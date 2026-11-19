#!/usr/bin/env bash
# ChatGPT 등 외부 AI에 붙일 프로젝트 맥락 덤프 (단위테스트 결과서 작성용)
# 사용: bash scripts/export-unit-test-context.sh | pbcopy   (또는 > context.txt)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "===== JHproject 단위테스트 컨텍스트 덤프 ====="
echo "생성일: $(date -Iseconds)"
echo ""

echo "----- [1] package.json (name, scripts) -----"
node -e "const p=require('./package.json'); console.log(JSON.stringify({name:p.name,version:p.version,scripts:p.scripts},null,2))" 2>/dev/null || cat package.json | head -30
echo ""

echo "----- [2] Prisma models (이름만) -----"
grep -E '^model |^enum ' prisma/schema.prisma | sed 's/{//'
echo ""

echo "----- [3] API Routes (app router) -----"
find src/app/api -name 'route.ts' 2>/dev/null | sed "s|^src/app/api|/api|" | sed 's|/route.ts||' | sort
echo ""

echo "----- [4] src/lib/*.ts (파일 목록) -----"
find src/lib -maxdepth 1 -name '*.ts' -type f 2>/dev/null | sed 's|^src/||' | sort
echo ""

echo "----- [5] src/lib 주요 export 함수 (export function / export async) -----"
grep -RhE '^(export )?(async )?function [a-zA-Z0-9_]+' src/lib --include='*.ts' 2>/dev/null \
  | sed 's/^/  /' | head -120
echo ""

echo "----- [6] 테이블 정의서 요약 (docs) -----"
if [ -f docs/테이블정의서.md ]; then
  sed -n '1,80p' docs/테이블정의서.md
  echo "... (전체는 docs/테이블정의서.md)"
fi
echo ""

echo "===== END CONTEXT ====="
