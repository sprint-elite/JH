"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HelpCircle, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import type { EmblemResult } from "@/lib/ai-design/generate-emblem";
import {
  loadAiDesignHistory,
  pushAiDesignHistory,
  resolveAiDesignDataUrl,
  type StoredAiDesign,
} from "@/lib/ai-design/history";
import { MAX_AI_REFERENCE_IMAGES } from "@/lib/ai-design/constants";
import { prepareReferenceImage } from "@/lib/ai-design/prepare-reference";
import {
  parseAiRequestIntent,
  type AiRequestIntent,
} from "@/lib/ai-design/request-intent";

type ReferenceThumb = {
  id: string;
  file: File;
  previewUrl: string;
};

interface AiDesignHelperPanelProps {
  open: boolean;
  disabled?: boolean;
  placing?: boolean;
  onClose: () => void;
  onPlace: (dataUrl: string, intent?: AiRequestIntent) => Promise<void>;
}

function FieldHelpBlock({
  label,
  required,
  title,
  lines,
  children,
}: {
  label: string;
  required?: boolean;
  title: string;
  lines: string[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="block">
      <span className="mb-1.5 flex items-center text-[11px] font-semibold text-zinc-500">
        {label}
        {required ? (
          <span className="ml-0.5 text-rose-500" aria-hidden>
            *
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-1 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          aria-label={`${title} 입력 도움말`}
          aria-expanded={open}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </span>
      {open ? (
        <div className="mb-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-left">
          <p className="text-[11px] font-bold text-zinc-800">{title}</p>
          <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-zinc-600">
            {lines.map((line) => (
              <li key={line} className="rounded-lg bg-white px-2 py-1.5">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {children}
    </div>
  );
}

function AiWorkingStatus({
  busy,
  placing,
  withReferenceImages,
}: {
  busy: boolean;
  placing: boolean;
  withReferenceImages: boolean;
}) {
  if (!busy && !placing) return null;

  const title = placing
    ? "티셔츠에 올리는 중입니다"
    : withReferenceImages
      ? "레퍼런스를 보고 시안을 만드는 중입니다"
      : "AI가 시안을 만드는 중입니다";
  const detail = placing
    ? "캔버스에 배치하고 있습니다. 잠시만 기다려 주세요."
    : "보통 20~60초 걸립니다. 창을 닫지 말고 기다려 주세요.";

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 px-3 py-3"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-rose-700">{title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-rose-600/90">
            {detail}
          </p>
          {busy ? (
            <p className="mt-1.5 text-[10px] font-medium text-rose-500/80">
              작업 중 · 로딩 중
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AiDesignHelperPanel({
  open,
  disabled,
  placing,
  onClose,
  onPlace,
}: AiDesignHelperPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [logoOnlyNoText, setLogoOnlyNoText] = useState(false);
  const [features, setFeatures] = useState("");
  const [reference, setReference] = useState("");
  const [refThumbs, setRefThumbs] = useState<ReferenceThumb[]>([]);
  const [results, setResults] = useState<EmblemResult[]>([]);
  const [history, setHistory] = useState<StoredAiDesign[]>([]);
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiReady, setAiReady] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void loadAiDesignHistory().then((rows) => {
      if (!cancelled) setHistory(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      refThumbs.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // Only run on unmount; thumbs revoke themselves when removed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/ai-design/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { configured?: boolean } | null) => {
        if (!cancelled) setAiReady(Boolean(data?.configured));
      })
      .catch(() => {
        if (!cancelled) setAiReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const remember = async (items: EmblemResult[]) => {
    let next = await loadAiDesignHistory();
    for (const item of items) {
      next = await pushAiDesignHistory({
        id: item.id,
        style: item.style,
        label: item.label,
        dataUrl: item.dataUrl,
        source: item.source,
        savedAt: Date.now(),
      });
    }
    setHistory(next);
  };

  const generateAi = async () => {
    const text = prompt.trim();
    if (!logoOnlyNoText && !text) {
      setError("티셔츠에 넣을 문구를 먼저 적어 주세요.");
      return;
    }
    if (!aiReady) {
      setError("AI 로고를 쓰려면 OPENAI_API_KEY가 필요합니다.");
      return;
    }
    setError(null);
    setBusy(true);
    setApplied(null);
    try {
      const body = await buildGenerateBody(text);
      const res = await fetch("/api/ai-design/generate", {
        method: "POST",
        headers:
          typeof body === "string"
            ? { "Content-Type": "application/json" }
            : undefined,
        body,
      });
      const data = (await res.json()) as {
        images?: EmblemResult[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "시안을 만들지 못했습니다.");
      const images = data.images ?? [];
      setResults(images);
      await remember(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시안을 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const buildGenerateBody = async (text: string) => {
    const payload = {
      title: logoOnlyNoText ? "" : text,
      logoOnly: logoOnlyNoText,
      features: features.trim() || undefined,
      reference: reference.trim() || undefined,
    };
    if (refThumbs.length === 0) {
      return JSON.stringify(payload);
    }
    const form = new FormData();
    form.append("title", payload.title);
    form.append("logoOnly", payload.logoOnly ? "true" : "false");
    if (features.trim()) form.append("features", features.trim());
    if (reference.trim()) form.append("reference", reference.trim());
    for (const item of refThumbs) {
      form.append("referenceImage", await prepareReferenceImage(item.file));
    }
    return form;
  };

  const addReferenceFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((file) => file.type.startsWith("image/"));
    if (incoming.length === 0) {
      setError("PNG, JPG, WEBP 이미지만 올릴 수 있습니다.");
      return;
    }
    setError(null);
    setRefThumbs((prev) => {
      const room = MAX_AI_REFERENCE_IMAGES - prev.length;
      const next = incoming.slice(0, Math.max(0, room)).map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...next];
    });
    if (refInputRef.current) refInputRef.current.value = "";
  };

  const removeReference = (id: string) => {
    setRefThumbs((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const apply = async (item: { id: string; dataUrl: string }) => {
    if (disabled || placing) return;
    setError(null);
    try {
      await onPlace(
        await resolveAiDesignDataUrl(item),
        parseAiRequestIntent(features, reference),
      );
      setApplied(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시안을 올리지 못했습니다.");
    }
  };

  const fieldClass =
    "w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div
      className="pointer-events-auto absolute right-[92px] top-1/2 z-40 w-[min(22rem,calc(100%-6.5rem))] -translate-y-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_16px_40px_rgba(24,24,27,0.16)]"
      aria-busy={busy || placing}
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-900 px-3.5 py-3 text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">AI 디자인 도우미</p>
          <p className="text-[11px] text-zinc-300">문구와 원하는 느낌을 알려 주세요</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
          aria-label="AI 디자인 도우미 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative max-h-[min(36rem,calc(100dvh-8rem))] space-y-3 overflow-y-auto p-3.5">
        {busy || placing ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 bg-white/55 backdrop-blur-[1px]"
            aria-hidden
          />
        ) : null}

        <FieldHelpBlock
          label="어떤 문구로 만들까요?"
          required={!logoOnlyNoText}
          title="문구 입력 예시"
          lines={["ANDONE", "한빛 축구부"]}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder={
              logoOnlyNoText
                ? "문구 없이 심볼만 만들어요"
                : "예: ANDONE, 한빛 축구부"
            }
            disabled={busy || placing || logoOnlyNoText}
            className={fieldClass}
          />
          <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-2.5 py-2 text-left hover:bg-zinc-100/80 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <input
              type="checkbox"
              checked={logoOnlyNoText}
              onChange={(e) => {
                setLogoOnlyNoText(e.target.checked);
                if (e.target.checked) setError(null);
              }}
              disabled={busy || placing}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-rose-500 focus:ring-rose-400"
            />
            <span className="text-[12px] leading-snug text-zinc-700">
              <span className="font-semibold text-zinc-900">
                문구 없이 로고만 생성
              </span>
              <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">
                글자 없이 아이콘·심볼만 만듭니다. 느낌은 아래 「원하는 특징」에
                적어 주세요.
              </span>
            </span>
          </label>
        </FieldHelpBlock>

        <FieldHelpBlock
          label="원하는 특징"
          title="원하는 특징 입력 예시"
          lines={[
            "가슴 작게, 등판 크게 · 보라+검정 2색",
            "마케팅 SaaS 로고, 스위치 아이콘 말고 심플 워드마크",
          ]}
        >
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={2}
            placeholder="예: 보라+검정, 마케팅 서비스 느낌, 가슴 작게"
            disabled={busy || placing}
            className={fieldClass}
          />
        </FieldHelpBlock>

        <FieldHelpBlock
          label="레퍼런스 글자"
          title="레퍼런스 글자 입력 예시"
          lines={[
            "example.com 참고, 보라·검정 톤",
            "학교 마크처럼 미니멀, 스포츠 엠블럼 말고",
          ]}
        >
          <span className="mb-1.5 block text-[10px] font-normal text-zinc-400">
            이미지 최대 {MAX_AI_REFERENCE_IMAGES}장
          </span>
          <textarea
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            rows={2}
            placeholder="참고 사이트·색상·분위기 (예: 보라+검정, 미니멀)"
            disabled={busy || placing}
            className={fieldClass}
          />
          <input
            ref={refInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addReferenceFiles(e.target.files)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {refThumbs.map((item) => (
              <div
                key={item.id}
                className="relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeReference(item.id)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-zinc-900/80 p-0.5 text-white hover:bg-zinc-900"
                  aria-label="레퍼런스 이미지 삭제"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {refThumbs.length < MAX_AI_REFERENCE_IMAGES ? (
              <button
                type="button"
                onClick={() => refInputRef.current?.click()}
                disabled={busy || placing}
                className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-zinc-300 text-zinc-500 hover:border-rose-300 hover:text-rose-500 disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                <span className="text-[9px] font-semibold">이미지</span>
              </button>
            ) : null}
          </div>
        </FieldHelpBlock>

        <div className="relative z-20 space-y-3">
          <AiWorkingStatus
            busy={busy}
            placing={Boolean(placing)}
            withReferenceImages={refThumbs.length > 0}
          />

        <button
          type="button"
          onClick={() => void generateAi()}
          disabled={busy || placing || !aiReady}
          className="relative z-20 flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {busy
            ? refThumbs.length > 0
              ? "사진을 보고 만드는 중…"
              : "시안 만드는 중…"
            : "AI로 만들기"}
        </button>
        </div>

        {error ? <p className="relative z-0 text-center text-[12px] text-rose-600">{error}</p> : null}
        {!aiReady ? (
          <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-500">
            OPENAI_API_KEY를 넣으면 AI 시안을 만들 수 있습니다.
          </p>
        ) : null}

        {results.length > 0 ? (
          <div className="relative z-0">
            <p className="mb-2 text-[11px] font-semibold text-zinc-500">
              시안을 누르면 인쇄면에 올라갑니다
            </p>
            <div className="grid grid-cols-2 gap-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled || busy || placing}
                  onClick={() => void apply(item)}
                  className={`overflow-hidden rounded-xl border bg-zinc-50 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 ${
                    applied === item.id
                      ? "border-rose-400 ring-2 ring-rose-200"
                      : "border-zinc-200"
                  }`}
                >
                  <div className="flex aspect-square items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.dataUrl}
                      alt={item.label}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="block border-t border-zinc-100 px-2 py-1.5 text-center text-[11px] font-semibold text-zinc-600">
                    {applied === item.id ? "올렸어요" : item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="relative z-0">
            <p className="mb-1.5 text-[11px] font-semibold text-zinc-500">최근 시안</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {history.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled || busy || placing}
                  onClick={() => void apply(item)}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 hover:border-rose-300 disabled:opacity-50"
                  title={item.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.dataUrl}
                    alt={item.label}
                    className="h-full w-full object-contain p-1"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
