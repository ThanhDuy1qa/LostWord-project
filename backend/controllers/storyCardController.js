const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const getAllStoryCards = async (req, res) => {
  try {
    // Truy vấn lấy toàn bộ danh sách Story Card từ bảng StoryCard
    const [rows] = await pool.query('SELECT * FROM StoryCard ORDER BY  storycard_id ASC, sort_order ASC');
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi Database StoryCard:", error);
    res.status(500).json({ error: "Không thể lấy dữ liệu Story Card" });
  }
};

// Thêm hàm addStoryCard
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

// Thêm hàm lấy Stat của thẻ (để dưới hàm getStoryCardEffects)
const getStoryCardStats = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM StoryCardStat WHERE storycard_id = ?', [req.params.id]);
    res.status(200).json(rows);
  } catch (error) { res.status(500).json({ error: "Lỗi lấy Stat" }); }
};

// CẬP NHẬT LẠI HÀM NÀY
const updateStoryCard = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy thêm stats từ req.body
    const { name, rarity, type, image_url, effects, stats } = req.body; 

    // 1. Cập nhật tên và ảnh (Logic cũ)
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
      } catch (fsError) { console.error("Lỗi đổi tên file", fsError); }
    }

    await pool.query('UPDATE StoryCard SET name = ?, rarity = ?, type = ?, image_url = ? WHERE storycard_id = ?', [name, rarity, type, image_url, id]);

    // 2. CẬP NHẬT HIỆU ỨNG (EFFECTS) - ĐÃ SỬA LỖI LƯU
    if (effects && Array.isArray(effects)) {
      // Xóa toàn bộ hiệu ứng cũ để ghi đè
      await pool.query('DELETE FROM StoryCardEffect WHERE storycard_id = ?', [id]);
      
      // Lọc các hiệu ứng hợp lệ (phải có mã effect_code)
      const validEffects = effects.filter(e => e.effect_code);
      if (validEffects.length > 0) {
        const effectValues = validEffects.map(e => [
          id, e.effect_code, e.direction || 'UP', parseInt(e.value) || 0, e.target || 'SELF', parseInt(e.duration) || 1, e.role_lock || 'ALL'
        ]);
        
        await pool.query(
          'INSERT INTO StoryCardEffect (storycard_id, effect_code, direction, value, target, duration, role_lock) VALUES ?', // <--- THÊM ROLE_LOCK VÀO ĐÂY
          [effectValues]
        );
      }
    }

    // 3. CẬP NHẬT CHỈ SỐ (STATS)
    if (stats) {
      const { hp = 0, yin_atk = 0, yang_atk = 0, yin_def = 0, yang_def = 0, agility = 0 } = stats;
      const [checkStat] = await pool.query('SELECT * FROM StoryCardStat WHERE storycard_id = ?', [id]);
      
      if (checkStat.length > 0) {
        // Nếu đã có stat -> Update
        await pool.query(
          'UPDATE StoryCardStat SET hp=?, yin_atk=?, yang_atk=?, yin_def=?, yang_def=?, agility=? WHERE storycard_id=?',
          [hp, yin_atk, yang_atk, yin_def, yang_def, agility, id]
        );
      } else {
        // Nếu chưa có stat -> Insert
        await pool.query(
          'INSERT INTO StoryCardStat (storycard_id, hp, yin_atk, yang_atk, yin_def, yang_def, agility) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, hp, yin_atk, yang_atk, yin_def, yang_def, agility]
        );
      }
    }

    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (error) { 
      console.error("Lỗi:", error);
      res.status(500).json({ error: "Lỗi Server" }); 
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
    const [rows] = await pool.query('SELECT * FROM StoryCardEffect WHERE storycard_id = ?', [req.params.id]);
    res.status(200).json(rows);
  } catch (error) { res.status(500).json({ error: "Lỗi lấy hiệu ứng thẻ" }); }
};

module.exports = { 
  getAllStoryCards, addStoryCard, updateStoryCard, updateSortOrder, deleteStoryCard,
  getEffectDictionary, getStoryCardEffects, getStoryCardStats // Nhớ export hàm mới!
};