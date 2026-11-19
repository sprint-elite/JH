export const AI_DESIGN_HISTORY_KEY = "daeji-ai-design-history";

const MAX = 5;
const MAX_STORED_CHARS = 2_000_000;

const fullById = new Map<string, string>();

export type StoredAiDesign = {
  id: string;
  style: string;
  label: string;
  dataUrl: string;
  source: "local" | "openai";
  savedAt: number;
};

function isStored(row: unknown): row is StoredAiDesign {
  return (
    Boolean(row) &&
    typeof row === "object" &&
    typeof (row as StoredAiDesign).id === "string" &&
    typeof (row as StoredAiDesign).dataUrl === "string"
  );
}

function toStored(row: unknown): StoredAiDesign | null {
  if (!row || typeof row !== "object") return null;
  const item = row as Partial<StoredAiDesign>;
  if (typeof item.id !== "string" || typeof item.dataUrl !== "string") return null;
  return {
    id: item.id,
    style: typeof item.style === "string" ? item.style : "openai",
    label: typeof item.label === "string" ? item.label : "AI 로고",
    dataUrl: item.dataUrl,
    source: item.source === "local" ? "local" : "openai",
    savedAt: typeof item.savedAt === "number" ? item.savedAt : 0,
  };
}

const FULL_DB = "daeji-ai-design-full";
const FULL_STORE = "images";

function openFullDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(FULL_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FULL_STORE)) {
        db.createObjectStore(FULL_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB를 열지 못했습니다."));
  });
}

async function saveFullToDb(item: StoredAiDesign) {
  if (typeof window === "undefined" || !window.indexedDB) return;
  const db = await openFullDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FULL_STORE, "readwrite");
    tx.objectStore(FULL_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const all = await new Promise<StoredAiDesign[]>((resolve, reject) => {
    const tx = db.transaction(FULL_STORE, "readonly");
    const req = tx.objectStore(FULL_STORE).getAll();
    req.onsuccess = () => resolve((req.result ?? []).map(toStored).filter(Boolean) as StoredAiDesign[]);
    req.onerror = () => reject(req.error);
  });
  const extra = all
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(MAX)
    .map((row) => row.id);
  if (extra.length > 0) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FULL_STORE, "readwrite");
      for (const idToDrop of extra) tx.objectStore(FULL_STORE).delete(idToDrop);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  db.close();
}

async function loadAllFromDb(): Promise<StoredAiDesign[]> {
  if (typeof window === "undefined" || !window.indexedDB) return [];
  try {
    const db = await openFullDb();
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const tx = db.transaction(FULL_STORE, "readonly");
      const req = tx.objectStore(FULL_STORE).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows
      .map(toStored)
      .filter((row): row is StoredAiDesign => Boolean(row))
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, MAX);
  } catch {
    return [];
  }
}

async function loadFullFromDb(id: string): Promise<string | null> {
  if (typeof window === "undefined" || !window.indexedDB) return null;
  try {
    const db = await openFullDb();
    const row = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(FULL_STORE, "readonly");
      const req = tx.objectStore(FULL_STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    const stored = toStored(row);
    return stored?.dataUrl ?? null;
  } catch {
    return null;
  }
}

export function rememberFullAiDesign(item: StoredAiDesign) {
  fullById.set(item.id, item.dataUrl);
  void saveFullToDb(item).catch(() => undefined);
}

export async function resolveAiDesignDataUrl(item: {
  id: string;
  dataUrl: string;
}) {
  const cached = fullById.get(item.id);
  if (cached?.startsWith("data:image/png") || cached?.startsWith("data:image/webp")) {
    return cached;
  }
  if (cached?.startsWith("data:") && !cached.startsWith("data:image/jpeg")) {
    return cached;
  }
  const fromDb = await loadFullFromDb(item.id);
  if (fromDb?.startsWith("data:")) {
    fullById.set(item.id, fromDb);
    if (!fromDb.startsWith("data:image/jpeg")) return fromDb;
  }
  if (item.dataUrl.startsWith("data:image/jpeg")) {
    if (cached?.startsWith("data:") && !cached.startsWith("data:image/jpeg")) {
      return cached;
    }
    throw new Error("원본 시안을 찾지 못했습니다. 시안을 다시 만들어 올려 주세요.");
  }
  return item.dataUrl;
}

function loadLocalThumbs(): StoredAiDesign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AI_DESIGN_HISTORY_KEY);
    if (!raw) return [];
    if (raw.length > MAX_STORED_CHARS) {
      window.localStorage.removeItem(AI_DESIGN_HISTORY_KEY);
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStored).slice(0, MAX);
  } catch {
    return [];
  }
}

export async function loadAiDesignHistory(): Promise<StoredAiDesign[]> {
  const fromDb = await loadAllFromDb();
  if (fromDb.length > 0) {
    for (const row of fromDb) fullById.set(row.id, row.dataUrl);
    return fromDb;
  }
  return loadLocalThumbs();
}

async function shrinkForStorage(dataUrl: string): Promise<string> {
  if (typeof window === "undefined") return dataUrl;
  if (dataUrl.length < 90_000) return dataUrl;
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const max = 320;
    const scale = Math.min(1, max / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
}

function writeLocalThumbs(items: StoredAiDesign[]): void {
  if (typeof window === "undefined") return;
  let next = items.slice(0, MAX);
  while (next.length > 0) {
    try {
      window.localStorage.setItem(AI_DESIGN_HISTORY_KEY, JSON.stringify(next));
      return;
    } catch {
      next = next.slice(0, -1);
    }
  }
  try {
    window.localStorage.removeItem(AI_DESIGN_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

export async function pushAiDesignHistory(
  item: StoredAiDesign,
): Promise<StoredAiDesign[]> {
  fullById.set(item.id, item.dataUrl);
  try {
    await saveFullToDb(item);
  } catch {
    /* IDB 실패해도 목록은 유지 */
  }
  const next = await loadAllFromDb();
  const list = next.length > 0 ? next : [item, ...loadLocalThumbs().filter((row) => row.id !== item.id)].slice(0, MAX);
  const thumbs = await Promise.all(
    list.map(async (row) => ({
      ...row,
      dataUrl: await shrinkForStorage(row.dataUrl),
    })),
  );
  writeLocalThumbs(thumbs);
  return list;
}
