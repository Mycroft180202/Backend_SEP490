// Order Tracking Bar - Figma design implementation
// https://www.figma.com/design/LVsmHJotknx0isQ2MZ6775/Web-%C4%90%E1%BB%93-%C3%81n?node-id=1-2469
import React from "react";


export default function TrackingBar() {
		
	const steps = [
		{ left: 144, label: "Chọn sản phẩm", active: true },
		{ left: 421, label: "Thanh toán", active: true },
		{ left: 698, label: "Chuẩn bị hàng", active: true, highlight: true },
		{ left: 975, label: "Đang vận chuyển", active: false },
		{ left: 1252, label: "Đã giao hàng", active: false },
	];

			return (
				<div className="flex flex-col gap-3 items-start w-full px-[144px] relative mb-8" data-node-id="1:2469">
					<div className="w-[1152px] mx-auto">
						{/* Title */}
						<h1 className="font-nunito text-[32px] font-bold text-[#9e211f] mb-6">Theo dõi đơn hàng</h1>
						
						{/* Progress Bar & Icons */}
						<div className="h-[44px] w-full relative">
							{/* Background Bar */}
							<div className="absolute bg-[#a0a0a0] h-1 left-0 rounded-full top-[52px] w-full" />
							{/* Progress Bar */}
							<div className="absolute bg-[#2c9a4c] h-1 left-0 rounded-full top-[52px]" style={{width: 568}} />
							{/* Step Circles with Checkmark */}
							{steps.map((step, idx) => (
								<div
									key={step.label}
									className={`absolute w-11 h-11 top-[32px]`}
									style={{left: step.left - 144}}
								>
									<span
										className={`flex items-center justify-center rounded-full border-2 size-full ${step.active ? "bg-[#2c9a4c] border-[#2c9a4c]" : "bg-[#a0a0a0] border-[#a0a0a0]"}`}
									>
										{step.active ? (
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M6 12.5L10.5 17L18 9.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
										) : null}
									</span>
								</div>
							))}
						</div>
						{/* Step Labels - chỉnh lại vị trí */}
						<div className="font-nunito font-normal h-8 leading-8 relative w-full text-[18px]" data-node-id="1:2483">
							{steps.map((step, idx) => {
								// Label đầu tiên dưới dấu tích đầu
								if (idx === 0) {
									return (
										<p
											key={step.label}
											className="absolute top-[32px] w-max whitespace-nowrap text-center"
											style={{left: step.left - 144, color: step.highlight ? "#46a762" : step.active ? "#000" : "#a0a0a0"}}
										>
											{step.label}
										</p>
									);
								}
								// 3 label giữa: mỗi label căn giữa giữa 2 dấu tích của nó, tách riêng từng label
								if (idx === 1) {
									
									const center = (steps[0].left + steps[1].left) / 2 - 144;
									return (
										<p
											key={step.label}
											className="absolute top-[32px] w-max whitespace-nowrap text-center"
											style={{left: step.left - 165, color: step.highlight ? "#46a762" : step.active ? "#000" : "#a0a0a0"}}
										>
											{step.label}
										</p>
									);
								}
								if (idx === 2) {
									
									const center = (steps[1].left + steps[2].left) / 2 - 40;
									return (
										<p
											key={step.label}
											className="absolute top-[32px] w-max whitespace-nowrap text-center"
											style={{left: center, color: step.highlight ? "#46a762" : step.active ? "#000" : "#a0a0a0"}}
										>
											{step.label}
										</p>
									);
								}
								if (idx === 3) {
									
									const center = (steps[2].left + steps[3].left) / 2 - 50;
									return (
										<p
											key={step.label}
											className="absolute top-[32px] w-max whitespace-nowrap text-center"
											style={{left: center, color: step.highlight ? "#46a762" : step.active ? "#000" : "#a0a0a0"}}
										>
											{step.label}
										</p>
									);
								}
								// Label cuối cùng sát lề phải, sát dấu tích cuối
								if (idx === steps.length - 1) {
									return (
										<p
											key={step.label}
											className="absolute top-[32px] w-max whitespace-nowrap text-right"
											style={{right: 0, color: step.highlight ? "#46a762" : step.active ? "#000" : "#a0a0a0"}}
										>
											{step.label}
										</p>
									);
								}
								return null;
							})}
						</div>
					</div>
				</div>
			);
}
