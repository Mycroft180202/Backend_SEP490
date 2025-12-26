export const API_ENDPOINTS = {
  PRODUCTS: {
    GET_ALL: '/products',
    GET_BY_ID: (id) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
    BY_ARTISAN: (id) => `/products/artisan/${id}`,
  },

  Categories: {
    GET_ALL: '/categories',
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
  },

  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_OTP: '/verify-otp',
  },

  PASSWORD: {
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  USERS: {
    LIST: '/users',
    USERS_PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
    CHANGE_PASSWORD: '/users/change-password',
    BY_ID: (id) => `/users/${id}`,
    ADDRESSES: '/users/address',
    ADDRESS_BY_ID: (id) => `/users/address/${id}`,
    MY_SHOP: '/users/my-shop',
    UPDATE_MY_SHOP: '/users/my-shop',
    SHOP_BY_QUERY: '/users/shop',
  },

  CART: {
    ROOT: '/carts',
  },

  BLOGS: {
    ROOT: '/blogs',
    BY_ID: (id) => `/blogs/${id}`,
  },

  ORDERS: {
    ROOT: '/api/Order/orders',
    MULTI: '/api/Order/orders/multi',
    MY_ORDERS: '/api/Order/my-orders',
    BY_ID: (orderId) => `/api/Order/orders/${orderId}`,
    CANCEL: (orderId) => `/api/Order/orders/${orderId}/cancel`,
    CONTINUE_PAYMENT: (orderNumber) => `/api/Order/orders/${orderNumber}/continue-payment`,
  },

  VOUCHERS: {
    ROOT: '/voucher',
    BY_ID: (id) => `/voucher/${id}`,
    MY_VOUCHERS: '/voucher/me',
  },

  NOTIFICATIONS: {
    ROOT: '/api/Notification',
    MARK_READ: (id) => `/api/Notification/${id}/read`,
    MARK_ALL_READ: '/api/Notification/mark-all-read',
    DELETE: (id) => `/api/Notification/${id}`,
    ADMIN_SEND: '/api/Notification/admin/send',
  },

  WISHLIST: {
    ROOT: '/wish-list',
  },

  PRODUCT_COLLECTION: {
    ROOT: '/productcollection',
    BY_ID: (id) => `/productcollection/${id}`,
  },

  SHOP: {
    MY_SHOP: '/users/my-shop',
    UPDATE_MY_SHOP: '/users/my-shop',
    BY_USER: '/users/shop',
  },

  CONTACT: {
    SUBMIT: '/api/Contact',
  },

  PAYMENTS: {
    VNPAY_BATCH: '/api/Payment/vnpay/batch',
    VNPAY_RESULT: '/api/Payment/vnpay/result',
  },
};
