import axiosClient from '../../api/axiosConfig';

export const AuthService = {
  login: async ({ email, password }) => {
    // placeholder: replace endpoint with your backend auth endpoint
    const res = await axiosClient.post('/auth/login', { email, password });
    // store token if returned
    if (res.data?.token) {
      localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY, res.data.token);
    }
    return res.data;
  },
};
