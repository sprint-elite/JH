import { writeFileSync } from "fs";

async function main() {
  const res = await fetch("http://127.0.0.1:3000/");
  const html = await res.text();
  const idx = html.indexOf('id="ideas"');
  console.log("ideas idx", idx);
  if (idx < 0) {
    console.log("no ideas section");
    return;
  }
  const chunk = html.slice(idx, idx + 12000);
  writeFileSync("/tmp/ideas-chunk.html", chunk);
  const titles = [
    "커플 에코백",
    "집꾸미기",
    "여행 필수템",
    "반려동물 산책",
    "마켓·플리마켓",
    "기업 웰컴 키트",
    "팬미팅 굿즈",
    "카페 오픈 기념",
  ];
  for (const t of titles) {
    console.log(t, chunk.includes(t) ? "YES" : "NO");
  }
}

main();
