import React, { useState } from 'react';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import CheckoutBanner from '../components/checkOut/CheckoutBanner';
import AddressSelector from '../components/checkOut/AddressSelector';
import PaymentMethod from '../components/checkOut/PaymentMethod';
import ProductReview from '../components/checkOut/ProductReview';
import OrderSummary from '../components/checkOut/OrderSummary';

const CheckOut = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <CheckoutBanner />
      
      <main className="flex-grow">
        <div className="max-w-[1440px] mx-auto px-10 py-12">
          <div className="grid grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="col-span-2 flex flex-col gap-6">
              <ProductReview />
              <AddressSelector onAddressSelect={setSelectedAddress} />
              <PaymentMethod />
            </div>

            {/* Right Column - Order Summary */}
            <div className="col-span-1">
              <OrderSummary />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckOut;
