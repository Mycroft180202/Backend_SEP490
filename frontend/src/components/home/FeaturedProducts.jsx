import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../shared/ProductCard';
import Pagination from '../shared/Pagination';
import { ProductService } from '../../services/modules/products/productService';

const PAGE_SIZE = 4;

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await ProductService.getAllProducts({ pageIndex: 1, pageSize: 50 });
        const items = res?.items || [];
        const sorted = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setProducts(sorted);
      } catch (err) {
        console.error('Load featured products error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const display = useMemo(
    () => products.slice((pageIndex - 1) * PAGE_SIZE, (pageIndex - 1) * PAGE_SIZE + PAGE_SIZE),
    [products, pageIndex],
  );

  return (
    <section className="w-full py-12 md:py-20 lg:py-[120px] px-4 md:px-10 lg:px-36 bg-background">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="font-alata text-2xl md:text-3xl lg:text-4xl text-primary leading-tight lg:leading-[56px] mb-6 md:mb-10">
          Sản phẩm nổi bật
        </h2>

        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, idx) => <ProductCard key={idx} loading />)
              : display.map((product) => (
                <ProductCard
                  key={product.id}
                  variant="grid"
                  productId={product.id}
                  image={product.imageUrl || '/images/default-product.png'}
                  title={product.name}
                  price={product.price}
                  rating={product.rating || 0}
                  shopName={product.displayName || product.shopName}
                  shortDescription={product.shortDescription}
                  onClick={() => window.location.assign(`/product-detail/${product.id}`)}
                />
              ))}
          </div>

          {products.length > PAGE_SIZE && (
            <div className="w-full flex justify-center">
              <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
