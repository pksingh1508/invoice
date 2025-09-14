import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  handleApiError,
  createSuccessResponse,
  validateEmail,
  combineValidationErrors,
  ValidationFailedError,
  NotFoundError
} from "@/lib/utils/errors";
import { UpdateClient } from "@/types/database";

// GET /api/clients/[id] - Get a single client
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
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Client");
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

// PUT /api/clients/[id] - Update a client
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

    // Validate email if provided
    const validationErrors = combineValidationErrors(
      body.email ? validateEmail(body.email, "email") : []
    );

    if (validationErrors.length > 0) {
      throw new ValidationFailedError(validationErrors);
    }

    // Create update data - only include fields that are provided
    const updateData: UpdateClient = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.address !== undefined) updateData.address = body.address;

    const { data, error } = await supabaseServer
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Client");
      }
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse(data, "Client updated successfully")
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

// DELETE /api/clients/[id] - Delete a client
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
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Client");
      }
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse(null, "Client deleted successfully")
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof NotFoundError ? 404 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
