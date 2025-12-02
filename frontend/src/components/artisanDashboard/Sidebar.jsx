import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaProductHunt,
  FaClipboardList,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaArrowLeft,
} from 'react-icons/fa';

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, menuItems }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#7A0909] text-white transition-all duration-300 flex flex-col`}>
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-red-800">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <img src="/images/OnlyLogo.png" alt="logo" className="w-10 h-10 rounded-full" />
            <span className="font-alata text-lg">Quản lý Shop</span>
          </div>
        )}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white hover:bg-red-800 p-2 rounded-lg transition-colors"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-200 hover:bg-red-800/50"
        >
          <FaArrowLeft className="text-xl flex-shrink-0" />
          {sidebarOpen && <span className="font-nunito">Về trang chủ</span>}
        </button>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === item.id 
                ? 'bg-red-800 text-white' 
                : 'text-gray-200 hover:bg-red-800/50'
            }`}
          >
            <item.icon className="text-xl flex-shrink-0" />
            {sidebarOpen && <span className="font-nunito">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-red-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-200 hover:bg-red-800 transition-colors"
        >
          <FaSignOutAlt className="text-xl flex-shrink-0" />
          {sidebarOpen && <span className="font-nunito">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
