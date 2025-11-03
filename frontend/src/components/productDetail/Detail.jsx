import React, { useState } from 'react';

const imgEllipse34 = "https://www.figma.com/api/mcp/asset/19274594-08ce-4e09-b869-ea2ac9a5a078";
const imgVuesaxLinearArrowRight = "https://www.figma.com/api/mcp/asset/7d7e2137-bb8e-4862-94f6-36c4392a83bc";
const imgVuesaxLinearStar = "https://www.figma.com/api/mcp/asset/73fcaa65-6d1c-4803-b6a9-86db4a49c94c";

export default function Detail() {
  const [tab, setTab] = useState('description');
  return (
    <div className="min-h-screen pb-40 px-36 pt-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11">
          <img alt="" className="w-full h-full object-cover rounded-full" src={imgEllipse34} />
        </div>
        <p className="font-['Alata:Regular'] text-[20px] text-black">Shop A</p>
        <div className="w-6 h-6">
          <img alt="" className="w-full h-full" src={imgVuesaxLinearArrowRight} />
        </div>
      </div>


      <div className="flex gap-10">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('description')}
              className={`text-[20px] font-['Alata:Regular'] cursor-pointer hover:text-primary focus:outline-none ${tab === 'description' ? 'text-[#9e211f]' : 'text-[#a0a0a0]'}`}
            >
              Mô tả
            </button>
            <span className={`w-2 h-2 rounded-full inline-block ${tab === 'description' ? 'bg-[#9e211f]' : 'bg-[#e0e0e0]'}`} />
            <button
              onClick={() => setTab('feedback')}
              className={`text-[20px] cursor-pointer hover:text-primary focus:outline-none ${tab === 'feedback' ? 'text-[#9e211f]' : 'text-[#a0a0a0]'}`}
            >
              Feedback (80)
            </button>
          </div>

          {tab === 'description' ? (
            <>
              <p className="text-[18px] text-black leading-8">
                Lorem ipsum dolor sit amet consectetur. Netus duis nullam feugiat nisl nunc. Aliquam mi nunc lacinia ultrices proin id pulvinar magna. Scelerisque enim in lorem dui vulputate a. Commodo at morbi eget laoreet aliquet.
              </p>

              <div className="bg-[#d9d9d9] h-[252px] rounded-[12px]" />

              <div className="flex gap-10 mt-6">
                <div className="flex flex-col gap-2 w-1/2">
                  <p className="font-medium">Xuất xứ</p>
                  <p className="font-medium">Chất liệu</p>
                </div>
                <div className="flex-1">
                  <p>Làng chuồn chuồn tre Thạch Xá</p>
                  <p>Tre, bột màu</p>
                </div>
              </div>

              <p className="text-[18px] text-black leading-8 mt-6">
                Lorem ipsum dolor sit amet consectetur. Netus duis nullam feugiat nisl nunc. Aliquam mi nunc lacinia ultrices proin id pulvinar magna. Scelerisque enim in lorem dui vulputate a. Commodo at morbi eget laoreet aliquet.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#d9d9d9] h-[252px] rounded-[12px]" />
                <div className="bg-[#d9d9d9] h-[252px] rounded-[12px]" />
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-[#f5f5f5] rounded-lg p-4 shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">Người dùng {i}</span>
                    <span className="text-yellow-500">★★★★★</span>
                  </div>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vitae velit ex.</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <p className="text-[48px] text-[#9e211f] font-['Alata:Regular']">4.9</p>
              <div className="w-12 h-12">
                <img alt="" className="w-full h-full" src={imgVuesaxLinearStar} />
              </div>
            </div>
            <p className="text-[24px] text-black">(80)</p>
          </div>


          <div className="flex flex-col gap-2 w-full">
            {[5, 4, 3, 2, 1].map((num, idx) => {
              const filledWidth = [254, 191, 15, 15, 15][idx];
              return (
                <div key={num} className="flex items-center gap-2">
                  <p className="w-6 text-right">{num}</p>
                  <div className="w-full bg-[#e0e0e0] h-3 rounded-full relative">
                    <div className="bg-[#f7f32f] h-3 rounded-full" style={{ width: filledWidth }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
