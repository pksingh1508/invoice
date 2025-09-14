import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  handleApiError,
  createSuccessResponse,
  validateRequired,
  validateEmail,
  combineValidationErrors,
  ValidationFailedError
} from "@/lib/utils/errors";
import { CreateClient, ClientQueryParams } from "@/types/database";

// GET /api/clients - Get all clients with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params: ClientQueryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "name",
      sortOrder: (searchParams.get("sortOrder") as any) || "asc"
    };

    // Get clients from database
    let query = supabaseServer
      .from("clients")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    // Apply search filter
    if (params.search) {
      query = query.or(
        `name.ilike.%${params.search}%,email.ilike.%${params.search}%`
      );
    }

    // Apply sorting and pagination
    const offset = ((params.page || 1) - 1) * (params.limit || 10);
    const { data, error, count } = await query
      .order(params.sortBy || "name", {
        ascending: params.sortOrder === "asc"
      })
      .range(offset, offset + (params.limit || 10) - 1);

    if (error) {
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / (params.limit || 10));

    return NextResponse.json(
      createSuccessResponse({
        clients: data || [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: count || 0,
          totalPages
        }
      })
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const validationErrors = combineValidationErrors(
      validateRequired(body.name, "name"),
      validateEmail(body.email, "email")
    );

    if (validationErrors.length > 0) {
      throw new ValidationFailedError(validationErrors);
    }

    // Create client data
    const clientData: CreateClient = {
      user_id: userId,
      name: body.name,
      email: body.email || null,
      address: body.address || null
    };

    const { data, error } = await supabaseServer
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) {
      const errorResponse = handleApiError(error);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(
      createSuccessResponse(data, "Client created successfully"),
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    const statusCode = error instanceof ValidationFailedError ? 400 : 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
