export const API_ENDPOINTS = {
  PRODUCTS: {
    GET_ALL: '/products',
    GET_BY_ID: (id) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  Categories: {
    GET_ALL: '/categories',
  },

  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_OTP: '/verify-otp',
  },
  
  USERS: {
    USERS_PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
    DELETE_ACCOUNT: '/users/profile/delete',
    BY_ID: (id) => `/users/${id}`,
    ADDRESSES: '/users/address',
    ADDRESS_BY_ID: (id) => `/users/address/${id}`,
  },

  PASSWORD: {
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  CART: {
    ROOT: '/carts',
    ITEM: (id) => `/carts/${id}`,
  },

  BLOGS: {
    ROOT: '/blogs',
    BY_ID: (id) => `/blogs/${id}`,
  },

  ORDERS: {
    ROOT: '/Order/orders',
    BY_ID: (orderId) => `/Order/orders/${orderId}`,
    CANCEL: (orderId) => `/Order/orders/${orderId}/cancel`,
  },

  VOUCHERS: {
    ROOT: '/voucher',
    PAGED: (pageIndex, pageSize) => `/voucher/${pageIndex}/${pageSize}`,
    BY_ID: (id) => `/voucher/${id}`,
  },

  NOTIFICATIONS: {
    ROOT: '/api/Notification',
    MARK_READ: (id) => `/api/Notification/${id}/read`,
    MARK_ALL_READ: '/api/Notification/mark-all-read',
    DELETE: (id) => `/api/Notification/${id}`,
    ADMIN_SEND: '/api/Notification/admin/send',
  },
};
