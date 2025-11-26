import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';

const translations = {
  vi: {
    nav: {
      home: 'Trang chủ',
      about: 'Về chúng tôi',
      shop: 'Cửa hàng',
      blog: 'Bài viết',
      contact: 'Liên hệ',
      policy: 'Chính sách',
    },
    header: {
      searchPlaceholder: 'Tìm kiếm...',
      login: 'Đăng nhập',
      profile: 'Tài khoản của tôi',
      orders: 'Đơn hàng',
      logout: 'Đăng xuất',
      notificationsEmpty: 'Không có thông báo mới.',
      cartTooltip: 'Giỏ hàng',
    },
    home: {
      collections: {
        title: 'Bộ sưu tập sản phẩm',
        description: 'Khám phá những sản phẩm thủ công mang đậm nét truyền thống Việt Nam',
        empty: 'Không có sản phẩm nào.',
      },
    },
    shop: {
      loading: 'Đang tải sản phẩm...',
      empty: 'Không có sản phẩm nào.',
      banner: {
        title: 'Chào mừng đến với website thủ công mỹ nghệ Hòa Lạc',
        subtitle: 'Nơi quy tụ các tác phẩm thủ công tinh xảo',
        cta: 'Khám phá sản phẩm',
      },
      filter: {
        allProductsHeading: 'Tất cả sản phẩm',
        allLabel: 'Tất cả',
        unknownCategory: 'Không tên',
        searchPlaceholder: 'Tìm kiếm sản phẩm...',
        sortButton: 'Sắp xếp',
        sortTitle: 'Sắp xếp theo:',
        scrollLeft: 'Cuộn sang trái',
        scrollRight: 'Cuộn sang phải',
        sort: {
          default: 'Mặc định',
          lowToHigh: 'Giá: thấp đến cao',
          highToLow: 'Giá: cao đến thấp',
          aToZ: 'Tên A -> Z',
          zToA: 'Tên Z -> A',
        },
        searchButton: 'Tìm kiếm',
      },
    },
    productCard: {
      fallbackDescription: 'Sản phẩm thủ công mang đậm nét truyền thống',
      sold: '{count} lượt bán',
      rating: '({count})',
      priceLabel: 'Giá bán',
      stock: 'Còn {stock} sản phẩm',
      viewDetail: 'Xem chi tiết',
      addToCart: 'Giỏ hàng',
      buyNow: 'Mua ngay',
      priceSuffix: ' VND',
    },
    relation: {
      title: 'Sản phẩm tương tự',
      subtitle: 'Khám phá thêm các sản phẩm thủ công tinh xảo',
      loading: 'Đang tải sản phẩm liên quan...',
    },
    contact: {
      title: 'Liên hệ',
      description: 'Đừng ngại gửi cho chúng tôi thông điệp của bạn. Đội ngũ Hòa Lạc Handicraft luôn sẵn sàng lắng nghe.',
      form: {
        name: 'Họ và tên',
        email: 'Email',
        message: 'Nội dung',
        submit: 'Gửi tin nhắn',
      },
      infoTitle: 'Thông tin liên hệ',
      office: 'Văn phòng',
      address: 'Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội',
      phone: 'Điện thoại',
      emailLabel: 'Email',
      hoursTitle: 'Giờ làm việc',
      hoursValue: 'Thứ 2 - Thứ 6: 8:30 - 17:30',
    },
    policy: {
      title: 'Chính sách',
      updated: 'Cập nhật lần cuối: Tháng 11/2025',
      privacyTitle: 'Chính sách bảo mật',
      privacyContent: 'Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn và chỉ sử dụng để cung cấp dịch vụ. Mọi thông tin được mã hóa và lưu trữ an toàn.',
      shippingTitle: 'Chính sách vận chuyển',
      shippingContent: 'Đơn hàng được xử lý trong 24 giờ và giao trong 3-5 ngày làm việc. Chúng tôi hỗ trợ giao hàng toàn quốc qua các đối tác uy tín.',
      returnTitle: 'Chính sách đổi trả',
      returnContent: 'Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm bị lỗi hoặc hư hỏng trong quá trình vận chuyển.',
    },
    cart: {
      title: 'Giỏ hàng của bạn',
      empty: 'Giỏ hàng của bạn đang trống.',
      headerProduct: 'Sản phẩm',
      headerQuantity: 'Số lượng',
      headerPrice: 'Giá',
      headerSubtotal: 'Thành tiền',
      summaryTitle: 'Thông tin đơn hàng',
      subtotal: 'Tạm tính',
      shipping: 'Phí vận chuyển',
      total: 'Tổng cộng',
      checkout: 'Tiến hành đặt hàng',
      continueShopping: 'Tiếp tục mua sắm',
      itemsCount: '{count} sản phẩm',
      updating: 'Đang cập nhật...',
      remove: 'Xóa',
    },
    messages: {
      loginRequired: 'Vui lòng đăng nhập để tiếp tục.',
      addedToCart: 'Đã thêm sản phẩm vào giỏ hàng.',
      addedToCartRedirect: 'Đã thêm sản phẩm, đang chuyển tới giỏ hàng...',
      addToCartError: 'Không thể thêm sản phẩm vào giỏ hàng.',
      cartLoadError: 'Không thể tải giỏ hàng.',
      cartUpdateSuccess: 'Đã cập nhật số lượng.',
      cartUpdateError: 'Cập nhật số lượng thất bại.',
      cartRemoveSuccess: 'Đã xóa sản phẩm khỏi giỏ hàng.',
      cartRemoveError: 'Xóa sản phẩm thất bại.',
      checkoutComingSoon: 'Tính năng thanh toán đang được phát triển.',
      cartEmpty: 'Giỏ hàng của bạn đang trống.',
      addressRequired: 'Vui lòng chọn địa chỉ giao hàng.',
      orderSuccess: 'Đặt hàng thành công.',
      orderError: 'Không thể đặt hàng. Vui lòng thử lại.',
    },
    order: {
      success: 'Đặt hàng thành công',
      details: 'Chi tiết đơn hàng',
      orderId: 'Mã đơn hàng',
      paymentMethod: 'Phương thức thanh toán',
      status: 'Trạng thái',
      codInfo: 'Bạn sẽ thanh toán khi nhận hàng. Vui lòng chuẩn bị tiền mặt hoặc thẻ tín dụng.',
      vnpayInfo: 'Thanh toán đã được xử lý qua VNPAY. Hóa đơn sẽ được gửi đến email của bạn.',
      summary: 'Tóm tắt đơn hàng',
      viewOrders: 'Xem đơn hàng của tôi',
      continueShopping: 'Tiếp tục mua sắm',
      expectedDelivery: 'Thời gian giao hàng dự kiến',
      failed: 'Đặt hàng thất bại',
      retryCheckout: 'Quay lại thanh toán',
      backHome: 'Về trang chủ',
    },
    general: {
      errorPrefix: 'Lỗi: ',
    },
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      shop: 'Shop',
      blog: 'Blog',
      contact: 'Contact',
      policy: 'Policies',
    },
    header: {
      searchPlaceholder: 'Search...',
      login: 'Sign in',
      profile: 'My account',
      orders: 'Orders',
      logout: 'Sign out',
      notificationsEmpty: 'No new notifications.',
      cartTooltip: 'Cart',
    },
    home: {
      collections: {
        title: 'Product collections',
        description: 'Discover handcrafted creations rooted in Vietnamese traditions',
        empty: 'No products available.',
      },
    },
    shop: {
      loading: 'Loading products...',
      empty: 'No products available.',
      banner: {
        title: 'Welcome to the Hoa Lac Handicraft boutique',
        subtitle: 'A curated collection of refined handcrafted pieces',
        cta: 'Discover products',
      },
      filter: {
        allProductsHeading: 'All products',
        allLabel: 'All',
        unknownCategory: 'Untitled',
        searchPlaceholder: 'Search products...',
        sortButton: 'Sort',
        sortTitle: 'Sort by:',
        scrollLeft: 'Scroll left',
        scrollRight: 'Scroll right',
        sort: {
          default: 'Default',
          lowToHigh: 'Price: low to high',
          highToLow: 'Price: high to low',
          aToZ: 'Name A -> Z',
          zToA: 'Name Z -> A',
        },
        searchButton: 'Search',
      },
    },
    productCard: {
      fallbackDescription: 'Handcrafted piece inspired by tradition',
      sold: '{count} sold',
      rating: '({count})',
      priceLabel: 'Price',
      stock: '{stock} items left',
      viewDetail: 'View detail',
      addToCart: 'Add to cart',
      buyNow: 'Buy now',
      priceSuffix: ' VND',
    },
    relation: {
      title: 'Similar products',
      subtitle: 'Explore more refined handcrafted creations',
      loading: 'Loading related products...',
    },
    contact: {
      title: 'Contact',
      description: 'Feel free to drop us a message. The Hoa Lac Handicraft team is ready to listen and support you.',
      form: {
        name: 'Full name',
        email: 'Email',
        message: 'Message',
        submit: 'Send message',
      },
      infoTitle: 'Contact information',
      office: 'Office',
      address: 'Hoa Lac Hi-Tech Park, Thach That, Ha Noi',
      phone: 'Phone',
      emailLabel: 'Email',
      hoursTitle: 'Working hours',
      hoursValue: 'Monday - Friday: 8:30 AM - 5:30 PM',
    },
    policy: {
      title: 'Policies',
      updated: 'Last updated: November 2025',
      privacyTitle: 'Privacy policy',
      privacyContent: 'We are committed to protecting your personal data and only use it to deliver our services. All information is encrypted and stored securely.',
      shippingTitle: 'Shipping policy',
      shippingContent: 'Orders are processed within 24 hours and delivered within 3-5 business days nationwide via trusted partners.',
      returnTitle: 'Return policy',
      returnContent: 'You can return products within 7 days of delivery if they are defective or damaged during transportation.',
    },
    cart: {
      title: 'Your cart',
      empty: 'Your cart is empty.',
      headerProduct: 'Product',
      headerQuantity: 'Quantity',
      headerPrice: 'Unit price',
      headerSubtotal: 'Subtotal',
      summaryTitle: 'Order summary',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      total: 'Total',
      checkout: 'Proceed to checkout',
      continueShopping: 'Continue shopping',
      itemsCount: '{count} items',
      updating: 'Updating...',
      remove: 'Remove',
    },
    messages: {
      loginRequired: 'Please log in to continue.',
      addedToCart: 'Product added to cart.',
      addedToCartRedirect: 'Product added. Redirecting to cart...',
      addToCartError: 'Could not add the product to cart.',
      cartLoadError: 'Unable to load your cart.',
      cartUpdateSuccess: 'Quantity updated.',
      cartUpdateError: 'Failed to update quantity.',
      cartRemoveSuccess: 'Item removed from cart.',
      cartRemoveError: 'Failed to remove item.',
      checkoutComingSoon: 'Checkout is coming soon.',
      cartEmpty: 'Your cart is empty.',
      addressRequired: 'Please select a shipping address.',
      orderSuccess: 'Order placed successfully.',
      orderError: 'Could not place the order. Please try again.',
    },
    order: {
      success: 'Order Placed Successfully',
      details: 'Order Details',
      orderId: 'Order ID',
      paymentMethod: 'Payment Method',
      status: 'Status',
      codInfo: 'You will pay when receiving your order. Please prepare cash or credit card.',
      vnpayInfo: 'Payment has been processed through VNPAY. An invoice will be sent to your email.',
      summary: 'Order Summary',
      viewOrders: 'View My Orders',
      continueShopping: 'Continue Shopping',
      expectedDelivery: 'Expected Delivery Time',
      failed: 'Order Failed',
      retryCheckout: 'Return to Checkout',
      backHome: 'Back to Home',
    },
    general: {
      errorPrefix: 'Error: ',
    },
  },
};

export const LanguageContext = createContext({
  language: 'vi',
  changeLanguage: () => {},
  t: (key) => key,
});

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'vi';
  return localStorage.getItem('app_language') || 'vi';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
  }, []);

  const translate = useCallback(
    (key, replacements = {}) => {
      if (!key) return '';

      const rawValue = key
        .split('.')
        .reduce((acc, part) => {
          if (acc && typeof acc === 'object') {
            return acc[part];
          }
          return undefined;
        }, translations[language]);

      if (typeof rawValue !== 'string') {
        return key;
      }

      return Object.keys(replacements).reduce(
        (acc, placeholder) => acc.replace(`{${placeholder}}`, replacements[placeholder]),
        rawValue,
      );
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      t: translate,
    }),
    [language, changeLanguage, translate],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
