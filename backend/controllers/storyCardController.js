const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

// 🌟 Đường dẫn thư mục ảnh Story Card
const STORYCARD_DIR = path.join(__dirname, '../../frontend/public/image/storycard');

// 🛠️ Hàm phụ: Xử lý đường dẫn file .webp an toàn (tránh bị trùng .webp.webp)
const getWebpPath = (imageUrl) => {
  if (!imageUrl) return null;
  const fileName = imageUrl.split('/').pop();
  const hasWebp = fileName.toLowerCase().endsWith('.webp');
  const finalFileName = hasWebp ? fileName : `${fileName}.webp`;
  return path.join(STORYCARD_DIR, finalFileName);
};

// 1. Lấy toàn bộ danh sách Story Card
const getAllStoryCards = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM storycard ORDER BY storycard_id ASC, sort_order ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi Database StoryCard:", error);
    res.status(500).json({ error: "Không thể lấy dữ liệu Story Card" });
  }
};

// 2. Thêm Story Card mới
const addStoryCard = async (req, res) => {
  try {
    const { name, rarity, type, image_url } = req.body;
    await pool.query(
      'INSERT INTO storycard (name, rarity, type, image_url) VALUES (?, ?, ?, ?)',
      [name, rarity, type, image_url]
    );
    res.status(201).json({ message: "Thêm thẻ thành công!" });
  } catch (error) {
    console.error("Lỗi thêm StoryCard:", error);
    res.status(500).json({ error: "Lỗi server khi thêm dữ liệu" });
  }
};

// 3. Lấy thông tin Chỉ số (Stats) của Story Card
const getStoryCardStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [exStats] = await pool.query('SELECT * FROM storycardexstat WHERE storycard_id = ?', [id]);
    if (exStats.length > 0) {
        return res.status(200).json({ is_random: true, data: exStats[0] });
    }
    
    const [normalStats] = await pool.query('SELECT * FROM storycardstat WHERE storycard_id = ?', [id]);
    return res.status(200).json({ is_random: false, data: normalStats.length > 0 ? normalStats[0] : null });
  } catch (error) { 
      console.error("Lỗi lấy StoryCard Stats:", error);
      res.status(500).json({ error: "Lỗi lấy Stat" }); 
  }
};

// 4. Cập nhật thông tin Story Card (Dùng Transaction để đảm bảo an toàn)
const updateStoryCard = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, rarity, type, image_url, effects, stats } = req.body; 

    await connection.beginTransaction();

    const [oldRecords] = await connection.query('SELECT image_url FROM storycard WHERE storycard_id = ?', [id]);
    if (oldRecords.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Không tìm thấy thẻ" });
    }

    // Cập nhật thông tin chính
    await connection.query(
      'UPDATE storycard SET name = ?, rarity = ?, type = ?, image_url = ? WHERE storycard_id = ?', 
      [name, rarity, type, image_url, id]
    );

    // Cập nhật hiệu ứng (Effects)
    if (effects && Array.isArray(effects)) {
      await connection.query('DELETE FROM storycardeffect WHERE storycard_id = ?', [id]);
      await connection.query('DELETE FROM storycardluckeffect WHERE storycard_id = ?', [id]);
      
      const baseEffectsToSave = effects.filter(e => e.effect_code && (!e.luck_group || e.luck_group === 0));
      const luckEffectsToSave = effects.filter(e => e.effect_code && e.luck_group > 0);

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
        await connection.query(
          'INSERT INTO storycardeffect (storycard_id, effect_code, direction, value, target, duration, role_lock, tag, character_lock) VALUES ?',
          [baseValues]
        );
      }

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
        await connection.query(
          'INSERT INTO storycardluckeffect (storycard_id, luck_group, effect_code, direction, value, target, duration, role_lock, tag, character_lock) VALUES ?',
          [luckValues]
        );
      }
    }

    // Cập nhật Stats
    if (stats) {
      const { is_random, stat1, stat2, normal_stats } = stats;
      
      if (is_random) {
          await connection.query('DELETE FROM storycardstat WHERE storycard_id = ?', [id]);
          const [checkEx] = await connection.query('SELECT * FROM storycardexstat WHERE storycard_id = ?', [id]);
          if (checkEx.length > 0) {
              await connection.query(
                  'UPDATE storycardexstat SET stat1_type=?, stat1_min=?, stat1_max=?, stat2_type=?, stat2_min=?, stat2_max=? WHERE storycard_id=?',
                  [stat1.type, stat1.min, stat1.max, stat2.type, stat2.min, stat2.max, id]
              );
          } else {
              await connection.query(
                  'INSERT INTO storycardexstat (storycard_id, stat1_type, stat1_min, stat1_max, stat2_type, stat2_min, stat2_max) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [id, stat1.type, stat1.min, stat1.max, stat2.type, stat2.min, stat2.max]
              );
          }
      } else {
          await connection.query('DELETE FROM storycardexstat WHERE storycard_id = ?', [id]);
          const { hp=0, yin_atk=0, yang_atk=0, yin_def=0, yang_def=0, agility=0 } = normal_stats || {};
          const [checkNormal] = await connection.query('SELECT * FROM storycardstat WHERE storycard_id = ?', [id]);
          if (checkNormal.length > 0) {
              await connection.query(
                  'UPDATE storycardstat SET hp=?, yin_atk=?, yang_atk=?, yin_def=?, yang_def=?, agility=? WHERE storycard_id=?',
                  [hp, yin_atk, yang_atk, yin_def, yang_def, agility, id]
              );
          } else {
              await connection.query(
                  'INSERT INTO storycardstat (storycard_id, hp, yin_atk, yang_atk, yin_def, yang_def, agility) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [id, hp, yin_atk, yang_atk, yin_def, yang_def, agility]
              );
          }
      }
    }

    await connection.commit();

    // Đổi tên file ảnh vật lý nếu image_url thay đổi
    const oldImageUrl = oldRecords[0].image_url;
    if (oldImageUrl && image_url && oldImageUrl !== image_url) {
      const oldFilePath = getWebpPath(oldImageUrl);
      const newFilePath = getWebpPath(image_url);
      try {
        if (oldFilePath && newFilePath && fs.existsSync(oldFilePath)) {
          fs.renameSync(oldFilePath, newFilePath);
        }
      } catch (fsError) { 
        console.error("Lỗi đổi tên file ảnh:", fsError); 
      }
    }

    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (error) {
      await connection.rollback();
      console.error("Lỗi cập nhật thẻ:", error);
      res.status(500).json({ error: "Lỗi cập nhật thẻ" });
  } finally {
      connection.release();
  }
};

// 5. Cập nhật thứ tự sắp xếp
const updateSortOrder = async (req, res) => {
  try {
    await pool.query('UPDATE storycard SET sort_order = ? WHERE storycard_id = ?', [req.body.sort_order, req.params.id]);
    res.status(200).json({ message: "Đã cập nhật" });
  } catch (error) { 
    console.error("Lỗi cập nhật sort_order:", error);
    res.status(500).json({ error: "Lỗi cập nhật thứ tự" }); 
  }
};

// 6. Xóa Story Card (Dùng Transaction để đảm bảo tính toàn vẹn)
const deleteStoryCard = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Lấy thông tin ảnh trước khi xóa
    const [oldRecords] = await connection.query(
      'SELECT image_url FROM storycard WHERE storycard_id = ?',
      [id]
    );

    if (oldRecords.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Không tìm thấy Story Card để xóa." });
    }

    // Xóa tất cả các bản ghi ở các bảng con
    await connection.query('DELETE FROM storycardeffect WHERE storycard_id = ?', [id]);
    await connection.query('DELETE FROM storycardluckeffect WHERE storycard_id = ?', [id]);
    await connection.query('DELETE FROM storycardstat WHERE storycard_id = ?', [id]);
    await connection.query('DELETE FROM storycardexstat WHERE storycard_id = ?', [id]);

    // Xóa bản ghi ở bảng chính
    await connection.query('DELETE FROM storycard WHERE storycard_id = ?', [id]);

    await connection.commit();

    // Xóa file ảnh vật lý sau khi xóa DB thành công
    if (oldRecords[0].image_url) {
      const filePath = getWebpPath(oldRecords[0].image_url);
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Đã xóa file ảnh: ${filePath}`);
        }
      } catch (fileErr) {
        console.warn(`Không thể xóa file ảnh: ${filePath}`, fileErr.message);
      }
    }

    res.status(200).json({ message: "Xóa Story Card thành công!" });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi xóa Story Card:", error);
    res.status(500).json({ error: "Lỗi server khi xóa dữ liệu Story Card." });
  } finally {
    connection.release();
  }
};

// 7. Lấy danh mục Effect
const getEffectDictionary = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM effect ORDER BY effect_group, effect_name');
    res.status(200).json(rows);
  } catch (error) { 
    console.error("Lỗi lấy Effect Dictionary:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách Effect" }); 
  }
};

// 8. Lấy danh sách hiệu ứng của một Story Card
const getStoryCardEffects = async (req, res) => {
  try {
    const { id } = req.params;
    
    const baseQuery = `
      SELECT sce.*, eff.* 
      FROM storycardeffect sce
      LEFT JOIN effect eff ON sce.effect_code = eff.effect_code
      WHERE sce.storycard_id = ?
    `;

    const luckQuery = `
      SELECT scle.*, eff.* 
      FROM storycardluckeffect scle
      LEFT JOIN effect eff ON scle.effect_code = eff.effect_code
      WHERE scle.storycard_id = ?
      ORDER BY scle.luck_group ASC
    `;

    const [baseEffects] = await pool.query(baseQuery, [id]);
    const [luckEffects] = await pool.query(luckQuery, [id]);
    
    const combinedEffects = [
      ...baseEffects.map(e => ({ ...e, luck_group: 0 })),
      ...luckEffects
    ];
    
    res.status(200).json(combinedEffects);
  } catch (error) { 
    console.error("Lỗi lấy hiệu ứng thẻ:", error);
    res.status(500).json({ error: "Lỗi lấy hiệu ứng thẻ" }); 
  }
};

// 9. Lấy chi tiết một Story Card theo ID
const getStoryCardById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM storycard WHERE storycard_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy Story Card" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết Story Card:", error);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu Story Card" });
  }
};

module.exports = { 
  getAllStoryCards, 
  addStoryCard, 
  updateStoryCard, 
  updateSortOrder, 
  deleteStoryCard,
  getEffectDictionary, 
  getStoryCardEffects, 
  getStoryCardStats, 
  getStoryCardById 
};