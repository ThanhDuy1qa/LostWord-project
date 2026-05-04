const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const getAllFriends = async (req, res) => {
  try {
    // Câu lệnh SQL lấy thông tin nhân vật kèm tên Rarity
    const [rows] = await pool.query(`
    SELECT f.*, r.rarity_name 
    FROM Friend f 
    JOIN Rarity r ON f.rarity_code = r.rarity_code
    ORDER BY f.sort_order ASC, f.friend_id ASC -- Xếp theo thứ tự, trùng thì xếp theo ID
  `);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi Database:", error);
    res.status(500).json({ error: "Không thể lấy dữ liệu nhân vật" });
  }
};

const addFriend = async (req, res) => {
  try {
    const { name, rarity_code, universe, role, image_url } = req.body;
    
    // Chèn dữ liệu vào bảng Friend
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

// Thêm hàm này vào file controller của bạn
const updateFriend = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rarity_code, universe, role, image_url } = req.body;
    
    // 1. Lấy thông tin URL ảnh CŨ từ Database trước khi ghi đè
    const [oldRecords] = await pool.query('SELECT image_url, universe FROM Friend WHERE friend_id = ?', [id]);
    if (oldRecords.length === 0) return res.status(404).json({ error: "Không tìm thấy" });
    
    const oldImageUrl = oldRecords[0].image_url;
    const oldUniverse = oldRecords[0].universe;

    // 2. Nếu image_url bị thay đổi, tiến hành đổi tên file vật lý
    if (oldImageUrl !== image_url) {
      // Hàm ánh xạ ngược universe (giống characterUtils.js)
      const mapFolder = (u) => u.replaceAll(':', '___').replaceAll('>', '__').replaceAll('<', '_').replaceAll('#', '%');
      
      const oldFolder = mapFolder(oldUniverse);
      const newFolder = mapFolder(universe);

      // Trích xuất tên file (Bỏ phần '/image/friend/' ở đầu)
      const oldFileName = oldImageUrl.split('/').pop();
      const newFileName = image_url.split('/').pop();

      // ĐƯỜNG DẪN GỐC TỚI THƯ MỤC CHỨA ẢNH TRÊN MÁY BẠN (Cần sửa lại cho khớp máy bạn)
      const rootDir = path.join(__dirname, '../../frontend/public/image/friend'); 
      
      const oldFilePath = path.join(rootDir, oldFolder, `${oldFileName}.webp`);
      const newFilePath = path.join(rootDir, newFolder, `${newFileName}.webp`);

      // Kiểm tra file cũ có tồn tại không rồi đổi tên
      if (fs.existsSync(oldFilePath)) {
        fs.renameSync(oldFilePath, newFilePath);
        console.log(`Đã đổi tên file: ${oldFileName} -> ${newFileName}`);
      } else {
        console.warn(`Không tìm thấy file cũ để đổi tên: ${oldFilePath}`);
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
// Thêm API cập nhật riêng thứ tự (sort_order)
const updateSortOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { sort_order } = req.body;
    await pool.query('UPDATE Friend SET sort_order = ? WHERE friend_id = ?', [sort_order, id]);
    res.status(200).json({ message: "Đã cập nhật thứ tự" });
  } catch (error) {
    console.error("Lỗi cập nhật thứ tự:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
// Thêm hàm API để xóa nhân vật
const deleteFriend = async (req, res) => {
  try {
    const { id } = req.params;

    // Tùy chọn: Xóa cả file ảnh vật lý nếu bạn muốn dọn dẹp ổ cứng
    // (Đoạn này mình viết thêm để DB và file đồng bộ, bạn có thể bỏ qua nếu muốn giữ lại file)
    const [oldRecords] = await pool.query('SELECT image_url, universe FROM Friend WHERE friend_id = ?', [id]);
    
    if (oldRecords.length > 0) {
       const oldImageUrl = oldRecords[0].image_url;
       const oldUniverse = oldRecords[0].universe;
       
       // Dịch ngược tên thư mục
       const mapFolder = (u) => u.replaceAll(':', '___').replaceAll('>', '__').replaceAll('<', '_').replaceAll('#', '%');
       const oldFolder = mapFolder(oldUniverse);
       const fileName = oldImageUrl.split('/').pop();
       
       // Đường dẫn file (Sửa lại số '../' cho khớp cấu trúc máy bạn nếu cần)
       const fs = require('fs');
       const path = require('path');
       const rootDir = path.join(__dirname, '../../frontend/public/image/friend'); 
       const filePath = path.join(rootDir, oldFolder, `${fileName}.webp`);

       if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Xóa file
          console.log(`Đã xóa file ảnh: ${filePath}`);
       }
    }

    // Xóa record trong Database
    const [result] = await pool.query('DELETE FROM Friend WHERE friend_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy nhân vật để xóa." });
    }

    res.status(200).json({ message: "Xóa nhân vật thành công!" });
  } catch (error) {
    console.error("Lỗi xóa nhân vật:", error);
    res.status(500).json({ error: "Lỗi server khi xóa dữ liệu." });
  }
};

// Cập nhật dòng module.exports ở cuối file
module.exports = { getAllFriends, addFriend, updateFriend, updateSortOrder, deleteFriend };
