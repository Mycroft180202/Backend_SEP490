const VN_MOBILE_PREFIXES = ['3', '5', '7', '8', '9'];

const digitsOnly = (value) => (value || '').toString().replace(/\D/g, '');

export const sanitizeVietnamPhoneInput = (value, { maxDigits = 11 } = {}) => {
  const digits = digitsOnly(value);
  if (!digits) return '';
  return digits.slice(0, maxDigits);
};

export const normalizeVietnamPhone = (value) => {
  const raw = (value || '').toString().trim();
  if (!raw) return { normalized: '', isValid: false, reason: 'empty' };

  const digits = digitsOnly(raw);
  if (!digits) return { normalized: '', isValid: false, reason: 'invalid' };

  if (digits.startsWith('0')) {
    if (digits.length !== 10) return { normalized: digits, isValid: false, reason: 'format' };
    const second = digits.charAt(1);
    if (!VN_MOBILE_PREFIXES.includes(second)) {
      return { normalized: digits, isValid: false, reason: 'format' };
    }
    return { normalized: digits, isValid: true };
  }

  if (digits.startsWith('84')) {
    if (digits.length !== 11) return { normalized: digits, isValid: false, reason: 'format84' };
    const firstAfterCountry = digits.charAt(2);
    if (!VN_MOBILE_PREFIXES.includes(firstAfterCountry)) {
      return { normalized: digits, isValid: false, reason: 'format84' };
    }
    return { normalized: `0${digits.slice(2)}`, isValid: true };
  }

  return { normalized: digits, isValid: false, reason: 'format' };
};

