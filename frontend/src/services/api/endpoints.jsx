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
};
