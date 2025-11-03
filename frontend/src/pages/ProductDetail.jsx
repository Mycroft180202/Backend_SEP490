import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import ShortDescription from '../components/productDetail/ShortDescription';
import Detail from '../components/productDetail/Detail';
import RelationProduct from '../components/productDetail/RelationProduct';



const ProductDetail = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Header />
      <main className="flex-grow">
        <ShortDescription /> 
        <Detail />
        <RelationProduct />
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
