"use client";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export default function ErrorFallback({ error, reset, title = "Bir hata oluştu" }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6" role="alert">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-2 text-xl font-semibold text-white">{title}</h2>
        <p className="mb-6 text-sm text-slate-300">
          {error.message || "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin."}
        </p>
        {error.digest && (
          <p className="mb-4 text-xs text-slate-500">Hata kodu: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-lime-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-lime-300"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
