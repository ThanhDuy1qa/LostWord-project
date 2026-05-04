const Footer = () => {
  return (
    <footer className="bg-[#0a0a0c] border-t-2 border-[#c09641]/50 py-8 mt-10 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] relative z-40">
      <div className="max-w-7xl mx-auto px-4 text-center">
        
        {/* Tiêu đề & Cảnh báo Unofficial */}
        <p className="text-[#c09641] text-lg font-bold font-serif mb-1 uppercase tracking-widest drop-shadow-md">
          LostWord Chronicle
        </p>
        <p className="text-gray-400 text-xs mb-4 uppercase tracking-wider font-bold">
          The Unofficial Database - Đồ án Tốt nghiệp
        </p>
        
        {/* Đoạn Disclaimer Bản Quyền */}
        <div className="text-gray-500 text-[11px] sm:text-xs leading-relaxed max-w-4xl mx-auto space-y-2">
          <p>
            ©Team Shanghai Alice ©GOOD SMILE COMPANY, INC. / NextNinja Co., Ltd.
          </p>
          <p>
            Trang web này là một dự án phi lợi nhuận do người hâm mộ tạo ra. Toàn bộ hình ảnh, tài nguyên, thiết kế nhân vật và dữ liệu trò chơi đều thuộc bản quyền của các nhà phát hành và tổ chức liên quan.
          </p>
          <p>
            Nếu có bất kỳ vấn đề nào về bản quyền hoặc yêu cầu gỡ bỏ hình ảnh (Takedown Request), vui lòng liên hệ: <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">thanhduy1qa@gmail.com</span>
          </p>
        </div>

        {/* Dải phân cách */}
        <div className="flex justify-center items-center my-4 space-x-2 text-[#c09641]/40">
          <span>❖</span>
          <div className="h-px w-24 bg-[#c09641]/40"></div>
          <span>❖</span>
        </div>

        {/* Chữ ký */}
        <p className="text-[#e2c784] text-xs font-bold tracking-widest uppercase">
          Developed by DuyApii
        </p>

      </div>
    </footer>
  );
};

export default Footer;