import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { invoiceServerQueries } from '@/lib/database/invoices';
import { supabaseServer } from '@/lib/supabase/server';
import { 
  handleApiError, 
  createSuccessResponse, 
  validateRequired, 
  validateEmail, 
  validateNumber,
  combineValidationErrors,
  ValidationFailedError
} from '@/lib/utils/errors';
import { CreateInvoice, InvoiceQueryParams, InvoiceStatus } from '@/types/database';

// GET /api/invoices - Get all invoices with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params: InvoiceQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as any || 'issued_at',
      sortOrder: searchParams.get('sortOrder') as any || 'desc'
    };

    // Get invoices from database
    let query = supabaseServer
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    if (params.search) {
      query = query.or(`buyer_name.ilike.%${params.search}%,service_name.ilike.%${params.search}%,invoice_number.ilike.%${params.search}%,buyer_email.ilike.%${params.search}%`);
    }
    
    // Apply sorting and pagination
    const offset = ((params.page || 1) - 1) * (params.limit || 10);
    const { data, error, count } = await query
      .order(params.sortBy || 'issued_at', { ascending: params.sortOrder === 'asc' })
      .range(offset, offset + (params.limit || 10) - 1);

    if (error) {
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / (params.limit || 10));

    return NextResponse.json(createSuccessResponse({
      invoices: data || [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total: count || 0,
        totalPages
      }
    }));

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/invoices - Create a new invoice
// PATCH /api/invoices - Bulk operations on invoices (mark paid, mark sent, delete, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, invoiceIds } = body;

    if (!action || !invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body. Must include action and invoiceIds array' },
        { status: 400 }
      );
    }

    // Verify user owns all these invoices
    const { data: ownedInvoices, error: verifyError } = await supabaseServer
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .in('id', invoiceIds);

    if (verifyError) {
      const errorResponse = handleApiError(verifyError);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!ownedInvoices || ownedInvoices.length !== invoiceIds.length) {
      return NextResponse.json(
        { error: 'Unauthorized. You do not own all specified invoices.' },
        { status: 401 }
      );
    }

    let result;
    
    switch (action) {
      case 'mark_paid':
        result = await supabaseServer
          .from('invoices')
          .update({ status: 'paid' as InvoiceStatus })
          .in('id', invoiceIds);
        break;
        
      case 'mark_sent':
        result = await supabaseServer
          .from('invoices')
          .update({ status: 'sent' as InvoiceStatus })
          .in('id', invoiceIds);
        break;
        
      case 'mark_draft':
        result = await supabaseServer
          .from('invoices')
          .update({ status: 'draft' as InvoiceStatus })
          .in('id', invoiceIds);
        break;
        
      case 'delete':
        result = await supabaseServer
          .from('invoices')
          .delete()
          .in('id', invoiceIds);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (result.error) {
      const errorResponse = handleApiError(result.error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(createSuccessResponse({
      action,
      affected: invoiceIds.length,
      message: `${invoiceIds.length} invoice(s) updated successfully`
    }));
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const validationErrors = combineValidationErrors(
      validateRequired(body.buyer_name, 'buyer_name'),
      validateRequired(body.service_name, 'service_name'),
      validateRequired(body.currency, 'currency'),
      validateNumber(body.unit_net_price, 'unit_net_price', { positive: true }),
      validateNumber(body.vat_rate, 'vat_rate', { min: 0, max: 100 }),
      validateNumber(body.qty, 'qty', { positive: true, min: 1 }),
      validateEmail(body.buyer_email, 'buyer_email')
    );

    if (validationErrors.length > 0) {
      throw new ValidationFailedError(validationErrors);
    }

    // Create invoice data
    const invoiceData: CreateInvoice = {
      user_id: userId,
      buyer_name: body.buyer_name,
      buyer_address: body.buyer_address || null,
      buyer_email: body.buyer_email || null,
      currency: body.currency,
      account_no: body.account_no || null,
      service_name: body.service_name,
      unit_net_price: parseFloat(body.unit_net_price),
      vat_rate: parseFloat(body.vat_rate || '0'),
      qty: parseInt(body.qty || '1'),
      payment_link: body.payment_link || null,
      due_date: body.due_date || null,
      status: body.status || 'draft'
    };

    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabaseServer
      .rpc('generate_invoice_number', { user_uuid: userId });

    if (numberError) {
      const errorResponse = handleApiError(numberError);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Create invoice with generated number
    const enhancedData = {
      ...invoiceData,
      service_name: `Invoice #${invoiceNumber} - ${invoiceData.service_name}`
    };

    const { data, error } = await supabaseServer
      .from('invoices')
      .insert(enhancedData)
      .select()
      .single();

    if (error) {
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse(data, 'Invoice created successfully'),
      { status: 201 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof ValidationFailedError ? 400 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}