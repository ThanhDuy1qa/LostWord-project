const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');

const ROOT_DIR = path.join(__dirname, '../../frontend/public/image/friend');
const FRIENDS_JSON_DIR = path.join(__dirname, '../../frontend/public/data/friends');

const mapFolder = (u) => {
  if (!u) return '';
  return u.replaceAll('>', '__').replaceAll('<', '_').replaceAll('#', '%');
};

const ensureValidEffectCode = (rawCode, rawText, validCodesSet) => {
  if (rawCode && validCodesSet.has(String(rawCode).trim().toUpperCase())) {
    return String(rawCode).trim().toUpperCase();
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
  return 'DMG_UP';
};

// 1. Lấy danh sách nhân vật
// Trong friendController.js -> sửa hàm getAllFriends:

const getAllFriends = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.*,
        COALESCE(NULLIF(f.image_url, ''), base.image_url) AS image_url,
        r.rarity_name,
        IF(fs.friend_id IS NOT NULL, 1, 0) AS has_details
      FROM friend f 
      LEFT JOIN friend base ON f.base_friend_id = base.friend_id
      JOIN rarity r ON f.rarity_code = r.rarity_code
      LEFT JOIN friendstat fs ON f.friend_id = fs.friend_id
      ORDER BY f.sort_order ASC, f.friend_id ASC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi Database:", error);
    res.status(500).json({ error: "Không thể lấy dữ liệu nhân vật" });
  }
};

// 2. Thêm nhân vật
const addFriend = async (req, res) => {
  try {
    const { name, rarity_code, universe, role, image_url, is_rebirth, base_friend_id } = req.body;

    if (universe) {
      const folderName = mapFolder(universe);
      const universeDirPath = path.join(ROOT_DIR, folderName);
      await fs.mkdir(universeDirPath, { recursive: true });
    }

    const [result] = await pool.query(
      'INSERT INTO friend (name, rarity_code, universe, role, image_url, is_rebirth, base_friend_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name, 
        rarity_code || 'GENERAL', 
        universe || '', 
        role || 'Attack', 
        image_url || '', 
        is_rebirth ? 1 : 0, 
        base_friend_id || null
      ]
    );

    res.status(201).json({ 
      message: "Thêm nhân vật thành công!", 
      friend_id: result.insertId 
    });
  } catch (error) {
    console.error("Lỗi thêm nhân vật:", error);
    res.status(500).json({ error: "Lỗi server khi thêm dữ liệu nhân vật" });
  }
};

// 3. Cập nhật thông tin cơ bản nhân vật (Đồng bộ ảnh cho bản Rebirth)
const updateFriend = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rarity_code, universe, role, image_url, is_rebirth, base_friend_id } = req.body;

    const [oldRecords] = await pool.query(
      'SELECT image_url, universe FROM friend WHERE friend_id = ?',
      [id]
    );
    if (oldRecords.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    const oldImageUrl = oldRecords[0].image_url;
    const oldUniverse = oldRecords[0].universe;

    if (oldImageUrl !== image_url || oldUniverse !== universe) {
      const oldFolder = mapFolder(oldUniverse);
      const newFolder = mapFolder(universe);
      const oldFileName = oldImageUrl.split('/').pop();
      const newFileName = image_url.split('/').pop();

      const oldFilePath = path.join(ROOT_DIR, oldFolder, `${oldFileName}.webp`);
      const newFilePath = path.join(ROOT_DIR, newFolder, `${newFileName}.webp`);

      try {
        await fs.access(oldFilePath);
        await fs.mkdir(path.dirname(newFilePath), { recursive: true });
        await fs.rename(oldFilePath, newFilePath);
      } catch (fileErr) {
        console.warn(`Không tìm thấy file cũ để đổi tên: ${oldFilePath}`);
      }
    }

    await pool.query(
      'UPDATE friend SET name = ?, rarity_code = ?, universe = ?, role = ?, image_url = ?, is_rebirth = ?, base_friend_id = ? WHERE friend_id = ?',
      [
        name, 
        rarity_code, 
        universe, 
        role, 
        image_url, 
        is_rebirth ? 1 : 0, 
        base_friend_id || null, 
        id
      ]
    );

    // 🌟 Tự động cập nhật lại ảnh cho các bản Rebirth liên kết với ID bản Thường này
    if (image_url) {
      await pool.query('UPDATE friend SET image_url = ? WHERE base_friend_id = ?', [image_url, id]);
    }

    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (error) {
    console.error("Lỗi cập nhật nhân vật:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật dữ liệu." });
  }
};

// 4. Cập nhật thứ tự
const updateSortOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { sort_order } = req.body;
    await pool.query('UPDATE friend SET sort_order = ? WHERE friend_id = ?', [sort_order, id]);
    res.status(200).json({ message: "Đã cập nhật thứ tự" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 5. Xóa nhân vật
const deleteFriend = async (req, res) => {
  try {
    const { id } = req.params;
    const [oldRecords] = await pool.query('SELECT image_url, universe FROM friend WHERE friend_id = ?', [id]);
    if (oldRecords.length > 0) {
      const oldFolder = mapFolder(oldRecords[0].universe);
      const fileName = oldRecords[0].image_url.split('/').pop();
      const filePath = path.join(ROOT_DIR, oldFolder, `${fileName}.webp`);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (fileErr) {}
    }

    const [result] = await pool.query('DELETE FROM friend WHERE friend_id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Không tìm thấy nhân vật để xóa." });

    res.status(200).json({ message: "Xóa nhân vật thành công!" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi xóa dữ liệu." });
  }
};

const getRarities = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rarity');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu Rarity" });
  }
};

const getFriendSuggestions = async (req, res) => {
  try {
    const { universe = '', name = '' } = req.query;
    const [rows] = await pool.query(
      `SELECT 
         f.friend_id, f.name, f.universe, f.role, f.rarity_code, 
         COALESCE(NULLIF(f.image_url, ''), base.image_url) AS image_url, 
         f.is_rebirth, f.base_friend_id 
       FROM friend f
       LEFT JOIN friend base ON f.base_friend_id = base.friend_id
       WHERE f.universe LIKE ? AND f.name LIKE ? 
       LIMIT 10`,
      [`%${universe}%`, `%${name}%`]
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Lỗi gợi ý nhân vật" });
  }
};

const getFriendJsonData = async (req, res) => {
  try {
    const { filename } = req.params;
    const cleanFileName = filename.endsWith('.json') ? filename : `${filename}.json`;
    const filePath = path.join(FRIENDS_JSON_DIR, cleanFileName);
    await fs.access(filePath);
    const fileData = await fs.readFile(filePath, 'utf-8');
    res.status(200).json(JSON.parse(fileData));
  } catch (error) {
    res.status(500).json({ error: "Không thể đọc dữ liệu file JSON" });
  }
};

// 9. Lấy chi tiết nhân vật theo ID
const getFriendById = async (req, res) => {
  try {
    const { id } = req.params;
    const [friends] = await pool.query(`
      SELECT 
        f.*,
        COALESCE(NULLIF(f.image_url, ''), base.image_url) AS image_url
      FROM friend f
      LEFT JOIN friend base ON f.base_friend_id = base.friend_id
      WHERE f.friend_id = ?
    `, [id]);
    if (friends.length === 0) return res.status(404).json({ error: "Không tìm thấy nhân vật" });

    const friend = friends[0];

    const [stats] = await pool.query('SELECT * FROM friendstat WHERE friend_id = ?', [id]);
    const [tags] = await pool.query('SELECT tag_name FROM friendtag WHERE friend_id = ?', [id]);
    const [skills] = await pool.query('SELECT * FROM friendskill WHERE friend_id = ? ORDER BY skill_index', [id]);
    
    const [skillEffects] = await pool.query(`
      SELECT 
        fse.skill_index, fse.effect_index, fse.target, fse.effect_code, fse.direction,
        fse.base_value, fse.value, fse.duration, fse.is_infinite, fse.sync_from_stat, fse.sync_to_stat,
        COALESCE(fse.extra_text, eff.effect_name, '') AS extra_text,
        COALESCE(fse.extra_text, eff.effect_name, '') AS effect_text,
        COALESCE(eff.effect_group, '') AS ui_group, COALESCE(eff.effect_name, '') AS effect_name
      FROM friendskilleffect fse
      LEFT JOIN effect eff ON fse.effect_code = eff.effect_code
      WHERE fse.friend_id = ? 
      ORDER BY fse.skill_index, fse.effect_index
    `, [id]);
    
    const [abilityHeader] = await pool.query('SELECT ability_name, switch_effect FROM friendability WHERE friend_id = ?', [id]);
    const [abilities] = await pool.query('SELECT * FROM friendabilityline WHERE friend_id = ? ORDER BY line_index', [id]);
    const [passives] = await pool.query('SELECT effect_text FROM friendpassiveline WHERE friend_id = ? ORDER BY passive_index', [id]);
    const [spellcards] = await pool.query('SELECT * FROM spellcard WHERE friend_id = ? ORDER BY card_index', [id]);

    const formattedSkills = skills.map(s => ({
      skill_name: s.skill_name || (s.skill_index === 4 ? 'X-Change Skill' : `Skill ${s.skill_index}`),
      cooldown: s.cooldown,
      is_x_change: Boolean(s.is_x_change),
      x_change_from: s.x_change_from || '',
      effects: skillEffects
        .filter(e => e.skill_index === s.skill_index)
        .map(e => ({
          target: e.target || 'SELF',
          effect_code: e.effect_code || '',
          direction: e.direction || 'UP',
          base_value: e.base_value ?? 0,
          value: e.value ?? 1,
          duration: e.duration ?? 1,
          is_infinite: Boolean(e.is_infinite),
          sync_from_stat: e.sync_from_stat || '',
          sync_to_stat: e.sync_to_stat || '',
          effect_text: e.effect_text || e.extra_text || e.effect_name || '',
          ui_group: e.ui_group || ''
        }))
    }));

    const formattedSpellcards = await Promise.all(spellcards.map(async (sc) => {
      const [effects] = await pool.query(`
        SELECT sce.effect_type, sce.effect_index, sce.target, sce.effect_code, sce.direction,
               sce.value, sce.duration, sce.is_infinite,
               COALESCE(eff.effect_group, '') AS ui_group, COALESCE(eff.effect_name, '') AS effect_name 
        FROM spellcardeffect sce
        LEFT JOIN effect eff ON sce.effect_code = eff.effect_code
        WHERE sce.spellcard_id = ? 
        ORDER BY sce.effect_index
      `, [sc.spellcard_id]);

      const mapEffectItem = (e) => ({
        target: e.target || 'SELF',
        effect_code: e.effect_code || '',
        direction: e.direction || 'UP',
        value: e.value ?? 1,
        duration: e.duration ?? 1,
        is_infinite: Boolean(e.is_infinite),
        effect_text: e.effect_name || '',
        ui_group: e.ui_group || ''
      });

      const [bullets] = await pool.query('SELECT * FROM bulletline WHERE spellcard_id = ? ORDER BY line_index', [sc.spellcard_id]);
      const bulletLines = await Promise.all(bullets.map(async (b) => {
        const [props] = await pool.query('SELECT property_text FROM bulletproperty WHERE bullet_id = ? ORDER BY property_index', [b.bullet_id]);
        const [killers] = await pool.query('SELECT killer_name FROM bulletkiller WHERE bullet_id = ?', [b.bullet_id]);
        return {
          id: b.bullet_id,
          raw_stats: b.raw_stats,
          element: b.element,
          bullet_type: b.bullet_type,
          properties: props.map(p => p.property_text),
          killers: killers.map(k => k.killer_name)
        };
      }));

      return {
        id: sc.spellcard_id,
        card_title: sc.card_title,
        target_type: sc.target_type,
        pre_effects: effects.filter(e => e.effect_type === 'PRE').map(mapEffectItem),
        post_effects: effects.filter(e => e.effect_type === 'POST').map(mapEffectItem),
        bullet_lines: bulletLines
      };
    }));

    res.status(200).json({
      ...friend,
      stats: stats[0] || {},
      unit_tags: tags.map(t => t.tag_name),
      skills: formattedSkills,
      ability_name: abilityHeader[0]?.ability_name || '',
      switch_effect: abilityHeader[0]?.switch_effect || '',
      ability: abilities.map(a => ({
        ability_category: a.ability_category,
        modifier_type: a.modifier_type,
        effect_code: a.effect_code,
        target: a.target,
        direction: a.direction,
        value: a.value,
        duration: a.duration,
        barrier_types: a.barrier_types,
        effect_text: a.effect_text
      })),
      passives: passives.map(p => p.effect_text),
      spellcards: formattedSpellcards
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin nhân vật:", error);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu nhân vật" });
  }
};

// 10. Lưu toàn bộ chi tiết nhân vật vào MySQL
const updateFriendDetails = async (req, res) => {
  const { id } = req.params;
  const { stats, unit_tags, skills, ability, ability_name, switch_effect, passives, spellcards, is_rebirth, base_friend_id } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (is_rebirth !== undefined || base_friend_id !== undefined) {
      await connection.query(
        'UPDATE friend SET is_rebirth = ?, base_friend_id = ? WHERE friend_id = ?',
        [is_rebirth ? 1 : 0, base_friend_id || null, id]
      );
    }

    const [effectRows] = await connection.query('SELECT effect_code FROM effect');
    const validCodesSet = new Set(effectRows.map(e => String(e.effect_code).trim().toUpperCase()));

    const safeInt = (val, def = 0) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? def : parsed;
    };
    const safeFloat = (val, def = 0) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? def : parsed;
    };

    if (stats) {
      await connection.query(`
        INSERT INTO friendstat (friend_id, hp, yin_atk, yang_atk, yin_def, yang_def, agility)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          hp=VALUES(hp), yin_atk=VALUES(yin_atk), yang_atk=VALUES(yang_atk),
          yin_def=VALUES(yin_def), yang_def=VALUES(yang_def), agility=VALUES(agility)
      `, [
        id, 
        safeInt(stats.hp), 
        safeInt(stats.yin_atk), 
        safeInt(stats.yang_atk), 
        safeInt(stats.yin_def), 
        safeInt(stats.yang_def), 
        safeInt(stats.agility)
      ]);
    }

    await connection.query('DELETE FROM friendtag WHERE friend_id = ?', [id]);
    if (unit_tags && unit_tags.length > 0) {
      const tagRows = unit_tags.map(tag => [id, String(tag).trim()]);
      await connection.query('INSERT INTO friendtag (friend_id, tag_name) VALUES ?', [tagRows]);
    }

    await connection.query('DELETE FROM friendskilleffect WHERE friend_id = ?', [id]);
    await connection.query('DELETE FROM friendskill WHERE friend_id = ?', [id]);

    if (skills && skills.length > 0) {
      for (let sIdx = 0; sIdx < skills.length; sIdx++) {
        const sk = skills[sIdx];
        const skillIndex = sIdx + 1;
        
        await connection.query(
          'INSERT INTO friendskill (friend_id, skill_index, cooldown) VALUES (?, ?, ?)', 
          [id, skillIndex, safeInt(sk.cooldown, 3)]
        );

        if (sk.effects && sk.effects.length > 0) {
          const effRows = sk.effects.map((eff, eIdx) => {
            const rawText = eff.extra_text || eff.effect_text || '';
            const validCode = ensureValidEffectCode(eff.effect_code, rawText, validCodesSet);

            return [
              id,
              skillIndex,
              eIdx + 1,
              eff.target || 'SELF',
              validCode,
              eff.direction || 'UP',
              safeFloat(eff.base_value, 0),
              safeFloat(eff.value, 1),
              safeInt(eff.duration, 1),
              eff.is_infinite ? 1 : 0,
              eff.is_recurring ? 1 : 0,
              eff.scale_by || 'NONE',
              eff.element_code || null,
              eff.sync_from_stat || null,
              eff.sync_to_stat || null,
              rawText || null
            ];
          });
          
          await connection.query(
            `INSERT INTO friendskilleffect 
            (friend_id, skill_index, effect_index, target, effect_code, direction, base_value, value, duration, is_infinite, is_recurring, scale_by, element_code, sync_from_stat, sync_to_stat, extra_text) 
            VALUES ?`,
            [effRows]
          );
        }
      }
    }

    if (switch_effect !== undefined || ability_name !== undefined) {
      await connection.query(`
        INSERT INTO friendability (friend_id, ability_name, switch_effect)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          ability_name = VALUES(ability_name),
          switch_effect = VALUES(switch_effect)
      `, [id, ability_name || null, switch_effect || null]);
    }

    await connection.query('DELETE FROM friendabilityline WHERE friend_id = ?', [id]);
    if (ability && ability.length > 0) {
      const abRows = ability.map((ab, aIdx) => {
        const item = typeof ab === 'string' ? { effect_text: ab, ability_category: 'SPECIAL' } : ab;
        const rawText = item.effect_text || (typeof ab === 'string' ? ab : '');
        const validCode = ensureValidEffectCode(item.effect_code, rawText, validCodesSet);

        let cat = item.ability_category || 'SPECIAL';
        if (cat.length > 30) {
          if (/element/i.test(cat)) cat = 'ELEMENT_MODIFIER';
          else if (/boost/i.test(cat)) cat = 'ON_BOOST';
          else if (/graze/i.test(cat)) cat = 'ON_GRAZE';
          else if (/barrier/i.test(cat)) cat = 'BARRIER_ANOMALY';
          else cat = 'SPECIAL';
        }

        return [
          id,
          aIdx + 1,
          cat,
          item.modifier_type || 'STAT_BUFF',
          validCode,
          item.target || 'SELF',
          item.direction || 'UP',
          safeFloat(item.value, 0),
          safeInt(item.duration, 1),
          item.barrier_types || null,
          rawText
        ];
      });

      await connection.query(
        `INSERT INTO friendabilityline 
        (friend_id, line_index, ability_category, modifier_type, effect_code, target, direction, value, duration, barrier_types, effect_text) 
        VALUES ?`,
        [abRows]
      );
    }

    await connection.query('DELETE FROM friendpassiveline WHERE friend_id = ?', [id]);
    if (passives && passives.length > 0) {
      const pasRows = passives.map((pasText, pIdx) => [id, pIdx + 1, pasText]);
      await connection.query('INSERT INTO friendpassiveline (friend_id, passive_index, effect_text) VALUES ?', [pasRows]);
    }

    const [oldSpellcards] = await connection.query('SELECT spellcard_id FROM spellcard WHERE friend_id = ?', [id]);
    if (oldSpellcards.length > 0) {
      const scIds = oldSpellcards.map(sc => sc.spellcard_id);
      await connection.query('DELETE FROM spellcardeffect WHERE spellcard_id IN (?)', [scIds]);
      
      const [oldBullets] = await connection.query('SELECT bullet_id FROM bulletline WHERE spellcard_id IN (?)', [scIds]);
      if (oldBullets.length > 0) {
        const bIds = oldBullets.map(b => b.bullet_id);
        await connection.query('DELETE FROM bulletproperty WHERE bullet_id IN (?)', [bIds]);
        await connection.query('DELETE FROM bulletkiller WHERE bullet_id IN (?)', [bIds]);
      }
      await connection.query('DELETE FROM bulletline WHERE spellcard_id IN (?)', [scIds]);
    }
    await connection.query('DELETE FROM spellcard WHERE friend_id = ?', [id]);

    if (spellcards && spellcards.length > 0) {
      for (let scIdx = 0; scIdx < spellcards.length; scIdx++) {
        const sc = spellcards[scIdx];
        const [scResult] = await connection.query(
          'INSERT INTO spellcard (friend_id, card_index, card_title, target_type) VALUES (?, ?, ?, ?)',
          [id, scIdx + 1, sc.card_title || sc.name || '', sc.target_type || sc.type || 'All']
        );
        const spellcardId = scResult.insertId;

        if (sc.pre_effects && sc.pre_effects.length > 0) {
          const preRows = sc.pre_effects.map((eff, i) => [
            spellcardId,
            'PRE',
            i + 1,
            eff.target || 'SELF',
            ensureValidEffectCode(eff.effect_code, eff.effect_text, validCodesSet),
            eff.direction || 'UP',
            safeFloat(eff.value, 1),
            safeInt(eff.duration, 1),
            eff.is_infinite ? 1 : 0
          ]);
          await connection.query(
            `INSERT INTO spellcardeffect 
            (spellcard_id, effect_type, effect_index, target, effect_code, direction, value, duration, is_infinite) 
            VALUES ?`,
            [preRows]
          );
        }

        if (sc.post_effects && sc.post_effects.length > 0) {
          const postRows = sc.post_effects.map((eff, i) => [
            spellcardId,
            'POST',
            i + 1,
            eff.target || 'SELF',
            ensureValidEffectCode(eff.effect_code, eff.effect_text, validCodesSet),
            eff.direction || 'UP',
            safeFloat(eff.value, 1),
            safeInt(eff.duration, 1),
            eff.is_infinite ? 1 : 0
          ]);
          await connection.query(
            `INSERT INTO spellcardeffect 
            (spellcard_id, effect_type, effect_index, target, effect_code, direction, value, duration, is_infinite) 
            VALUES ?`,
            [postRows]
          );
        }

        if (sc.bullet_lines && sc.bullet_lines.length > 0) {
          for (let bIdx = 0; bIdx < sc.bullet_lines.length; bIdx++) {
            const bl = sc.bullet_lines[bIdx];
            const [bResult] = await connection.query(
              'INSERT INTO bulletline (spellcard_id, line_index, raw_stats, element, bullet_type) VALUES (?, ?, ?, ?, ?)',
              [spellcardId, bIdx + 1, bl.raw_stats || '', bl.element || '', bl.bullet_type || '']
            );
            const bulletId = bResult.insertId;

            if (bl.properties && bl.properties.length > 0) {
              const propRows = bl.properties.map((pText, pIdx) => [bulletId, pIdx + 1, pText]);
              await connection.query('INSERT INTO bulletproperty (bullet_id, property_index, property_text) VALUES ?', [propRows]);
            }

            if (bl.killers && bl.killers.length > 0) {
              const killRows = bl.killers.map(kName => [bulletId, kName]);
              await connection.query('INSERT INTO bulletkiller (bullet_id, killer_name) VALUES ?', [killRows]);
            }
          }
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Lưu thành công toàn bộ dữ liệu nhân vật!" });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi khi cập nhật nhân vật:", error);
    res.status(500).json({ error: "Lỗi lưu dữ liệu nhân vật vào Database.", details: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllFriends,
  addFriend,
  updateFriend,
  updateSortOrder,
  deleteFriend,
  getRarities,
  getFriendSuggestions,
  getFriendJsonData,
  getFriendById,
  getFriendDetails: getFriendById,
  getFriendDetail: getFriendById,
  updateFriendDetails,
  updateFriendDetail: updateFriendDetails
};