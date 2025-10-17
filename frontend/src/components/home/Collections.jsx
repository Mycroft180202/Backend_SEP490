import React, { useState, useEffect } from 'react';
import { ProductService } from '../../services/modules/products/productService';

const CollectionCard = ({ image, title }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[368px]">
      <img 
        src={image} 
        alt={title}
        className="w-full h-[400px] object-cover rounded-xl" 
      />
      <div className="relative w-full h-[68px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 368 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id={`path-mask-${title}`} fill="white">
            <path d="M356 0C356 6.62742 361.373 12 368 12V56C361.373 56 356 61.3726 356 68H12C12 61.3726 6.62742 56 0 56V12C6.62742 12 12 6.62742 12 0H356Z"/>
          </mask>
          <path d="M356 0H357V-1H356V0ZM368 12H369V11H368V12ZM368 56V57H369V56H368ZM356 68V69H357V68H356ZM12 68H11V69H12V68ZM0 56H-1V57H0V56ZM0 12V11H-1V12H0ZM12 0V-1H11V0H12ZM356 0H355C355 7.1797 360.82 13 368 13V12V11C361.925 11 357 6.07513 357 0H356ZM368 12H367V56H368H369V12H368ZM368 56V55C360.82 55 355 60.8203 355 68H356H357C357 61.9249 361.925 57 368 57V56ZM356 68V67H12V68V69H356V68ZM12 68H13C13 60.8203 7.1797 55 0 55V56V57C6.07513 57 11 61.9249 11 68H12ZM0 56H1V12H0H-1V56H0ZM0 12V13C7.1797 13 13 7.1797 13 0H12H11C11 6.07513 6.07513 11 0 11V12ZM12 0V1H356V0V-1H12V0Z" fill="#9E211F" mask={`url(#path-mask-${title})`}/>
        </svg>
        <button className="absolute left-3 right-3 top-3 bottom-3 bg-primary rounded-xl hover:bg-opacity-90 transition-all">
          <span className="font-nunito text-lg text-white">{title}</span>
        </button>
      </div>
    </div>
  );
};

const Pagination = () => {
  return (
    <div className="flex justify-center items-center gap-5">
      <button className="w-6 h-6">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.9998 19.9201L8.47984 13.4001C7.70984 12.6301 7.70984 11.3701 8.47984 10.6001L14.9998 4.08008" stroke="#A0A0A0" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="flex items-center gap-5">
        <span className="font-nunito text-lg text-black">1</span>
        <span className="font-nunito text-lg text-text-light">2</span>
        <span className="font-nunito text-lg text-text-light">3</span>
        <span className="font-nunito text-lg text-text-light">...</span>
        <span className="font-nunito text-lg text-text-light">10</span>
      </div>
      <button className="w-6 h-6">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.91016 19.9201L15.4302 13.4001C16.2002 12.6301 16.2002 11.3701 15.4302 10.6001L8.91016 4.08008" stroke="black" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

const Collections = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ProductService.getAllProducts({ pageIndex, pageSize });
        setProducts(response.items || []);
        setTotalPages(response.totalPages || 0);
        setTotalCount(response.totalCount || 0);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pageIndex, pageSize]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <section className="w-full py-12 md:py-20 lg:py-[106px] px-4 md:px-10 lg:px-36 bg-background">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="font-alata text-2xl md:text-3xl lg:text-4xl text-primary leading-tight lg:leading-[56px] mb-6 md:mb-10">
          Bộ sưu tập sản phẩm
        </h2>
        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {products.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 py-10">Không có sản phẩm nào.</div>
            ) : (
              products.map((product) => (
                <CollectionCard
                  key={product.id}
                  image={product.imageUrl || '/default-product-image.jpg'}
                  title={product.name}
                />
              ))
            )}
          </div>
          {/* Pagination: you can enhance this to use totalPages and setPageIndex */}
          <Pagination />
        </div>
      </div>
    </section>
  );
};

export default Collections;
