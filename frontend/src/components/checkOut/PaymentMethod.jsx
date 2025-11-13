import React from 'react';
import PropTypes from 'prop-types';
import { FaCreditCard, FaMoneyBillWave, FaWallet } from 'react-icons/fa';

const PaymentMethod = ({
  selectedMethod = 'cod',
  onChange = () => {},
  disabled = false,
}) => {
  const paymentMethods = [
    {
      id: 'cod',
      name: 'Thanh toan khi nhan hang (COD)',
      description: 'Thanh toan truc tiep bang tien mat khi nhan hang',
      icon: <FaMoneyBillWave className="text-2xl text-primary" />,
    },
    {
      id: 'banking',
      name: 'Chuyen khoan ngan hang',
      description: 'Chuyen khoan qua Internet/Mobile Banking',
      icon: <FaCreditCard className="text-2xl text-primary" />,
    },
    {
      id: 'ewallet',
      name: 'Vi dien tu',
      description: 'Thanh toan qua cac vi nhu MoMo, ZaloPay, VNPay',
      icon: <FaWallet className="text-2xl text-primary" />,
    },
  ];

  const handleSelect = (methodId) => {
    if (disabled || methodId === selectedMethod) return;
    onChange(methodId);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-alata text-2xl text-black mb-6">
        Phuong thuc thanh toan
      </h2>

      <div className="flex flex-col gap-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelect(method.id)}
              className={`flex items-start gap-4 p-4 border-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-primary bg-[#FFF5F5]'
                  : 'border-gray-300 hover:border-gray-400'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={disabled}
            >
              <div className="flex items-center justify-center w-5 h-5 mt-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary' : 'border-gray-400'
                  }`}
                >
                  {isSelected && (
                    <div className="w-3 h-3 rounded-full bg-primary" />
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
            </button>
          );
        })}
      </div>

      {selectedMethod === 'banking' && (
        <div className="mt-6 p-4 bg-[#DBEFE2] rounded-lg">
          <h3 className="font-nunito text-lg font-semibold text-black mb-3">
            Thong tin chuyen khoan mau
          </h3>
          <div className="flex flex-col gap-2 font-nunito text-base text-black">
            <p>
              <span className="font-semibold">Ngan hang:</span> Vietcombank
            </p>
            <p>
              <span className="font-semibold">So tai khoan:</span> 1234567890
            </p>
            <p>
              <span className="font-semibold">Chu tai khoan:</span> Hoa Lac
              Handicraft
            </p>
            <p>
              <span className="font-semibold">Noi dung:</span> [Ma don hang] +
              [So dien thoai]
            </p>
          </div>
        </div>
      )}

      {selectedMethod === 'ewallet' && (
        <div className="mt-6 p-4 bg-[#DBEFE2] rounded-lg">
          <h3 className="font-nunito text-lg font-semibold text-black mb-3">
            Lua chon vi dien tu
          </h3>
          <div className="flex gap-4">
            {['MoMo', 'ZaloPay', 'VNPay'].map((wallet) => (
              <button
                key={wallet}
                type="button"
                className="flex-1 py-3 border-2 border-primary rounded-lg font-nunito text-base font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                disabled
              >
                {wallet}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Tich hop thanh toan vi dien tu se duoc cap nhat sau.
          </p>
        </div>
      )}
    </div>
  );
};

PaymentMethod.propTypes = {
  selectedMethod: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default PaymentMethod;
