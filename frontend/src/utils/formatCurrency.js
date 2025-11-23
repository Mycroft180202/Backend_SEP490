/**
 * Format number to Vietnamese currency format
 * @param {number} value - The value to format
 * @param {string} suffix - Currency suffix (default: 'đ')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, suffix = 'đ') => {
  if (value === null || value === undefined) {
    return `0${suffix}`;
  }
  return `${Number(value).toLocaleString('vi-VN')}${suffix}`;
};
