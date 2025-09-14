import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { invoiceServerQueries } from "@/lib/database/invoices";
import { clientServerQueries } from "@/lib/database/clients";
import { handleApiError, createSuccessResponse } from "@/lib/utils/errors";

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all dashboard data in parallel
    const [invoiceStatsResult, recentInvoicesResult, clientStatsResult] =
      await Promise.all([
        invoiceServerQueries.getInvoiceStats(userId),
        invoiceServerQueries.getRecentInvoices(userId, 5),
        clientServerQueries.getClientStats(userId)
      ]);

    // Check for errors
    if (invoiceStatsResult.error) {
      return NextResponse.json(
        { error: invoiceStatsResult.error },
        { status: 500 }
      );
    }

    if (recentInvoicesResult.error) {
      return NextResponse.json(
        { error: recentInvoicesResult.error },
        { status: 500 }
      );
    }

    if (clientStatsResult.error) {
      return NextResponse.json(
        { error: clientStatsResult.error },
        { status: 500 }
      );
    }

    // Combine all data
    const dashboardData = {
      stats: {
        ...invoiceStatsResult.data,
        ...clientStatsResult.data
      },
      recent_invoices: recentInvoicesResult.data
    };

    return NextResponse.json(createSuccessResponse(dashboardData));
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
