import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { UserProvider, UserContext } from './context/UserContext';
import { LanguageProvider, LanguageContext } from './context/LanguageContext';
import { NavigationProvider } from './context/NavigationContext';
import HomePage from './pages/HomePage';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import AboutUs from './pages/AboutUs';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import ArtisanShop from './pages/ArtisanShop';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import OrderHistory from './pages/OrderHistory';
import OrderTracking from './pages/OrderTracking';
import CollectionDetail from './pages/CollectionDetail';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import Policy from './pages/Policy';
import CheckOut from './pages/CheckOut';
import OrderSuccess from './pages/OrderSuccess';
import PaymentResult from './pages/PaymentResult';
import ArtisanDashboard from './components/artisanDashboard/dashboard';
import StorytellingDetail from './pages/StorytellingDetail';
import RealtimeBootstrap from './services/realtime/RealtimeBootstrap';

const resolveRoleName = (role) => {
  if (typeof role === 'string') return role;
  return role?.name || role?.roleName || role?.value || '';
};

const hasRole = (roles, requiredRole) => {
  const target = typeof requiredRole === 'string' ? requiredRole.toLowerCase() : '';
  return roles.some((role) => resolveRoleName(role).toLowerCase() === target);
};

const RequireRole = ({ roles: allowedRoles = [], children }) => {
  const { userInfo } = useContext(UserContext);
  const roleList = Array.isArray(userInfo?.roles) ? userInfo.roles : [];
  const isAuthorized = allowedRoles.length === 0
    || allowedRoles.some((role) => hasRole(roleList, role));

  if (!isAuthorized) {
    return <NotFound />;
  }

  return children;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname, hash]);

  return null;
};

const DocumentTitleUpdater = () => {
  const { pathname } = useLocation();
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';
    const routeTitleMap = [
      { pattern: /^\/$/, key: 'pageTitles.home' },
      { pattern: /^\/about$/, key: 'pageTitles.about' },
      { pattern: /^\/shop$/, key: 'pageTitles.shop' },
      { pattern: /^\/blog$/, key: 'pageTitles.blog' },
      { pattern: /^\/blog\/.+$/, key: 'pageTitles.blogDetail' },
      { pattern: /^\/contact$/, key: 'pageTitles.contact' },
      { pattern: /^\/policy$/, key: 'pageTitles.policy' },
      { pattern: /^\/cart$/, key: 'pageTitles.cart' },
      { pattern: /^\/checkout$/, key: 'pageTitles.checkout' },
      { pattern: /^\/order-history$/, key: 'pageTitles.orderHistory' },
      { pattern: /^\/order-tracking$/, key: 'pageTitles.orderTracking' },
      { pattern: /^\/order-success$/, key: 'pageTitles.orderSuccess' },
      { pattern: /^\/payment-result$/, key: 'pageTitles.paymentResult' },
      { pattern: /^\/profile$/, key: 'pageTitles.profile' },
      { pattern: /^\/login$/, key: 'pageTitles.login' },
      { pattern: /^\/register$/, key: 'pageTitles.register' },
      { pattern: /^\/forgot-password$/, key: 'pageTitles.forgotPassword' },
      { pattern: /^\/product-detail\/[^/]+$/, key: 'pageTitles.productDetail' },
      { pattern: /^\/collections\/[^/]+$/, key: 'pageTitles.collectionDetail' },
      { pattern: /^\/artisan-shop$/, key: 'pageTitles.artisanShop' },
      { pattern: /^\/artisan-dashboard$/, key: 'pageTitles.artisanDashboard' },
      { pattern: /^\/admin$/, key: 'pageTitles.adminDashboard' },
      { pattern: /^\/storytelling\/[^/]+$/, key: 'pageTitles.storytellingDetail' },
    ];

    const brand = t('pageTitles.brand');
    const resolvedBrand = brand && brand !== 'pageTitles.brand' ? brand : 'HoaLac Handicraft';
    const match = routeTitleMap.find((route) => route.pattern.test(normalizedPath));
    const fallbackKey = normalizedPath === '/' ? 'pageTitles.home' : 'pageTitles.notFound';
    const targetKey = match ? match.key : fallbackKey;
    const pageTitle = t(targetKey);
    const resolvedPageTitle = pageTitle && pageTitle !== targetKey ? pageTitle : resolvedBrand;

    document.title = targetKey === 'pageTitles.brand' || resolvedPageTitle === resolvedBrand
      ? resolvedBrand
      : `${resolvedPageTitle} | ${resolvedBrand}`;
  }, [pathname, t]);

  return null;
};

const AdminAccessEnforcer = () => {
  const { userInfo } = useContext(UserContext);
  const location = useLocation();

  const roleList = Array.isArray(userInfo?.roles) ? userInfo.roles : [];
  const isAdmin = hasRole(roleList, 'Admin');

  if (!isAdmin) return null;
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath !== '/admin') {
    return <Navigate to="/admin" replace />;
  }

  return null;
};
function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <NavigationProvider>
          <Router>
            <>
              <RealtimeBootstrap />
              <ScrollToTop />
              <DocumentTitleUpdater />
              <AdminAccessEnforcer />
              <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<Register />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product-detail/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<CheckOut />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/order-history" element={<OrderHistory />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
              <Route path="/artisan-shop" element={<ArtisanShop />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/storytelling/:storyId" element={<StorytellingDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/policy" element={<Policy />} />
              <Route
                path="/admin"
                element={(
                  <RequireRole roles={["Admin"]}>
                    <AdminDashboard />
                  </RequireRole>
                )}
              />
              <Route path="/collections/:id" element={<CollectionDetail />} />
              <Route
                path="/artisan-dashboard"
                element={(
                  <RequireRole roles={["Artisan"]}>
                    <ArtisanDashboard />
                  </RequireRole>
                )}
              />
              <Route path="*" element={<NotFound />} />
              </Routes>
              <ToastContainer position="top-right" autoClose={3000} />
            </>
          </Router>
        </NavigationProvider>
      </LanguageProvider>
    </UserProvider>
  );
}

export default App;
