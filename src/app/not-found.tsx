import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold text-zinc-400">404</p>
      <h1 className="mt-2 text-2xl font-bold text-zinc-900">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        요청하신 주소가 변경되었거나 존재하지 않습니다.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          홈으로
        </Link>
        <Link
          href="/products/list"
          className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          상품 목록
        </Link>
      </div>
    </main>
  );
}
