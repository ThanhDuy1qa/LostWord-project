import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const Home = () => {
  const [bgImages, setBgImages] = useState([]);
  const [currentBg, setCurrentBg] = useState('');
  const [fade, setFade] = useState(true);

  // 1. Chuẩn hóa đường dẫn hình ảnh Story Card
  const getFullImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    let path = String(imgUrl).trim();

    // Nếu đã là link URL tuyệt đối
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Tự động bổ sung đuôi .webp nếu chưa có extension
    if (!/\.(webp|png|jpg|jpeg)$/i.test(path)) {
      path = `${path}.webp`;
    }

    // Nếu đường dẫn chưa bắt đầu bằng dấu /
    if (!path.startsWith('/')) {
      path = `/image/storycard/${path}`;
    }

    return path;
  };

  // 2. Tải danh sách Story Cards từ Server
  useEffect(() => {
    const fetchStoryCards = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/storycards`);
        
        // Xử lý linh hoạt mảng dữ liệu trả về từ API
        const cardsList = Array.isArray(res.data) 
          ? res.data 
          : (res.data?.storycards || res.data?.data || []);

        if (cardsList.length > 0) {
          // Lọc ra các đường dẫn ảnh hợp lệ
          const images = cardsList
            .map((card) => card.image_url || card.image || card.url)
            .filter((img) => Boolean(img));

          console.log('📸 Danh sách ảnh Story Card tải được:', images);

          if (images.length > 0) {
            setBgImages(images);
            const randomIndex = Math.floor(Math.random() * images.length);
            setCurrentBg(images[randomIndex]);
          }
        }
      } catch (error) {
        console.error('Lỗi lấy danh sách hình nền Story Card:', error);
      }
    };

    fetchStoryCards();
  }, []);

  // 3. Tự động đổi hình ngẫu nhiên mỗi 5 giây
  useEffect(() => {
    if (bgImages.length === 0) return;

    const interval = setInterval(() => {
      setFade(false); // Mờ dần hình cũ

      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * bgImages.length);
        setCurrentBg(bgImages[randomIndex]);
        setFade(true); // Hiện hình mới
      }, 600);
    }, 5000);

    return () => clearInterval(interval);
  }, [bgImages]);

  const bgUrl = getFullImageUrl(currentBg);

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-[#0d0d11]">
      {/* 🌟 CẬP NHẬT HÌNH NỀN VỚI ĐỘ HIỂN THỊ RÕ HƠN */}
      {bgUrl && (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out transform scale-105 ${
            fade ? 'opacity-50' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url("${bgUrl}")`,
          }}
        />
      )}

      {/* LỚP PHỦ TỐI GIÚP NỔI BẬT NỘI DUNG CHỮ */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f12] via-[#0f0f12]/50 to-[#0f0f12]/30" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      {/* NỘI DUNG TRANG CHỦ */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center gap-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#e1c16e] via-amber-200 to-[#c09641] font-serif tracking-wider drop-shadow-2xl">
          APII LOSTWORD LIBRARY
        </h1>
        
        <p className="text-gray-200 text-sm sm:text-lg max-w-2xl font-light leading-relaxed drop-shadow-md">
          Hệ thống tra cứu cơ sở dữ liệu chi tiết Nhân Vật, Kỹ Năng, Spell Card và bộ sưu tập Story Card Touhou LostWord đầy đủ nhất.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <Link
            to="/characters"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold shadow-lg shadow-amber-950/60 border border-amber-400/30 transition-all transform hover:-translate-y-0.5"
          >
            👤 Tra Cứu Nhân Vật
          </Link>
          <Link
            to="/storycards"
            className="px-6 py-3 rounded-xl bg-[#1d1d24]/90 hover:bg-[#282834] text-cyan-400 font-bold border border-cyan-800/60 transition-all transform hover:-translate-y-0.5 shadow-lg backdrop-blur-sm"
          >
            🃏 Thư Viện Story Card
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;