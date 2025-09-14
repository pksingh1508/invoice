import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { invoiceQueries } from "@/lib/database/invoices";
import { profileServerQueries } from "@/lib/database/profiles";
import { 
  generateInvoicePDF,
  generateInvoicePDFForEmail,
  createRenderOptionsFromInvoiceData 
} from "@/lib/pdf/generator";
import { generateBrandingFromProfile } from "@/lib/pdf/branding";
import { handleApiError, createSuccessResponse } from "@/lib/utils/errors";

// POST /api/pdf - Generate PDF from invoice data
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      invoice_id,
      template_id = 'classic-professional',
      format = 'blob',
      quality = 'standard',
      for_email = false
    } = body;
    
    if (!invoice_id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }
    
    // Get invoice data
    const invoiceResult = await invoiceQueries.getInvoice(invoice_id);
    if (invoiceResult.error || !invoiceResult.data) {
      return NextResponse.json(
        { error: invoiceResult.error || "Invoice not found" },
        { status: 404 }
      );
    }
    
    // Check if user owns this invoice
    if (invoiceResult.data.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Get user profile using server-side query
    const profileResult = await profileServerQueries.getProfile(userId);
    let userProfile = profileResult.data;
    
    // If profile doesn't exist, create a default one for PDF generation
    if (!userProfile) {
      userProfile = {
        id: userId,
        business_name: 'Your Business',
        business_email: '',
        business_phone: '',
        business_address: '',
        logo_url: '',
        default_currency: 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    // Generate branding from profile
    const branding = generateBrandingFromProfile(userProfile);
    
    // Create render options
    console.log('Creating render options for template:', template_id);
    const renderOptions = createRenderOptionsFromInvoiceData(
      template_id,
      invoiceResult.data,
      userProfile,
      branding
    );
    
    console.log('Render options created:', {
      template_id: renderOptions.template_id,
      business_name: renderOptions.data?.business?.name,
      client_name: renderOptions.data?.client?.name,
      invoice_number: renderOptions.data?.invoice?.number
    });
    
    // Generate PDF
    console.log('Generating PDF with options:', {
      template_id,
      invoice_id,
      userProfile: {
        business_name: userProfile.business_name,
        business_email: userProfile.business_email
      }
    });
    
    const pdfResult = for_email 
      ? await generateInvoicePDFForEmail(renderOptions, { format, quality })
      : await generateInvoicePDF(renderOptions, { format, quality });
    
    if (!pdfResult.success) {
      console.error('PDF generation failed:', pdfResult.error);
      return NextResponse.json(
        { error: pdfResult.error || "PDF generation failed" },
        { status: 500 }
      );
    }
    
    // Return appropriate response based on format
    if (format === 'blob' && pdfResult.blob) {
      // Return the PDF as a file download
      const arrayBuffer = await pdfResult.blob.arrayBuffer();
      
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
          'Content-Length': arrayBuffer.byteLength.toString(),
        },
      });
    } else if (format === 'arrayBuffer' && pdfResult.arrayBuffer) {
      // Return as binary data for email attachments
      return new NextResponse(pdfResult.arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
          'Content-Length': pdfResult.arrayBuffer.byteLength.toString(),
        },
      });
    } else {
      // Return metadata and base64 for other uses
      return NextResponse.json(createSuccessResponse({
        filename: pdfResult.filename,
        size: pdfResult.size,
        success: true
      }));
    }
    
  } catch (error) {
    console.error('PDF API Error:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET /api/pdf?invoice_id=xxx - Quick PDF download
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const invoice_id = searchParams.get('invoice_id');
    const template_id = searchParams.get('template_id') || 'classic-professional';
    
    if (!invoice_id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }
    
    // Reuse the POST logic by creating a request body
    const body = {
      invoice_id,
      template_id,
      format: 'blob',
      quality: 'standard',
      for_email: false
    };
    
    // Create a mock request with the body
    const mockRequest = {
      json: async () => body
    } as NextRequest;
    
    // Call POST handler
    return await POST(mockRequest);
    
  } catch (error) {
    console.error('PDF GET API Error:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}