export const parseRawStats = (rawStr) => {
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

export const normalizeElement = (rawElem) => {
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

export const normalizeBulletType = (rawType) => {
  if (!rawType) return 'NORMAL';
  return String(rawType).trim().toUpperCase();
};

export const parseTextToEffect = (rawInput, dbEffectDict = []) => {
  if (!rawInput) return null;
  const safeDict = Array.isArray(dbEffectDict) ? dbEffectDict : [];

  if (typeof rawInput === 'object' && (rawInput.effect_code || rawInput.code)) {
    const inputCode = rawInput.effect_code || rawInput.code;
    const matchedDict = safeDict.find(d => 
      String(d.code || d.effect_code || '').toLowerCase() === String(inputCode).toLowerCase()
    );

    return {
      ui_group: rawInput.ui_group || matchedDict?.ui_group || matchedDict?.group || matchedDict?.effect_group || '',
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
  if (/DOWN|-|Debuff|Decrease/i.test(text) && !/UP/i.test(text)) direction = 'DOWN';

  let value = 1;
  const valMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*(?:%|levels?|steps?|UP|DOWN)?/i);
  if (valMatch && valMatch[1]) value = Math.abs(parseFloat(valMatch[1]));

  let duration = 1;
  const turnMatch = text.match(/(\d+)\s*turns?/i);
  if (turnMatch && turnMatch[1]) duration = parseInt(turnMatch[1], 10);

  let matchedCode = '';
  let matchedGroup = '';

  const lowerText = text.toLowerCase();
  for (const item of safeDict) {
    const code = String(item.code || item.effect_code || '').toLowerCase();
    const name = String(item.effect_name || item.name || '').toLowerCase();
    if ((code && lowerText.includes(code)) || (name && lowerText.includes(name))) {
      matchedCode = item.code || item.effect_code;
      matchedGroup = item.ui_group || item.group || item.effect_group;
      break;
    }
  }

  return {
    ui_group: matchedGroup || '',
    effect_code: matchedCode || '',
    code: matchedCode || '',
    direction,
    value,
    target,
    duration
  };
};

export const parseBulletPropertyItem = (p, dbEffectDict = []) => {
  if (!p) return null;

  if (typeof p === 'string') {
    const str = p.trim();
    const matchedDict = dbEffectDict.find(d => {
      const code = String(d.code || d.effect_code || '').toLowerCase();
      const name = String(d.effect_name || d.name || '').toLowerCase();
      return str.toLowerCase().includes(code) || str.toLowerCase().includes(name);
    });

    const effectCode = matchedDict ? (matchedDict.code || matchedDict.effect_code) : str;
    const uiGroup = matchedDict ? (matchedDict.ui_group || matchedDict.group || matchedDict.effect_group) : 'Tag Modifier';

    return {
      is_status_effect: true,
      ui_group: uiGroup,
      effect_code: effectCode,
      property_code: effectCode,
      code: effectCode,
      target: 'TARGET',
      direction: 'UP',
      value: 1.0,
      duration: 3
    };
  }

  return {
    is_status_effect: p.is_status_effect ?? true,
    ui_group: p.ui_group || '',
    effect_code: p.effect_code || p.property_code || p.code || '',
    property_code: p.property_code || p.effect_code || p.code || '',
    code: p.code || p.effect_code || p.property_code || '',
    target: p.target || 'TARGET',
    direction: p.direction || 'UP',
    value: Number(p.value ?? 1.0),
    duration: Number(p.duration ?? 3)
  };
};