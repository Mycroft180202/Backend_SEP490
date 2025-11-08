import React from 'react';

const TrackingDetail = ({ trackingData }) => {
  // Danh sách các trạng thái theo thứ tự
  const statuses = [
    {
      key: 'payment_confirmed',
      label: 'Đã thanh toán',
      description: null
    },
    {
      key: 'preparing',
      label: 'Người gửi đang chuẩn bị hàng',
      description: null
    },
    {
      key: 'shipped_to_carrier',
      label: 'Đơn hàng đã được gửi cho đơn vị vận chuyển',
      description: null
    },
    {
      key: 'arrived_at_warehouse',
      label: 'Đơn hàng đã đến kho Hanoi SOC',
      description: null
    },
    {
      key: 'out_for_delivery',
      label: 'Đơn hàng đã được bàn giao cho đơn vị vận chuyển',
      description: null
    },
    {
      key: 'delivered',
      label: 'Người gửi đang chuẩn bị hàng',
      description: null
    }
  ];

  // Hàm kiểm tra trạng thái hiện tại
  const getStatusIndex = (currentStatus) => {
    const index = statuses.findIndex(s => s.key === currentStatus);
    return index !== -1 ? index : 0;
  };

  const currentStatusIndex = trackingData ? getStatusIndex(trackingData.status) : 0;

  // Dữ liệu mẫu nếu không có trackingData
  const defaultData = [
    {
      date: '15/10',
      time: '08:00',
      status: 'delivered',
      label: 'Đã thanh toán',
      isActive: false
    },
    {
      date: '15/10',
      time: '08:00',
      status: 'preparing',
      label: 'Người gửi đang chuẩn bị hàng',
      isActive: false
    },
    {
      date: '15/10',
      time: '08:00',
      status: 'shipped_to_carrier',
      label: 'Đơn hàng đã được gửi cho đơn vị vận chuyển',
      isActive: false
    },
    {
      date: '15/10',
      time: '08:00',
      status: 'arrived_at_warehouse',
      label: 'Đơn hàng đã đến kho Hanoi SOC',
      isActive: false
    },
    {
      date: '15/10',
      time: '08:00',
      status: 'out_for_delivery',
      label: 'Đơn hàng đã được bàn giao cho đơn vị vận chuyển',
      isActive: false
    },
    {
      date: 'Hôm nay',
      time: '08:00',
      status: 'current',
      label: 'Người gửi đang chuẩn bị hàng',
      isActive: true
    }
  ];

  const trackingItems = trackingData?.timeline || defaultData;
  // Đảo ngược mảng để hiển thị từ trên xuống (mới nhất ở trên)
  const reversedItems = [...trackingItems].reverse();

  return (
    <div className="flex flex-col gap-10 items-start px-[144px] py-6 w-full relative">
      <div className="w-[1152px] mx-auto">
        <h2 className="font-nunito text-2xl font-semibold mb-6 text-black">Chi tiết</h2>
        
        <div className="relative">
          {reversedItems.map((item, index) => (
            <div key={index} className="flex gap-4 relative">
              {/* Cột bên trái: Ngày và giờ */}
              <div className="w-20 text-left flex-shrink-0">
                <div className={`font-nunito text-sm ${item.isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {item.date}
                </div>
                <div className={`font-nunito text-sm ${item.isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {item.time}
                </div>
              </div>

              {/* Cột giữa: Timeline dot và line */}
              <div className="flex flex-col items-center relative flex-shrink-0">
                {/* Dot */}
                <div 
                  className={`w-4 h-4 rounded-full border-2 z-10 ${
                    item.isActive 
                      ? 'bg-green-500 border-green-500' 
                      : 'bg-gray-300 border-gray-300'
                  }`}
                />
                
                {/* Vertical line - vẽ từ center của dot hiện tại đến dot tiếp theo */}
                {index < reversedItems.length - 1 && (
                  <div 
                    className="absolute w-0.5 bg-gray-300"
                    style={{
                      top: '16px',
                      height: '48px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  />
                )}
              </div>

              {/* Cột bên phải: Label */}
              <div className={`flex-1 ${index < reversedItems.length - 1 ? 'pb-12' : ''}`}>
                <p className={`font-nunito text-base ${item.isActive ? 'text-[#46a762] font-medium' : 'text-gray-600'}`}>
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackingDetail;