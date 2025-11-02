import React from "react";

const imgVuesaxLinearExport =
  "https://www.figma.com/api/mcp/asset/a179a411-507d-49bb-ae12-1a5e900abcf5";
const imgStar =
  "https://www.figma.com/api/mcp/asset/96a6305e-11a3-4ab8-ba60-c78a1dc64718";
const img = "https://www.figma.com/api/mcp/asset/f497f2e3-94e4-4666-be8c-6b2c56ce8ab2";
const img1 = "https://www.figma.com/api/mcp/asset/1b5b8664-f2a7-4070-bc07-64687ce79f1d";
const imgVuesaxLinearHeart =
  "https://www.figma.com/api/mcp/asset/6e8bf7a6-c112-4ba2-a424-eadc1554a5a4";

function VuesaxLinearExport({ className }) {
  return (
    <div className={`${className} flex items-center`}>
      <img alt="Export Icon" src={imgVuesaxLinearExport} className="w-5 h-5" />
    </div>
  );
}

function LtBanVaSao({ className }) {
  return (
    <div className={`${className} flex items-center gap-3`}>
      <p>200 lượt bán</p>
      <div className="flex items-center gap-1">
        <p>4.9</p>
        <img alt="Star Icon" src={imgStar} className="w-5 h-5" />
        <p>(80)</p>
      </div>
      <VuesaxLinearExport />
    </div>
  );
}

export default function ShortDescription() {
  return (
    <div className="relative w-full flex justify-center py-10 bg-[#FFFDEB]">
      <div className="flex flex-col md:flex-row gap-10 items-start max-w-[1200px] w-full px-6">

        {/* Ô vuông bên trái, 50% */}
        <div className="w-full md:w-1/2 rounded-[24px] bg-[#d9d9d9] h-[458px]"></div>

        {/* Nội dung bên phải, 50% */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">

          <div className="flex justify-end">
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "100px",
                padding: "6px",
              }}
            >
              <img
                alt="Heart Icon"
                src={imgVuesaxLinearHeart}
                className="w-6 h-6"
              />
            </div>
          </div>

          <p
            style={{
              fontFamily: "Alata, sans-serif",
              fontSize: "36px",
              lineHeight: "56px",
            }}
          >
            Chuồn chuồn tre
          </p>

          <LtBanVaSao className="text-gray-700 text-base" />

          <div className="flex flex-col gap-2">
            <p>Số lượng</p>
            <div className="flex items-center gap-2">
              <img alt="Minus Icon" src={img} className="w-6 h-6 cursor-pointer" />
              <p>1</p>
              <img alt="Add Icon" src={img1} className="w-6 h-6 cursor-pointer" />
            </div>
            <p>Còn 10 sản phẩm</p>
          </div>

          {/* Giá */}
          <div>
            <p style={{ textDecoration: "line-through", color: "#a0a0a0" }}>
              100.000đ
            </p>
            <p style={{ color: "#9e211f", fontSize: "48px", lineHeight: "68px" }}>
              50.000đ
            </p>
          </div>

          {/* Nút */}
          <div className="flex gap-4">
            <button
              style={{
                border: "0.5px solid #9e211f",
                borderRadius: "12px",
                padding: "6px 24px",
                color: "#9e211f",
              }}
            >
              Thêm giỏ hàng
            </button>
            <button
              style={{
                backgroundColor: "#9e211f",
                borderRadius: "12px",
                padding: "6px 24px",
                color: "#feffff",
              }}
            >
              Mua ngay
            </button>
          </div>

          {/* Khuyến mãi */}
          <div
            style={{
              backgroundColor: "#dbefe2",
              border: "1px solid #2c9a4c",
              borderRadius: "12px",
              padding: "12px 16px",
            }}
          >
            <p>Áp dụng mã freeshep 30k cho đơn hàng từ 3 sản phẩm trở lên</p>
          </div>
        </div>
      </div>
    </div>
  );
}
