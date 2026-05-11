'use client';

interface DiscountTagProps {
  label: string;
  className?: string;
}

export function DiscountTag({ label, className = '' }: DiscountTagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-white shadow-md animate-subtle-shake ${className}`}
    >
      {label}
    </span>
  );
}
