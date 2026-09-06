const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');

// Đường dẫn gốc tới thư mục chứa ảnh
const ROOT_DIR = path.join(__dirname, '../../frontend/public/image/friend');

// Hàm bổ trợ ánh xạ ngược tên thư mục universe
const mapFolder = (u) => {
  if (!u) return '';
  return u
    .replaceAll('>', '__')
    .replaceAll('<', '_')
    .replaceAll('#', '%');
};

// 1. Lấy danh sách nhân vật
const getAllFriends = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, r.rarity_name 
      FROM Friend f 
      JOIN Rarity r ON f.rarity_code = r.rarity_code
      ORDER BY f.sort_order ASC, f.friend_id ASC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi Database:", error);
    res.status(500).json({ error: "Không thể lấy dữ liệu nhân vật" });
  }
};

// 2. Thêm nhân vật
// backend/controllers/friendController.js

// 2. Thêm nhân vật (Cập nhật tự động tạo thư mục vũ trụ)
const addFriend = async (req, res) => {
  try {
    const { name, rarity_code, universe, role, image_url } = req.body;

    // 🌟 Tự động tạo thư mục Vũ trụ nếu chưa tồn tại
    if (universe) {
      const folderName = mapFolder(universe);
      const universeDirPath = path.join(ROOT_DIR, folderName);
      await fs.mkdir(universeDirPath, { recursive: true });
    }

    await pool.query(
      'INSERT INTO Friend (name, rarity_code, universe, role, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, rarity_code, universe, role, image_url]
    );

    res.status(201).json({ message: "Thêm nhân vật thành công!" });
  } catch (error) {
    console.error("Lỗi thêm nhân vật:", error);
    res.status(500).json({ error: "Lỗi server khi thêm dữ liệu nhân vật" });
  }
};

// 3. Cập nhật nhân vật
const updateFriend = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rarity_code, universe, role, image_url } = req.body;

    // 1. Lấy thông tin URL ảnh và Universe CŨ từ Database
    const [oldRecords] = await pool.query(
      'SELECT image_url, universe FROM Friend WHERE friend_id = ?',
      [id]
    );
    if (oldRecords.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    const oldImageUrl = oldRecords[0].image_url;
    const oldUniverse = oldRecords[0].universe;

    // 2. Nếu image_url HOẶC universe bị thay đổi, tiến hành đổi tên/chuyển file vật lý
    if (oldImageUrl !== image_url || oldUniverse !== universe) {
      const oldFolder = mapFolder(oldUniverse);
      const newFolder = mapFolder(universe);

      const oldFileName = oldImageUrl.split('/').pop();
      const newFileName = image_url.split('/').pop();

      const oldFilePath = path.join(ROOT_DIR, oldFolder, `${oldFileName}.webp`);
      const newFilePath = path.join(ROOT_DIR, newFolder, `${newFileName}.webp`);

      try {
        await fs.access(oldFilePath);
        
        // 🌟 Tự động tạo thư mục đích nếu chưa tồn tại (trường hợp đổi sang universe mới)
        await fs.mkdir(path.dirname(newFilePath), { recursive: true });
        
        // Đổi tên / Di chuyển file
        await fs.rename(oldFilePath, newFilePath);
        console.log(`Đã đổi tên/chuyển file thành công: ${oldFileName} -> ${newFileName}`);
      } catch (fileErr) {
        console.warn(`Không tìm thấy file cũ để đổi tên hoặc lỗi: ${oldFilePath}`, fileErr.message);
      }
    }

    // 3. Cập nhật vào Database
    await pool.query(
      'UPDATE Friend SET name = ?, rarity_code = ?, universe = ?, role = ?, image_url = ? WHERE friend_id = ?',
      [name, rarity_code, universe, role, image_url, id]
    );

    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (error) {
    console.error("Lỗi cập nhật nhân vật:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật dữ liệu." });
  }
};
// 4. Cập nhật thứ tự sắp xếp (sort_order)
const updateSortOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { sort_order } = req.body;

    await pool.query('UPDATE Friend SET sort_order = ? WHERE friend_id = ?', [
      sort_order,
      id,
    ]);

    res.status(200).json({ message: "Đã cập nhật thứ tự" });
  } catch (error) {
    console.error("Lỗi cập nhật thứ tự:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// 5. Xóa nhân vật
const deleteFriend = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin ảnh cũ để xóa file vật lý
    const [oldRecords] = await pool.query(
      'SELECT image_url, universe FROM Friend WHERE friend_id = ?',
      [id]
    );

    if (oldRecords.length > 0) {
      const oldImageUrl = oldRecords[0].image_url;
      const oldUniverse = oldRecords[0].universe;

      const oldFolder = mapFolder(oldUniverse);
      const fileName = oldImageUrl.split('/').pop();
      const filePath = path.join(ROOT_DIR, oldFolder, `${fileName}.webp`);

      // Xóa file ảnh bất đồng bộ
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`Đã xóa file ảnh: ${filePath}`);
      } catch (fileErr) {
        console.warn(`Không tìm thấy file ảnh để xóa: ${filePath}`);
      }
    }

    // Xóa record trong Database
    const [result] = await pool.query(
      'DELETE FROM Friend WHERE friend_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy nhân vật để xóa." });
    }

    res.status(200).json({ message: "Xóa nhân vật thành công!" });
  } catch (error) {
    console.error("Lỗi xóa nhân vật:", error);
    res.status(500).json({ error: "Lỗi server khi xóa dữ liệu." });
  }
};

module.exports = {
  getAllFriends,
  addFriend,
  updateFriend,
  updateSortOrder,
  deleteFriend,
};