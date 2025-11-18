import { useState } from 'react';

interface ValidationRules {
  required?: boolean;
  email?: boolean;
  phone?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationResult {
  isValid: boolean;
  error: string;
}

export function useValidation() {
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());

  const validateField = (fieldName: string, value: any, rules: ValidationRules, label?: string): ValidationResult => {
    const fieldLabel = label || fieldName;

    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return { isValid: false, error: `${fieldLabel} es requerido` };
    }

    if (!value || (typeof value === 'string' && !value.trim())) {
      return { isValid: true, error: '' };
    }

    if (rules.email && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, error: 'Email inválido' };
      }
    }

    if (rules.phone && typeof value === 'string') {
      const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
      if (!phoneRegex.test(value)) {
        return { isValid: false, error: 'Teléfono inválido' };
      }
    }

    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      return { isValid: false, error: `Mínimo ${rules.minLength} caracteres` };
    }

    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      return { isValid: false, error: `Máximo ${rules.maxLength} caracteres` };
    }

    if (rules.min !== undefined) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue < rules.min) {
        return { isValid: false, error: `Debe ser mayor o igual a ${rules.min}` };
      }
    }

    if (rules.max !== undefined) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue > rules.max) {
        return { isValid: false, error: `Debe ser menor o igual a ${rules.max}` };
      }
    }

    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return { isValid: false, error: 'Formato inválido' };
    }

    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return { isValid: false, error: customError };
      }
    }

    return { isValid: true, error: '' };
  };

  const validateDate = (dateStr: string, fieldName: string = 'Fecha'): ValidationResult => {
    if (!dateStr) {
      return { isValid: true, error: '' };
    }

    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Formato inválido (dd/mm/aaaa)' };
    }

    const [day, month, year] = parts.map(p => parseInt(p, 10));

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { isValid: false, error: 'Fecha inválida' };
    }

    if (month < 1 || month > 12) {
      return { isValid: false, error: 'Mes inválido' };
    }

    if (day < 1 || day > 31) {
      return { isValid: false, error: 'Día inválido' };
    }

    if (year < 1900 || year > 2100) {
      return { isValid: false, error: 'Año inválido' };
    }

    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return { isValid: false, error: 'Fecha inválida' };
    }

    return { isValid: true, error: '' };
  };

  const validateBirthDate = (dateStr: string): ValidationResult => {
    const dateValidation = validateDate(dateStr, 'Fecha de Nacimiento');
    if (!dateValidation.isValid) {
      return dateValidation;
    }

    if (!dateStr) {
      return { isValid: true, error: '' };
    }

    const parts = dateStr.split('/');
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (birthDate > today) {
      return { isValid: false, error: 'La fecha no puede ser futura' };
    }

    if (actualAge < 16) {
      return { isValid: false, error: 'Debe ser mayor de 16 años' };
    }

    if (actualAge > 100) {
      return { isValid: false, error: 'Fecha inválida' };
    }

    return { isValid: true, error: '' };
  };

  const validateHireDate = (dateStr: string): ValidationResult => {
    const dateValidation = validateDate(dateStr, 'Fecha de Contratación');
    if (!dateValidation.isValid) {
      return dateValidation;
    }

    if (!dateStr) {
      return { isValid: true, error: '' };
    }

    const parts = dateStr.split('/');
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    const hireDate = new Date(year, month - 1, day);
    const today = new Date();

    if (hireDate > today) {
      return { isValid: false, error: 'La fecha no puede ser futura' };
    }

    const minDate = new Date(1950, 0, 1);
    if (hireDate < minDate) {
      return { isValid: false, error: 'Fecha muy antigua' };
    }

    return { isValid: true, error: '' };
  };

  const setError = (fieldName: string, error: string) => {
    setFieldErrors(prev => {
      const newErrors = new Map(prev);
      if (error) {
        newErrors.set(fieldName, error);
      } else {
        newErrors.delete(fieldName);
      }
      return newErrors;
    });
  };

  const clearError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(fieldName);
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setFieldErrors(new Map());
  };

  const getError = (fieldName: string): string => {
    return fieldErrors.get(fieldName) || '';
  };

  const hasError = (fieldName: string): boolean => {
    return fieldErrors.has(fieldName);
  };

  const hasAnyErrors = (): boolean => {
    return fieldErrors.size > 0;
  };

  return {
    fieldErrors,
    validateField,
    validateDate,
    validateBirthDate,
    validateHireDate,
    setError,
    clearError,
    clearAllErrors,
    getError,
    hasError,
    hasAnyErrors
  };
}
