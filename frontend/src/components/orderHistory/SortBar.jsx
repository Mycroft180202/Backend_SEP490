import { useState } from "react";

const STATUS_LIST = [
  { label: "Tất cả", key: "all" },
  { label: "Chờ xác nhận", key: "WaitingForPickup" },
  { label: "Đang giao", key: "Shipping" },
{ label: "Đã nhận hàng", key: "Completed" },
  { label: "Đã hủy", key: "Cancelled" },
  { label: "Đã thanh toán", key: "Paid" },
];

export default function SortBar({ onStatusChange }) {
	const [selected, setSelected] = useState(0);

	const handleClick = (idx, key) => {
		setSelected(idx);
		if (onStatusChange) onStatusChange(key);
	};

	return (
		<div className="box-border flex flex-col gap-4 items-start px-[144px] py-6 relative w-full bg-white border-b border-gray-200">
			<div className="flex items-baseline justify-start gap-8 relative w-full">
				{STATUS_LIST.map((status, idx) => (
					<button
						key={status.key}
						type="button"
						onClick={() => handleClick(idx, status.key)}
						className={`font-alata text-[18px] px-2 py-2 focus:outline-none transition-colors duration-150 border-b-2 ${
							selected === idx 
								? "text-primary border-primary font-bold" 
								: "text-gray-500 border-transparent hover:text-gray-700"
						}`}
					>
						{status.label}
					</button>
				))}
			</div>
		</div>
	);
}
