const DEFAULT_SPECIAL_REGEX = /[^A-Za-z0-9]/;
const DEFAULT_UPPERCASE_REGEX = /[A-Z]/;

export const validateStrongPassword = (password, { minLength = 8 } = {}) => {
  const value = (password || '').toString();
  const reasons = {
    minLength: value.length >= minLength,
    uppercase: DEFAULT_UPPERCASE_REGEX.test(value),
    special: DEFAULT_SPECIAL_REGEX.test(value),
  };

  return {
    isValid: Object.values(reasons).every(Boolean),
    reasons,
    minLength,
  };
};

