const MAX_EDGE = 1024;

export async function prepareReferenceImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지를 준비하지 못했습니다.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) => (next ? resolve(next) : reject(new Error("이미지를 준비하지 못했습니다."))),
        "image/png",
      );
    });
    const base = file.name.replace(/\.[^.]+$/, "") || "reference";
    return new File([blob], `${base}.png`, { type: "image/png" });
  } finally {
    bitmap.close();
  }
}
