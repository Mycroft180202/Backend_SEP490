import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import HomePage from './pages/HomePage';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import AboutUs from './pages/AboutUs';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';
import ArtisanShop from './pages/ArtisanShop';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import OrderHistory from './pages/OrderHistory';
import OrderTracking from './pages/OrderTracking';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
function App() {
  return (
    <UserProvider>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product-detail" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/order-tracking" element={<OrderTracking />} />
        <Route path="/artisan-shop" element={<ArtisanShop />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog-detail" element={<BlogDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </UserProvider>
  );
}

export default App;
