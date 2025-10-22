import React from 'react';

const WhyUsSection = () => (
  <section className="bg-[#dbefe2] px-[48px] py-[60px] flex flex-row items-center justify-center gap-10">
    {/* Cột 1: Tiêu đề ngoài cùng bên trái */}
    <div className="flex flex-col justify-center items-center flex-1">
      <div className="font-alata text-[#9e211f] text-[40px] leading-[56px] tracking-wide text-right drop-shadow-md">
        <p className="mb-0">Vì sao lại chọn</p>
        <p className="font-bold">Hoalachandicraft?</p>
      </div>
    </div>
    {/* Cột 2: Lý do (list dọc) */}
    <div className="flex flex-col justify-center items-center flex-[2] gap-6">
      <span className="font-nunito text-[20px] leading-[34px] font-semibold text-[#222] bg-white/40 rounded-[8px] px-6 py-4 w-full max-w-[700px] transition-colors duration-200 hover:text-[#9e211f] hover:bg-[#fff7] cursor-pointer text-center">
        Chân thật & thủ công: Mỗi sản phẩm đều được làm bằng tay, tỉ mỉ trong từng chi tiết, mang hồn cốt của người thợ Việt.
      </span>
      <span className="font-nunito text-[20px] leading-[34px] font-semibold text-[#222] bg-white/40 rounded-[8px] px-6 py-4 w-full max-w-[700px] transition-colors duration-200 hover:text-[#9e211f] hover:bg-[#fff7] cursor-pointer text-center">
        Gắn kết truyền thống & hiện đại: Chúng tôi giữ nguyên nét xưa, nhưng thể hiện theo phong cách gần gũi, phù hợp với đời sống hôm nay.
      </span>
      <span className="font-nunito text-[20px] leading-[34px] font-semibold text-[#222] bg-white/40 rounded-[8px] px-6 py-4 w-full max-w-[700px] transition-colors duration-200 hover:text-[#9e211f] hover:bg-[#fff7] cursor-pointer text-center">
        Sản phẩm mang câu chuyện: Mỗi món đồ không chỉ đẹp mà còn kể về một làng nghề, một con người, một niềm tự hào văn hóa.
      </span>
      <span className="font-nunito text-[20px] leading-[34px] font-semibold text-[#222] bg-white/40 rounded-[8px] px-6 py-4 w-full max-w-[700px] transition-colors duration-200 hover:text-[#9e211f] hover:bg-[#fff7] cursor-pointer text-center">
        Bền vững & ý nghĩa: Chúng tôi hướng đến phát triển bền vững, đồng hành cùng nghệ nhân và lan tỏa giá trị thủ công tới cộng đồng.
      </span>
    </div>
    {/* Cột 3: Ảnh ngoài cùng bên phải */}
    <div className="flex flex-col justify-center items-center flex-1">
      <img src="/images/WhyUsSection.jpg" alt="Ảnh giới thiệu" className="w-[520px] h-[720px] object-cover rounded-[16px] shadow-xl bg-white" />
    </div>
  </section>
);

export default WhyUsSection;
