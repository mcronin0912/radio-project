"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090a",
          color: "#d0d6e0",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 510,
              letterSpacing: "-0.012em",
              color: "#ffffff",
            }}
          >
            Something went wrong
          </h2>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              border: "none",
              borderRadius: 6,
              background: "#e4f222",
              color: "#08090a",
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 510,
              letterSpacing: "-0.011em",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
