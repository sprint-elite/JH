import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_MOCKUPS = path.join(process.cwd(), "public/mockups");
const OUT_IMAGES = path.join(process.cwd(), "public/images");

type Kind = "tee" | "polo" | "hoodie";

function shirtBody(kind: Kind, fill: string, stroke: string, back: boolean) {
  const collar =
    kind === "polo"
      ? `<path d="M168 108 L200 138 L232 108 L222 96 L200 118 L178 96 Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
         <path d="M178 96 L200 118 L222 96" fill="none" stroke="${stroke}" stroke-width="3"/>
         ${
           back
             ? ""
             : `<circle cx="188" cy="128" r="3.2" fill="${stroke}"/><circle cx="188" cy="142" r="3.2" fill="${stroke}"/>`
         }`
      : kind === "hoodie"
        ? `<path d="M150 78 C150 52 178 38 200 38 C222 38 250 52 250 78 L238 118 C226 108 214 104 200 104 C186 104 174 108 162 118 Z" fill="${fill}" stroke="${stroke}" stroke-width="3.5"/>
           ${
             back
               ? `<path d="M200 104 L200 210" stroke="${stroke}" stroke-width="3" fill="none"/>`
               : `<path d="M176 92 C188 108 212 108 224 92" fill="none" stroke="${stroke}" stroke-width="3"/>
                  <path d="M188 210 H212 V248 H188 Z" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`
           }`
        : `<path d="M168 96 C176 118 188 130 200 130 C212 130 224 118 232 96" fill="${fill}" stroke="${stroke}" stroke-width="3.5"/>`;

  const sleeves =
    kind === "hoodie"
      ? `<path d="M78 150 C40 168 28 214 42 268 L92 252 C88 220 96 188 118 168 Z" fill="${fill}" stroke="${stroke}" stroke-width="3.5"/>
         <path d="M322 150 C360 168 372 214 358 268 L308 252 C312 220 304 188 282 168 Z" fill="${fill}" stroke="${stroke}" stroke-width="3.5"/>`
      : `<path d="M86 138 C48 152 36 198 52 236 L98 220 C94 196 102 168 122 152 Z" fill="${fill}" stroke="${stroke}" stroke-width="3.5"/>
         <path d="M314 138 C352 152 364 198 348 236 L302 220 C306 196 298 168 278 152 Z" fill="${fill}" stroke="${stroke}" stroke-width="3.5"/>`;

  const hem =
    kind === "hoodie"
      ? `<path d="M118 390 C118 412 154 424 200 424 C246 424 282 412 282 390" fill="none" stroke="${stroke}" stroke-width="3"/>`
      : `<path d="M118 392 H282" stroke="${stroke}" stroke-width="3" fill="none"/>`;

  return `
    ${sleeves}
    <path d="M122 148 C146 118 164 108 200 108 C236 108 254 118 278 148 L282 392 C250 408 150 408 118 392 Z" fill="${fill}" stroke="${stroke}" stroke-width="3.5"/>
    ${collar}
    ${hem}
  `;
}

function svgFor(kind: Kind, fill: string, back: boolean, transparent: boolean) {
  const stroke = "#c5c0b6";
  const bg = transparent
    ? ""
    : `<rect width="400" height="520" fill="#f7f6f3"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520">
  ${bg}
  <g>
    ${shirtBody(kind, fill, stroke, back)}
  </g>
</svg>`;
}

async function writePng(filePath: string, svg: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(filePath);
}

async function main() {
  const jobs: Array<{ file: string; kind: Kind; fill: string; back: boolean; transparent: boolean }> = [
    { file: path.join(OUT_MOCKUPS, "tee-front.png"), kind: "tee", fill: "#f3efe6", back: false, transparent: true },
    { file: path.join(OUT_MOCKUPS, "tee-back.png"), kind: "tee", fill: "#f3efe6", back: true, transparent: true },
    { file: path.join(OUT_MOCKUPS, "polo-front.png"), kind: "polo", fill: "#1f3b66", back: false, transparent: true },
    { file: path.join(OUT_MOCKUPS, "polo-back.png"), kind: "polo", fill: "#1f3b66", back: true, transparent: true },
    { file: path.join(OUT_MOCKUPS, "hoodie-front.png"), kind: "hoodie", fill: "#2a2a2a", back: false, transparent: true },
    { file: path.join(OUT_MOCKUPS, "hoodie-back.png"), kind: "hoodie", fill: "#2a2a2a", back: true, transparent: true },
    { file: path.join(OUT_IMAGES, "tee.png"), kind: "tee", fill: "#f3efe6", back: false, transparent: false },
    { file: path.join(OUT_IMAGES, "polo.png"), kind: "polo", fill: "#1f3b66", back: false, transparent: false },
    { file: path.join(OUT_IMAGES, "hoodie.png"), kind: "hoodie", fill: "#2a2a2a", back: false, transparent: false },
    { file: path.join(OUT_IMAGES, "tee-navy.png"), kind: "tee", fill: "#243a5e", back: false, transparent: false },
    { file: path.join(OUT_IMAGES, "tee-black.png"), kind: "tee", fill: "#222222", back: false, transparent: false },
    { file: path.join(OUT_IMAGES, "tee-mint.png"), kind: "tee", fill: "#9ad7c8", back: false, transparent: false },
    { file: path.join(OUT_IMAGES, "polo-white.png"), kind: "polo", fill: "#f7f4ee", back: false, transparent: false },
    { file: path.join(OUT_IMAGES, "hoodie-cream.png"), kind: "hoodie", fill: "#ece6d8", back: false, transparent: false },
    { file: path.join(OUT_IMAGES, "hoodie-zip.png"), kind: "hoodie", fill: "#3d4a3c", back: false, transparent: false },
  ];

  for (const job of jobs) {
    await writePng(job.file, svgFor(job.kind, job.fill, job.back, job.transparent));
    console.log("wrote", path.relative(process.cwd(), job.file));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
