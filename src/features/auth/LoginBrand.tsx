/** Tanda grafis sederhana: kotak dengan denyut jantung, diambil dari nama produk. */
export function AuthProviderIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-md bg-white/12 ring-1 ring-white/20`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2-5 3 10 2.5-5H21" />
      </svg>
    </span>
  );
}
