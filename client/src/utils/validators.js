/**
 * Client-side form validators for immediate feedback.
 * Server still validates independently — this is UX, not security.
 */

export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address.';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};

export const validateName = (name) => {
  if (!name || !name.trim()) return 'Name is required.';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value && value !== 0) return `${fieldName} is required.`;
  return null;
};

export const validatePositiveNumber = (value, fieldName) => {
  if (value == null || value === '') return null; // Optional
  if (isNaN(value) || Number(value) < 0) return `${fieldName} must be a positive number.`;
  return null;
};
