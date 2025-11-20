import React from 'react';
import PropTypes from 'prop-types';
import { FaMoneyBillWave, FaWallet } from 'react-icons/fa';

const PaymentMethod = ({
  selectedMethod = 'cod',
  onChange = () => {},
  disabled = false,
}) => {
  const paymentMethods = [
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng (COD)',
      description: 'Trả tiền mặt khi nhận hàng',
      icon: <FaMoneyBillWave className="text-2xl text-[#9E211F]" />,
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      description: 'Thanh toán trực tuyến qua VNPay',
      icon: <FaWallet className="text-2xl text-[#9E211F]" />,
    },
  ];

  const handleSelect = (methodId) => {
    if (disabled || methodId === selectedMethod) return;
    onChange(methodId);
  };

  return (
    <div className="bg-white rounded-[20px] p-6 shadow-lg border border-[#efe7db] checkout-card">
      <h2 className="font-alata text-2xl text-[#331c11] mb-6">
        Phương thức thanh toán
      </h2>

      <div className="flex flex-col gap-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelect(method.id)}
              className={`flex items-start gap-4 p-4 border-2 rounded-xl text-left transition-all ${
                isSelected
                  ? 'border-[#9E211F] bg-[#FFF6EF] shadow-[0_10px_25px_rgba(158,33,31,0.1)]'
                  : 'border-[#efe7db] hover:border-[#d9c8b3]'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={disabled}
            >
              <div className="flex items-center justify-center w-5 h-5 mt-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-[#9E211F]' : 'border-gray-400'
                  }`}
                >
                  {isSelected && (
                    <div className="w-3 h-3 rounded-full bg-[#9E211F]" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {method.icon}
                  <h3 className="font-nunito text-lg font-semibold text-[#331c11]">
                    {method.name}
                  </h3>
                </div>
                <p className="font-nunito text-base text-gray-600">
                  {method.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

PaymentMethod.propTypes = {
  selectedMethod: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default PaymentMethod;
