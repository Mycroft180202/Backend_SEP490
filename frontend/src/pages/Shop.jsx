import React, { useState, useEffect } from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import ShopBanner from '../components/shop/ShopBanner';
import Pagination from '../components/shared/Pagination';
import ProductCard from '../components/shared/ProductCard';
import ShopFilter from '../components/shop/ShopFilter';
import { ProductService } from '../services/modules/products/productService';

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState('Chuồn chuồn tre Thạch Xá');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndexRaw] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);

  const setPageIndex = (idx) => {
    setLoading(true);
    setPageIndexRaw(idx);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ProductService.getAllProducts({
          pageIndex,
          pageSize,
          categoryId: selectedCategory, // Pass the selected category as a parameter
        });
        setProducts(response.items || []);
        setTotalPages(
          response.totalPages && response.totalPages > 0
            ? response.totalPages
            : Math.ceil((response.totalCount || 0) / pageSize)
        );
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pageIndex, pageSize, selectedCategory]); // Add selectedCategory as a dependency

  if (error) return <div>Error: {error}</div>;

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
          {loading ? (
            Array.from({ length: 12 }).map((_, idx) => (
              <ProductCard key={idx} loading={true} />
            ))
          ) : products.length === 0 ? (
            <div className="col-span-4 text-center text-gray-500 py-10">Không có sản phẩm nào.</div>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                image={product.imageUrl || '/default-product-image.jpg'}
                title={product.name}
                shortDescription={product.shortDescription}
                price={product.price}
                rating={product.rating || 0}
                loading={false}
              />
            ))
          )}
        </section>

        <div className="flex justify-center mt-8">
          <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
