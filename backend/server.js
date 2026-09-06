require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const friendRoutes = require('./routes/friendRoutes');
const storyCardRoutes = require('./routes/storyCardRoutes');
const app = express();

app.use(cors()); // Phải có cái này để React gọi được
app.use(express.json());

// 🌟 Đã sửa: Thêm tùy chọn Cache 30 ngày cho ảnh tĩnh
app.use('/image', express.static(path.join(__dirname, 'public/image'), {
  maxAge: '30d',      // Lưu ảnh vào Disk Cache của trình duyệt trong 30 ngày
  immutable: true     // Báo trình duyệt ảnh không thay đổi, tránh gửi yêu cầu re-validate
}));

// Routes
app.use('/api/friends', friendRoutes);

// Route test đơn giản
app.get('/test', (req, res) => res.json({ message: "Backend is running!" }));

// Route cho Story Cards
app.use('/api/storycards', storyCardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});