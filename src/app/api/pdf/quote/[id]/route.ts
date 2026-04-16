import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderQuotePDF } from "@/lib/pdf";

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

  // Fetch quote (RLS ensures user can only access own)
  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (quoteErr || !quote) {
    return new NextResponse("Quote not found", { status: 404 });
  }

  // Fetch company
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("*")
    .eq("id", quote.company_id)
    .single();

  if (companyErr || !company) {
    return new NextResponse("Company not found", { status: 404 });
  }

  // Fetch line items
  const { data: lineItems, error: itemsErr } = await supabase
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort_order", { ascending: true });

  if (itemsErr) {
    return new NextResponse("Failed to fetch line items", { status: 500 });
  }

  try {
    const pdfBuffer = await renderQuotePDF(quote, lineItems ?? [], company);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quote.quote_number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF render failed:", err);
    return new NextResponse("PDF generation failed", { status: 500 });
  }
}
