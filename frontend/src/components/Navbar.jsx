import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  // Danh sách các trang trên menu
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/characters', label: 'Characters' },
    { path: '/storycards', label: 'Story Cards' },
    { path: '/features', label: 'Features' },
    { path: '/tables', label: 'Tables' },
    { path: '/lorepedia', label: 'Lorepedia' },
  ];

  return (
    // Thanh điều hướng: Nền màu vàng nhạt, dính chặt lên cùng (sticky)
    <nav className="bg-[#fcf4dc] border-b-[3px] border-[#c09641] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Căn giữa toàn bộ nội dung, cho phép cuộn ngang trên điện thoại */}
        <div className="flex justify-center items-center py-2.5 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center space-x-3 sm:space-x-6 text-[#c09641] font-serif font-bold text-[15px] sm:text-[18px] whitespace-nowrap">
            
            {/* Thêm ký tự thoi ở đầu */}
            <span className="text-[#e2c784] select-none text-xl">❖</span>

            {navItems.map((item, index) => (
              <div key={item.path} className="flex items-center space-x-3 sm:space-x-6">
                
                {/* Thẻ Link thay cho <a> để chuyển trang không bị load lại web */}
                <Link
                  to={item.path}
                  className={`hover:text-[#8a6822] transition-colors duration-200 ${
                    location.pathname === item.path 
                      ? 'underline decoration-[3px] underline-offset-[6px] text-[#8a6822]' 
                      : ''
                  }`}
                >
                  {item.label}
                </Link>

                {/* Ký tự phân cách hình thoi ❖ */}
                <span className="text-[#e2c784] select-none text-xl">❖</span>
              </div>
            ))}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;