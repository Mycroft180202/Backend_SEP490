import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { FaBell, FaShoppingCart, FaSearch } from 'react-icons/fa';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationService } from '../../services/modules/notification/notificationService';
import { NotificationHub } from '../../services/modules/notification/notificationHub';

const Header = () => {
  const { userInfo } = useContext(UserContext);
  const { language, changeLanguage, t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userInfo) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userInfo]);

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
  };

  const fetchNotifications = useCallback(async () => {
    if (!userInfo) return;
    try {
      setNotifLoading(true);
      const response = await NotificationService.getList({ pageIndex: 1, pageSize: 10 });
      const items = response?.items || response?.Items || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setNotifLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (isNotificationVisible) {
      fetchNotifications();
    }
  }, [isNotificationVisible, fetchNotifications]);

  // Fetch once on login to keep badge updated without clicking the bell
  useEffect(() => {
    if (userInfo) {
      fetchNotifications();
    }
  }, [userInfo, fetchNotifications]);

  useEffect(() => {
    let cleanup = () => {};
    let isMounted = true;

    const setupHub = async () => {
      if (!userInfo) {
        await NotificationHub.stop();
        return;
      }

      try {
        const connection = await NotificationHub.ensureConnected();
        if (!isMounted) return;

        const handleReceive = (payload) => {
          setNotifications((prev) => [payload, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + (payload?.isRead ? 0 : 1));
        };
        const handleReconnected = () => fetchNotifications();

        connection.on('ReceiveNotification', handleReceive);
        connection.onreconnected(handleReconnected);

        if (connection.state === 'Connected') {
          fetchNotifications();
        }

        cleanup = () => {
          connection.off('ReceiveNotification', handleReceive);
          connection.onreconnected(null);
        };
      } catch (err) {
        console.error('Notification hub init error:', err);
      }
    };

    setupHub();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [userInfo, fetchNotifications]);

  // Polling dự phòng để badge luôn cập nhật (3-5s)
  useEffect(() => {
    if (!userInfo) return undefined;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [userInfo, fetchNotifications]);

  const markAsRead = async (id) => {
    if (!id) return;
    try {
      await NotificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await NotificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  const removeNotification = async (id) => {
    if (!id) return;
    try {
      await NotificationService.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const roleList = userInfo?.roles || [];
  const isAdmin = roleList.some((r) => (typeof r === 'string' ? r : r?.name) === 'Admin');
  const isArtisan = roleList.some((r) => (typeof r === 'string' ? r : r?.name) === 'Artisan');

  return (
    <header
      className="relative flex items-center justify-between px-[40px] py-[12px] w-full min-h-[68px] z-50"
      style={{ background: 'rgba(122, 9, 9, 0.85)', backdropFilter: 'blur(30px)' }}
    >
      <div className="flex items-center gap-2 relative z-10">
        <img src="/images/OnlyLogo.png" alt="logo" className="w-[44px] h-[44px] rounded-full object-cover" />
        <span style={{ fontFamily: 'Alata, sans-serif', fontSize: 20, lineHeight: '32px', color: '#fff', fontWeight: 400 }}>
          Hoa Lac Handicraft
        </span>
      </div>
      <nav className="flex items-center gap-[24px] relative z-10">
        <Link to="/" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>{t('nav.home')}</Link>
        <Link to="/about" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>{t('nav.about')}</Link>
        <Link to="/shop" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>{t('nav.shop')}</Link>
        <Link to="/blog" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>{t('nav.blog')}</Link>
        <Link to="/contact" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>{t('nav.contact')}</Link>
        <Link to="/policy" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, lineHeight: '32px', color: '#fff' }}>{t('nav.policy')}</Link>

      </nav>
      <div className="flex items-center gap-[16px] relative z-10">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        {userInfo ? (
          <div className="relative flex items-center gap-[16px]">
            <div
              className="relative"
              onMouseEnter={() => setDropdownVisible(true)}
              onMouseLeave={() => setDropdownVisible(false)}
            >
              <img
                src={userInfo.userUrlImage || '/images/default-avatar.png'}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
              />
              {isDropdownVisible && (
                <div
                  className="absolute w-56 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
                  style={{ 
                    zIndex: 1000, 
                    top: 'calc(100% + 8px)', 
                    left: '-300%',
                    paddingTop: '8px',
                    marginTop: '-8px'
                  }}
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('header.profile')}
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('header.orders')}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Admin dashboard
                    </Link>
                  )}
                  {isArtisan && (
                    <Link
                      to="/artisan-dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Shop management
                    </Link>
                  )}
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      localStorage.removeItem('accessToken');
                      window.location.href = '/';
                    }}
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link to="/login" className="px-6 py-[6px] border border-white rounded-[12px] flex items-center" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, fontWeight: 500, lineHeight: '32px', color: '#fff' }}>
            {t('header.login')}
          </Link>
        )}
        <FaShoppingCart
          className="text-white text-xl cursor-pointer"
          title={t('header.cartTooltip')}
          onClick={() => navigate('/cart')}
        />
        <div className="relative">
          <FaBell
            className="text-white text-xl cursor-pointer"
            title="Thông báo"
            onClick={() => setNotificationVisible(!isNotificationVisible)}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1 leading-none">
              {unreadCount}
            </span>
          )}
          {isNotificationVisible && (
            <div
              className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
              style={{ zIndex: 1000 }}
            >
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="text-sm font-semibold text-gray-800">Thông báo</span>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline disabled:text-gray-400"
                  onClick={markAllRead}
                  disabled={notifications.length === 0}
                >
                  Đánh dấu đã đọc hết
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifLoading ? (
                  <div className="p-4 text-sm text-gray-500">Đang tải...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-700">{t('header.notificationsEmpty')}</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 ${item.isRead ? 'bg-white' : 'bg-red-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{item.message || item.content || 'Thông báo mới'}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(item.createAt)}</p>
                        </div>
                        {!item.isRead && (
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-1" />
                        )}
                      </div>
                      <div className="flex gap-3 text-xs mt-2">
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsRead(item.id)}
                            className="text-blue-600 hover:underline"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNotification(item.id)}
                          className="text-red-600 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => changeLanguage('vi')}
          className={`w-[36px] h-[24px] rounded-full bg-white overflow-hidden flex items-center justify-center transition ${language === 'vi' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#7a0909]' : ''}`}
          aria-pressed={language === 'vi'}
        >
          <img src="/images/VNFlag.png" alt="flag" className="w-full h-full object-cover" />
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          className={`w-[36px] h-[24px] rounded-full bg-white overflow-hidden flex items-center justify-center transition ${language === 'en' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#7a0909]' : ''}`}
          aria-pressed={language === 'en'}
        >
          <img src="/images/Engflag.png" alt="Eflag" className="w-full h-full object-cover" />
        </button>
      </div>
    </header>
  );
};

export default Header;
