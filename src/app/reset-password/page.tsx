import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-zinc-500">로딩…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
