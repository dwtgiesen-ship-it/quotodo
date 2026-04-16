"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateAndSaveQuote } from "@/lib/actions/quotes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function NewQuotePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await generateAndSaveQuote(input);

      if (!res.success || !res.data) {
        setError(res.error || "Generation failed");
        setLoading(false);
        return;
      }

      router.push(`/quotes/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">New Quote</h1>

      <div className="space-y-3">
        <Textarea
          placeholder="Paste client communication here (email, WhatsApp, meeting notes, bullet points)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          disabled={loading}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button onClick={handleGenerate} disabled={loading || input.length < 10}>
            {loading ? "Generating..." : "Generate Quote"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
