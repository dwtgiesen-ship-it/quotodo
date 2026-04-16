import { notFound } from "next/navigation";
import { getQuoteById } from "@/lib/actions/quotes";
import { getCompany } from "@/lib/actions/companies";
import { QuoteView } from "./quote-view";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quoteResult, companyResult] = await Promise.all([
    getQuoteById(id),
    getCompany(),
  ]);

  if (!quoteResult.success || !quoteResult.data) {
    notFound();
  }

  const brandColor = companyResult.success
    ? companyResult.data?.brand_color_primary ?? null
    : null;

  return (
    <QuoteView
      quote={quoteResult.data.quote}
      lineItems={quoteResult.data.lineItems}
      brandColor={brandColor}
    />
  );
}
