import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-[24px] font-medium tracking-[-0.012em] text-paper">
          Page not found
        </h2>
        <p className="mt-2 text-[15px] font-normal text-fog">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-buttons bg-acid-lime px-4 py-2.5 text-[14px] font-medium tracking-tight text-void shadow-acid"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
