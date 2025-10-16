import axios from 'axios';

const axiosConfig = axios.create({
  baseURL: 'https://your-api-url.com/api', // Replace with your API base URL
  timeout: 10000, // Set a timeout for requests
  headers: {
    'Content-Type': 'application/json',
    // Add any other headers you need
  },
});

// Optionally, you can add interceptors for requests or responses
axiosConfig.interceptors.request.use(
  (config) => {
    // You can modify the request config here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosConfig.interceptors.response.use(
  (response) => {
    // You can modify the response here
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosConfig;