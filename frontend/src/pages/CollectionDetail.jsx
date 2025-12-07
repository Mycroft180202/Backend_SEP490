import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import ProductCard from '../components/shared/ProductCard';
import { ProductCollectionService } from '../services/modules/collections/productCollectionService';
import { ProductService } from '../services/modules/products/productService';
import Breadcrumb from '../components/shared/Breadcrumb';
import { NavigationKeys } from '../context/NavigationContext';
import useNavigationNode from '../hooks/useNavigationNode';
import useResolvedNavigationNode from '../hooks/useResolvedNavigationNode';

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const productListNode = useResolvedNavigationNode({
    locationKey: 'fromProductList',
    contextKey: NavigationKeys.LAST_PRODUCT_LIST,
  });
  const collectionNode = useMemo(() => (
    collection?.id
      ? {
        label: collection.title || 'Bộ sưu tập',
        href: `/collections/${collection.id}`,
      }
      : null
  ), [collection?.id, collection?.title]);

  useNavigationNode(NavigationKeys.LAST_COLLECTION, collectionNode);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await ProductCollectionService.getById(id);
        setCollection(res);
        let productList = res?.products || res?.Products || [];
        const productIds = res?.productIds || res?.ProductIds || [];
        if (!productList.length && productIds.length) {
          productList = await Promise.all(
            productIds.map(async (pid) => {
              try {
                return await ProductService.getProductById(pid);
              } catch (err) {
                return null;
              }
            }),
          );
          productList = productList.filter(Boolean);
        }
        setProducts(productList || []);
      } catch (err) {
        console.error('Load collection error:', err);
        setError(err?.response?.data?.message || err?.message || 'Không thể tải bộ sưu tập');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const heroBg = collection?.image || '/images/default-product.png';
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Trang chủ', href: '/' }, { label: 'Bộ sưu tập' }];
    if (collectionNode?.label && collectionNode?.href) {
      items.push({
        label: collectionNode.label,
        href: collectionNode.href,
        state: { fromCollection: collectionNode },
      });
    } else if (collection?.title) {
      items.push({ label: collection.title });
    }
    return items;
  }, [collection?.title, collectionNode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E7] to-white flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-[#fff4e5]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb items={breadcrumbItems} floating />
          </div>
        </div>
        <section className="relative h-72 md:h-96 overflow-hidden">
          <img src={heroBg} alt={collection?.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
          <div className="relative max-w-6xl mx-auto h-full flex flex-col justify-center px-6 text-white">
            <p className="text-sm uppercase tracking-widest">Bộ sưu tập</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{collection?.title || 'Collection'}</h1>
            {collection?.headline && <p className="text-lg text-white/90 max-w-3xl">{collection.headline}</p>}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {collection?.content && (
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-[#D4A574]/40">
              <h3 className="text-xl font-bold text-[#8B4513] mb-3">Giới thiệu</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{collection.content}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-600">Đang tải sản phẩm...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-600">Chưa có sản phẩm trong bộ sưu tập này.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id || p.productId} className="relative">
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-[#8B4513] text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                      Trong bộ sưu tập
                    </span>
                  </div>
                  <ProductCard
                    productId={p.id || p.productId}
                    image={p.imageUrl || p.thumbnail || '/images/default-product.png'}
                    title={p.name || p.title}
                    shortDescription={p.shortDescription}
                    price={p.price}
                    rating={p.rating || 0}
                    stock={p.stock}
                    onClick={() => navigate(`/product-detail/${p.id || p.productId}`, {
                      state: {
                        fromCollection: collectionNode,
                        fromProductList: productListNode,
                      },
                    })}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CollectionDetail;
