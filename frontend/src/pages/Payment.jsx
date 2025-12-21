import React from 'react';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import PaymentBanner from '../components/payment/PaymentBanner';
import PaymentStatus from '../components/payment/PaymentStatus';
import PaymentDetails from '../components/payment/PaymentDetails';
import PaymentActions from '../components/payment/PaymentActions';

const Payment = () => {
  // You can get status from URL params or state
  // const searchParams = new URLSearchParams(window.location.search);
  // const status = searchParams.get('status') || 'success';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <PaymentBanner />
      
      <main className="flex-grow">
        <div className="max-w-[1440px] mx-auto px-10 py-12">
          {/* Payment Status */}
          <div className="mb-8">
            <PaymentStatus status="success" />
          </div>

          {/* Payment Details and Actions */}
          <div className="grid grid-cols-3 gap-8">
            {/* Left Column - Payment Details */}
            <div className="col-span-2">
              <PaymentDetails />
            </div>

            {/* Right Column - Actions */}
            <div className="col-span-1">
              <PaymentActions />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
