'use client';

import { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export function FAQItem({ question, answer, defaultOpen = false }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-primary-light">
      <button
        type="button"
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-sm font-bold leading-[1.08] tracking-tight-2 text-slate-900 sm:text-xs">{question}</span>
        <span className="ml-4 flex-shrink-0">
          <ChevronIcon
            className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="body-text pb-5 text-slate-600">{answer}</p>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
