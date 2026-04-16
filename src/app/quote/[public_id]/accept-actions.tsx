"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptQuote, rejectQuote } from "@/lib/actions/public-quote";

type Status = "draft" | "sent" | "accepted" | "rejected";

interface Props {
  publicId: string;
  status: Status;
  acceptedAt: string | null;
  rejectedAt: string | null;
  accent: string;
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function AcceptActions({
  publicId,
  status,
  acceptedAt,
  rejectedAt,
  accent,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setBusy("accept");
    setError(null);
    const res = await acceptQuote(publicId);
    if (!res.success) {
      setError(res.error || "Failed to accept");
      setBusy(null);
      return;
    }
    router.refresh();
  }

  async function handleReject() {
    if (!confirm("Are you sure you want to decline this quote?")) {
      return;
    }
    setBusy("reject");
    setError(null);
    const res = await rejectQuote(publicId);
    if (!res.success) {
      setError(res.error || "Failed to decline");
      setBusy(null);
      return;
    }
    router.refresh();
  }

  // Already accepted
  if (status === "accepted") {
    return (
      <div className="border-t pt-8">
        <div
          className="rounded-lg p-6 text-center"
          style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", borderWidth: 1 }}
        >
          <p className="text-base font-semibold text-green-800 mb-1">
            Quote accepted — thank you!
          </p>
          {acceptedAt && (
            <p className="text-sm text-green-700">
              Accepted on {formatDateTime(acceptedAt)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Rejected
  if (status === "rejected") {
    return (
      <div className="border-t pt-8">
        <div
          className="rounded-lg p-6 text-center"
          style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", borderWidth: 1 }}
        >
          <p className="text-base font-semibold text-red-800 mb-1">Quote declined</p>
          {rejectedAt && (
            <p className="text-sm text-red-700">
              Declined on {formatDateTime(rejectedAt)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Pending decision (draft or sent)
  return (
    <div className="border-t pt-8">
      <p className="text-sm text-center text-muted-foreground mb-4">
        Please review the quote and choose to accept or decline.
      </p>

      {error && (
        <p className="text-sm text-center text-red-600 mb-4">{error}</p>
      )}

      <div className="flex gap-3 justify-center">
        <Button
          size="lg"
          onClick={handleAccept}
          disabled={busy !== null}
          style={{ backgroundColor: accent, borderColor: accent }}
        >
          {busy === "accept" ? "Accepting..." : "Accept Quote"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleReject}
          disabled={busy !== null}
        >
          {busy === "reject" ? "Declining..." : "Decline"}
        </Button>
      </div>
    </div>
  );
}
