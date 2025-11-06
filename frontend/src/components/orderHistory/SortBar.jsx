import { useState } from "react";
const imgEllipse32 = "https://www.figma.com/api/mcp/asset/e5956650-7571-4653-8af2-506aa8648cfb";
const imgGroup17 = "https://www.figma.com/api/mcp/asset/e05556b0-4d6e-4fa3-a149-88929afa62db";

const STATUS_LIST = [
	{ label: "Chưa thanh toán", key: "unpaid", color: "#a0a0a0" },
	{ label: "Chờ vận chuyển", key: "waiting", color: "#a0a0a0" },
	{ label: "Đang vận chuyển", key: "shipping", color: "#a0a0a0" },
	{ label: "Đã mua", key: "purchased", color: "#a0a0a0" },
	{ label: "Đã hủy", key: "cancelled", color: "#a0a0a0" },
];

export default function SortBar({ onStatusChange }) {
	const [selected, setSelected] = useState(0);

	const handleClick = (idx, key) => {
		setSelected(idx);
		if (onStatusChange) onStatusChange(key);
	};

		return (
			<div className="box-border content-stretch flex flex-col gap-[4px] items-start px-[144px] py-0 relative size-full" data-node-id="2493:2787">
				<div className="content-stretch flex items-baseline justify-between relative shrink-0 w-full" data-node-id="2493:2785">
					{STATUS_LIST.map((status, idx) => (
						<div key={status.key} className="flex flex-col items-center flex-1">
							<button
								type="button"
								onClick={() => handleClick(idx, status.key)}
								className={`font-['Alata',sans-serif] leading-[32px] not-italic relative shrink-0 text-[20px] px-2 focus:outline-none transition-colors duration-150 ${
									selected === idx ? "text-[#9e211f] font-bold" : "text-[#a0a0a0]"
								}`}
								style={{ color: selected === idx ? "#9e211f" : status.color }}
								data-node-id={`2493:277${idx}`}
							>
								{status.label}
							</button>
						</div>
					)).reduce((acc, el, idx) => {
						acc.push(el);
						if (idx < STATUS_LIST.length - 1) {
							acc.push(
								<div key={`dot-${idx}`} className="flex items-center justify-center h-full">
									<div className="relative shrink-0 size-[8px]" data-node-id={`2493:278${idx+1}`}> 
										<img alt="" className="block max-w-none size-full" src={imgEllipse32} />
									</div>
								</div>
							);
						}
						return acc;
					}, [])}
				</div>
				{/* Đường kẻ liền mạch phía dưới, đoạn dưới mục chọn sẽ tô đỏ */}
				<div className="relative w-full h-[4px] mt-2">
					<div className="absolute top-0 left-0 w-full h-full bg-[#e5e5e5] rounded" />
					<div
						className="absolute top-0 h-full rounded transition-all duration-150"
						style={{
							left: `calc(${(100 / STATUS_LIST.length) * selected}% )`,
							width: `calc(100% / ${STATUS_LIST.length})`,
							background: '#9e211f'
						}}
					/>
				</div>
			</div>
		);
}
