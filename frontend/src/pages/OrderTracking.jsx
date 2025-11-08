
import React, { useState } from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import TrackingBar from '../components/orderTracking/TrackingBar';
import ProductList from '../components/orderTracking/ProductList';
import TrackingDetail from '../components/orderTracking/TrackingDetail';


const OrderTracking = () => {
  return (
     <div className="min-h-screen bg-background flex flex-col relative">
      <Header />
      <main className="flex-grow">
        {/* Breadcrumbs can be added here in the future */}
        <TrackingBar />
        <ProductList />
        <TrackingDetail />
      </main>
      <Footer />
    </div>
  );
};

export default OrderTracking;
