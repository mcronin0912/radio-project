"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
