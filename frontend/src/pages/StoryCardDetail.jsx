import React from 'react';
import { Link } from 'react-router-dom';
import { useStoryCardDetail } from '../hooks/useStoryCardDetail';
import { getRoleIconUrl } from '../utils/characterUtils';

// 🌟 Quét động ảnh nhân vật bằng Regex trong folder character
const characterImages = import.meta.glob('/public/image/character/**/*.(png|jpg|jpeg|webp)', { eager: true });
const directionImages = import.meta.glob('/public/image/direction/**/*.(png|jpg|jpeg|webp)', { eager: true });

// 🌟 Format tên chỉ số Stat chuẩn ký hiệu (Yin ATK, Agility, ...)
const STAT_LABEL_MAP = {
  'hp': 'HP',
  'yin_atk': 'Yin ATK',
  'yang_atk': 'Yang ATK',
  'yin_def': 'Yin DEF',
  'yang_def': 'Yang DEF',
  'agility': 'Agility'
};

const formatStatLabel = (label = '') => {
  if (!label) return '';
  const key = String(label).trim().toLowerCase();
  return STAT_LABEL_MAP[key] || label;
};

// 🌟 Regex tìm ảnh Nhân vật
const getCharacterLockImage = (charLockStr) => {
  if (!charLockStr) return null;
  const match = charLockStr.trim().match(/^([A-Za-z0-9]+)\s+(.+)$/);
  if (!match) return null;

  const [, worldFolder, rawName] = match;
  const foundPath = Object.keys(characterImages).find((pathKey) => {
    const regex = new RegExp(`/image/character/${worldFolder}/.*${rawName}.*\\.(png|jpg|jpeg|webp)$`, 'i');
    return regex.test(pathKey);
  });

  return foundPath ? foundPath.replace(/^\/public/, '') : null;
};

// 🌟 Tìm Icon Hướng (Direction UP/DOWN Icon)
const getDirectionImage = (dir = '') => {
  if (!dir) return null;
  const cleanDir = dir.trim().toLowerCase();
  const foundPath = Object.keys(directionImages).find((pathKey) => pathKey.toLowerCase().includes(cleanDir));
  return foundPath ? foundPath.replace(/^\/public/, '') : `/image/direction/${dir}.png`;
};

// 🌟 Lấy Icon Hiệu Ứng chuẩn
const getEffectIconPath = (eff) => {
  if (!eff) return null;

  let rawUrl = eff.direction === 'DOWN' 
    ? (eff.icon_down_url || eff.icon_up_url) 
    : (eff.icon_up_url || eff.icon_down_url);

  if (!rawUrl) return null;

  rawUrl = rawUrl.replace(/^\/?public/, '');
  if (!rawUrl.startsWith('/') && !rawUrl.startsWith('http')) {
    rawUrl = `/${rawUrl}`;
  }
  return rawUrl.endsWith('.webp') ? rawUrl : `${rawUrl}.webp`;
};

// 🌟 Format Tên Hiệu Ứng (Tự động ghi thẳng Tag với Damage Resist)
const getFormattedEffectName = (eff) => {
  const name = eff.effect_name || eff.effect_code || '';
  const category = (eff.category || '').toLowerCase();
  
  const isResist = category.includes('resist') || category.includes('cut') || category.includes('reduction') || (eff.effect_code || '').toLowerCase().includes('resist');
  
  if (isResist) {
    if (eff.tag && !name.toLowerCase().includes(eff.tag.toLowerCase())) {
      return `${eff.tag} Damage Resist`;
    }
    if (!name.toLowerCase().includes('resist') && !name.toLowerCase().includes('cut')) {
      return `${name} Damage Resist`;
    }
  }
  return name;
};

// 🌟 Kiểm tra hiệu ứng Hệ (Element) hoặc Đạn (Bullet)
const isElementOrBulletEffect = (code = '', name = '', category = '') => {
  const text = `${code} ${name} ${category}`.toLowerCase();
  const pattern = /\b(element|bullet|elem|sun|moon|fire|water|wood|metal|earth|star|slash|laser|missile|ofuda|body|energy|liquid|heavy|sharp|spell|light|normal|resist|cut)\b/i;
  return pattern.test(text);
};

// 🌟 Kiểm tra SP UP (Spirit Power Up)
const isSpiritPowerUpEffect = (code = '', name = '') => {
  const text = `${code} ${name}`.toLowerCase();
  return (text.includes('spirit') || text.includes('sp')) && !text.includes('rate') && !text.includes('collection') && !text.includes('recovery');
};

// 🌟 Kiểm tra SP Collection Rate
const isSpCollectionRateEffect = (code = '', name = '') => {
  const text = `${code} ${name}`.toLowerCase();
  return (text.includes('sp') || text.includes('spirit')) && (text.includes('rate') || text.includes('collection'));
};

// 🌟 Xác định đơn vị (% hoặc P hoặc để trống)
const getEffectUnit = (code = '', name = '', category = '') => {
  if (isElementOrBulletEffect(code, name, category) || isSpCollectionRateEffect(code, name)) {
    return '%';
  }
  if (isSpiritPowerUpEffect(code, name)) {
    return ' P';
  }
  return '';
};

const StoryCardDetail = () => {
  const { card, stats, effects, loading } = useStoryCardDetail();

  if (loading) return <div className="min-h-screen bg-[#0f0f12] text-white flex justify-center items-center font-bold">Đang tải chi tiết Story Card...</div>;
  if (!card) return <div className="min-h-screen bg-[#0f0f12] text-white flex justify-center items-center font-bold">Không tìm thấy Story Card!</div>;

  const normalStatsList = [
    { label: 'HP', val: stats?.data?.hp },
    { label: 'Yin ATK', val: stats?.data?.yin_atk },
    { label: 'Yang ATK', val: stats?.data?.yang_atk },
    { label: 'Yin DEF', val: stats?.data?.yin_def },
    { label: 'Yang DEF', val: stats?.data?.yang_def },
    { label: 'Agility', val: stats?.data?.agility },
  ].filter(s => s.val && Number(s.val) > 0);

  const hasStats = stats?.is_random 
    ? (stats.data?.stat1_type || stats.data?.stat2_type) 
    : normalStatsList.length > 0;

  // 🌟 PHÂN LOẠI BASE EFFECTS VÀ LUCK EFFECTS
  const baseEffects = effects.filter(eff => !eff.is_luck && !eff.is_ex && !eff.luck_group);
  const luckEffects = effects.filter(eff => eff.is_luck || eff.is_ex || eff.luck_group);

  let baseList = baseEffects;
  let luckPairs = [];

  if (baseEffects.length === 0 && luckEffects.length === 0 && effects.length > 0) {
    if (card.type?.toLowerCase() === 'luck' || card.is_luck) {
      baseList = [effects[0]];
      const remaining = effects.slice(1);
      for (let i = 0; i < remaining.length; i += 2) {
        luckPairs.push(remaining.slice(i, i + 2));
      }
    } else {
      baseList = effects;
    }
  } else if (luckEffects.length > 0) {
    const groupMap = {};
    let hasExplicitGroups = false;

    luckEffects.forEach((eff) => {
      if (eff.luck_group || eff.option_num) {
        hasExplicitGroups = true;
        const key = eff.luck_group || eff.option_num;
        if (!groupMap[key]) groupMap[key] = [];
        groupMap[key].push(eff);
      }
    });

    if (hasExplicitGroups) {
      Object.values(groupMap).forEach(pair => luckPairs.push(pair));
    } else {
      for (let i = 0; i < luckEffects.length; i += 2) {
        luckPairs.push(luckEffects.slice(i, i + 2));
      }
    }
  }

  // 🌟 Hàm Render 1 Dòng Hiệu Ứng
  const renderEffectRow = (eff, keyIndex) => {
    const code = eff.effect_code || '';
    const name = getFormattedEffectName(eff);
    const category = eff.category || '';
    
    const isElemOrBullet = isElementOrBulletEffect(code, name, category);
    const isSpUp = isSpiritPowerUpEffect(code, name);
    const unit = getEffectUnit(code, name, category);
    const charImgPath = getCharacterLockImage(eff.character_lock);
    const effectImgPath = getEffectIconPath(eff); 
    const directionImgPath = getDirectionImage(eff.direction);

    // Xử lý logic Dấu: Chỉ dùng '-' nếu là hiệu ứng Status VÀ direction là DOWN
    const isStatus = category.toLowerCase().includes('status') || (!isElemOrBullet && !isSpUp && Boolean(eff.target));
    const sign = (isStatus && eff.direction === 'DOWN') ? '-' : '+';

    return (
      <div 
        key={keyIndex} 
        className="bg-[#1a1a20] p-3 rounded-xl border border-gray-700/80 flex items-center justify-between gap-3 shadow relative min-h-[52px]"
      >
        {/* Góc trái: Lock Conditions ➔ Direction ➔ Effect Icon ➔ Tên */}
        <div className="flex items-center gap-2.5 min-w-0">
          
          {/* 🔒 CỤM ĐIỀU KIỆN LOCK */}
          {((eff.role_lock && eff.role_lock !== 'ALL') || charImgPath) && (
            <div 
              className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/40 px-1.5 py-0.5 rounded-lg shrink-0"
              title="Điều kiện kích hoạt"
            >
              {eff.role_lock && eff.role_lock !== 'ALL' && (
                <img 
                  src={getRoleIconUrl(eff.role_lock)} 
                  alt={eff.role_lock} 
                  title={`Yêu cầu Class: ${eff.role_lock}`}
                  className="w-5 h-5 object-contain shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}

              {charImgPath && (
                <img 
                  src={charImgPath} 
                  alt={eff.character_lock} 
                  title={`Yêu cầu Nhân vật: ${eff.character_lock}`}
                  className="w-5 h-5 object-cover rounded-full border border-yellow-400 shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          )}

          {/* Icon Lên / Xuống (Direction) */}
          {directionImgPath && (
            <img 
              src={directionImgPath} 
              alt={eff.direction} 
              title={`Direction: ${eff.direction}`}
              className="w-5 h-5 object-contain shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Effect Icon chính */}
          {effectImgPath && (
            <img 
              src={effectImgPath} 
              alt={code} 
              className="w-7 h-7 object-contain shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Tên Hiệu Úng */}
          <span className="font-semibold text-sm text-gray-200 truncate">
            {name}
          </span>
        </div>

        {/* Góc phải: MỤC TIÊU ➔ SỐ LƯỢNG ➔ TURNS */}
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          {!isElemOrBullet && eff.target && (
            <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700 font-semibold uppercase">
              {eff.target}
            </span>
          )}

          <span className={`px-2 py-0.5 rounded font-bold font-mono ${eff.direction === 'DOWN' ? 'bg-red-900/60 text-red-300' : 'bg-green-900/60 text-green-300'}`}>
            {sign}{eff.value}{unit}
          </span>

          {/* Ẩn Turn nếu là Element, Bullet hoặc Spirit Power Up */}
          {!isElemOrBullet && !isSpUp && eff.duration > 0 && (
            <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700 font-mono">
              {eff.duration} {eff.duration > 1 ? 'Turns' : 'Turn'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Nút Quay về */}
        <div className="flex justify-between items-center">
          <Link to="/storycards" className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-4 py-2 rounded text-sm transition-colors">
            ⬅ Quay về danh sách
          </Link>
          <span className="text-gray-500 font-mono text-sm">ID: #{card.storycard_id}</span>
        </div>

        {/* PHẦN TRÊN: ẢNH + STAT + THÔNG TIN CHÍNH + HIỆU ỨNG CHUNG */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* CỘT TRÁI: Ảnh Card & Stat */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            <div className="w-full aspect-[3/2] bg-black rounded-xl border border-gray-700 overflow-hidden shadow-xl">
              <img 
                src={card.display_image_url} 
                alt={card.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                }}
              />
            </div>

            {/* Chỉ số Stat */}
            {hasStats && (
              <div className="bg-[#1a1a20] p-3 rounded-xl border border-gray-700 shadow-lg">
                {stats?.is_random ? (
                  <div className="space-y-2 text-xs">
                    {stats.data?.stat1_type && (
                      <div className="flex justify-between bg-[#0f0f12] p-2 rounded border border-gray-800">
                        <span className="text-gray-400 font-semibold">{formatStatLabel(stats.data.stat1_type)}</span>
                        <span className="text-yellow-400 font-bold font-mono">{stats.data.stat1_min} ~ {stats.data.stat1_max}</span>
                      </div>
                    )}
                    {stats.data?.stat2_type && (
                      <div className="flex justify-between bg-[#0f0f12] p-2 rounded border border-gray-800">
                        <span className="text-gray-400 font-semibold">{formatStatLabel(stats.data.stat2_type)}</span>
                        <span className="text-yellow-400 font-bold font-mono">{stats.data.stat2_min} ~ {stats.data.stat2_max}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {normalStatsList.map((s) => (
                      <div key={s.label} className="bg-[#0f0f12] p-2 rounded border border-gray-800 text-center">
                        <div className="text-gray-400 text-[10px] uppercase">{formatStatLabel(s.label)}</div>
                        <div className="font-bold text-yellow-400 font-mono">+{s.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Tên Card + Hiệu ứng chung */}
          <div className="flex-1 w-full space-y-4">
            
            <div className="bg-[#1a1a20] p-4 rounded-xl border border-gray-700 shadow-lg space-y-2">
              <div className="flex items-center gap-3">
                {card.type && (
                  <img 
                    src={`/image/type/${card.type.trim()}.png`} 
                    alt={card.type}
                    title={card.type}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <h1 className="text-xl sm:text-2xl font-bold text-[#e1c16e] font-serif leading-tight">
                  {card.name}
                </h1>
              </div>

              <div className="text-yellow-400 text-sm tracking-widest pl-1">
                {'★'.repeat(card.rarity || 0)}
              </div>
            </div>

            {/* HIỆU ỨNG CHUNG (BASE EFFECTS) */}
            <div className="space-y-2">
              {baseList.map((eff, index) => renderEffectRow(eff, `base-${index}`))}
            </div>

          </div>
        </div>

        {/* PHẦN DƯỚI: CÁC NHÓM HIỆU ỨNG LUCK (CHIA LÀM 2 CỘT) */}
        {luckPairs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {luckPairs.map((pair, groupIdx) => (
              <div 
                key={`luck-group-${groupIdx}`} 
                className="border border-amber-500/30 rounded-xl p-3 bg-[#16161c] space-y-2 relative shadow-md"
              >
                <div className="text-xs font-bold text-amber-400 font-mono tracking-wider">
                  #{groupIdx + 1}
                </div>
                <div className="space-y-2">
                  {pair.map((eff, effIdx) => renderEffectRow(eff, `luck-${groupIdx}-${effIdx}`))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default StoryCardDetail;