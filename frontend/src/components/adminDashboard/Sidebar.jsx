import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, menuItems }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <aside
      className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-primary text-white shadow-lg transition-all duration-300 flex flex-col h-screen sticky top-0 z-30`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-red-400/50">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <img src="/images/OnlyLogo.png" alt="logo" className="w-10 h-10 rounded-full" />
            <span className="font-alata text-lg text-white">Admin Panel</span>
          </div>
        )}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white hover:bg-red-600/40 p-2 rounded-lg transition-colors"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === item.id 
                ? 'bg-red-600 text-white shadow-inner shadow-black/10' 
                : 'text-white/80 hover:bg-red-600/40'
            }`}
          >
            <item.icon className={`text-xl flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-white/80'}`} />
            {sidebarOpen && <span className="font-nunito">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-red-400/50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:bg-red-600/40 transition-colors"
        >
          <FaSignOutAlt className="text-xl flex-shrink-0" />
          {sidebarOpen && <span className="font-nunito">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
