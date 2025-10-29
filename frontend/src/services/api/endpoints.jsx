export const API_ENDPOINTS = {
  PRODUCTS: {
    GET_ALL: '/products',
    GET_BY_ID: (id) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_OTP: '/verify-otp',
  },
  USERS: {
    USERS_PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/profile/update',
    DELETE_ACCOUNT: '/users/profile/delete',
  },
};