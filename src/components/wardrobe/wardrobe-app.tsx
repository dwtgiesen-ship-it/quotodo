"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, Check, ImagePlus, LoaderCircle, RotateCcw, Search, Upload, X } from "lucide-react";
import { CATEGORIES, categoryLabel, imageUrl, type WardrobeItem } from "@/lib/wardrobe";
import { prepareImage } from "@/lib/image-client";
import { cn } from "@/lib/utils";
import { ItemSheet } from "./item-sheet";

type Upload = {
  key: string;
  file: File;
  preview: string;
  status: "queued" | "working" | "done" | "error";
  error?: string;
};

const CONCURRENCY = 3;

export function WardrobeApp() {
  const [items, setItems] = useState<WardrobeItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/items")
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error ?? r.statusText))))
      .then(setItems)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  // ── Upload queue ──────────────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/") || /\.(hei[cf]|jpe?g|png|webp)$/i.test(f.name))
      .map<Upload>((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, file, preview: URL.createObjectURL(file), status: "queued" }));
    if (next.length) setUploads((u) => [...u, ...next]);
  }, []);

  useEffect(() => {
    const working = uploads.filter((u) => u.status === "working").length;
    const queued = uploads.filter((u) => u.status === "queued").slice(0, CONCURRENCY - working);
    if (!queued.length) return;
    const keys = new Set(queued.map((u) => u.key));
    setUploads((all) => all.map((u) => (keys.has(u.key) ? { ...u, status: "working" } : u)));
    for (const upload of queued) {
      (async () => {
        try {
          const image = await prepareImage(upload.file);
          const res = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
          const body = await res.json();
          if (!res.ok) throw new Error(body.error ?? "Upload mislukt");
          setItems((list) => [body as WardrobeItem, ...(list ?? [])]);
          setUploads((all) => all.map((u) => (u.key === upload.key ? { ...u, status: "done" } : u)));
        } catch (e) {
          const error = e instanceof Error ? e.message : "Upload mislukt";
          setUploads((all) => all.map((u) => (u.key === upload.key ? { ...u, status: "error", error } : u)));
        }
      })();
    }
  }, [uploads]);

  const retry = (key: string) => setUploads((all) => all.map((u) => (u.key === key ? { ...u, status: "queued", error: undefined } : u)));
  const clearDone = () =>
    setUploads((all) => {
      all.filter((u) => u.status === "done").forEach((u) => URL.revokeObjectURL(u.preview));
      return all.filter((u) => u.status !== "done");
    });
  const dismiss = (key: string) => setUploads((all) => all.filter((u) => u.key !== key));

  // ── Filtering ─────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items ?? []) c[i.category] = (c[i.category] ?? 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((i) => {
      if (filter === "archived") return i.archived;
      if (filter !== "all" && i.category !== filter) return false;
      if (!q) return true;
      return [i.name, i.subcategory, i.material, i.description, i.notes, ...i.colors, ...i.styleTags].join(" ").toLowerCase().includes(q);
    });
  }, [items, filter, query]);

  const openItem = items?.find((i) => i.id === openId) ?? null;
  const pending = uploads.filter((u) => u.status === "queued" || u.status === "working").length;
  const archivedCount = items?.filter((i) => i.archived).length ?? 0;

  return (
    <div
      className="mx-auto max-w-6xl px-4 pb-24 pt-6"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Mijn kast</h1>
          <p className="mt-1 text-sm text-muted">
            {items ? `${items.length} stuks` : "Laden…"} · Upload één kledingstuk per foto, Claude herkent de rest.
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition hover:brightness-110"
        >
          <ImagePlus className="size-4" /> Foto&apos;s toevoegen
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Drop zone / empty state */}
      {(items?.length === 0 || dragging) && (
        <button
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mt-6 flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-16 text-center transition",
            dragging ? "border-accent bg-accent-soft" : "border-line bg-card hover:border-accent",
          )}
        >
          <Upload className="size-8 text-accent" />
          <span className="font-display text-2xl">Sleep je kledingfoto&apos;s hierheen</span>
          <span className="max-w-md text-sm text-muted">
            Tip: leg of hang elk stuk los op een rustige achtergrond. Schoenen, riemen, tassen en zonnebrillen horen er ook bij — dan kan de stylist complete looks maken.
          </span>
        </button>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <section className="mt-6 rounded-2xl border border-line bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">
              {pending ? `Bezig met ${pending} foto${pending === 1 ? "" : "'s"}…` : "Uploads klaar"}
            </span>
            {uploads.some((u) => u.status === "done") && (
              <button onClick={clearDone} className="text-muted hover:text-ink">
                Opruimen
              </button>
            )}
          </div>
          <div className="scroll-x flex gap-3 overflow-x-auto">
            {uploads.map((u) => (
              <div key={u.key} className="relative w-20 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.preview} alt="" className={cn("aspect-[3/4] w-20 rounded-xl object-cover", u.status !== "done" && "opacity-60")} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {u.status === "working" && <LoaderCircle className="size-6 animate-spin text-ink" />}
                  {u.status === "done" && (
                    <span className="rounded-full bg-olive p-1 text-white">
                      <Check className="size-4" />
                    </span>
                  )}
                  {u.status === "error" && (
                    <button onClick={() => retry(u.key)} className="rounded-full bg-accent p-1.5 text-accent-ink" title={u.error}>
                      <RotateCcw className="size-4" />
                    </button>
                  )}
                </div>
                {u.status === "error" && (
                  <>
                    <p className="mt-1 line-clamp-3 text-[10px] leading-tight text-accent">{u.error}</p>
                    <button onClick={() => dismiss(u.key)} className="absolute -right-1 -top-1 rounded-full bg-ink p-0.5 text-bg">
                      <X className="size-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {loadError && <p className="mt-6 rounded-xl bg-accent-soft p-4 text-sm">Kast laden mislukt: {loadError}</p>}

      {items && items.length > 0 && (
        <>
          {/* Filters */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 sm:w-64">
              <Search className="size-4 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek: linnen, navy, loafer…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </label>
            <div className="scroll-x -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>
                Alles <span className="opacity-60">{items.length}</span>
              </Chip>
              {CATEGORIES.filter((c) => counts[c.id]).map((c) => (
                <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                  {c.label} <span className="opacity-60">{counts[c.id]}</span>
                </Chip>
              ))}
              {archivedCount > 0 && (
                <Chip active={filter === "archived"} onClick={() => setFilter("archived")}>
                  <Archive className="size-3.5" /> Niet beschikbaar <span className="opacity-60">{archivedCount}</span>
                </Chip>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visible.map((item) => (
              <button
                key={item.id}
                onClick={() => setOpenId(item.id)}
                className="group overflow-hidden rounded-2xl border border-line bg-card text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[3/4] bg-bg2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(item)} alt={item.name} loading="lazy" className={cn("size-full object-cover", item.archived && "opacity-40 grayscale")} />
                  {item.archived && (
                    <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-bg">niet beschikbaar</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                    {categoryLabel(item.category)}
                    {item.colors[0] ? ` · ${item.colors[0]}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {visible.length === 0 && <p className="mt-10 text-center text-sm text-muted">Niets gevonden.</p>}
        </>
      )}

      {openItem && (
        <ItemSheet
          item={openItem}
          onClose={() => setOpenId(null)}
          onSaved={(saved) => setItems((list) => list?.map((i) => (i.id === saved.id ? saved : i)) ?? null)}
          onDeleted={(id) => {
            setItems((list) => list?.filter((i) => i.id !== id) ?? null);
            setOpenId(null);
          }}
        />
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition",
        active ? "border-ink bg-ink text-bg" : "border-line bg-card text-ink2 hover:border-ink2",
      )}
    >
      {children}
    </button>
  );
}
