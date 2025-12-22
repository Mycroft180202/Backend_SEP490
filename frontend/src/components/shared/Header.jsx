import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { FaBell, FaShoppingCart } from 'react-icons/fa';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationService } from '../../services/modules/notification/notificationService';
import { NotificationHub } from '../../services/modules/notification/notificationHub';
import { CartService } from '../../services/modules/cart/cartService';
import { NavigationKeys, useNavigationContext } from '../../context/NavigationContext';

const appendCacheBuster = (url, buster) => {
  if (!url) return url;
  if (!buster) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(String(buster))}`;
};

const Header = () => {
  const { userInfo } = useContext(UserContext);
  const { language, changeLanguage, t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const { setContextValue } = useNavigationContext();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const notificationHoverRef = useRef(false);
  const isMountedRef = useRef(true);
  const avatarBust = typeof window !== 'undefined' ? localStorage.getItem('avatarBust') : null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const computeCartCount = useCallback((cartResponse) => {
    if (!cartResponse) return 0;
    const { raw, items } = cartResponse;
    const totalFromRaw = raw?.totalItems
      ?? raw?.totalCount
      ?? raw?.cartItems?.totalItems
      ?? raw?.cartItems?.totalCount
      ?? raw?.cartItems?.total
      ?? raw?.total;
    if (typeof totalFromRaw === 'number' && Number.isFinite(totalFromRaw)) {
      return totalFromRaw;
    }
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  }, []);

  const fetchCartCount = useCallback(async () => {
    if (!userInfo) {
      if (isMountedRef.current) setCartCount(0);
      return;
    }
    const roleSnapshot = Array.isArray(userInfo?.roles) ? userInfo.roles : [];
    const isAdminUser = roleSnapshot.some((role) => (typeof role === 'string' ? role : role?.name) === 'Admin');
    if (isAdminUser) {
      if (isMountedRef.current) setCartCount(0);
      return;
    }
    try {
      const cart = await CartService.getCart(1, 50);
      const totalItems = computeCartCount(cart);
      if (isMountedRef.current) setCartCount(totalItems);
    } catch (error) {
      console.error('Load cart count error:', error);
      if (isMountedRef.current) setCartCount(0);
    }
  }, [userInfo, computeCartCount]);

  useEffect(() => {
    if (!userInfo) {
      setNotifications([]);
      setUnreadCount(0);
      setCartCount(0);
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

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    const handleCartUpdated = () => {
      fetchCartCount();
    };
    window.addEventListener('cart:updated', handleCartUpdated);
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdated);
    };
  }, [fetchCartCount]);

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

  const location = useLocation();

  const resolveLabel = useCallback((key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  }, [t]);

  const navItems = useMemo(() => {
    const baseItems = [
      { path: '/', label: resolveLabel('nav.home', 'Trang chủ') },
      { path: '/about', label: resolveLabel('nav.about', 'Giới thiệu') },
      { path: '/shop', label: resolveLabel('nav.shop', 'Cửa hàng') },
      { path: '/blog', label: resolveLabel('nav.blog', 'Blog') },
      { path: '/contact', label: resolveLabel('nav.contact', 'Liên hệ') },
      { path: '/policy', label: resolveLabel('nav.policy', 'Chính sách') },
    ];
    if (isAdmin) {
      return [{ path: '/admin', label: 'Admin' }, ...baseItems];
    }
    return baseItems;
  }, [isAdmin, resolveLabel]);

  const profileEntryNode = useMemo(() => {
    if (location.pathname === '/profile') {
      return null;
    }
    if (location.pathname.startsWith('/checkout')) {
      return {
        label: resolveLabel('checkout.title', 'Thanh toán'),
        href: '/checkout',
      };
    }
    if (location.pathname.startsWith('/cart')) {
      return {
        label: resolveLabel('cart.title', 'Giỏ hàng'),
        href: '/cart',
      };
    }
    if (location.pathname.startsWith('/order-history')) {
      return {
        label: resolveLabel('header.orders', 'Lịch sử đơn hàng'),
        href: '/order-history',
      };
    }
    const matchedNav = navItems.find((item) => (
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)
    ));
    if (matchedNav) {
      return matchedNav;
    }
    return {
      label: resolveLabel('nav.home', 'Trang chủ'),
      href: '/',
    };
  }, [location.pathname, navItems, resolveLabel]);

  useEffect(() => {
    if (!profileEntryNode) {
      return;
    }
    setContextValue(NavigationKeys.LAST_PROFILE_ENTRY, profileEntryNode);
  }, [profileEntryNode, setContextValue]);

  return (
    <header
      className="relative flex items-center justify-between px-4 sm:px-6 lg:px-[40px] py-3 sm:py-[12px] w-full min-h-[60px] sm:min-h-[68px] z-50"
      style={{ background: 'rgba(122, 9, 9, 0.85)', backdropFilter: 'blur(30px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1 sm:gap-2 relative z-10 flex-shrink-0">
        <img src="/images/OnlyLogo.png" alt="logo" className="w-10 h-10 sm:w-[44px] sm:h-[44px] rounded-full object-cover" />
        <span style={{ fontFamily: 'Alata, sans-serif', fontSize: 'clamp(14px, 4vw, 20px)', lineHeight: '32px', color: '#fff', fontWeight: 400 }} className="hidden sm:inline">
          HoaLac Handicraft
        </span>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-6 relative z-10">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, lineHeight: '32px', color: '#fff' }}
              className={`group relative px-1 py-1 text-sm font-semibold transition-colors duration-200 ${
                isActive ? 'text-yellow-200' : 'text-white hover:text-yellow-200'
              }`}
            >
              <span className={`relative z-10 transition-all duration-300 ${
                isActive ? 'tracking-[0.12em]' : 'group-hover:tracking-[0.12em]'
              }`}
              >
                {item.label}
              </span>
              <span
                className={`absolute left-0 right-0 -bottom-1 h-0.5 bg-yellow-200 origin-center transition-transform duration-300 ${
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Right Icons Section */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 relative z-10">
        <button
          type="button"
          aria-label="Toggle navigation"
          className="flex flex-col justify-center items-center gap-[5px] lg:hidden w-9 h-9 rounded-full border border-white/40 text-white"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span className={`block w-5 h-[2px] rounded-full transition ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px] bg-yellow-200' : 'bg-white'}`} />
          <span className={`block w-5 h-[2px] rounded-full transition ${isMobileMenuOpen ? 'opacity-0' : 'bg-white'}`} />
          <span className={`block w-5 h-[2px] rounded-full transition ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px] bg-yellow-200' : 'bg-white'}`} />
        </button>

        {userInfo ? (
          <div className="relative flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div
              className="relative"
              onMouseEnter={() => setDropdownVisible(true)}
              onMouseLeave={() => setDropdownVisible(false)}
            >
              <img
                src={appendCacheBuster(userInfo.userUrlImage || '/images/default-avatar.png', avatarBust)}
                alt="User Avatar"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover cursor-pointer"
              />
              {isDropdownVisible && (
                <div
                  className="absolute w-48 sm:w-56 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
                  style={{ 
                    zIndex: 1000, 
                    top: 'calc(100% + 8px)', 
                    left: 'auto',
                    right: '0',
                    paddingTop: '8px',
                    marginTop: '-8px'
                  }}
                >
                  {!isAdmin && (
                    <Link
                      to="/profile"
                      state={profileEntryNode ? { fromProfileOrigin: profileEntryNode } : undefined}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('header.profile')}
                    </Link>
                  )}
                  {!isAdmin && (
                    <Link
                      to="/order-history"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('header.orders')}
                    </Link>
                  )}
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
                      to="/artisan-shop"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('header.myShop')}
                    </Link>
                  )}
                  {isArtisan && (
                    <Link
                      to="/artisan-dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('header.artisanDashboard')}
                    </Link>
                  )}
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      localStorage.removeItem('accessToken');
                      window.location.href = '/login';
                    }}
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link to="/login" className="px-3 sm:px-6 py-1.5 sm:py-[6px] border border-white rounded-lg sm:rounded-[12px] flex items-center text-xs sm:text-sm lg:text-base" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 500, lineHeight: '32px', color: '#fff' }}>
            {t('header.login')}
          </Link>
        )}

        {/* Cart Icon */}
        {!isAdmin && (
          <div className="relative">
            <FaShoppingCart
              className="text-white text-lg sm:text-xl cursor-pointer hover:text-yellow-200 transition"
              title={t('header.cartTooltip')}
              onClick={() => navigate('/cart')}
            />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-semibold rounded-full px-[3px] min-w-[16px] h-[16px] flex items-center justify-center leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
        )}

        {/* Notifications */}
        <div
          className="relative"
          onMouseEnter={() => {
            notificationHoverRef.current = true;
            setNotificationVisible(true);
          }}
          onMouseLeave={() => {
            notificationHoverRef.current = false;
            setNotificationVisible(false);
          }}
        >
          <FaBell
            className="text-white text-lg sm:text-xl cursor-pointer hover:text-yellow-200 transition"
            title="Thông báo"
            onClick={() => {
              if (!notificationHoverRef.current) {
                setNotificationVisible((prev) => !prev);
              }
            }}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1 leading-none">
              {unreadCount}
            </span>
          )}
          {isNotificationVisible && (
            <div
              className="absolute w-72 sm:w-80 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
              style={{
                zIndex: 1000,
                right: 0,
                top: 'calc(100% + 8px)',
                paddingTop: '8px',
                marginTop: '-8px',
              }}
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
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" />
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

        {/* Language Switchers */}
        <button
          type="button"
          onClick={() => changeLanguage('vi')}
          className={`w-6 h-4 sm:w-[36px] sm:h-[24px] rounded-full bg-white overflow-hidden flex items-center justify-center transition flex-shrink-0 ${language === 'vi' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#7a0909]' : ''}`}
          aria-pressed={language === 'vi'}
          title="Tiếng Việt"
        >
          <img src="/images/VNFlag.png" alt="flag" className="w-full h-full object-cover" />
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          className={`w-6 h-4 sm:w-[36px] sm:h-[24px] rounded-full bg-white overflow-hidden flex items-center justify-center transition flex-shrink-0 ${language === 'en' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#7a0909]' : ''}`}
          aria-pressed={language === 'en'}
          title="English"
        >
          <img src="/images/Engflag.png" alt="Eflag" className="w-full h-full object-cover" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[rgba(122,9,9,0.98)] backdrop-blur-xl border-t border-white/10">
          <nav className="flex flex-col px-6 py-6 gap-3">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-nunito py-2 border-b border-white/10 last:border-b-0 transition ${
                    isActive ? 'text-yellow-200' : 'text-white hover:text-yellow-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="self-end text-sm text-white/80 hover:text-yellow-200"
            >
              Đóng
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
