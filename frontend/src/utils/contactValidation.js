const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_REGEX = /^\d{9,11}$/;
const MIN_MESSAGE_LENGTH = 10;

export const sanitizeContactPayload = (raw = {}) => {
  const name = (raw.name || '').trim();
  const email = (raw.email || '').trim();
  const phoneNumber = (raw.phoneNumber || '').replace(/\D+/g, '');
  const message = (raw.message || '').trim();

  return { name, email, phoneNumber, message };
};

export const validateContactForm = (values, translate) => {
  const errors = {};

  if (!values.name) {
    errors.name = translate('contact.form.validation.nameRequired');
  }

  if (!values.email) {
    errors.email = translate('contact.form.validation.emailRequired');
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = translate('contact.form.validation.emailInvalid');
  }

  if (!values.phoneNumber) {
    errors.phoneNumber = translate('contact.form.validation.phoneRequired');
  } else if (!PHONE_REGEX.test(values.phoneNumber)) {
    errors.phoneNumber = translate('contact.form.validation.phoneInvalid');
  }

  if (!values.message) {
    errors.message = translate('contact.form.validation.messageRequired');
  } else if (values.message.length < MIN_MESSAGE_LENGTH) {
    errors.message = translate('contact.form.validation.messageLength', { min: MIN_MESSAGE_LENGTH });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
