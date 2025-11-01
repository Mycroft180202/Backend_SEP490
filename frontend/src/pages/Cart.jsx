import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import CartBanner from '../components/cart/CartBanner';
import ProductList from '../components/cart/ProductList';

const Cart = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <CartBanner />
      <main className="flex-grow">
        <ProductList />
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
