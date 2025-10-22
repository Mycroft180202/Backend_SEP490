import React from 'react';

const MissionSection = () => (
  <section className="px-[144px] pt-[60px] pb-[120px]">
    <h2 className="font-alata text-[#9e211f] text-[40px] leading-[56px] mb-12 tracking-wide text-center drop-shadow-md">Sứ mệnh của chúng tôi</h2>
    <div className="flex flex-wrap gap-8 justify-center">
      <div className="bg-gradient-to-br from-[#fbfbbb] to-[#fff] rounded-[16px] p-10 flex-1 min-w-[300px] max-w-[368px] flex flex-col items-center text-center shadow-lg transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl">
        <span className="font-alata text-[22px] text-[#9e211f] font-bold mb-3 tracking-wider">1</span>
        <span className="font-nunito text-[20px] leading-[32px] font-semibold text-[#222]">Gìn giữ tinh hoa làng nghề Hòa Lạc</span>
      </div>
      <div className="bg-gradient-to-br from-[#fbfbbb] to-[#fff] rounded-[16px] p-10 flex-1 min-w-[300px] max-w-[368px] flex flex-col items-center text-center shadow-lg transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl">
        <span className="font-alata text-[22px] text-[#9e211f] font-bold mb-3 tracking-wider">2</span>
        <span className="font-nunito text-[20px] leading-[32px] font-semibold text-[#222]">Kết nối nghệ nhân với cộng đồng yêu thủ công</span>
      </div>
      <div className="bg-gradient-to-br from-[#fbfbbb] to-[#fff] rounded-[16px] p-10 flex-1 min-w-[300px] max-w-[368px] flex flex-col items-center text-center shadow-lg transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl">
        <span className="font-alata text-[22px] text-[#9e211f] font-bold mb-3 tracking-wider">3</span>
        <span className="font-nunito text-[20px] leading-[32px] font-semibold text-[#222]">Lan tỏa vẻ đẹp văn hóa Việt qua từng sản phẩm</span>
      </div>
    </div>
  </section>
);

export default MissionSection;
