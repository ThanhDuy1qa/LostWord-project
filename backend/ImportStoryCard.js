require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db'); // Dùng lại file kết nối DB đang chạy ngon lành của bạn

// 1. Khai báo đường dẫn
// Đường dẫn gốc từ thư mục datamine của bạn
const sourceBaseDir = 'D:\\datamine\\chon\\ExportedProject\\Assets\\east\\pictures'; 
// Đường dẫn đích: Thư mục chứa ảnh storycard trong server của bạn
const destBaseDir = path.join(__dirname, 'public', 'image', 'storycard');

// Đảm bảo thư mục đích tồn tại, nếu chưa có thì tự tạo
if (!fs.existsSync(destBaseDir)) {
  fs.mkdirSync(destBaseDir, { recursive: true });
}

const runImport = async () => {
  try {
    console.log("🚀 Bắt đầu quét dữ liệu Datamine...");
    
    // Đọc tất cả các thư mục con trong 'pictures' (1, 2, 3...)
    const folders = fs.readdirSync(sourceBaseDir);
    let count = 0;

    for (const folder of folders) {
      const sourceFile = path.join(sourceBaseDir, folder, 'Efuda.png');
      
      // Nếu thư mục này chứa file Efuda.png
      if (fs.existsSync(sourceFile)) {
        // Đổi tên file thành ID của thư mục (Ví dụ: 1.png, 2.png)
        const newFileName = `${folder}.png`;
        const destFile = path.join(destBaseDir, newFileName);

        // Copy file từ datamine sang project của bạn
        fs.copyFileSync(sourceFile, destFile);

        // Tạo đường dẫn chuẩn để lưu vào Database
        const dbImageUrl = `/image/storycard/${newFileName}`;

        // Kiểm tra xem thẻ này đã tồn tại trong DB chưa (tránh trùng lặp khi chạy 2 lần)
        const [existing] = await pool.query('SELECT * FROM StoryCard WHERE image_url = ?', [dbImageUrl]);
        
        if (existing.length === 0) {
          // Nếu chưa có, Insert dữ liệu tạm (Placeholder) vào DB
          // Gán mặc định: Rarity 3, Type Bamboo (Bạn sẽ chỉnh sửa sau trên Web)
          await pool.query(
            'INSERT INTO StoryCard (name, rarity, type, image_url) VALUES (?, ?, ?, ?)',
            [`Story Card ID: ${folder}`, 3, 'Bamboo', dbImageUrl]
          );
          console.log(`✅ Đã thêm mới: ${newFileName}`);
          count++;
        }
      }
    }

    console.log(`🎉 HOÀN TẤT! Đã import thành công ${count} Story Cards mới.`);
    process.exit(0); // Tắt script an toàn
  } catch (error) {
    console.error("❌ Có lỗi xảy ra:", error);
    process.exit(1);
  }
};

runImport();