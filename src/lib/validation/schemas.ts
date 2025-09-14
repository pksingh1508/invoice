import { z } from 'zod';

// Base validation schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .optional()
  .or(z.literal(''));

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .optional()
  .or(z.literal(''));

export const currencySchema = z
  .string()
  .min(1, 'Currency is required')
  .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter code (e.g., USD, EUR)');

export const positiveNumberSchema = z
  .number()
  .positive('Must be a positive number')
  .finite('Must be a finite number');

export const nonNegativeNumberSchema = z
  .number()
  .nonnegative('Must be zero or positive')
  .finite('Must be a finite number');

// Invoice Form Schema
export const invoiceFormSchema = z.object({
  // Buyer Information
  buyer_name: z
    .string()
    .min(1, 'Buyer name is required')
    .max(255, 'Buyer name must be less than 255 characters'),
  
  buyer_email: emailSchema,
  
  buyer_address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  // Invoice Details
  service_name: z
    .string()
    .min(1, 'Service description is required')
    .max(255, 'Service description must be less than 255 characters'),

  currency: currencySchema,

  unit_net_price: positiveNumberSchema.refine(
    (val) => val > 0,
    { message: 'Unit price must be greater than 0' }
  ),

  qty: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(9999, 'Quantity must be less than 10,000'),

  vat_rate: nonNegativeNumberSchema
    .max(100, 'VAT rate cannot exceed 100%')
    .default(0),

  // Optional Fields
  account_no: z
    .string()
    .max(50, 'Account number must be less than 50 characters')
    .optional()
    .or(z.literal('')),

  payment_link: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),

  due_date: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true; // Optional field
        const dueDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate >= today;
      },
      { message: 'Due date cannot be in the past' }
    ),

  status: z
    .enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .default('draft'),

  // Notes (optional)
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

// Client Form Schema
export const clientFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Client name is required')
    .max(255, 'Client name must be less than 255 characters'),

  email: emailSchema,

  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

// User Profile Form Schema
export const userProfileFormSchema = z.object({
  business_name: z
    .string()
    .max(255, 'Business name must be less than 255 characters')
    .optional()
    .or(z.literal('')),

  business_email: emailSchema,

  business_phone: phoneSchema,

  business_address: z
    .string()
    .max(500, 'Business address must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  default_currency: currencySchema.default('USD'),
});

// Invoice Query Parameters Schema
export const invoiceQuerySchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .default(1),

  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),

  status: z
    .enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .optional(),

  search: z
    .string()
    .max(255)
    .optional(),

  sortBy: z
    .enum(['issued_at', 'due_date', 'total_gross_price', 'buyer_name'])
    .default('issued_at'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

// Client Query Parameters Schema
export const clientQuerySchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .default(1),

  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),

  search: z
    .string()
    .max(255)
    .optional(),

  sortBy: z
    .enum(['name', 'email', 'created_at'])
    .default('name'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc'),
});

// Form validation helper functions
export const validateInvoiceForm = (data: unknown) => {
  return invoiceFormSchema.safeParse(data);
};

export const validateClientForm = (data: unknown) => {
  return clientFormSchema.safeParse(data);
};

export const validateUserProfileForm = (data: unknown) => {
  return userProfileFormSchema.safeParse(data);
};

// Transform string numbers to actual numbers for form processing
export const transformInvoiceFormData = (data: any) => {
  return {
    ...data,
    unit_net_price: typeof data.unit_net_price === 'string' 
      ? parseFloat(data.unit_net_price) 
      : data.unit_net_price,
    qty: typeof data.qty === 'string' 
      ? parseInt(data.qty, 10) 
      : data.qty,
    vat_rate: typeof data.vat_rate === 'string' 
      ? parseFloat(data.vat_rate) 
      : data.vat_rate,
  };
};

// Type inference from schemas
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
export type ClientFormData = z.infer<typeof clientFormSchema>;
export type UserProfileFormData = z.infer<typeof userProfileFormSchema>;
export type InvoiceQueryParams = z.infer<typeof invoiceQuerySchema>;
export type ClientQueryParams = z.infer<typeof clientQuerySchema>;

// Validation error helper
export const getFieldError = (
  result: any,
  fieldName: string
): string | undefined => {
  if (result.success) return undefined;
  
  const fieldError = result.error.errors.find(
    (error: any) => error.path.includes(fieldName)
  );
  
  return fieldError?.message;
};
