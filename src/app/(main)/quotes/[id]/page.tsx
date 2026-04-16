import { notFound } from "next/navigation";
import { getQuoteById } from "@/lib/actions/quotes";
import { getCompany } from "@/lib/actions/companies";
import {
  listQuoteVersions,
  getQuoteVersion,
  diffSnapshots,
} from "@/lib/actions/quote-versions";
import { QuoteView } from "./quote-view";
import { HistoricalVersionView } from "./historical-view";

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { id } = await params;
  const { v } = await searchParams;

  const [quoteResult, companyResult, versionsResult] = await Promise.all([
    getQuoteById(id),
    getCompany(),
    listQuoteVersions(id),
  ]);

  if (!quoteResult.success || !quoteResult.data) {
    notFound();
  }

  const brandColor = companyResult.success
    ? companyResult.data?.brand_color_primary ?? null
    : null;

  const versions = versionsResult.success ? versionsResult.data ?? [] : [];

  // If ?v=N, show historical read-only view
  const requestedVersion = v ? parseInt(v, 10) : null;
  if (
    requestedVersion &&
    requestedVersion !== quoteResult.data.quote.current_version
  ) {
    const versionResult = await getQuoteVersion(id, requestedVersion);
    if (versionResult.success && versionResult.data) {
      // Find previous version for diff
      const previousVersion = versions.find(
        (ver) => ver.version_number === requestedVersion - 1
      );
      const changes = previousVersion
        ? await diffSnapshots(previousVersion.data, versionResult.data.data)
        : [];

      return (
        <HistoricalVersionView
          quoteId={id}
          quoteNumber={quoteResult.data.quote.quote_number}
          version={versionResult.data}
          currentVersion={quoteResult.data.quote.current_version}
          changes={changes}
          brandColor={brandColor}
          allVersions={versions}
        />
      );
    }
  }

  return (
    <QuoteView
      quote={quoteResult.data.quote}
      lineItems={quoteResult.data.lineItems}
      brandColor={brandColor}
      versions={versions}
    />
  );
}
