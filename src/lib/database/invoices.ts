import { supabase } from "@/lib/supabase/client";
import { supabaseServer } from "@/lib/supabase/server";
import {
  Invoice,
  CreateInvoice,
  UpdateInvoice,
  InvoiceQueryParams,
  PaginatedResponse,
  ApiResponse,
  InvoiceStats,
  RecentInvoice
} from "@/types/database";
import { handleSupabaseError } from "@/lib/utils/errors";

// Client-side functions (for use in components)
export const invoiceQueries = {
  // Get all invoices for the current user with pagination and filtering
  async getInvoices(
    params: InvoiceQueryParams = {}
  ): Promise<PaginatedResponse<Invoice>> {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "issued_at",
      sortOrder = "desc"
    } = params;

    const offset = (page - 1) * limit;

    let query = supabase.from("invoices").select("*", { count: "exact" });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `buyer_name.ilike.%${search}%,service_name.ilike.%${search}%`
      );
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      return {
        error: handleSupabaseError(error, "fetching invoices")
      };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    };
  },

  // Get a single invoice by ID
  async getInvoice(id: string): Promise<ApiResponse<Invoice>> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, "fetching invoice")
      };
    }

    return { data };
  },

  // Create a new invoice
  async createInvoice(
    invoiceData: CreateInvoice
  ): Promise<ApiResponse<Invoice>> {
    // First generate an invoice number
    const { data: invoiceNumber, error: numberError } = await supabase.rpc(
      "generate_invoice_number",
      { p_user_id: invoiceData.user_id }
    );

    if (numberError) {
      return {
        error: handleSupabaseError(numberError, "generating invoice number")
      };
    }

    // Create the invoice with the generated number in the service_name
    const enhancedData = {
      ...invoiceData,
      service_name: `Invoice #${invoiceNumber} - ${invoiceData.service_name}`
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert(enhancedData)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, "creating invoice")
      };
    }

    return {
      data,
      message: "Invoice created successfully"
    };
  },

  // Update an existing invoice
  async updateInvoice(
    id: string,
    updates: UpdateInvoice
  ): Promise<ApiResponse<Invoice>> {
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, "updating invoice")
      };
    }

    return {
      data,
      message: "Invoice updated successfully"
    };
  },

  // Delete an invoice
  async deleteInvoice(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (error) {
      return {
        error: handleSupabaseError(error, "deleting invoice")
      };
    }

    return {
      message: "Invoice deleted successfully"
    };
  },

  // Update invoice status
  async updateInvoiceStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Invoice>> {
    const { data, error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, "updating invoice status")
      };
    }

    return {
      data,
      message: `Invoice marked as ${status}`
    };
  },

  // Duplicate an existing invoice
  async duplicateInvoice(id: string): Promise<ApiResponse<Invoice>> {
    // First get the original invoice
    const { data: original, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return {
        error: handleSupabaseError(fetchError, "fetching original invoice")
      };
    }

    // Create new invoice data without id and timestamps
    const { id: _, created_at, updated_at, ...invoiceData } = original;
    const newInvoiceData: CreateInvoice = {
      ...invoiceData,
      status: "draft" // Reset to draft
    };

    return this.createInvoice(newInvoiceData);
  }
};

// Server-side functions (for use in API routes)
export const invoiceServerQueries = {
  // Get user's invoice statistics
  async getInvoiceStats(userId: string): Promise<ApiResponse<InvoiceStats>> {
    const { data, error } = await supabaseServer.rpc("get_user_invoice_stats", {
      p_user_id: userId
    });

    if (error) {
      return {
        error: handleSupabaseError(error, "fetching invoice statistics")
      };
    }

    return {
      data: data[0] || {
        total_invoices: 0,
        paid_invoices: 0,
        pending_invoices: 0,
        draft_invoices: 0,
        total_revenue: 0,
        pending_revenue: 0
      }
    };
  },

  // Get recent invoices
  async getRecentInvoices(
    userId: string,
    limit: number = 5
  ): Promise<ApiResponse<RecentInvoice[]>> {
    const { data, error } = await supabaseServer.rpc("get_recent_invoices", {
      p_user_id: userId,
      limit_count: limit
    });

    if (error) {
      return {
        error: handleSupabaseError(error, "fetching recent invoices")
      };
    }

    return { data: data ?? [] };
  },

  // Update overdue invoices (cron job function)
  async updateOverdueInvoices(): Promise<ApiResponse<void>> {
    const { error } = await supabaseServer.rpc("update_overdue_invoices");

    if (error) {
      return {
        error: handleSupabaseError(error, "updating overdue invoices")
      };
    }

    return {
      message: "Overdue invoices updated successfully"
    };
  },

  // Get invoices by status for a user
  async getInvoicesByStatus(
    userId: string,
    status: string
  ): Promise<ApiResponse<Invoice[]>> {
    const { data, error } = await supabaseServer
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("issued_at", { ascending: false });

    if (error) {
      return {
        error: handleSupabaseError(error, `fetching ${status} invoices`)
      };
    }

    return { data: data || [] };
  },

  // Calculate totals for an invoice
  async calculateInvoiceTotals(
    netPrice: number,
    quantity: number,
    vatRate: number
  ): Promise<
    ApiResponse<{ subtotal: number; vat_amount: number; total_gross: number }>
  > {
    const { data, error } = await supabaseServer.rpc(
      "calculate_invoice_totals",
      {
        net_price: netPrice,
        quantity: quantity,
        vat_rate: vatRate
      }
    );

    if (error) {
      return {
        error: handleSupabaseError(error, "calculating invoice totals")
      };
    }

    return { data: data[0] };
  }
};

export default invoiceQueries;
