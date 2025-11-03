import React from "react";

const imgVuesaxLinearArrowLeft = "https://www.figma.com/api/mcp/asset/6d59ec5c-a5a1-49d5-91cd-28960953f2a6";
const imgVuesaxLinearArrowRight = "https://www.figma.com/api/mcp/asset/179ad049-6990-4a25-b2c1-aff02ed2114c";
const imgStar = "https://www.figma.com/api/mcp/asset/862d3571-5051-433c-a564-108f2ead6b04";
const imgEllipse37 = "https://www.figma.com/api/mcp/asset/0e5474bd-8bc9-4ff2-93e4-fb66e7d75505";

function Pagination({ className = "" }) {
	return (
		<div className={`flex items-center gap-5 ${className}`}>
			<button className="w-6 h-6 flex items-center justify-center">
				<img src={imgVuesaxLinearArrowLeft} alt="prev" className="w-full h-full" />
			</button>
			<div className="flex items-center gap-5 text-[18px] leading-8 font-normal font-nunito">
				<span className="text-black">1</span>
				<span className="text-text-light">2</span>
				<span className="text-text-light">3</span>
				<span className="text-text-light">...</span>
				<span className="text-text-light">10</span>
			</div>
			<button className="w-6 h-6 flex items-center justify-center">
				<img src={imgVuesaxLinearArrowRight} alt="next" className="w-full h-full" />
			</button>
		</div>
	);
}

function LtBanVaSao({ className = "" }) {
	return (
		<div className={`flex gap-3 items-center ${className}`}>
			<span className="text-[16px] leading-6 font-normal font-nunito text-black">200 lượt bán</span>
			<div className="flex items-center gap-1">
				<span className="text-[16px] leading-6 font-normal font-nunito text-black">4.9</span>
				<img src={imgStar} alt="star" className="w-5 h-5" />
				<span className="text-[16px] leading-6 font-normal font-nunito text-text-gray">(80)</span>
			</div>
		</div>
	);
}

function CardSanPham({ className = "" }) {
	return (
		<div className={`flex flex-col gap-1 items-start w-[270px] ${className}`}> 
			<div className="bg-[#d9d9d9] h-[320px] w-full rounded-[12px] mb-2" />
			<span className="font-medium font-nunito text-[18px] leading-8 text-black">Chuồn chuồn tre nhiều màu</span>
			<div className="flex items-center gap-1">
				<img src={imgEllipse37} alt="shop" className="w-6 h-6" />
				<span className="font-nunito text-[16px] text-black">Shop A</span>
			</div>
			<div className="flex gap-3 items-baseline w-full">
				<span className="font-nunito text-[16px] text-text-gray line-through">100.000đ</span>
				<span className="font-alata text-[20px] leading-8 text-primary">200.000đ</span>
			</div>
			<LtBanVaSao className="w-full" />
		</div>
	);
}

export default function RelationProduct() {
	return (
		<div className="flex flex-col items-center gap-10 px-36 py-28 w-full">
			<h2 className="font-alata text-[36px] leading-[56px] text-primary text-center w-full mb-2">Sản phẩm tương tự</h2>
			<div className="flex flex-col gap-6 items-center w-full">
				<div className="flex gap-6 w-full justify-center">
					<CardSanPham />
					<CardSanPham />
					<CardSanPham />
					<CardSanPham />
				</div>
				<Pagination />
			</div>
		</div>
	);
}
