import React from 'react';

const ContactSection = ({ assets }) => (
  <div className="px-[144px] py-[60px] flex flex-col gap-6">
    <h2 className="font-alata text-[#9e211f] text-[36px] leading-[56px]">Liên hệ</h2>
    <div className="flex flex-col gap-3 text-[18px]">
      <div className="flex items-center gap-2">
        <img src={assets.imgVuesaxLinearLocation} alt="location" className="w-6 h-6" />
        <span>Hòa Lạc, Thạch Thất, Hà Nội</span>
      </div>
      <div className="flex items-center gap-2">
        <img src={assets.imgVuesaxLinearSms} alt="email" className="w-6 h-6" />
        <span>hoalachandicraft@gmail.com</span>
      </div>
      <div className="flex items-center gap-2">
        <img src={assets.imgVuesaxLinearCall} alt="phone" className="w-6 h-6" />
        <span>0123 456 789</span>
      </div>
    </div>
  </div>
);

export default ContactSection;
