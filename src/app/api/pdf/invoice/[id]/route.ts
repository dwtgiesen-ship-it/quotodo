import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderInvoicePDF } from "@/lib/invoice-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: invoice, error: invoiceErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (invoiceErr || !invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("*")
    .eq("id", invoice.company_id)
    .single();

  if (companyErr || !company) {
    return new NextResponse("Company not found", { status: 404 });
  }

  try {
    const pdfBuffer = await renderInvoicePDF(invoice, company);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Invoice PDF render failed:", err);
    return new NextResponse("PDF generation failed", { status: 500 });
  }
}
