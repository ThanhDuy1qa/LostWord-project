import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// ----------------------------------------------------------------------
// 1. CÁC HÀM XỬ LÝ & CHUẨN HÓA DỮ LIỆU
// ----------------------------------------------------------------------

// Tách thông số từ chuỗi raw_stats (VD: "PWR 2.62 ACC 80% CRI 10% x20")
const parseRawStats = (rawStr) => {
  if (!rawStr || typeof rawStr !== 'string') {
    return { power: 100, accuracy: 80, crit: 5, count: 1 };
  }

  const pwrMatch = rawStr.match(/PWR\s*([\d.]+)/i);
  const accMatch = rawStr.match(/ACC\s*([\d.]+)/i);
  const criMatch = rawStr.match(/CRI\s*([\d.]+)/i);
  const countMatch = rawStr.match(/x(\d+)/i);

  return {
    power: pwrMatch ? parseFloat(pwrMatch[1]) : 100,
    accuracy: accMatch ? parseFloat(accMatch[1]) : 80,
    crit: criMatch ? parseFloat(criMatch[1]) : 5,
    count: countMatch ? parseInt(countMatch[1], 10) : 1
  };
};

// Chuẩn hóa Nguyên tố về value khớp với ELEMENT_OPTIONS
const normalizeElement = (rawElem) => {
  if (!rawElem) return 'NO_ELEMENT';
  const str = String(rawElem).trim().toUpperCase();

  if (str.includes('SUN')) return 'SUN';
  if (str.includes('MOON')) return 'MOON';
  if (str.includes('FIRE')) return 'FIRE';
  if (str.includes('WATER')) return 'WATER';
  if (str.includes('WOOD')) return 'WOOD';
  if (str.includes('METAL')) return 'METAL';
  if (str.includes('EARTH')) return 'EARTH';
  if (str.includes('STAR')) return 'STAR';

  return 'NO_ELEMENT';
};

// Chuẩn hóa Loại đạn về chữ hoa (LASER, LIQUID, SLASH, NORMAL, ...)
const normalizeBulletType = (rawType) => {
  if (!rawType) return 'NORMAL';
  return String(rawType).trim().toUpperCase();
};

export const parseTextToEffect = (rawInput, effectDict = []) => {
  if (!rawInput) return null;

  const safeDict = Array.isArray(effectDict) ? effectDict : [];

  if (typeof rawInput === 'object' && (rawInput.effect_code || rawInput.code)) {
    const inputCode = rawInput.effect_code || rawInput.code;
    const matchedDict = safeDict.find(d => 
      String(d.code || d.effect_code || '').toLowerCase() === String(inputCode).toLowerCase()
    );

    return {
      ui_group: rawInput.ui_group || matchedDict?.ui_group || matchedDict?.group || matchedDict?.effect_group || 'General Status',
      effect_code: matchedDict ? (matchedDict.code || matchedDict.effect_code) : inputCode,
      code: matchedDict ? (matchedDict.code || matchedDict.effect_code) : inputCode,
      direction: rawInput.direction || 'UP',
      value: Number(rawInput.value ?? rawInput.base_value ?? 1),
      target: rawInput.target || 'SELF',
      duration: Number(rawInput.duration ?? 1)
    };
  }

  const text = typeof rawInput === 'string' ? rawInput : (rawInput.text || '');
  if (!text) return null;

  let target = 'SELF';
  if (/\[?Allies\]?|\[?Party\]?/i.test(text)) target = 'ALL_ALLIES';
  else if (/\[?Enemies\]?|\[?Enemy\]?/i.test(text)) target = 'ALL_ENEMIES';
  else if (/\[?Target\]?/i.test(text)) target = 'TARGET';

  let direction = 'UP';
  if (/DOWN|-|Debuff|Decrease/i.test(text) && !/UP/i.test(text)) {
    direction = 'DOWN';
  }

  let value = 1;
  const valMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*(?:%|levels?|steps?|UP|DOWN)?/i);
  if (valMatch && valMatch[1]) {
    value = Math.abs(parseFloat(valMatch[1]));
  }

  let duration = 1;
  const turnMatch = text.match(/(\d+)\s*turns?/i);
  if (turnMatch && turnMatch[1]) {
    duration = parseInt(turnMatch[1], 10);
  }

  const isRank2 = /\b(ii|rank\s*2|rank\s*ii)\b/i.test(text);
  const hasDmg = /\bdmg\b|\bdamage\b/i.test(text);

  const sortedDict = safeDict;

  let matchedCode = '';
  let matchedGroup = '';

  const isCleanseAnomalyText = /cleanse|cleanses|heal|heals|remove|removes|dispel|dispels/i.test(text) &&
                               /anomaly|anomalies|status|debuff|affliction|ailment/i.test(text);

  if (isCleanseAnomalyText) {
    const dictMatch = sortedDict.find(d => {
      const c = String(d.code || d.effect_code || '').toLowerCase();
      const n = String(d.effect_name || d.name || '').toLowerCase();
      return (c.includes('status_heal') || n.includes('status heal') ||
              c.includes('barrier_status_heal') || n.includes('barrier status heal') ||
              c.includes('cleanse') || n.includes('cleanse') ||
              (n.includes('status') && n.includes('heal')));
    });
    if (dictMatch) {
      matchedCode = dictMatch.code || dictMatch.effect_code;
      matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
    }
  }

  if (!matchedCode) {
    const isStoredPowerText = /stored\s*power|stored|scale|scaling|per\s*(\d+(\.\d+)?)?\s*p\b|for\s*each\s*p\b|proportional/i.test(text);
    if (isStoredPowerText || (hasDmg && /spirit\s*power|per\s*p\b|\bfor\s*each\s*p\b/i.test(text))) {
      if (/spirit\s*power|per\s*p\b|\bfor\s*each\s*p\b|\bp\s*store|\bsp\s*store|\bp\b/i.test(text)) {
        const dictMatch = sortedDict.find(d => {
          const c = String(d.code || d.effect_code || '').toLowerCase();
          const n = String(d.effect_name || d.name || '').toLowerCase();
          return (c.includes('sp_store') || c.includes('p_store') || c.includes('sp_st') || c.includes('p_st') || 
                  ((n.includes('spirit') || n.includes('power') || n.includes('p')) && (n.includes('store') || n.includes('scale'))));
        });
        if (dictMatch) {
          matchedCode = dictMatch.code || dictMatch.effect_code;
          matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
        }
      } else if (/barrier/i.test(text)) {
        const dictMatch = sortedDict.find(d => {
          const c = String(d.code || d.effect_code || '').toLowerCase();
          const n = String(d.effect_name || d.name || '').toLowerCase();
          return c.includes('barrier_st') || c.includes('barrier_store') || (n.includes('barrier') && (n.includes('store') || n.includes('scale')));
        });
        if (dictMatch) {
          matchedCode = dictMatch.code || dictMatch.effect_code;
          matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
        }
      } else if (/hp/i.test(text)) {
        const dictMatch = sortedDict.find(d => {
          const c = String(d.code || d.effect_code || '').toLowerCase();
          const n = String(d.effect_name || d.name || '').toLowerCase();
          return c.includes('hp_st') || c.includes('hp_store') || (n.includes('hp') && (n.includes('store') || n.includes('scale')));
        });
        if (dictMatch) {
          matchedCode = dictMatch.code || dictMatch.effect_code;
          matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
        }
      }
    }
  }

  if (!matchedCode && /\bhp\b/i.test(text) && /restore|restores|recover|recovers|heal|heals/i.test(text)) {
    const dictMatch = sortedDict.find(d => {
      const c = String(d.code || d.effect_code || '').toLowerCase();
      const n = String(d.effect_name || d.name || '').toLowerCase();
      return (c.includes('hp') || n.includes('hp')) && 
             (c.includes('recov') || c.includes('heal') || c.includes('restore') ||
              n.includes('recov') || n.includes('heal') || n.includes('restore'));
    });
    if (dictMatch) {
      matchedCode = dictMatch.code || dictMatch.effect_code;
      matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
    }
  }

  const isDmgEffective = /(dmg|damage).*(effective)|effective.*(dmg|damage)|\beffective\b/i.test(text);
  const isDmgAnomaly = /(dmg|damage).*(anomaly|anomalies|debuff|status|afflict|inflict)/i.test(text);

  if (!matchedCode && (isDmgEffective || isDmgAnomaly || /eff\s*dmg|anomaly\s*dmg/i.test(text))) {
    if (isDmgEffective) {
      const dictMatch = sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();
        const g = String(d.ui_group || d.group || d.effect_group || '').toLowerCase();
        return c.includes('effective') || n.includes('effective') || g.includes('effective') ||
               c.includes('eff_dmg') || c.includes('dmg_eff') || c.includes('eff_damage');
      });
      if (dictMatch) {
        matchedCode = dictMatch.code || dictMatch.effect_code;
        matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
      }
    }

    if (!matchedCode) {
      const dictMatch = sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();
        return c.includes('eff_dmg') || c.includes('dmg_eff') || c.includes('dmg_to') || c.includes('anomaly_dmg') ||
               (n.includes('eff') && n.includes('dmg')) || (n.includes('damage') && (n.includes('effect') || n.includes('anomaly')));
      });
      if (dictMatch) {
        matchedCode = dictMatch.code || dictMatch.effect_code;
        matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
      }
    }
  }

  if (!matchedCode && (/\bres\b|resistance|dmg\s*cut|damage\s*cut/i.test(text))) {
    const dictMatch = sortedDict.find(d => {
      const c = String(d.code || d.effect_code || '').toLowerCase();
      const n = String(d.effect_name || d.name || '').toLowerCase();
      return c.includes('res') || c.includes('resistance') || n.includes('res') || n.includes('resistance') || n.includes('cut');
    });
    if (dictMatch) {
      matchedCode = dictMatch.code || dictMatch.effect_code;
      matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
    }
  }

  if (!matchedCode && /barrier/i.test(text)) {
    const isCleanseText = /cleanse|cleanses|remove|removes|dispel|dispels/i.test(text);
    const isAnomalyText = /paralyz|freeze|froze|burn|poison|dark|blind|electrif|inflict|afflict|anomaly|anomalies|debuff|break|bind/i.test(text);

    if (isCleanseText) {
      const dictMatch = sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();
        return (c.includes('barrier') || n.includes('barrier')) &&
               (c.includes('cleanse') || c.includes('remove') || c.includes('dispel') || c.includes('status_heal') ||
                n.includes('cleanse') || n.includes('remove') || n.includes('dispel') || n.includes('status heal'));
      });
      if (dictMatch) {
        matchedCode = dictMatch.code || dictMatch.effect_code;
        matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
      }
    } else if (isAnomalyText) {
      let specificType = null;
      if (/poison/i.test(text)) specificType = 'poison';
      else if (/burn/i.test(text)) specificType = 'burn';
      else if (/freeze|froze/i.test(text)) specificType = 'freeze';
      else if (/paralyz/i.test(text)) specificType = 'paralyz';
      else if (/dark|blind/i.test(text)) specificType = 'dark';

      let dictMatch = null;

      if (specificType) {
        dictMatch = sortedDict.find(d => {
          const c = String(d.code || d.effect_code || '').toLowerCase();
          const n = String(d.effect_name || d.name || '').toLowerCase();
          return (c.includes('barrier') || n.includes('barrier')) &&
                 (c.includes(specificType) || n.includes(specificType));
        });
      }

      if (!dictMatch) {
        dictMatch = sortedDict.find(d => {
          const c = String(d.code || d.effect_code || '').toLowerCase();
          const n = String(d.effect_name || d.name || '').toLowerCase();
          return (c.includes('barrier') || n.includes('barrier')) &&
                 (c.includes('anomal') || c.includes('inflict') || c.includes('debuff') ||
                  n.includes('anomal') || n.includes('inflict') || n.includes('debuff'));
        });
      }

      const finalMatch = dictMatch || sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();
        return (c.includes('barrier') || n.includes('barrier')) &&
               !c.includes('add') && !c.includes('recov') && !c.includes('heal') && !c.includes('restore') &&
               !n.includes('add') && !n.includes('recov') && !n.includes('heal') && !n.includes('restore') &&
               !c.includes('st') && !c.includes('store') && !c.includes('res');
      });

      if (finalMatch) {
        matchedCode = finalMatch.code || finalMatch.effect_code;
        matchedGroup = finalMatch.ui_group || finalMatch.group || finalMatch.effect_group;
      }
    } else {
      const dictMatch = sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();

        const isAnomalyItem = c.includes('anomal') || n.includes('anomal') || c.includes('inflict') || n.includes('inflict') || c.includes('debuff') || n.includes('debuff');
        const isStoreItem = c.includes('st') || c.includes('store') || n.includes('store');
        const isResItem = c.includes('res') || n.includes('res');

        if (isAnomalyItem || isStoreItem || isResItem) return false;

        return (c.includes('barrier') || n.includes('barrier')) && 
               (c.includes('add') || c.includes('recov') || c.includes('heal') || c.includes('restore') || c === 'barrier' ||
                n.includes('add') || n.includes('recov') || n.includes('heal') || n.includes('restore') || n === 'barrier');
      });

      const fallbackMatch = dictMatch || sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();
        return (c === 'barrier' || n === 'barrier') || 
               ((c.includes('barrier') || n.includes('barrier')) && 
                !c.includes('anomal') && !n.includes('anomal') && !c.includes('st') && !c.includes('store'));
      });

      if (fallbackMatch) {
        matchedCode = fallbackMatch.code || fallbackMatch.effect_code;
        matchedGroup = fallbackMatch.ui_group || fallbackMatch.group || fallbackMatch.effect_group;
      }
    }
  }

  if (!matchedCode && /cleanse|anomal/i.test(text)) {
    const dictMatch = sortedDict.find(d => {
      const str = `${d.code || d.effect_code || ''} ${d.effect_name || d.name || ''}`.toLowerCase();
      return str.includes('cleanse') || str.includes('status') || str.includes('heal');
    });
    if (dictMatch) {
      matchedCode = dictMatch.code || dictMatch.effect_code;
      matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
    }
  }

  if (!matchedCode && /bind|debuff/i.test(text)) {
    const dictMatch = sortedDict.find(d => {
      const str = `${d.code || d.effect_code || ''} ${d.effect_name || d.name || ''}`.toLowerCase();
      return str.includes('bind') || str.includes('debuff') || str.includes('remove');
    });
    if (dictMatch) {
      matchedCode = dictMatch.code || dictMatch.effect_code;
      matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
    }
  }

  if (!matchedCode && !isCleanseAnomalyText && /spirit\s*power|\bp\b|\bp\s*\+/i.test(text)) {
    const isRateText = /rate|recovery|gained|collection/i.test(text);

    if (isRateText) {
      const dictMatch = sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();
        return (c.includes('p_rate') || c.includes('sp_rate') || c.includes('rate') || n.includes('rate') || n.includes('recovery')) &&
               !c.includes('st') && !c.includes('store');
      });
      if (dictMatch) {
        matchedCode = dictMatch.code || dictMatch.effect_code;
        matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
      }
    } else {
      const dictMatch = sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();
        const isRateItem = c.includes('rate') || n.includes('rate') || n.includes('recovery');
        return (c.includes('p_up') || c.includes('sp_up') || c.includes('p_add') || c === 'p' || c === 'sp' || n.includes('spirit power')) && 
               !isRateItem && !c.includes('st') && !c.includes('store');
      });
      if (dictMatch) {
        matchedCode = dictMatch.code || dictMatch.effect_code;
        matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
      }
    }
  }

  if (!matchedCode) {
    let statKeyword = null;

    if (/yin\s*atk/i.test(text)) statKeyword = 'yin atk';
    else if (/yang\s*atk/i.test(text)) statKeyword = 'yang atk';
    else if (/yin\s*def/i.test(text)) statKeyword = 'yin def';
    else if (/yang\s*def/i.test(text)) statKeyword = 'yang def';
    else if (/agility/i.test(text)) statKeyword = 'agility';
    else if (/crit\s*atk/i.test(text)) statKeyword = 'crit atk';
    else if (/crit\s*def/i.test(text)) statKeyword = 'crit def';
    else if (/crit\s*eva/i.test(text)) statKeyword = 'crit eva';

    if (statKeyword) {
      const dictMatch = sortedDict.find(d => {
        const c = String(d.code || d.effect_code || '').toLowerCase();
        const n = String(d.effect_name || d.name || '').toLowerCase();
        const combined = `${c} ${n}`;

        const containsKey = combined.includes(statKeyword);
        const isItemRank2 = /\bii\b|_ii\b|rank\s*2|rank\s*ii/i.test(combined);

        return isRank2 ? (containsKey && isItemRank2) : (containsKey && !isItemRank2);
      });

      if (dictMatch) {
        matchedCode = dictMatch.code || dictMatch.effect_code;
        matchedGroup = dictMatch.ui_group || dictMatch.group || dictMatch.effect_group;
      }
    }
  }

  if (!matchedCode) {
    const lowerText = text.toLowerCase();
    for (const item of sortedDict) {
      const code = String(item.code || item.effect_code || '').toLowerCase();
      const name = String(item.effect_name || item.name || '').toLowerCase();
      const combined = `${code} ${name}`;

      const isItemRank2 = /\bii\b|_ii\b|rank\s*2|rank\s*ii/i.test(combined);
      if (!isRank2 && isItemRank2) continue;

      if ((code && lowerText.includes(code)) || (name && lowerText.includes(name))) {
        matchedCode = item.code || item.effect_code;
        matchedGroup = item.ui_group || item.group || item.effect_group;
        break;
      }
    }
  }

  return {
    ui_group: matchedGroup || 'General Status',
    effect_code: matchedCode || '',
    code: matchedCode || '',
    direction,
    value,
    target,
    duration
  };
};
/**
 * Parse chuỗi văn bản hiệu ứng đạn từ JSON thành Object chuẩn hóa khớp với HARDCODED_EFFECT_DICT
 */
export const parseBulletPropertyItem = (p, dict = []) => {
  if (!p) return null;

  // 1. NẾU DỮ LIỆU ĐẦU VÀO LÀ CHUỖI TEXT THÔ TỪ JSON
  if (typeof p === 'string') {
    const str = p.trim();

    // A. Bóc tách Tag Modifier / Scale (Slice, Hard, Elastic, Explosive, Precision, Heavy, Piercing, Absorb, Charge...)
    // Ví dụ: "[Slice]: 100% Agility Scale", "[Elastic]: Higher CRIT chance scaling with enemy ATK"
    const tagMatch = str.match(/^\[(Slice|Hard|Explosive|Elastic|Precision|Heavy|Piercing|Destroy|Absorb|Charge|Sure-Hit)\]:\s*(.*)/i);
    if (tagMatch) {
      const rawTag = tagMatch[1].toLowerCase();
      const detail = tagMatch[2];

      // Ánh xạ về code chuẩn trong từ điển HARDCODED_EFFECT_DICT
      let effectCode = 'Slice';
      if (rawTag === 'slice') effectCode = 'Slice';
      else if (rawTag === 'hard') effectCode = 'Hard';
      else if (rawTag === 'explosive') effectCode = 'Explosive';
      else if (rawTag === 'elastic') effectCode = 'Elastic';
      else if (rawTag === 'precision') effectCode = 'Precision';
      else if (rawTag === 'heavy') effectCode = 'Heavy';
      else if (rawTag === 'piercing') effectCode = 'Piercing';
      else if (rawTag === 'destroy') effectCode = 'Destroy';
      else if (rawTag === 'absorb') effectCode = 'Absorb';
      else if (rawTag === 'charge') effectCode = 'Charge_Bullet';
      else if (rawTag === 'sure-hit') effectCode = 'Sure-Hit';

      // Trích xuất phần trăm scale nếu có (VD: "100% Agility Scale" -> value: 100)
      const scaleValMatch = detail.match(/(\d+(?:\.\d+)?)\%/);
      const scaleValue = scaleValMatch ? parseFloat(scaleValMatch[1]) : 1.0;

      return {
        is_status_effect: false,
        ui_group: 'Tag Modifier',
        effect_code: effectCode,
        property_code: effectCode,
        code: effectCode,
        target: 'TARGET',
        value: scaleValue,
        duration: 0,
        description: detail
      };
    }

    // B. Bóc tách hiệu ứng Phá Barrier (Break Barrier Anomaly)
    // Ví dụ: "[Incineration]: Breaks Burn", "[Melting]: Breaks Freeze", "[Toxic]: Breaks Poison", "[Discharge]: Breaks Paralyze", "[Flash]: Breaks Blind"
    const breakMatch = str.match(/^\[(Incineration|Melting|Toxic|Discharge|Flash)\]:\s*Breaks?\s*(\w+)/i);
    if (breakMatch) {
      const breakType = breakMatch[1].toLowerCase();

      // Ánh xạ tên về Code chuẩn trong HARDCODED_EFFECT_DICT
      let effectCode = 'Incinerate';
      if (breakType === 'incineration') effectCode = 'Incinerate';
      else if (breakType === 'melting') effectCode = 'Melt';
      else if (breakType === 'toxic') effectCode = 'Disperse';
      else if (breakType === 'discharge') effectCode = 'Discharge';
      else if (breakType === 'flash') effectCode = 'Flash';

      return {
        is_status_effect: true,
        ui_group: 'Break Barrier Anomaly',
        effect_code: effectCode,
        property_code: effectCode,
        code: effectCode,
        target: 'TARGET',
        value: 1.0,
        duration: 0
      };
    }

    // C. Bóc tách hiệu ứng Thêm Barrier (Add Barrier Anomaly)
    // Ví dụ: "[Self] Blinds 1.0 Barrier(s) (3 turns)", "[Target] Burns 1.0 Barrier(s) ( 3 turns)"
    const addBarrierMatch = str.match(/^\[(Enemies|Target|Self|Allies)\]\s*(Burns?|Poisons?|Freezes?|Paralyzes?|Blinds?)\s*([\d\.]+)\s*Barrier\(s\)\s*\(\s*(\d+)\s*turns?\)/i);
    if (addBarrierMatch) {
      const rawTarget = addBarrierMatch[1].toUpperCase();
      const rawAnomaly = addBarrierMatch[2].toLowerCase();
      const val = parseFloat(addBarrierMatch[3]) || 1.0;
      const dur = parseInt(addBarrierMatch[4], 10) || 3;

      let target = 'TARGET';
      if (rawTarget.includes('ENEMI')) target = 'ALL_ENEMIES';
      if (rawTarget.includes('SELF')) target = 'SELF';
      if (rawTarget.includes('ALLI')) target = 'ALL_ALLIES';

      // Ánh xạ tên về Code chuẩn trong HARDCODED_EFFECT_DICT ('Freeze', 'Burn', 'Poison', 'Paralyze', 'Blind')
      let effectCode = 'Burn';
      if (rawAnomaly.startsWith('burn')) effectCode = 'Burn';
      else if (rawAnomaly.startsWith('poison')) effectCode = 'Poison';
      else if (rawAnomaly.startsWith('freeze')) effectCode = 'Freeze';
      else if (rawAnomaly.startsWith('paralyz')) effectCode = 'Paralyze';
      else if (rawAnomaly.startsWith('blind')) effectCode = 'Blind';

      return {
        is_status_effect: true,
        ui_group: 'Add Barrier Anomaly',
        effect_code: effectCode,
        property_code: effectCode,
        code: effectCode,
        target: target,
        value: val,
        duration: dur
      };
    }

    // D. Bóc tách hiệu ứng Buff / Debuff Chỉ số thông thường
    // Ví dụ: "[Self] Yang ATK +2.0 (3 turns)", "[Target] Evasion -1.0 (2 turns)"
    const buffMatch = str.match(/^\[(Self|Target|Enemies|Allies)\]\s*([A-Za-z\s]+)\s*([\+\-])([\d\.]+)\s*\(\s*(\d+)\s*turns?\)/i);
    if (buffMatch) {
      const rawTarget = buffMatch[1].toUpperCase();
      const statName = buffMatch[2].trim();
      const sign = buffMatch[3];
      const val = parseFloat(buffMatch[4]) || 1.0;
      const dur = parseInt(buffMatch[5], 10) || 3;

      let target = 'SELF';
      if (rawTarget.includes('TARGET')) target = 'TARGET';
      if (rawTarget.includes('ENEMI')) target = 'ALL_ENEMIES';
      if (rawTarget.includes('ALLI')) target = 'ALL_ALLIES';

      let code = statName.replace(/\s+/g, '_');
      if (/yin\s*atk/i.test(statName)) code = 'Yin_ATK';
      else if (/yang\s*atk/i.test(statName)) code = 'Yang_ATK';
      else if (/yin\s*def/i.test(statName)) code = 'Yin_DEF';
      else if (/yang\s*def/i.test(statName)) code = 'Yang_DEF';
      else if (/agility/i.test(statName)) code = 'Agility';

      return {
        is_status_effect: true,
        ui_group: 'Status Buff / Debuff',
        effect_code: code,
        property_code: code,
        code: code,
        target: target,
        direction: sign === '-' ? 'DOWN' : 'UP',
        value: val,
        duration: dur
      };
    }

    // Fallback nếu không khớp regex
    return {
      is_status_effect: true,
      ui_group: 'Tag Modifier',
      effect_code: str,
      property_code: str,
      code: str,
      target: 'TARGET',
      direction: 'UP',
      value: 1.0,
      duration: 3
    };
  }

  // 2. NẾU DỮ LIỆU ĐÃ LÀ OBJECT STATE
  return {
    is_status_effect: p.is_status_effect ?? true,
    ui_group: p.ui_group || 'Tag Modifier',
    effect_code: p.effect_code || p.property_code || p.code || '',
    property_code: p.property_code || p.effect_code || p.code || '',
    code: p.code || p.effect_code || p.property_code || '',
    target: p.target || 'TARGET',
    direction: p.direction || 'UP',
    value: Number(p.value ?? 1.0),
    duration: Number(p.duration ?? 3)
  };
};
// ----------------------------------------------------------------------
// 2. MAIN HOOK
// ----------------------------------------------------------------------

export const useEditFriendDetail = (characterIdFromProp) => {
  const { id } = useParams();
  const characterId = characterIdFromProp || id;

  const [effectDict, setEffectDict] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const defaultSkills = [
    { id: 1, name: 'Skill 1', cd: 3, effects: [] },
    { id: 2, name: 'Skill 2', cd: 4, effects: [] },
    { id: 3, name: 'Skill 3', cd: 5, effects: [] },
  ];

  const defaultPCosts = [0, 1, 1, 2, 2, 3];

  const createDefaultBullets = () => Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    element: 'NO_ELEMENT',
    type: 'NORMAL',
    p_cost: defaultPCosts[i] ?? 0,
    power: 100,
    accuracy: 80,
    crit: 5,
    count: 1,
    killers: '',
    properties: [],
    effects: []
  }));

  const defaultSpellCards = [
    { id: 1, name: 'Spell Card 1', type: 'SOLO', isLastWord: false, pre_effects: [], post_effects: [], bullets: createDefaultBullets() },
    { id: 2, name: 'Spell Card 2', type: 'ALL', isLastWord: false, pre_effects: [], post_effects: [], bullets: createDefaultBullets() },
    { id: 3, name: 'Last Word', type: 'ALL', isLastWord: true, pre_effects: [], post_effects: [], bullets: createDefaultBullets() },
  ];

  const [charData, setCharData] = useState({
    code: '',
    name: '',
    universe: '',
    image_url: '',
    role: '',
    rarity_code: '',
    stats: { hp: 0, yin_atk: 0, yang_atk: 0, yin_def: 0, yang_def: 0, agility: 0 },
    skills: defaultSkills,
    spellCards: defaultSpellCards
  });

  const normalizeEffectArray = (arr, dict) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => parseTextToEffect(item, dict)).filter(Boolean);
  };

  const applyCharacterData = (jsonData, currentDict = effectDict) => {
    if (!jsonData) return;

    const rawSpellCards = jsonData.spellCards || jsonData.spellcards || jsonData.spell_cards || [];

    setCharData(prev => ({
      ...prev,
      code: jsonData.displayCode || jsonData.code || prev.code,
      name: jsonData.displayName || jsonData.name || prev.name,
      universe: jsonData.universe || prev.universe || '',
      image_url: jsonData.image_url || prev.image_url || '',
      role: jsonData.role || prev.role || '',
      rarity_code: jsonData.rarity_code || prev.rarity_code || '',
      stats: jsonData.stats || prev.stats,
      skills: jsonData.skills?.length
        ? jsonData.skills.map((sk, idx) => ({
            id: sk.id || idx + 1,
            name: sk.name || `Skill ${idx + 1}`,
            cd: sk.cd ?? sk.cooldown ?? 3,
            effects: normalizeEffectArray(sk.effects, currentDict)
          }))
        : prev.skills,
      spellCards: rawSpellCards.length
        ? rawSpellCards.map((sc, idx) => {
            const bulletSource = sc.bullet_lines || sc.bullets || [];
            const parsedBullets = (bulletSource && bulletSource.length > 0)
              ? bulletSource.map((b, bIdx) => {
                  const parsedStats = parseRawStats(b.raw_stats);

                  const rawBulletEffects = [
                    ...(Array.isArray(b.effects) ? b.effects : []),
                    ...(Array.isArray(b.properties) ? b.properties : [])
                  ];

                  // Chuẩn hóa riêng cho thuộc tính đạn
                  const parsedBulletProperties = rawBulletEffects
                    .map(p => parseBulletPropertyItem(p, currentDict))
                    .filter(Boolean);

                  return {
                    id: b.id || bIdx + 1,
                    element: normalizeElement(b.element || b.elem || b.element_type),
                    type: normalizeBulletType(b.bullet_type || b.type || b.bullet_tag),
                    p_cost: Number(b.p_cost ?? b.cost ?? defaultPCosts[bIdx] ?? 0),
                    power: Number(b.power ?? b.bullet_power ?? parsedStats.power),
                    accuracy: Number(b.accuracy ?? b.acc ?? parsedStats.accuracy),
                    crit: Number(b.crit ?? b.crit_rate ?? parsedStats.crit),
                    count: Number(b.count ?? b.bullet_count ?? parsedStats.count),
                    killers: Array.isArray(b.killers) 
                      ? b.killers.join(', ') 
                      : (b.killers || b.killer || ''),
                    effects: parsedBulletProperties
                  };
                })
              : createDefaultBullets();

            return {
              id: sc.id || idx + 1,
              name: sc.name || sc.card_title || `Spell Card ${idx + 1}`,
              type: (sc.type || sc.target_type || 'SOLO').toUpperCase(),
              isLastWord: sc.isLastWord || sc.is_last_word || idx === 2,
              pre_effects: normalizeEffectArray(sc.pre_effects, currentDict),
              post_effects: normalizeEffectArray(sc.post_effects, currentDict),
              bullets: parsedBullets
            };
          })
        : prev.spellCards
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dictRes = await axios.get('http://localhost:5000/api/storycards/dictionary/effects');
        
        let rawDict = [];
        if (Array.isArray(dictRes.data)) {
          rawDict = dictRes.data;
        } else if (dictRes.data && Array.isArray(dictRes.data.data)) {
          rawDict = dictRes.data.data;
        }

        const loadedDict = [...rawDict].sort((a, b) => {
          const nameA = a.effect_name || a.name || a.code || '';
          const nameB = b.effect_name || b.name || b.code || '';
          return nameB.length - nameA.length;
        });

        setEffectDict(loadedDict);

        if (characterId) {
          const charRes = await axios.get(`http://localhost:5000/api/friends/${characterId}/details`);
          const charDataPayload = charRes.data?.data || charRes.data;
          if (charDataPayload) {
            applyCharacterData(charDataPayload, loadedDict);
          }
        }
      } catch (err) {
        console.error("Lỗi khi nạp dữ liệu:", err);
        setMessage('❌ Lỗi nạp dữ liệu từ máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [characterId]);

  // Các hàm helper thao tác trên thuộc tính đạn cho UI
  const addBulletEffect = (scIdx, bIdx) => {
    const updated = [...charData.spellCards];
    if (!updated[scIdx].bullets[bIdx].effects) {
      updated[scIdx].bullets[bIdx].effects = [];
    }
    updated[scIdx].bullets[bIdx].effects.push({
      ui_group: 'Barrier Anomaly',
      effect_code: '',
      value: 1,
      direction: 'UP'
    });
    setCharData({ ...charData, spellCards: updated });
  };

  const updateBulletEffect = (scIdx, bIdx, eIdx, updatedVal) => {
    setCharData(prev => {
      const newSpellCards = [...prev.spellCards];
      const targetSc = { ...newSpellCards[scIdx] };
      const targetBullets = [...targetSc.bullets];
      const targetBullet = { ...targetBullets[bIdx] };
      const targetEffects = [...(targetBullet.effects || [])];

      targetEffects[eIdx] = updatedVal;
      targetBullet.effects = targetEffects;
      targetBullets[bIdx] = targetBullet;
      targetSc.bullets = targetBullets;
      newSpellCards[scIdx] = targetSc;

      return { ...prev, spellCards: newSpellCards };
    });
  };

  const removeBulletEffect = (scIdx, bIdx, eIdx) => {
    setCharData(prev => {
      const newSpellCards = [...prev.spellCards];
      const targetSc = { ...newSpellCards[scIdx] };
      const targetBullets = [...targetSc.bullets];
      const targetBullet = { ...targetBullets[bIdx] };

      targetBullet.effects = (targetBullet.effects || []).filter((_, i) => i !== eIdx);
      targetBullets[bIdx] = targetBullet;
      targetSc.bullets = targetBullets;
      newSpellCards[scIdx] = targetSc;

      return { ...prev, spellCards: newSpellCards };
    });
  };

  const handleSave = async () => {
    try {
      setMessage('⌛ Đang lưu dữ liệu...');

      const payload = {
        code: charData.code,
        name: charData.name,
        stats: charData.stats,
        skills: charData.skills.map(s => ({
          name: s.name,
          cooldown: Number(s.cd || 0),
          effects: (s.effects || []).map(e => ({
            ui_group: e.ui_group || 'Status Buff',
            effect_code: e.effect_code || 'Agility',
            direction: e.direction || 'UP',
            value: Number(e.value ?? 1),
            target: e.target || 'SELF',
            duration: Number(e.duration ?? 1)
          }))
        })),
        spellcards: charData.spellCards.map(sc => ({
          card_title: sc.name,
          target_type: sc.type,
          is_last_word: sc.isLastWord ? 1 : 0,
          pre_effects: (sc.pre_effects || []).map(e => ({
            ui_group: e.ui_group || 'Status Buff',
            effect_code: e.effect_code || 'Agility',
            direction: e.direction || 'UP',
            value: Number(e.value ?? 1),
            target: e.target || 'SELF',
            duration: Number(e.duration ?? 1)
          })),
          post_effects: (sc.post_effects || []).map(e => ({
            ui_group: e.ui_group || 'Status Buff',
            effect_code: e.effect_code || 'Agility',
            direction: e.direction || 'UP',
            value: Number(e.value ?? 1),
            target: e.target || 'SELF',
            duration: Number(e.duration ?? 1)
          })),
          bullet_lines: sc.bullets.map(b => ({
            element: b.element,
            bullet_type: b.type,
            p_cost: Number(b.p_cost || 0),
            power: Number(b.power || 0),
            accuracy: Number(b.accuracy || 0),
            crit: Number(b.crit || 0),
            count: Number(b.count || 1),
            killers: typeof b.killers === 'string'
              ? b.killers.split(',').map(k => k.trim()).filter(Boolean)
              : (b.killers || []),
            properties: (b.effects || []).map(p => {
              if (p.is_status_effect) {
                return {
                  type: 'STATUS_BUFF',
                  effect_code: p.effect_code || p.property_code,
                  direction: p.direction || 'UP',
                  value: Number(p.value ?? 1),
                  target: p.target || 'SELF',
                  duration: Number(p.duration ?? 1)
                };
              }
              return {
                type: 'BULLET_PROPERTY',
                property_code: p.property_code || p.effect_code,
                scale_stat: p.scale_stat || null,
                value: Number(p.value ?? 0)
              };
            })
          }))
        }))
      };

      await axios.put(`http://localhost:5000/api/friends/${characterId}/details`, payload);
      setMessage('✅ Lưu dữ liệu thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Lỗi lưu dữ liệu:", err);
      setMessage('❌ Lỗi khi lưu dữ liệu!');
    }
  };

  return {
    charData,
    setCharData,
    effectDict,
    loading,
    message,
    handleSave,
    applyCharacterData,
    addBulletEffect,
    updateBulletEffect,
    removeBulletEffect
  };
};