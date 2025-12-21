import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const submitContactMessage = async (payload) => {
  const response = await axiosClient.post(API_ENDPOINTS.CONTACT.SUBMIT, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
