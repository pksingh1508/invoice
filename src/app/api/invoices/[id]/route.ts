import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  handleApiError,
  createSuccessResponse,
  validateEmail,
  validateNumber,
  combineValidationErrors,
  ValidationFailedError,
  NotFoundError
} from "@/lib/utils/errors";
import { UpdateInvoice, InvoiceStatus } from "@/types/database";

// GET /api/invoices/[id] - Get a single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Invoice");
      }
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(createSuccessResponse(data));
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof NotFoundError ? 404 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PUT /api/invoices/[id] - Update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate fields that are provided
    const validationErrors = combineValidationErrors(
      body.buyer_email ? validateEmail(body.buyer_email, "buyer_email") : [],
      body.unit_net_price
        ? validateNumber(body.unit_net_price, "unit_net_price", {
            positive: true
          })
        : [],
      body.vat_rate
        ? validateNumber(body.vat_rate, "vat_rate", { min: 0, max: 100 })
        : [],
      body.qty
        ? validateNumber(body.qty, "qty", { positive: true, min: 1 })
        : []
    );

    if (validationErrors.length > 0) {
      throw new ValidationFailedError(validationErrors);
    }

    // Create update data - only include fields that are provided
    const updateData: UpdateInvoice = {};

    if (body.buyer_name !== undefined) updateData.buyer_name = body.buyer_name;
    if (body.buyer_address !== undefined)
      updateData.buyer_address = body.buyer_address;
    if (body.buyer_email !== undefined)
      updateData.buyer_email = body.buyer_email;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.account_no !== undefined) updateData.account_no = body.account_no;
    if (body.service_name !== undefined)
      updateData.service_name = body.service_name;
    if (body.unit_net_price !== undefined)
      updateData.unit_net_price = parseFloat(body.unit_net_price);
    if (body.vat_rate !== undefined)
      updateData.vat_rate = parseFloat(body.vat_rate);
    if (body.qty !== undefined) updateData.qty = parseInt(body.qty);
    if (body.payment_link !== undefined)
      updateData.payment_link = body.payment_link;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabaseServer
      .from("invoices")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Invoice");
      }
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse(data, "Invoice updated successfully")
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode =
      error instanceof ValidationFailedError
        ? 400
        : error instanceof NotFoundError
        ? 404
        : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseServer
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Invoice");
      }
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse(null, "Invoice deleted successfully")
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof NotFoundError ? 404 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PATCH /api/invoices/[id] - Update invoice status or other partial updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    let finalUpdateData = updateData;

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'mark_paid':
          finalUpdateData = { status: 'paid' as InvoiceStatus };
          break;
        case 'mark_sent':
          finalUpdateData = { status: 'sent' as InvoiceStatus };
          break;
        case 'mark_draft':
          finalUpdateData = { status: 'draft' as InvoiceStatus };
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    }

    // Update the invoice
    const { data, error } = await supabaseServer
      .from('invoices')
      .update(finalUpdateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Invoice');
      }
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const actionMessages = {
      mark_paid: 'marked as paid',
      mark_sent: 'marked as sent',
      mark_draft: 'marked as draft'
    };

    const message = action 
      ? `Invoice ${actionMessages[action as keyof typeof actionMessages]}`
      : 'Invoice updated successfully';

    return NextResponse.json(createSuccessResponse(data, message));
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof NotFoundError ? 404 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
