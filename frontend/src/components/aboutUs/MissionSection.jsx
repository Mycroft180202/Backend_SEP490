import React from 'react';

const MissionSection = () => (
  <div className="px-[144px] pt-[60px] pb-[120px]">
    <h2 className="font-alata text-[#9e211f] text-[36px] leading-[56px] mb-10">Sứ mệnh</h2>
    <div className="flex flex-wrap gap-6">
      <div className="bg-[#fbfbbb] rounded-[12px] p-10 flex-1 min-w-[300px] max-w-[368px] flex flex-col items-center text-center">
        <span className="font-alata text-[20px] leading-[32px] mb-2">01</span>
        <span className="font-alata text-[20px] leading-[32px]">Gìn giữ tinh hoa làng nghề Hòa Lạc</span>
      </div>
      <div className="bg-[#fbfbbb] rounded-[12px] p-10 flex-1 min-w-[300px] max-w-[368px] flex flex-col items-center text-center">
        <span className="font-alata text-[20px] leading-[32px] mb-2">02</span>
        <span className="font-alata text-[20px] leading-[32px]">Kết nối nghệ nhân với cộng đồng yêu thủ công</span>
      </div>
      <div className="bg-[#fbfbbb] rounded-[12px] p-10 flex-1 min-w-[300px] max-w-[368px] flex flex-col items-center text-center">
        <span className="font-alata text-[20px] leading-[32px] mb-2">03</span>
        <span className="font-alata text-[20px] leading-[32px]">Lan tỏa vẻ đẹp văn hóa Việt qua từng sản phẩm</span>
      </div>
    </div>
  </div>
);

export default MissionSection;
