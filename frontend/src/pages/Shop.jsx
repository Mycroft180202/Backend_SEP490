import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import ShopBanner from '../components/shop/ShopBanner';
import Pagination from '../components/shared/Pagination';
import ProductCard from '../components/shared/ProductCard';
import ShopFilter from '../components/shop/ShopFilter';
import { ProductService } from '../services/modules/products/productService';

export default function Shop() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndexRaw] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Query thực sự được gửi đi
  const [sortOption, setSortOption] = useState('');

  const setPageIndex = (idx) => {
    setLoading(true);
    setPageIndexRaw(idx);
  };

  // Hàm xử lý khi nhấn Enter
  const handleSearchSubmit = () => {
    setSearchQuery(searchValue);
    setPageIndexRaw(1); // Reset về trang 1 khi search
  };

  useEffect(() => {
    setLoading(true); 
    setProducts([]);  
    const fetchProducts = async () => {
      try {
        const params = {
          pageIndex,
          pageSize,
        };
        if (selectedCategory) {
          params.categoryId = selectedCategory;
        }
        if (searchQuery) {
          params.productName = searchQuery; // Search theo productName (OpenAI embedding)
        }
        if (sortOption) {
          // Map frontend sort values to backend format
          const sortMap = {
            'lowToHigh': 'lowToHigh',
            'highToLow': 'highToLow',
            'aToZ': 'aToZ',
            'zToA': 'zToA',
          };
          params.sortOrder = sortMap[sortOption] || '';
        }
        const response = await ProductService.getAllProducts(params);
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
  }, [pageIndex, pageSize, selectedCategory, searchQuery, sortOption]);

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-gradient-to-b from-[#FFFBF0] to-[#FFF8E7] min-h-screen">
      <Header />
      <ShopBanner onSelect={(label) => setSelectedCategory(label)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ShopFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={handleSearchSubmit}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {loading ? (
            Array.from({ length: 12 }).map((_, idx) => (
              <ProductCard key={idx} loading={true} />
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🏺</div>
              <p className="text-xl font-['Nunito'] text-gray-500">Không có sản phẩm nào.</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} onClick={() => navigate(`/product-detail/${product.id}`)} className="cursor-pointer">
                <ProductCard
                  image={product.imageUrl || '/images/default-product.png'}
                  title={product.name}
                  shortDescription={product.shortDescription}
                  price={product.price}
                  rating={product.rating || 0}
                  loading={false}
                />
              </div>
            ))
          )}
        </section>

        <div className="flex justify-center mt-12">
          <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
