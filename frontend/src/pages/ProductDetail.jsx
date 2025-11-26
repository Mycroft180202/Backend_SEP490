import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import Breadcrumb from '../components/shared/Breadcrumb';
import ShortDescription from '../components/productDetail/ShortDescription';
import Detail from '../components/productDetail/Detail';
import RelationProduct from '../components/productDetail/RelationProduct';
import { ProductService } from '../services/modules/products/productService';
import { CategoryService } from '../services/modules/products/categoryService';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const breadcrumbItems = useMemo(() => ([
    { label: 'Trang chủ', href: '/' },
    { label: 'Cửa hàng', href: '/shop' },
    { label: product?.name || 'Chi tiết sản phẩm' },
  ]), [product]);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const response = await ProductService.getProductById(id);
        setProduct(response);
        
        // Fetch category name
        if (response.category) {
          try {
            const categories = await CategoryService.getAllCategories();
            const category = categories.find(cat => cat.id === response.category);
            if (category) {
              setCategoryName(category.name);
            }
          } catch (catError) {
            console.error('Error fetching category:', catError);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="relative bg-[#fff4e5] h-24">
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <Breadcrumb items={breadcrumbItems} floating />
          </div>
        </div>
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="relative bg-[#fff4e5] h-24">
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <Breadcrumb items={breadcrumbItems} floating />
          </div>
        </div>
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-xl mb-2">Lỗi: {error}</p>
            <p>Không thể tải thông tin sản phẩm</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="relative bg-[#fff4e5] h-24">
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <Breadcrumb items={breadcrumbItems} floating />
          </div>
        </div>
        <main className="flex-grow flex items-center justify-center">
          <p className="text-gray-600">Không tìm thấy sản phẩm</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Header />
      <div className="relative bg-[#fff4e5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-6">
          <Breadcrumb items={breadcrumbItems} floating />
        </div>
      </div>
      <main className="flex-grow">
        <ShortDescription product={product} />
        <Detail product={product} categoryName={categoryName} />
        <RelationProduct categoryId={product.category} currentProductId={product.id} />
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
