import React from 'react';

const WhyUsSection = ({ assets }) => (
  <div className="bg-[#dbefe2] px-[144px] py-[60px] flex gap-[95px] items-start">
    <div className="font-alata text-[#9e211f] text-[36px] leading-[56px] whitespace-nowrap">
      <p className="mb-0">Vì sao lại chọn</p>
      <p>Hoalachandicraft?</p>
    </div>
    <div className="flex flex-col gap-3 w-[760px]">
      <div className="flex items-center gap-3">
        <img src={assets.imgEllipse43} alt="dot" className="w-2 h-2" />
        <span className="text-[18px] leading-[32px]">Chân thật & thủ công: Mỗi sản phẩm đều được làm bằng tay, tỉ mỉ trong từng chi tiết, mang hồn cốt của người thợ Việt.</span>
      </div>
      <div className="flex items-center gap-3">
        <img src={assets.imgEllipse43} alt="dot" className="w-2 h-2" />
        <span className="text-[18px] leading-[32px]">Gắn kết truyền thống & hiện đại: Chúng tôi giữ nguyên nét xưa, nhưng thể hiện theo phong cách gần gũi, phù hợp với đời sống hôm nay.</span>
      </div>
      <div className="flex items-center gap-3">
        <img src={assets.imgEllipse43} alt="dot" className="w-2 h-2" />
        <span className="text-[18px] leading-[32px]">Sản phẩm mang câu chuyện: Mỗi món đồ không chỉ đẹp mà còn kể về một làng nghề, một con người, một niềm tự hào văn hóa.</span>
      </div>
      <div className="flex items-center gap-3">
        <img src={assets.imgEllipse43} alt="dot" className="w-2 h-2" />
        <span className="text-[18px] leading-[32px]">Bền vững & ý nghĩa: Chúng tôi hướng đến phát triển bền vững, đồng hành cùng nghệ nhân và lan tỏa giá trị thủ công tới cộng đồng.</span>
      </div>
    </div>
  </div>
);

export default WhyUsSection;
