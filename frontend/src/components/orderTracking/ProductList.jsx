// Product List - Order Tracking - Figma design implementation
// https://www.figma.com/design/LVsmHJotknx0isQ2MZ6775/Web-%C4%90%E1%BB%93-%C3%81n?node-id=1-2489
import React from "react";

const imgLine13 = "https://www.figma.com/api/mcp/asset/5d1290b1-e766-4040-9642-4a518617dd65";

export default function ProductList() {
				return (
					<div className="box-border flex flex-col gap-10 items-end px-[144px] py-6 w-full relative mt-12" data-node-id="1:2489">
						<div className="w-[1152px] mx-auto">
							<div className="flex flex-col gap-3 items-end w-full relative">
								<div className="flex flex-col gap-3 items-start w-full relative">
									{/* Product row */}
									<div className="flex h-[72px] items-center justify-between w-full">
										<div className="flex gap-3 items-start">
											<div className="bg-[#d9d9d9] rounded-xl w-[72px] h-[72px]" />
											<div className="flex flex-col gap-1 items-start text-black w-[215px]">
												<p className="font-nunito font-medium text-[18px] leading-8">Chuồn chuồn tre Thạch Xá</p>
												<p className="font-nunito text-[16px] leading-6">15x15cm, 1 chiếc</p>
											</div>
										</div>
										<p className="font-alata text-[20px] leading-8 text-[#9e211f]">50.000đ</p>
									</div>
									{/* Divider - only span product area */}
									<div className="w-full flex justify-center my-2">
										<img src={imgLine13} alt="divider" className="w-full h-[2px] object-cover" />
									</div>
								</div>
								{/* Shipping & total */}
								<div className="flex flex-col items-end w-[183px]">
									<p className="font-nunito text-[16px] leading-6 text-[#46a762] text-right">Phí ship: 30.000đ</p>
									<p className="font-alata text-[20px] leading-8 text-[#9e211f] text-right">Thành tiền: 80.000đ</p>
								</div>
								{/* Payment info */}
								<p className="font-nunito text-[16px] leading-6 text-black">Đã thanh toán 80.000đ qua chuyển khoản ngân hàng</p>
							</div>
							{/* Cancel button */}
							<div className="flex justify-end mt-4">
								<button className="border-[#9e211f] border border-solid flex gap-2 items-center justify-center px-6 py-1.5 rounded-xl">
									<p className="font-nunito font-medium text-[18px] leading-8 text-[#9e211f]">Hủy đơn hàng</p>
								</button>
							</div>
						</div>
					</div>
				);
}
