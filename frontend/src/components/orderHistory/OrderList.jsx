import React from "react";


function CardOrderProduct({ shopName, productName, productDesc, price, shipFee, total, imageUrl }) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-[1152px] p-0" data-name="Card sản phẩm khi thanh toán">
      <div className="flex items-center justify-between h-[72px] w-full">
        <div className="flex gap-3 items-start">
          <div className="bg-[#d9d9d9] rounded-xl w-[72px] h-[72px] flex items-center justify-center overflow-hidden">
            {imageUrl ? <img src={imageUrl} alt={productName} className="object-cover w-full h-full rounded-xl" /> : null}
          </div>
          <div className="flex flex-col gap-1 w-[215px] text-black">
            <p className="font-nunito font-medium text-[18px] leading-8">{productName}</p>
            <p className="font-nunito text-[16px] leading-6">{productDesc}</p>
          </div>
        </div>
        <p className="font-alata text-[20px] leading-8 text-primary">{price}</p>
      </div>
      <div className="flex flex-col items-end w-[183px] ml-auto">
        <p className="font-nunito text-[16px] leading-6 text-[#46a762] text-right">Phí ship: {shipFee}</p>
        <p className="font-alata text-[20px] leading-8 text-primary text-right">Thành tiền: {total}</p>
      </div>
      <div className="w-full h-[2px] mt-2 bg-[#e5e5e5] rounded" />
    </div>
  );
}

export default function OrderList({ orders }) {
  return (
    <div className="flex flex-col gap-6 items-center pb-[120px] pt-6 px-[144px] w-full">
      {orders.map((order, idx) => (
        <CardOrderProduct key={idx} {...order} />
      ))}
    </div>
  );
}
