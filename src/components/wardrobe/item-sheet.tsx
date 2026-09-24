"use client";

import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, LoaderCircle, Trash2, X } from "lucide-react";
import { CATEGORIES, imageUrl, type WardrobeItem } from "@/lib/wardrobe";
import { cn } from "@/lib/utils";

const FORMALITY = ["Sport / strand", "Casual", "Smart casual", "Business / cocktail", "Gala"];
const WARMTH = ["Hittebestendig", "Zomer", "Tussenseizoen", "Koud", "Winter"];

export function ItemSheet({
  item,
  onClose,
  onSaved,
  onDeleted,
}: {
  item: WardrobeItem;
  onClose: () => void;
  onSaved: (item: WardrobeItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState({
    ...item,
    colorsText: item.colors.join(", "),
    tagsText: item.styleTags.join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error ?? "Opslaan mislukt");
      onSaved(saved);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    const ok = await patch({
      name: draft.name,
      category: draft.category,
      subcategory: draft.subcategory,
      colors: split(draft.colorsText),
      pattern: draft.pattern,
      material: draft.material,
      fit: draft.fit,
      formality: draft.formality,
      warmth: draft.warmth,
      styleTags: split(draft.tagsText),
      description: draft.description,
      notes: draft.notes,
    });
    if (ok) onClose();
  }

  async function remove() {
    if (!confirm(`"${item.name}" definitief verwijderen?`)) return;
    await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    onDeleted(item.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:flex-row sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 shrink-0 bg-bg2 sm:h-auto sm:w-2/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(item)} alt={item.name} className="size-full object-contain" />
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-card/90 p-1.5 sm:hidden">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-sm text-muted">Details aanpassen</span>
            <button onClick={onClose} className="hidden rounded-full p-1 hover:bg-bg2 sm:block">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
            <Field label="Naam">
              <input className={inputCls} value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categorie">
                <select className={inputCls} value={draft.category} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <input className={inputCls} value={draft.subcategory} onChange={(e) => set("subcategory", e.target.value)} />
              </Field>
              <Field label="Kleuren">
                <input className={inputCls} value={draft.colorsText} onChange={(e) => set("colorsText", e.target.value)} />
              </Field>
              <Field label="Materiaal">
                <input className={inputCls} value={draft.material} onChange={(e) => set("material", e.target.value)} />
              </Field>
              <Field label="Patroon">
                <input className={inputCls} value={draft.pattern} onChange={(e) => set("pattern", e.target.value)} />
              </Field>
              <Field label="Pasvorm">
                <input className={inputCls} value={draft.fit} onChange={(e) => set("fit", e.target.value)} />
              </Field>
            </div>
            <Scale label="Formeel" value={draft.formality} labels={FORMALITY} onChange={(v) => set("formality", v)} />
            <Scale label="Warmte" value={draft.warmth} labels={WARMTH} onChange={(v) => set("warmth", v)} />
            <Field label="Stijl">
              <input className={inputCls} value={draft.tagsText} onChange={(e) => set("tagsText", e.target.value)} />
            </Field>
            <Field label="Beschrijving (dit leest de stylist)">
              <textarea rows={3} className={inputCls} value={draft.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Eigen notitie">
              <textarea
                rows={2}
                className={inputCls}
                placeholder="Bijv. valt klein, alleen voor bruiloften, favoriet…"
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
            {error && <p className="text-accent">{error}</p>}
          </div>

          <div className="flex items-center gap-2 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button onClick={remove} className="rounded-full p-2 text-muted hover:bg-bg2 hover:text-accent" title="Verwijderen">
              <Trash2 className="size-4" />
            </button>
            <button
              onClick={() => patch({ archived: !item.archived })}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-muted hover:bg-bg2 hover:text-ink"
              title="Tijdelijk niet beschikbaar (in de was, uitgeleend) — de stylist slaat het over"
            >
              {item.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              <span className="text-xs">{item.archived ? "Weer beschikbaar" : "Niet beschikbaar"}</span>
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="ml-auto flex items-center gap-2 rounded-full bg-ink px-5 py-2 font-medium text-bg disabled:opacity-60"
            >
              {saving && <LoaderCircle className="size-4 animate-spin" />} Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-ink2";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Scale({ label, value, labels, onChange }: { label: string; value: number; labels: string[]; onChange: (v: number) => void }) {
  return (
    <div>
      <span className="mb-1 flex justify-between text-xs font-medium text-muted">
        {label} <span className="text-ink2">{labels[value - 1]}</span>
      </span>
      <div className="flex gap-1">
        {labels.map((l, i) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(i + 1)}
            className={cn("h-2 flex-1 rounded-full transition", i < value ? "bg-accent" : "bg-line")}
            aria-label={l}
          />
        ))}
      </div>
    </div>
  );
}
