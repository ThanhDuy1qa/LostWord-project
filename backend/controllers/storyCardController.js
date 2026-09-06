const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const getAllStoryCards = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM StoryCard ORDER BY storycard_id ASC, sort_order ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi Database StoryCard:", error);
    res.status(500).json({ error: "Không thể lấy dữ liệu Story Card" });
  }
};

const addStoryCard = async (req, res) => {
  try {
    const { name, rarity, type, image_url } = req.body;
    await pool.query(
      'INSERT INTO StoryCard (name, rarity, type, image_url) VALUES (?, ?, ?, ?)',
      [name, rarity, type, image_url]
    );
    res.status(201).json({ message: "Thêm thẻ thành công!" });
  } catch (error) {
    console.error("Lỗi thêm StoryCard:", error);
    res.status(500).json({ error: "Lỗi server khi thêm dữ liệu" });
  }
};

const getStoryCardStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem thẻ này có nằm trong bảng cá biệt (EX Stat) không
    const [exStats] = await pool.query('SELECT * FROM StoryCardExStat WHERE storycard_id = ?', [id]);
    if (exStats.length > 0) {
        return res.status(200).json({ is_random: true, data: exStats[0] });
    }
    
    // Nếu không có, tìm trong bảng Stat thường
    const [normalStats] = await pool.query('SELECT * FROM StoryCardStat WHERE storycard_id = ?', [id]);
    return res.status(200).json({ is_random: false, data: normalStats.length > 0 ? normalStats[0] : null });
  } catch (error) { 
      res.status(500).json({ error: "Lỗi lấy Stat" }); 
  }
};

const updateStoryCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rarity, type, image_url, effects, stats } = req.body; 

    // 1. CẬP NHẬT TÊN VÀ ẢNH
    const [oldRecords] = await pool.query('SELECT image_url FROM StoryCard WHERE storycard_id = ?', [id]);
    if (oldRecords.length === 0) return res.status(404).json({ error: "Không tìm thấy thẻ" });

    const oldImageUrl = oldRecords[0].image_url;
    if (oldImageUrl !== image_url) {
      const oldFileName = oldImageUrl.split('/').pop();
      const newFileName = image_url.split('/').pop();
      const rootDir = path.join(__dirname, '../../frontend/public/image/storycard'); 
      const oldFilePath = path.join(rootDir, `${oldFileName}.webp`);
      const newFilePath = path.join(rootDir, `${newFileName}.webp`);
      try {
          if (fs.existsSync(oldFilePath)) fs.renameSync(oldFilePath, newFilePath);
      } catch (fsError) { 
          console.error("Lỗi đổi tên file", fsError); 
      }
    }

    await pool.query('UPDATE StoryCard SET name = ?, rarity = ?, type = ?, image_url = ? WHERE storycard_id = ?', [name, rarity, type, image_url, id]);

    // 2. CẬP NHẬT HIỆU ỨNG
    if (effects && Array.isArray(effects)) {
      await pool.query('DELETE FROM StoryCardEffect WHERE storycard_id = ?', [id]);
      await pool.query('DELETE FROM StoryCardLuckEffect WHERE storycard_id = ?', [id]);
      
      const baseEffectsToSave = effects.filter(e => e.effect_code && (!e.luck_group || e.luck_group === 0));
      const luckEffectsToSave = effects.filter(e => e.effect_code && e.luck_group > 0);

      // Lưu bảng chính (Base Effects)
      if (baseEffectsToSave.length > 0) {
        const baseValues = baseEffectsToSave.map(e => [
          id, 
          e.effect_code, 
          e.direction || 'UP', 
          parseFloat(e.value) || 0, 
          e.target || 'SELF', 
          parseInt(e.duration) || 1, 
          e.role_lock || 'ALL', 
          e.tag || null, 
          e.character_lock || null
        ]);
        await pool.query(
          'INSERT INTO StoryCardEffect (storycard_id, effect_code, direction, value, target, duration, role_lock, tag, character_lock) VALUES ?',
          [baseValues]
        );
      }

      // Lưu bảng phụ (Luck Effects)
      if (luckEffectsToSave.length > 0) {
        const luckValues = luckEffectsToSave.map(e => [
          id, 
          e.luck_group, 
          e.effect_code, 
          e.direction || 'UP', 
          parseFloat(e.value) || 0, 
          e.target || 'SELF', 
          parseInt(e.duration) || 1, 
          e.role_lock || 'ALL', 
          e.tag || null,
          e.character_lock || null
        ]);
        await pool.query(
          'INSERT INTO StoryCardLuckEffect (storycard_id, luck_group, effect_code, direction, value, target, duration, role_lock, tag, character_lock) VALUES ?',
          [luckValues]
        );
      }
    }

    // 3. CẬP NHẬT STATS
    if (stats) {
      const { is_random, stat1, stat2, normal_stats } = stats;
      
      if (is_random) {
          await pool.query('DELETE FROM StoryCardStat WHERE storycard_id = ?', [id]);
          const [checkEx] = await pool.query('SELECT * FROM StoryCardExStat WHERE storycard_id = ?', [id]);
          if (checkEx.length > 0) {
              await pool.query(
                  'UPDATE StoryCardExStat SET stat1_type=?, stat1_min=?, stat1_max=?, stat2_type=?, stat2_min=?, stat2_max=? WHERE storycard_id=?',
                  [stat1.type, stat1.min, stat1.max, stat2.type, stat2.min, stat2.max, id]
              );
          } else {
              await pool.query(
                  'INSERT INTO StoryCardExStat (storycard_id, stat1_type, stat1_min, stat1_max, stat2_type, stat2_min, stat2_max) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [id, stat1.type, stat1.min, stat1.max, stat2.type, stat2.min, stat2.max]
              );
          }
      } else {
          await pool.query('DELETE FROM StoryCardExStat WHERE storycard_id = ?', [id]);
          const { hp=0, yin_atk=0, yang_atk=0, yin_def=0, yang_def=0, agility=0 } = normal_stats || {};
          const [checkNormal] = await pool.query('SELECT * FROM StoryCardStat WHERE storycard_id = ?', [id]);
          if (checkNormal.length > 0) {
              await pool.query(
                  'UPDATE StoryCardStat SET hp=?, yin_atk=?, yang_atk=?, yin_def=?, yang_def=?, agility=? WHERE storycard_id=?',
                  [hp, yin_atk, yang_atk, yin_def, yang_def, agility, id]
              );
          } else {
              await pool.query(
                  'INSERT INTO StoryCardStat (storycard_id, hp, yin_atk, yang_atk, yin_def, yang_def, agility) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [id, hp, yin_atk, yang_atk, yin_def, yang_def, agility]
              );
          }
      }
    }
    
    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi cập nhật thẻ" });
  }
};

const updateSortOrder = async (req, res) => {
  try {
    await pool.query('UPDATE StoryCard SET sort_order = ? WHERE storycard_id = ?', [req.body.sort_order, req.params.id]);
    res.status(200).json({ message: "Đã cập nhật" });
  } catch (error) { res.status(500).json({ error: "Lỗi" }); }
};

const deleteStoryCard = async (req, res) => {
  try {
    await pool.query('DELETE FROM StoryCard WHERE storycard_id = ?', [req.params.id]);
    res.status(200).json({ message: "Xóa thành công!" });
  } catch (error) { res.status(500).json({ error: "Lỗi xóa" }); }
};

const getEffectDictionary = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Effect ORDER BY effect_group, effect_name');
    res.status(200).json(rows);
  } catch (error) { res.status(500).json({ error: "Lỗi lấy danh sách Effect" }); }
};

const getStoryCardEffects = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lấy hiệu ứng chung từ bảng chính
    const [baseEffects] = await pool.query('SELECT * FROM StoryCardEffect WHERE storycard_id = ?', [id]);
    
    // Lấy hiệu ứng luck từ bảng phụ
    const [luckEffects] = await pool.query('SELECT * FROM StoryCardLuckEffect WHERE storycard_id = ? ORDER BY luck_group ASC', [id]);
    
    // Trộn 2 mảng lại và gán luck_group = 0 cho baseEffects để Frontend dễ hiển thị
    const combinedEffects = [
        ...baseEffects.map(e => ({ ...e, luck_group: 0 })),
        ...luckEffects
    ];
    
    res.status(200).json(combinedEffects);
  } catch (error) { 
      console.error(error);
      res.status(500).json({ error: "Lỗi lấy hiệu ứng thẻ" }); 
  }
};

module.exports = { 
  getAllStoryCards, addStoryCard, updateStoryCard, updateSortOrder, deleteStoryCard,
  getEffectDictionary, getStoryCardEffects, getStoryCardStats
};