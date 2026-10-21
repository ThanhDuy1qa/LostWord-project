import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export const parseRawStats = (rawStats) => {
  if (!rawStats || typeof rawStats !== 'string') {
    return { power: 0, accuracy: 100, crit_rate: 0, bullet_count: 1, p_cost: 0 };
  }
  const regex = /PWR\s+([\d.]+)\s+ACC\s+([\d.]+)%?\s+CRI\s+([\d.]+)%?\s+x(\d+)(?:\s+(\d+))?/i;
  const match = rawStats.match(regex);
  if (!match) {
    return { power: 0, accuracy: 100, crit_rate: 0, bullet_count: 1, p_cost: 0 };
  }
  return {
    power: parseFloat(match[1]) || 0,
    accuracy: parseFloat(match[2]) || 0,
    crit_rate: parseFloat(match[3]) || 0,
    bullet_count: parseInt(match[4], 10) || 1,
    p_cost: match[5] !== undefined ? parseInt(match[5], 10) : 0,
  };
};

export const formatRawStats = (line) => {
  const pwr = line.power ?? 0;
  const acc = line.accuracy ?? 100;
  const cri = line.crit_rate ?? line.crit ?? 0;
  const count = line.bullet_count ?? line.count ?? 1;
  const pCost = line.p_cost ?? 0;

  let result = `PWR ${pwr} ACC ${acc}% CRI ${cri}% x${count}`;
  if (pCost > 0) {
    result += ` ${pCost}`;
  }
  return result;
};

const parseTarget = (text) => {
  if (!text || typeof text !== 'string') return 'SELF';
  const lower = text.toLowerCase();

  if (/\[\s*(self\vert{}own)\s*\]/i.test(lower)) return 'SELF';
  if (/\[\s*(allies\vert{}party\vert{}own\/allies\vert{}allies\/own)\s*\]/i.test(lower)) return 'ALLIES';
  if (/\[\s*(enemies\vert{}enemy)\s*\]/i.test(lower)) return 'ENEMIES';
  if (/\[\s*(target\vert{}single)\s*\]/i.test(lower)) return 'TARGET';
  if (/\[\s*field\s*\]/i.test(lower)) return 'FIELD';

  if (/\b(self|own)\b/i.test(lower)) return 'SELF';
  if (/\b(allies|party)\b/i.test(lower)) return 'ALLIES';
  if (/\b(enemies|enemy)\b/i.test(lower)) return 'ENEMIES';

  return 'SELF';
};

const parseValue = (text) => {
  if (!text || typeof text !== 'string') return 1;
  const cleanStr = text.replace(/\[.*?\]/g, '');
  const valMatch = cleanStr.match(/([+-]?\d+(?:\.\d+)?)/);
  if (valMatch) {
    const num = Math.abs(parseFloat(valMatch[1]));
    return isNaN(num) ? 1 : num;
  }
  return 1;
};

const parseIsInfinite = (text) => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return lower.includes('infinite') || lower.includes('permanent');
};

const parseDuration = (text) => {
  if (!text || typeof text !== 'string') return 0;
  if (parseIsInfinite(text)) return 0;

  const turnMatch =
    text.match(/\(\s*(\d+)\s*turns?\s*\)/i) ||
    text.match(/\(\s*(\d+)\s*t\s*\)/i) ||
    text.match(/(\d+)\s*(t|turn|turns|lượt)/i);

  return turnMatch ? parseInt(turnMatch[1], 10) : 0;
};

const parseDirection = (text) => {
  if (!text || typeof text !== 'string') return 'UP';
  const lower = text.toLowerCase();
  if (/down|decrease|lower|drop|giảm|-/i.test(lower)) return 'DOWN';
  if (/up|increase|raise|boost|tăng|\+|adds/i.test(lower)) return 'UP';
  return 'UP';
};

const autoDetectGroup = (text) => {
  if (!text || typeof text !== 'string') return '';
  const lower = text.toLowerCase();

  if (/on boost/i.test(lower)) return 'On Boost Effect';
  if (/on graze/i.test(lower)) return 'On Graze Effect';

  if (/each layer boosts\s*atk/i.test(lower)) return 'ATK Barrier Anomaly';
  if (/each layer boosts\s*def/i.test(lower)) return 'DEF Barrier Anomaly';
  if (/each layer boosts\s*support/i.test(lower)) return 'Support Barrier Anomaly';
  if (/converts into.*?spirit power/i.test(lower)) return 'P Recovery Anomaly';

  if (/dmg to (effective|resisted)/i.test(lower) || /dmg from (unfavourable|favourable)/i.test(lower)) {
    return 'Elemental DMG Modifier';
  }

  if (/reflects?/i.test(lower)) return 'Reflect Anomaly';
  if (/void/i.test(lower)) return 'Void Immunity';

  if (/yin atk|yang atk|yin def|yang def|agility|crit atk|crit def|crit accuracy|accuracy|evasion/i.test(lower)) {
    return 'Status Buff';
  }

  return '';
};

const normalizeEffectText = (text) => {
  if (!text) return '';
  let str = text.toLowerCase();

  str = str
    .replace(/^on boost\s*:\s*/gi, '')
    .replace(/^on graze\s*:\s*/gi, '')
    .replace(/^each layer boosts\s*(atk|def|support)\s*:\s*/gi, '')
    .replace(/^converts into [\d.]+\s*spirit power\s*:\s*/gi, '')
    .replace(/^dmg to (effective|resisted) elements\s*:\s*/gi, '')
    .replace(/^dmg from (unfavourable|favourable) elements\s*:\s*/gi, '');

  if (/\bsyncs?\b/i.test(str)) {
    str = str.replace(/\bsyncs?\b/gi, 'stat sync');
  }

  return str
    .replace(/\[.*?\]/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\+/g, ' up ')
    .replace(/-/g, ' down ')
    .replace(/[\d.%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const checkDictMatch = (cleanText, item) => {
  const dictName = (item.effect_name || item.name || '').toLowerCase().trim();
  const dictCode = (item.effect_code || '').toLowerCase().trim();

  if (!dictName && !dictCode) return false;
  const rawText = cleanText.toLowerCase();

  if (dictCode && rawText.includes(dictCode)) return true;

  const normInput = normalizeEffectText(cleanText);
  const dictVariants = dictName.split('/').map((v) => v.trim());

  for (const variant of dictVariants) {
    const normVariant = normalizeEffectText(variant);
    if (normVariant && normInput.includes(normVariant)) {
      return true;
    }
    const keywords = normVariant.split(' ').filter((w) => w.length > 0);
    if (keywords.length > 0 && keywords.every((kw) => normInput.includes(kw))) {
      return true;
    }
  }

  return false;
};

const parseStatSync = (text) => {
  if (!text || typeof text !== 'string') return { from_stat: '', to_stat: '' };

  const match = text.match(/syncs?\s*(?:\+?[\d.]+%?\s*of\s*)?([a-z0-9\s]+?)\s+to\s+([a-z0-9\s]+?)(?:\s*\(|\s*$)/i);
  if (match) {
    return {
      from_stat: match[1].trim(),
      to_stat: match[2].trim()
    };
  }
  return { from_stat: '', to_stat: '' };
};

export const inferEffectCode = (rawText, currentCode = '', effectDict = []) => {
  if (currentCode && String(currentCode).trim() !== '') {
    const exists = effectDict.some(
      (d) => String(d.effect_code).toUpperCase() === String(currentCode).trim().toUpperCase()
    );
    if (exists) return String(currentCode).trim().toUpperCase();
  }

  const text = String(rawText || '').toLowerCase();

  if (/restore.*hp|heal.*hp|restores.*hp|hp recovery|hồi hp/i.test(text)) return 'HP_RECOVERY';
  if (/unbind|remove.*bind|removes.*debuff|xóa debuff/i.test(text)) return 'UNBIND';
  if (/resisted|resistence|resist/i.test(text)) return 'DMG_RES';
  if (/effective/i.test(text)) return 'DMG_EFFECTIVE';
  if (/spirit power rate|power scale/i.test(text)) return 'SPIRIT_POWER_RATE_UP';
  if (/spirit power|p up|sp up|p recovery/i.test(text)) return 'SPIRIT_POWER_UP';
  if (/barrier add/i.test(text)) return 'BARRIER_ADD';
  if (/barrier recovery/i.test(text)) return 'BARRIER_RECOVERY';
  if (/barrier status heal/i.test(text)) return 'BARRIER_STATUS_HEAL';

  if (/yin atk ii/i.test(text)) return 'YIN_ATK_II';
  if (/yin atk|ying atk/i.test(text)) return 'YING_ATK';
  if (/yin def ii/i.test(text)) return 'YIN_DEF_II';
  if (/yin def|ying def/i.test(text)) return 'YING_DEF';
  if (/yang atk ii/i.test(text)) return 'YANG_ATK_II';
  if (/yang atk/i.test(text)) return 'YANG_ATK';
  if (/yang def ii/i.test(text)) return 'YANG_DEF_II';
  if (/yang def/i.test(text)) return 'YANG_DEF';
  if (/agility ii|agi ii/i.test(text)) return 'AGI_II';
  if (/agility|agi/i.test(text)) return 'AGI';
  if (/accuracy ii|acc ii/i.test(text)) return 'ACC_II';
  if (/accuracy|acc/i.test(text)) return 'ACC';
  if (/evasion ii|eva ii/i.test(text)) return 'EVA_II';
  if (/evasion|eva/i.test(text)) return 'EVA';
  if (/focus/i.test(text)) return 'FOCUS';

  if (/burn/i.test(text)) return 'ANOMALY_BURN';
  if (/freeze/i.test(text)) return 'ANOMALY_FREEZE';
  if (/paralyze/i.test(text)) return 'ANOMALY_PARALYZE';
  if (/poison/i.test(text)) return 'ANOMALY_POISON';
  if (/dark/i.test(text)) return 'ANOMALY_DARK';

  const sortedDict = [...effectDict].sort(
    (a, b) => (b.effect_name || '').length - (a.effect_name || '').length
  );
  let dictItem = sortedDict.find((d) => checkDictMatch(text, d));
  if (dictItem?.effect_code) return String(dictItem.effect_code).toUpperCase();

  return 'DMG_UP';
};

export const matchDictItem = (effInput, effectDict = []) => {
  if (!effInput) {
    return {
      effect_code: 'DMG_UP',
      ui_group: 'Combat Modifier',
      effect_group: 'Combat Modifier',
      direction: 'UP',
      value: 1,
      target: 'SELF',
      duration: 1,
      is_infinite: 0,
      sync_from_stat: '',
      sync_to_stat: '',
      effect_text: '',
    };
  }

  if (typeof effInput === 'object' && effInput !== null) {
    const rawText = effInput.effect_text || effInput.extra_text || effInput.effect_name || '';
    const code = inferEffectCode(rawText, effInput.effect_code, effectDict);
    const dictItem = effectDict.find(
      (d) => String(d.effect_code).toUpperCase() === String(code).toUpperCase()
    );

    const group = effInput.ui_group || effInput.effect_group || dictItem?.effect_group || dictItem?.ui_group || 'Status Buff';

    return {
      ...effInput,
      effect_code: code,
      ui_group: group,
      effect_group: group,
      target: effInput.target || 'SELF',
      direction: effInput.direction || 'UP',
      value: effInput.value ?? effInput.base_value ?? 1,
      duration: effInput.duration ?? 1,
      is_infinite: effInput.is_infinite ? 1 : 0,
      sync_from_stat: effInput.sync_from_stat || effInput.from_stat || '',
      sync_to_stat: effInput.sync_to_stat || effInput.to_stat || '',
      effect_text: rawText || dictItem?.effect_name || '',
    };
  }

  const rawText = String(effInput).trim();
  if (!rawText) {
    return {
      effect_code: 'DMG_UP',
      ui_group: 'Combat Modifier',
      effect_group: 'Combat Modifier',
      direction: 'UP',
      value: 1,
      target: 'SELF',
      duration: 1,
      is_infinite: 0,
      sync_from_stat: '',
      sync_to_stat: '',
      effect_text: '',
    };
  }

  const code = inferEffectCode(rawText, '', effectDict);
  const detectedGroup = autoDetectGroup(rawText);
  const target = parseTarget(rawText);
  const direction = parseDirection(rawText);
  const value = parseValue(rawText);
  const duration = parseDuration(rawText);
  const isInfinite = parseIsInfinite(rawText);
  const parsedSync = parseStatSync(rawText);

  const dictItem = effectDict.find(
    (d) => String(d.effect_code).toUpperCase() === String(code).toUpperCase()
  );

  return {
    effect_code: code,
    ui_group: detectedGroup || dictItem?.effect_group || 'Status Buff',
    effect_group: detectedGroup || dictItem?.effect_group || 'Status Buff',
    direction,
    value,
    target,
    duration,
    is_infinite: isInfinite ? 1 : 0,
    sync_from_stat: parsedSync.from_stat || '',
    sync_to_stat: parsedSync.to_stat || '',
    effect_text: rawText,
  };
};

export const getDefaultCharData = () => {
  const defaultSpellCards = [1, 2, 3].map((idx) => ({
    id: idx,
    card_title: `Spell Card ${idx}`,
    title: `Spell Card ${idx}`,
    name: `Spell Card ${idx}`,
    target_type: 'Solo',
    pre_effects: [],
    post_effects: [],
    bullets: [],
    bullet_lines: [],
  }));

  return {
    friend_id: null,
    base_friend_id: null,
    name_id: '',
    code: '',
    universe: '',
    name: '',
    is_rebirth: false,
    role: '',
    image_url: '',
    stats: { hp: 0, agility: 0, yang_atk: 0, yin_atk: 0, yang_def: 0, yin_def: 0 },
    unit_tags: [],
    switch_effect: '',
    ability_name: '',
    ability: [],
    skills: [
      { skill_name: 'Skill 1', name: 'Skill 1', cooldown: 3, cd: 3, effects: [] },
      { skill_name: 'Skill 2', name: 'Skill 2', cooldown: 3, cd: 3, effects: [] },
      { skill_name: 'Skill 3', name: 'Skill 3', cooldown: 3, cd: 3, effects: [] },
    ],
    passives: [],
    spellcards: defaultSpellCards,
    spellCards: defaultSpellCards,
  };
};

export const mapApiToState = (rawData, effectDict = []) => {
  if (!rawData) return getDefaultCharData();

  const data = rawData.data || rawData.friend || rawData.character || rawData;

  const name_id = data.name_id || '';
  let code = data.code || data.universe || data.universe_code || '';
  let name = data.name || data.character_name || '';

  if ((!code || !name) && name_id) {
    const parts = name_id.split('_');
    if (parts.length > 1) {
      code = code || parts[0];
      name = name || parts.slice(1).join(' ');
    } else {
      name = name || name_id;
    }
  }

  const stats = {
    hp: data.stats?.hp ?? 0,
    agility: data.stats?.agility ?? 0,
    yang_atk: data.stats?.yang_atk ?? 0,
    yin_atk: data.stats?.yin_atk ?? 0,
    yang_def: data.stats?.yang_def ?? 0,
    yin_def: data.stats?.yin_def ?? 0,
  };

  const unit_tags = Array.isArray(data.unit_tags) ? data.unit_tags : [];
  const rawAbility = Array.isArray(data.ability) ? data.ability : [];
  const passives = Array.isArray(data.passives) ? data.passives : [];

  const mappedAbility = rawAbility.map((ab) => matchDictItem(ab, effectDict));

  const rawSkills = Array.isArray(data.skills) ? data.skills : [];
  const skillCount = Math.max(rawSkills.length, 3);

  const skills = Array.from({ length: skillCount }).map((_, idx) => {
    const sk = rawSkills[idx] || {};
    const rawEffects = Array.isArray(sk.effects) ? sk.effects : [];
    const rawCd = sk.cooldown ?? sk.cd ?? 3;

    let cdVal = 3;
    let isXChangeDetected = Boolean(sk.is_x_change || idx >= 3);
    let xChangeFromVal = sk.x_change_from || sk.x_change_friend_id || '';

    if (typeof rawCd === 'number') {
      cdVal = rawCd;
    } else if (typeof rawCd === 'string') {
      const cdMatch = rawCd.match(/\d+/);
      if (cdMatch) cdVal = parseInt(cdMatch[0], 10);
      if (/x-switch|x-change/i.test(rawCd)) {
        isXChangeDetected = true;
      }
    }

    const defaultName = idx === 3 ? 'X-Change Skill' : `Skill ${idx + 1}`;
    const nameVal = sk.skill_name || sk.name || defaultName;

    return {
      skill_name: nameVal,
      name: nameVal,
      cooldown: cdVal,
      cd: cdVal,
      is_x_change: isXChangeDetected,
      x_change_from: xChangeFromVal,
      effects: rawEffects.map((eff) => matchDictItem(eff, effectDict)),
    };
  });

  const rawSpellcards = Array.isArray(data.spellcards) || Array.isArray(data.spellCards)
    ? (data.spellcards || data.spellCards)
    : [];

  const spellcardsList = rawSpellcards.map((sc, scIdx) => {
    const pre_effects = (Array.isArray(sc.pre_effects) ? sc.pre_effects : []).map((eff) =>
      matchDictItem(eff, effectDict)
    );
    const post_effects = (Array.isArray(sc.post_effects) ? sc.post_effects : []).map((eff) =>
      matchDictItem(eff, effectDict)
    );

    const rawBullets = Array.isArray(sc.bullet_lines) || Array.isArray(sc.bullets)
      ? (sc.bullet_lines || sc.bullets)
      : [];

    const bulletList = rawBullets.map((line, bIdx) => {
      const parsedStats = parseRawStats(line.raw_stats);

      const power = line.power !== undefined ? line.power : parsedStats.power;
      const accuracy = line.accuracy !== undefined ? line.accuracy : parsedStats.accuracy;
      const crit_rate = line.crit_rate !== undefined ? line.crit_rate : (line.crit !== undefined ? line.crit : parsedStats.crit_rate);
      const bullet_count = line.bullet_count !== undefined ? line.bullet_count : (line.count !== undefined ? line.count : parsedStats.bullet_count);
      const p_cost = line.p_cost !== undefined ? line.p_cost : parsedStats.p_cost;

      const rawProps = Array.isArray(line.properties) ? line.properties : [];
      const properties = rawProps.map((p) =>
        typeof p === 'string' ? p : p.property_text || p.effect_text || ''
      );

      const elementVal = line.element || line.element_code || line.element_type || 'NO_ELEMENT';
      const bulletTypeVal = line.bullet_type || line.bullet_type_code || line.bullet_type_name || line.type || 'NORMAL';

      return {
        id: line.id || bIdx,
        raw_stats: line.raw_stats || formatRawStats({ power, accuracy, crit_rate, bullet_count, p_cost }),
        power,
        accuracy,
        crit_rate,
        crit: crit_rate,
        bullet_count,
        count: bullet_count,
        p_cost,
        element: elementVal,
        bullet_type: bulletTypeVal,
        type: bulletTypeVal,
        properties,
        killers: Array.isArray(line.killers) ? line.killers : [],
      };
    });
    const cardTitle = sc.card_title || sc.title || sc.name || `Spell Card ${scIdx + 1}`;

    return {
      id: sc.id || scIdx,
      card_title: cardTitle,
      title: cardTitle,
      name: cardTitle,
      target_type: sc.target_type || 'Solo',
      pre_effects,
      post_effects,
      bullet_lines: bulletList,
      bullets: bulletList,
    };
  });

  return {
    friend_id: data.friend_id || data.id || null, 
    base_friend_id: data.base_friend_id || null,
    name_id,
    code,
    universe: code,
    name,
    is_rebirth: Boolean(data.is_rebirth || /\(Rebirth\)/i.test(name)),
    role: data.role || '',
    rarity_code: data.rarity_code || 'GENERAL',
    image_url: data.image_url || '',
    stats,
    unit_tags,
    switch_effect: data.switch_effect || '',
    ability_name: data.ability_name || '',
    ability: mappedAbility,
    skills,
    passives,
    spellcards: spellcardsList,
    spellCards: spellcardsList,
  };
};

export const mapStateToApi = (charData, effectDict = []) => {
  const code = charData.code || charData.universe || '';
  const name = charData.name || '';
  const name_id = charData.name_id || (code && name ? `${code}_${name.replace(/\s+/g, '_')}` : '');
  const spellCardsList = charData.spellCards || charData.spellcards || [];

  const formatEffectObj = (eff) => {
    const matched = matchDictItem(eff, effectDict);
    return {
      effect_code: matched.effect_code,
      ui_group: matched.ui_group || '',
      direction: matched.direction || 'UP',
      value: matched.value ?? 1,
      target: matched.target || 'SELF',
      duration: matched.is_infinite ? 0 : (matched.duration ?? 1),
      is_infinite: matched.is_infinite ? 1 : 0,
      sync_from_stat: matched.sync_from_stat || '',
      sync_to_stat: matched.sync_to_stat || '',
      effect_text: matched.effect_text || '',
    };
  };

  return {
    friend_id: charData.friend_id || null,
    base_friend_id: charData.base_friend_id || null,
    name_id,
    code,
    universe: code,
    name,
    is_rebirth: charData.is_rebirth ? 1 : 0,
    role: charData.role || '',
    rarity_code: charData.rarity_code || 'GENERAL',
    image_url: charData.image_url || '',
    stats: charData.stats,
    unit_tags: charData.unit_tags || [],
    switch_effect: charData.switch_effect || '',
    ability_name: charData.ability_name || '',
    ability: (charData.ability || []).map((ab) => formatEffectObj(ab)),
    skills: (charData.skills || []).map((sk) => ({
      skill_name: sk.skill_name || sk.name || '',
      cooldown: Number(sk.cooldown ?? sk.cd ?? 0),
      is_x_change: Boolean(sk.is_x_change),
      x_change_from: sk.is_x_change ? (sk.x_change_from || '') : null,
      effects: (sk.effects || []).map((eff) => formatEffectObj(eff)),
    })),
    passives: charData.passives || [],
    spellcards: spellCardsList.map((sc) => {
      const bulletsList = sc.bullets || sc.bullet_lines || [];
      return {
        card_title: sc.card_title || sc.title || sc.name || '',
        target_type: sc.target_type || 'Solo',
        pre_effects: (sc.pre_effects || []).map((eff) => formatEffectObj(eff)),
        post_effects: (sc.post_effects || []).map((eff) => formatEffectObj(eff)),
        bullet_lines: bulletsList.map((line) => ({
          raw_stats: formatRawStats(line),
          element: line.element || '',
          bullet_type: line.bullet_type || '',
          properties: (line.properties || []).map((p) => {
            if (typeof p === 'string') return p;
            if (p?.effObj) return p.effObj.effect_text || p.effObj.effect_code || '';
            return p?.property_text || p?.effect_text || '';
          }),
          killers: Array.isArray(line.killers) ? line.killers : [],
        })),
      };
    }),
  };
};

export const useEditFriendDetail = (characterIdFromProp = null) => {
  const params = useParams() || {};
  const navigate = useNavigate();
  const characterId = characterIdFromProp || params.id || params.name_id || params.characterId || params.friendId;

  const [charData, setCharData] = useState(getDefaultCharData());
  const [effectDict, setEffectDict] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [autoNext, setAutoNext] = useState(false);

  const originalCharDataRef = useRef(null);
  // 🌟 Dùng Ref để chống vòng lặp vô hạn do effectDict tạo ra
  const effectDictRef = useRef([]);

  const applyCharacterData = useCallback((data, dictOverride = null) => {
    if (!data) return;
    const dict = dictOverride || effectDictRef.current;
    const mapped = mapApiToState(data, dict);

    setCharData((prev) => ({
      ...mapped,
      image_url: mapped.image_url || prev.image_url || originalCharDataRef.current?.image_url || '',
      friend_id: prev.friend_id || mapped.friend_id,
      base_friend_id: prev.base_friend_id || mapped.base_friend_id,
      is_rebirth: prev.is_rebirth !== undefined ? prev.is_rebirth : mapped.is_rebirth,
    }));
  }, []);

  const loadFriendDetail = useCallback(async (targetId, dict = null) => {
    try {
      let charResData = null;
      try {
        const res = await axios.get(`${API_BASE_URL}/friends/${targetId}/details`);
        charResData = res.data;
      } catch (err1) {
        try {
          const res2 = await axios.get(`${API_BASE_URL}/friends/${targetId}`);
          charResData = res2.data;
        } catch (err2) {
          console.error('Lỗi khi tải nhân vật từ API:', err2);
        }
      }

      if (charResData) {
        const parsedData = mapApiToState(charResData, dict || effectDictRef.current);
        setCharData(parsedData);
        originalCharDataRef.current = parsedData;
      }
    } catch (err) {
      console.error('Lỗi lấy chi tiết nhân vật:', err);
    }
  }, []); // 🌟 Xóa dependency array để ngăn re-render loop

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [dictRes, friendsRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/storycards/dictionary/effects`),
          axios.get(`${API_BASE_URL}/friends`),
        ]);

        let dict = [];
        if (dictRes.status === 'fulfilled' && dictRes.value?.data) {
          dict = dictRes.value.data;
        }

        if (isMounted) {
          effectDictRef.current = dict;
          setEffectDict(dict);
          if (friendsRes.status === 'fulfilled' && friendsRes.value?.data) {
            setFriendList(friendsRes.value.data);
          }
        }

        if (characterId && isMounted) {
          await loadFriendDetail(characterId, dict);
        }
      } catch (err) {
        console.error('Lỗi trong quá trình lấy dữ liệu:', err);
        if (isMounted) setMessage('Lỗi kết nối khi tải dữ liệu!');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [characterId, loadFriendDetail]);

  const updateCharData = useCallback((field, value) => {
    setCharData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'code') updated.universe = value;
      if (field === 'universe') updated.code = value;
      return updated;
    });
  }, []);

  const getCurrentIndex = useCallback(() => {
    if (!friendList.length || !charData) return -1;
    return friendList.findIndex(
      (f) =>
        String(f.id) === String(characterId) ||
        String(f.friend_id) === String(characterId) ||
        String(f.friend_id) === String(charData.friend_id) ||
        f.name_id === charData.name_id
    );
  }, [friendList, characterId, charData]);

  const goToNextCharacter = useCallback(() => {
    const idx = getCurrentIndex();
    if (idx !== -1 && idx < friendList.length - 1) {
      const nextFriend = friendList[idx + 1];
      const nextId = nextFriend.id || nextFriend.friend_id || nextFriend.name_id;
      navigate(`/edit-friend-detail/${nextId}`);
    }
  }, [getCurrentIndex, friendList, navigate]);

  const goToPrevCharacter = useCallback(() => {
    const idx = getCurrentIndex();
    if (idx > 0) {
      const prevFriend = friendList[idx - 1];
      const prevId = prevFriend.id || prevFriend.friend_id || prevFriend.name_id;
      navigate(`/edit-friend-detail/${prevId}`);
    }
  }, [getCurrentIndex, friendList, navigate]);

  const currentCode = charData.code || charData.universe || '';
  const currentBaseName = (charData.name || '').replace(/\s*\(Rebirth\)/i, '').trim();

  const isCurrentRebirth = Boolean(
    charData.is_rebirth || /\(Rebirth\)/i.test(charData.name || '')
  );

  const normalCounterpart = friendList.find((f) => {
    if (charData.base_friend_id) {
      return String(f.friend_id || f.id) === String(charData.base_friend_id);
    }
    const fCode = f.code || f.universe || '';
    const fName = (f.name || '').replace(/\s*\(Rebirth\)/i, '').trim();
    const fIsRebirth = Boolean(f.is_rebirth || /\(Rebirth\)/i.test(f.name || ''));
    return (fCode === currentCode || fName === currentBaseName) && !fIsRebirth;
  });

  const rebirthCounterpart = friendList.find((f) => {
    if (f.base_friend_id && charData.friend_id) {
      return String(f.base_friend_id) === String(charData.friend_id);
    }
    const fCode = f.code || f.universe || '';
    const fName = (f.name || '').replace(/\s*\(Rebirth\)/i, '').trim();
    const fIsRebirth = Boolean(f.is_rebirth || /\(Rebirth\)/i.test(f.name || ''));
    return (fCode === currentCode || fName === currentBaseName) && fIsRebirth;
  });

  const toggleRebirthMode = async (targetRebirthState) => {
    if (targetRebirthState === isCurrentRebirth) return;

    if (targetRebirthState) {
      if (rebirthCounterpart) {
        const rId = rebirthCounterpart.friend_id || rebirthCounterpart.id;
        await loadFriendDetail(rId, effectDictRef.current);
      } else {
        const cleanName = charData.name ? charData.name.replace(/\s*\(Rebirth\)/i, '').trim() : '';
        setCharData((prev) => ({
          ...prev,
          is_rebirth: true,
          base_friend_id: prev.friend_id || prev.base_friend_id || null,
          image_url: prev.image_url || originalCharDataRef.current?.image_url || '',
          name: `${cleanName} (Rebirth)`,
        }));
      }
    } else {
      if (normalCounterpart) {
        const nId = normalCounterpart.friend_id || normalCounterpart.id;
        await loadFriendDetail(nId, effectDictRef.current);
      } else if (charData.base_friend_id) {
        await loadFriendDetail(charData.base_friend_id, effectDictRef.current);
      } else if (originalCharDataRef.current) {
        setCharData(originalCharDataRef.current);
      } else {
        const cleanName = charData.name ? charData.name.replace(/\s*\(Rebirth\)/i, '').trim() : '';
        setCharData((prev) => ({
          ...prev,
          is_rebirth: false,
          base_friend_id: null,
          name: cleanName,
        }));
      }
    }
  };

  const handleSave = async (options = {}) => {
    let targetId = charData.friend_id || characterId || charData.name_id || charData.code;

    setLoading(true);
    setMessage('');
    try {
      const isRebirthMode = Boolean(charData.is_rebirth || /\(Rebirth\)/i.test(charData.name || ''));
      const existsRebirthInDb = Boolean(rebirthCounterpart);

      if (isRebirthMode && !existsRebirthInDb) {
        const cleanName = charData.name ? charData.name.replace(/\s*\(Rebirth\)/i, '').trim() : '';
        const rebirthFullName = `${cleanName} (Rebirth)`;
        const baseId = charData.base_friend_id || charData.friend_id || characterId;
        const sharedImageUrl = originalCharDataRef.current?.image_url || charData.image_url || '';

        const addRes = await axios.post(`${API_BASE_URL}/friends`, {
          name: rebirthFullName,
          rarity_code: charData.rarity_code || 'GENERAL',
          universe: charData.universe || charData.code || '',
          role: charData.role || 'Attack',
          image_url: sharedImageUrl,
          is_rebirth: 1,
          base_friend_id: baseId,
        });

        if (addRes.data && addRes.data.friend_id) {
          targetId = addRes.data.friend_id;
          setCharData((prev) => ({
            ...prev,
            friend_id: targetId,
            base_friend_id: baseId,
            image_url: sharedImageUrl,
            is_rebirth: true,
            name: rebirthFullName,
          }));
        }
      }

      if (!targetId) {
        setMessage('Không tìm thấy ID / Mã nhân vật để lưu!');
        setLoading(false);
        return;
      }

      const payload = mapStateToApi(charData, effectDictRef.current);
      await axios.put(`${API_BASE_URL}/friends/${targetId}/details`, payload);

      const friendsRes = await axios.get(`${API_BASE_URL}/friends`);
      if (friendsRes.data) {
        setFriendList(friendsRes.data);
      }

      setMessage('✅ Lưu chi tiết nhân vật thành công!');

      if (options.forceGoNext || autoNext) {
        setTimeout(() => goToNextCharacter(), 500);
      }
    } catch (err) {
      console.error('Lỗi khi lưu dữ liệu:', err);
      setMessage('Lỗi khi lưu dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  return {
    charData,
    setCharData,
    effectDict,
    friendList,
    loading,
    message,
    autoNext,
    setAutoNext,
    currentIndex: getCurrentIndex(),
    totalFriends: friendList.length,
    isCurrentRebirth,
    hasRebirthVersion: Boolean(rebirthCounterpart || isCurrentRebirth),
    toggleRebirthMode,
    goToNextCharacter,
    goToPrevCharacter,
    applyCharacterData,
    loadLocalCharacter: applyCharacterData,
    updateCharData,
    handleSave,
  };
};