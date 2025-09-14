// Database Types for Invoice Management System

// User Profile Types
export interface UserProfile {
  id: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  logo_url?: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserProfile {
  id: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  logo_url?: string;
  default_currency?: string;
}

export interface UpdateUserProfile {
  business_name?: string;
  business_email?: string | null;
  business_phone?: string | null;
  business_address?: string | null;
  logo_url?: string | null;
  default_currency?: string;
}

// Client Types
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClient {
  user_id: string;
  name: string;
  email?: string;
  address?: string;
}

export interface UpdateClient {
  name?: string;
  email?: string;
  address?: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  user_id: string;
  buyer_name: string;
  buyer_address?: string;
  buyer_email?: string;
  currency: string;
  account_no?: string;
  service_name: string;
  unit_net_price: number;
  vat_rate: number;
  vat_amount: number;
  total_gross_price: number;
  qty: number;
  payment_link?: string;
  issued_at: string;
  due_date?: string;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoice {
  user_id: string;
  buyer_name: string;
  buyer_address?: string;
  buyer_email?: string;
  currency: string;
  account_no?: string;
  service_name: string;
  unit_net_price: number;
  vat_rate?: number;
  qty?: number;
  payment_link?: string;
  due_date?: string;
  status?: InvoiceStatus;
}

export interface UpdateInvoice {
  buyer_name?: string;
  buyer_address?: string;
  buyer_email?: string;
  currency?: string;
  account_no?: string;
  service_name?: string;
  unit_net_price?: number;
  vat_rate?: number;
  qty?: number;
  payment_link?: string;
  due_date?: string;
  status?: InvoiceStatus;
}

// Enums
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

// Dashboard Statistics Types
export interface InvoiceStats {
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  draft_invoices: number;
  total_revenue: number;
  pending_revenue: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query Parameters
export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  search?: string;
  sortBy?: 'issued_at' | 'due_date' | 'total_gross_price' | 'buyer_name';
  sortOrder?: 'asc' | 'desc';
}

export interface ClientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'email' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

// Calculation Types
export interface InvoiceCalculation {
  subtotal: number;
  vat_amount: number;
  total_gross: number;
}

// Recent Activity Types
export interface RecentInvoice {
  id: string;
  buyer_name: string;
  service_name: string;
  total_gross_price: number;
  status: InvoiceStatus;
  issued_at: string;
  due_date?: string;
}

// Form Types
export interface InvoiceFormData {
  buyer_name: string;
  buyer_address?: string;
  buyer_email?: string;
  currency: string;
  account_no?: string;
  service_name: string;
  unit_net_price: number;
  vat_rate: number;
  qty: number;
  payment_link?: string;
  due_date?: string;
  status: InvoiceStatus;
}

export interface ClientFormData {
  name: string;
  email?: string;
  address?: string;
}

export interface UserProfileFormData {
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  default_currency: string;
}

// Error Types
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Supabase Database Types (Generated from actual schema)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: CreateUserProfile;
        Update: UpdateUserProfile;
      };
      clients: {
        Row: Client;
        Insert: CreateClient;
        Update: UpdateClient;
      };
      invoices: {
        Row: Invoice;
        Insert: CreateInvoice;
        Update: UpdateInvoice;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_invoice_number: {
        Args: { user_uuid: string };
        Returns: string;
      };
      calculate_invoice_totals: {
        Args: { net_price: number; quantity: number; vat_rate: number };
        Returns: InvoiceCalculation[];
      };
      get_user_invoice_stats: {
        Args: { user_uuid: string };
        Returns: InvoiceStats[];
      };
      get_recent_invoices: {
        Args: { user_uuid: string; limit_count?: number };
        Returns: RecentInvoice[];
      };
      update_overdue_invoices: {
        Args: {};
        Returns: void;
      };
    };
    Enums: {
      invoice_status: InvoiceStatus;
    };
  };
}