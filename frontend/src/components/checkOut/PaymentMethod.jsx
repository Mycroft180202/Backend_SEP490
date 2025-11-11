import React, { useState } from 'react';
import { FaCreditCard, FaMoneyBillWave, FaWallet } from 'react-icons/fa';

const PaymentMethod = () => {
  const [selectedMethod, setSelectedMethod] = useState('cod');

  const paymentMethods = [
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng (COD)',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng',
      icon: <FaMoneyBillWave className="text-2xl text-primary" />
    },
    {
      id: 'banking',
      name: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản qua Internet Banking hoặc Mobile Banking',
      icon: <FaCreditCard className="text-2xl text-primary" />
    },
    {
      id: 'ewallet',
      name: 'Ví điện tử',
      description: 'Thanh toán qua MoMo, ZaloPay, VNPay',
      icon: <FaWallet className="text-2xl text-primary" />
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-alata text-2xl text-black mb-6">
        Phương thức thanh toán
      </h2>

      <div className="flex flex-col gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-primary bg-[#FFF5F5]'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center w-5 h-5 mt-1">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === method.id
                    ? 'border-primary'
                    : 'border-gray-400'
                }`}
              >
                {selectedMethod === method.id && (
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {method.icon}
                <h3 className="font-nunito text-lg font-semibold text-black">
                  {method.name}
                </h3>
              </div>
              <p className="font-nunito text-base text-text-gray">
                {method.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Banking details */}
      {selectedMethod === 'banking' && (
        <div className="mt-6 p-4 bg-[#DBEFE2] rounded-lg">
          <h3 className="font-nunito text-lg font-semibold text-black mb-3">
            Thông tin chuyển khoản
          </h3>
          <div className="flex flex-col gap-2 font-nunito text-base text-black">
            <p><span className="font-semibold">Ngân hàng:</span> Vietcombank</p>
            <p><span className="font-semibold">Số tài khoản:</span> 1234567890</p>
            <p><span className="font-semibold">Chủ tài khoản:</span> Hoa Lac Handicraft</p>
            <p><span className="font-semibold">Nội dung:</span> [Mã đơn hàng] + [Số điện thoại]</p>
          </div>
        </div>
      )}

      {/* E-wallet details */}
      {selectedMethod === 'ewallet' && (
        <div className="mt-6 p-4 bg-[#DBEFE2] rounded-lg">
          <h3 className="font-nunito text-lg font-semibold text-black mb-3">
            Chọn ví điện tử
          </h3>
          <div className="flex gap-4">
            <button className="flex-1 py-3 border-2 border-primary rounded-lg font-nunito text-base font-semibold text-primary hover:bg-primary hover:text-white transition-colors">
              MoMo
            </button>
            <button className="flex-1 py-3 border-2 border-primary rounded-lg font-nunito text-base font-semibold text-primary hover:bg-primary hover:text-white transition-colors">
              ZaloPay
            </button>
            <button className="flex-1 py-3 border-2 border-primary rounded-lg font-nunito text-base font-semibold text-primary hover:bg-primary hover:text-white transition-colors">
              VNPay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethod;
