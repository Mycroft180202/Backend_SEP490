import React, { useState } from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import ShopBanner from '../components/shop/ShopBanner';
import { ProductCard, Pagination } from '../components/shop/ShopComponents';
import ShopFilter from '../components/shop/ShopFilter';

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState('Chuồn chuồn tre Thạch Xá');

  return (
    <div className="bg-[#fdfeee] min-h-screen">
      <Header />
      <ShopBanner onSelect={(label) => setSelectedCategory(label)} />

      <main className="max-w-screen-xl mx-auto px-8 py-12">
        <ShopFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

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
}
