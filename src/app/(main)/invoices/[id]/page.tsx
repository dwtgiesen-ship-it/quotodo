import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/invoices";
import { getCompany } from "@/lib/actions/companies";
import { InvoiceView } from "./invoice-view";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoiceResult, companyResult] = await Promise.all([
    getInvoiceById(id),
    getCompany(),
  ]);

  if (!invoiceResult.success || !invoiceResult.data) {
    notFound();
  }

  const brandColor = companyResult.success
    ? companyResult.data?.brand_color_primary ?? null
    : null;

  return (
    <InvoiceView invoice={invoiceResult.data} brandColor={brandColor} />
  );
}
