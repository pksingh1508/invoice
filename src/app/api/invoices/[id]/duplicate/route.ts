import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';
import { 
  handleApiError, 
  createSuccessResponse,
  NotFoundError
} from '@/lib/utils/errors';
import { CreateInvoice } from '@/types/database';

// POST /api/invoices/[id]/duplicate - Duplicate an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the original invoice
    const { data: originalInvoice, error: fetchError } = await supabaseServer
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Invoice');
      }
      const errorResponse = handleApiError(fetchError);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Generate new invoice number
    const { data: invoiceNumber, error: numberError } = await supabaseServer
      .rpc('generate_invoice_number', { user_uuid: userId });

    if (numberError) {
      const errorResponse = handleApiError(numberError);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Create duplicate invoice data (excluding id, timestamps, and resetting status)
    const duplicateData: CreateInvoice = {
      user_id: userId,
      buyer_name: originalInvoice.buyer_name,
      buyer_address: originalInvoice.buyer_address,
      buyer_email: originalInvoice.buyer_email,
      currency: originalInvoice.currency,
      account_no: originalInvoice.account_no,
      service_name: `Invoice #${invoiceNumber} - ${originalInvoice.service_name.replace(/^Invoice #\w+-\d+-\d+ - /, '')}`,
      unit_net_price: originalInvoice.unit_net_price,
      vat_rate: originalInvoice.vat_rate,
      qty: originalInvoice.qty,
      payment_link: originalInvoice.payment_link,
      due_date: undefined, // Reset due date so user can set new one
      status: 'draft' // Reset status to draft
    };

    // Create the duplicate invoice
    const { data: newInvoice, error: createError } = await supabaseServer
      .from('invoices')
      .insert(duplicateData)
      .select()
      .single();

    if (createError) {
      const errorResponse = handleApiError(createError);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse(
        newInvoice, 
        `Invoice duplicated successfully as #${invoiceNumber}`
      ),
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof NotFoundError ? 404 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}