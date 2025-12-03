import React, { createContext, useState, useEffect } from 'react';
import { AuthService } from '../services/modules/auth/authService';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const data = await AuthService.getUserInfo();
        setUserInfo(data);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error.message);
      }
    };

    fetchUserInfo();
  }, []);

  const updateUserInfo = async () => {
    try {
      const data = await AuthService.getUserInfo();
      setUserInfo(data);
      return data;
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin người dùng:', error.message);
      return null;
    }
  };

  return (
    <UserContext.Provider value={{ userInfo, updateUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };