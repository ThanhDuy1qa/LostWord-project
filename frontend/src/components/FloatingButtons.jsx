import { Link } from 'react-router-dom';

const FloatingButtons = () => {
  return (
    <>
      {/* NÚT BÊN TRÁI: ĐẾN TRANG QUẢN LÝ THÊM DỮ LIỆU */}
      {/* 'fixed top-24 left-2' giúp nút luôn nổi ở bên trái, cách top một khoảng */}
      <Link
        to="/admin"
        className="fixed top-24 left-2 sm:left-6 z-40 flex flex-col items-center group hover:scale-105 transition-transform duration-200"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#e2c784] rounded-xl border-2 border-[#c09641] shadow-lg flex items-center justify-center overflow-hidden">
          {/* Bạn có thể lưu ảnh quyển sổ vào thư mục public và trỏ link src vào đây */}
          {/* Ví dụ: src="/image/ui/menu_book.png" */}
          <img 
            src="https://cdn-icons-png.flaticon.com/512/3388/3388930.png" 
            alt="Menu" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" 
          />
        </div>
        <div className="bg-gray-200 text-[#c09641] font-bold font-serif text-xs sm:text-sm px-3 py-0.5 rounded shadow border border-gray-400 mt-1">
          Menu
        </div>
      </Link>

      {/* NÚT BÊN PHẢI: VỀ TRANG CHỦ */}
      <Link
        to="/"
        className="fixed top-24 right-2 sm:right-6 z-40 flex flex-col items-center group hover:scale-105 transition-transform duration-200"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-b from-[#e8f0fe] to-[#a2c5f1] rounded-xl border-2 border-[#5b8abf] shadow-lg flex items-center justify-center overflow-hidden">
          {/* Bạn có thể lưu ảnh ngôi nhà vào thư mục public và trỏ link src vào đây */}
          <img 
            src="https://cdn-icons-png.flaticon.com/512/1946/1946488.png" 
            alt="Home" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" 
          />
        </div>
      </Link>
    </>
  );
};

export default FloatingButtons;