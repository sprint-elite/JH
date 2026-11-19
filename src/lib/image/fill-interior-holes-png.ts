import sharp from "sharp";
import { fillInteriorHolesRgba } from "./fill-interior-holes";

export async function fillInteriorHolesPng(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const filled = fillInteriorHolesRgba(data, info.width, info.height);
  if (filled === 0) return input;

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

export async function fillInteriorHolesDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:(image\/(?:png|webp|jpeg|jpg));base64,(.+)$/i.exec(
    dataUrl,
  );
  if (!match) return dataUrl;
  const buf = Buffer.from(match[2], "base64");
  const next = await fillInteriorHolesPng(buf);
  return `data:image/png;base64,${next.toString("base64")}`;
}
