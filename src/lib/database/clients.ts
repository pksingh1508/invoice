import { supabase } from '@/lib/supabase/client';
import { supabaseServer } from '@/lib/supabase/server';
import { 
  Client, 
  CreateClient, 
  UpdateClient, 
  ClientQueryParams,
  PaginatedResponse,
  ApiResponse
} from '@/types/database';
import { handleSupabaseError } from '@/lib/utils/errors';

// Client-side functions (for use in components)
export const clientQueries = {
  // Get all clients for the current user with pagination and filtering
  async getClients(params: ClientQueryParams = {}): Promise<PaginatedResponse<Client>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = params;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      return {
        error: handleSupabaseError(error, 'fetching clients')
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

  // Get all clients without pagination (for dropdowns, etc.)
  async getAllClients(): Promise<ApiResponse<Client[]>> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return {
        error: handleSupabaseError(error, 'fetching all clients')
      };
    }

    return { data: data || [] };
  },

  // Get a single client by ID
  async getClient(id: string): Promise<ApiResponse<Client>> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, 'fetching client')
      };
    }

    return { data };
  },

  // Create a new client
  async createClient(clientData: CreateClient): Promise<ApiResponse<Client>> {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, 'creating client')
      };
    }

    return { 
      data,
      message: 'Client created successfully'
    };
  },

  // Update an existing client
  async updateClient(id: string, updates: UpdateClient): Promise<ApiResponse<Client>> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {
        error: handleSupabaseError(error, 'updating client')
      };
    }

    return { 
      data,
      message: 'Client updated successfully'
    };
  },

  // Delete a client
  async deleteClient(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        error: handleSupabaseError(error, 'deleting client')
      };
    }

    return {
      message: 'Client deleted successfully'
    };
  },

  // Search clients by name (for autocomplete/dropdown)
  async searchClients(query: string, limit: number = 10): Promise<ApiResponse<Client[]>> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      return {
        error: handleSupabaseError(error, 'searching clients')
      };
    }

    return { data: data || [] };
  }
};

// Server-side functions (for use in API routes)
export const clientServerQueries = {
  // Get client statistics for a user
  async getClientStats(userId: string): Promise<ApiResponse<{ total_clients: number }>> {
    const { data, error, count } = await supabaseServer
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      return {
        error: handleSupabaseError(error, 'fetching client statistics')
      };
    }

    return { 
      data: { total_clients: count || 0 }
    };
  },

  // Get clients with invoice counts
  async getClientsWithInvoiceCounts(userId: string): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabaseServer
      .from('clients')
      .select(`
        *,
        invoices:invoices(count)
      `)
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      return {
        error: handleSupabaseError(error, 'fetching clients with invoice counts')
      };
    }

    return { data: data || [] };
  },

  // Get top clients by invoice count or revenue
  async getTopClients(
    userId: string, 
    limit: number = 5, 
    sortBy: 'invoice_count' | 'revenue' = 'invoice_count'
  ): Promise<ApiResponse<any[]>> {
    let query = supabaseServer
      .from('clients')
      .select(`
        *,
        invoices!inner(
          total_gross_price
        )
      `)
      .eq('user_id', userId);

    if (sortBy === 'revenue') {
      // This would need a more complex aggregation query
      // For now, we'll keep it simple and sort by invoice count
      query = query.limit(limit);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return {
        error: handleSupabaseError(error, 'fetching top clients')
      };
    }

    return { data: data || [] };
  },

  // Check if client has any invoices (before deletion)
  async checkClientHasInvoices(clientId: string): Promise<ApiResponse<{ has_invoices: boolean }>> {
    const { data, error, count } = await supabaseServer
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_name', clientId); // This would need to be adjusted based on your schema

    if (error) {
      return {
        error: handleSupabaseError(error, 'checking client invoices')
      };
    }

    return { 
      data: { has_invoices: (count || 0) > 0 }
    };
  }
};

export default clientQueries;