import React from 'react';
import ProductCard from '../components/shop/ProductCard';
import Pagination from '../components/shop/Pagination';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';

export default function Shop() {
  return (
    <div className="bg-[#fdfeee] min-h-screen">
      <Header />
      <main className="max-w-screen-xl mx-auto px-8 py-12">
        <section className="mb-8">
          <h2 className="font-Alata text-3xl text-[#9e211f]">Chuồn chuồn tre Thạch Xá</h2>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-3">
              <div className="bg-[#faf998] p-4 rounded-lg">Chuồn chuồn tre Thạch Xá</div>
              <div className="bg-[#e0e0e0] p-4 rounded-lg">Quạt Chàng Sơn</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="border p-2 rounded-md">Tìm kiếm</div>
              <div className="p-2">Bộ lọc</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCard key={i} />
          ))}
        </section>

        <div className="flex justify-center mt-8">
          <Pagination />
        </div>
      </main>

    <Footer/>
    </div>
  );
}
