import React, { useState, useEffect } from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import WishListBanner from '../components/wishList/WishListBanner';
import WishListGrid from '../components/wishList/WishListGrid';

const WishList = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulated data - Replace with actual API call
  useEffect(() => {
    // Simulate API call
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await WishlistService.getWishlist();
        // setWishlistItems(response.items || []);
        
        // Mock data for demonstration (Added more items to show pagination)
        setTimeout(() => {
          const mockData = [
            {
              id: 1,
              name: 'Chuồn chuồn tre Thạch Xá',
              shortDescription: 'Sản phẩm thủ công truyền thống',
              price: 50000,
              rating: 4.5,
              imageUrl: '/images/products/product1.jpg',
            },
            {
              id: 2,
              name: 'Tô gốm Bát Tràng',
              shortDescription: 'Gốm sứ cao cấp làm thủ công',
              price: 120000,
              rating: 5.0,
              imageUrl: '/images/products/product2.jpg',
            },
            {
              id: 3,
              name: 'Tranh sơn mài Hà Nội',
              shortDescription: 'Tranh nghệ thuật truyền thống',
              price: 350000,
              rating: 4.8,
              imageUrl: '/images/products/product3.jpg',
            },
            {
              id: 4,
              name: 'Đèn lồng Hội An',
              shortDescription: 'Đèn trang trí độc đáo',
              price: 85000,
              rating: 4.3,
              imageUrl: '/images/products/product4.jpg',
            },
            {
              id: 5,
              name: 'Túi thổ cẩm Tây Bắc',
              shortDescription: 'Thổ cẩm thủ công dân tộc',
              price: 180000,
              rating: 4.7,
              imageUrl: '/images/products/product5.jpg',
            },
            {
              id: 6,
              name: 'Nón lá Huế',
              shortDescription: 'Nón lá truyền thống Việt Nam',
              price: 65000,
              rating: 4.4,
              imageUrl: '/images/products/product6.jpg',
            },
            {
              id: 7,
              name: 'Túi thổ cẩm Tây Bắc',
              shortDescription: 'Thổ cẩm thủ công dân tộc',
              price: 180000,
              rating: 4.7,
              imageUrl: '/images/products/product5.jpg',
            },
            {
              id: 8,
              name: 'Nón lá Huế',
              shortDescription: 'Nón lá truyền thống Việt Nam',
              price: 65000,
              rating: 4.4,
              imageUrl: '/images/products/product6.jpg',
            },
            {
              id: 9,
              name: 'Chuồn chuồn tre Thạch Xá',
              shortDescription: 'Sản phẩm thủ công truyền thống',
              price: 50000,
              rating: 4.5,
              imageUrl: '/images/products/product1.jpg',
            },
            {
              id: 10,
              name: 'Tô gốm Bát Tràng',
              shortDescription: 'Gốm sứ cao cấp làm thủ công',
              price: 120000,
              rating: 5.0,
              imageUrl: '/images/products/product2.jpg',
            },
            {
              id: 11,
              name: 'Tranh sơn mài Hà Nội',
              shortDescription: 'Tranh nghệ thuật truyền thống',
              price: 350000,
              rating: 4.8,
              imageUrl: '/images/products/product3.jpg',
            },
            {
              id: 12,
              name: 'Đèn lồng Hội An',
              shortDescription: 'Đèn trang trí độc đáo',
              price: 85000,
              rating: 4.3,
              imageUrl: '/images/products/product4.jpg',
            },
            {
              id: 13,
              name: 'Túi thổ cẩm Tây Bắc',
              shortDescription: 'Thổ cẩm thủ công dân tộc',
              price: 180000,
              rating: 4.7,
              imageUrl: '/images/products/product5.jpg',
            },
            {
              id: 14,
              name: 'Nón lá Huế',
              shortDescription: 'Nón lá truyền thống Việt Nam',
              price: 65000,
              rating: 4.4,
              imageUrl: '/images/products/product6.jpg',
            },
            {
              id: 15,
              name: 'Chuồn chuồn tre Thạch Xá',
              shortDescription: 'Sản phẩm thủ công truyền thống',
              price: 50000,
              rating: 4.5,
              imageUrl: '/images/products/product1.jpg',
            },
          ];
          setWishlistItems(mockData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = (productId) => {
    // TODO: Call API to remove from wishlist
    // await WishlistService.removeFromWishlist(productId);
    
    setWishlistItems(prevItems => 
      prevItems.filter(item => item.id !== productId)
    );
    
    // Show success notification
    console.log(`Đã xóa sản phẩm ${productId} khỏi danh sách yêu thích`);
  };

  const handleAddToCart = (product) => {
    // TODO: Call API to add to cart
    // await CartService.addToCart(product.id, 1);
    
    // Show success notification
    console.log(`Đã thêm ${product.name} vào giỏ hàng`);
    alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <WishListBanner itemCount={wishlistItems.length} />
      <main className="flex-grow">
        <WishListGrid 
          products={wishlistItems}
          loading={loading}
          onRemove={handleRemoveFromWishlist}
          onAddToCart={handleAddToCart}
        />
      </main>
      <Footer />
    </div>
  );
};

export default WishList;
