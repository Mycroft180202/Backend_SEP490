import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import HomePage from './pages/HomePage';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import AboutUs from './pages/AboutUs';
import Shop from './pages/Shop';
import Login from './pages/Login';
import './App.css';
import ArtisanShop from './pages/ArtisanShop';
import Cart from './pages/Cart';

function App() {
  return (
    <UserProvider>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/artisanShop" element={<ArtisanShop />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </UserProvider>
  );
}

export default App;
