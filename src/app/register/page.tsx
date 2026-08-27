import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-zinc-500">로딩 중…</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
