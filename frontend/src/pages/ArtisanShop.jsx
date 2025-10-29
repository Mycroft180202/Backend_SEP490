import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import Banner from '../components/artisanShop/Banner';
import Pagination from '../components/shop/Pagination';
import ProductCard from '../components/shop/ProductCard';
import FilterSection from '../components/artisanShop/FilterSection';

const ArtisanShop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Banner />
      <FilterSection />
      <main className="max-w-screen-xl mx-auto px-8 py-12">
             
              <section className="grid grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCard key={i} />
                ))}
              </section>
      
              <div className="flex justify-center mt-8">
                <Pagination />
              </div>
            </main>
      <Footer />
    </div>
  );
};

export default ArtisanShop;
