import React from 'react';

const locationIcon = "https://www.figma.com/api/mcp/asset/b32ba2ea-94e9-4ace-b6a0-60bb51872195"; // imgVuesaxLinearLocation
const smsIcon = "https://www.figma.com/api/mcp/asset/815a54c5-958c-4237-a3e3-3a84a1b08f69"; // imgVuesaxLinearSms
const callIcon = "https://www.figma.com/api/mcp/asset/84624ae5-60c1-44bb-8821-311e54e79749"; // imgVuesaxLinearCall

export default function ShopFooter({ className = '' }) {
  return (
    <footer className={`${className} bg-[#fcfdde] mt-12`}> 
      <div className="max-w-screen-xl mx-auto px-10 py-8">
        <div className="flex gap-8">
          <div>
            <h4 className="font-Alata text-[20px]">Liên hệ</h4>
            <div className="flex items-center gap-2 mt-2"><img src={locationIcon} alt="location" className="w-6 h-6"/> <span>Hòa Lạc, Thạch Thất, Hà Nội</span></div>
            <div className="flex items-center gap-2 mt-2"><img src={smsIcon} alt="email" className="w-6 h-6"/> <span>Hoalachandicraft@gmail.com</span></div>
            <div className="flex items-center gap-2 mt-2"><img src={callIcon} alt="phone" className="w-6 h-6"/> <span>1234567890</span></div>
          </div>
          <div>
            <h4 className="font-Alata text-[20px]">Cửa hàng</h4>
            <p className="mt-2">Chuồn chuồn tre Thạch Xá</p>
            <p>Quạt Quảng Sơn</p>
            <p>Mây tre đan</p>
          </div>
          <div>
            <h4 className="font-Alata text-[20px]">Chính sách</h4>
            <p className="mt-2">Chính sách bảo hành</p>
            <p>Chính sách vận chuyển</p>
            <p>Chính sách đổi trả</p>
          </div>
          <div>
            <h4 className="font-Alata text-[20px]">Khám phá</h4>
            <p className="mt-2">Tin tức làng nghề</p>
            <p>Bộ sưu tập sản phẩm</p>
          </div>
        </div>

        <div className="mt-6 border-t pt-6 text-center">
          <p className="text-sm">Copyright © 2025 Hoalachandicraft · All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
}
