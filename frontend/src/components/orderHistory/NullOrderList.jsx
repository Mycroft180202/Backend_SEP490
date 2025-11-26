import React from "react";

const emptyOrdersIcon = "/images/default-product.png";

export default function NullOrderList() {
  return (
    <div className="flex flex-col gap-3 items-center justify-center w-full h-full py-16">
      <img src={emptyOrdersIcon} alt="no order" className="w-[80px] h-[80px] mb-2 object-contain" />
      <p className="font-alata text-[20px] leading-8 text-[#a0a0a0] text-center">
        Chưa có đơn hàng nào
      </p>
    </div>
  );
}
