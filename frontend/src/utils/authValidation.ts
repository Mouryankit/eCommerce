/**
 * Email, password, and credential validation utilities
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email.trim()) {
    return { valid: false, error: 'Please provide your email address.' };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true };
}

export function validatePassword(password: string, minLength = 6): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Please enter your password.' };
  }
  if (password.length < minLength) {
    return { valid: false, error: `Password must contain at least ${minLength} characters.` };
  }
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Please provide your full name.' };
  }
  return { valid: true };
}
