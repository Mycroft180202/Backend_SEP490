import React from "react";

const imgVuesaxLinearArchiveMinus = "https://www.figma.com/api/mcp/asset/a8f38622-9545-4205-b18e-fc567dde03f1";

export default function NullOrderList() {
  return (
    <div className="flex flex-col gap-3 items-center justify-center w-full h-full py-16">
      <img src={imgVuesaxLinearArchiveMinus} alt="no order" className="w-[60px] h-[60px] mb-2" />
      <p className="font-alata text-[20px] leading-8 text-[#a0a0a0] text-center">Chưa có đơn hàng nào</p>
    </div>
  );
}
