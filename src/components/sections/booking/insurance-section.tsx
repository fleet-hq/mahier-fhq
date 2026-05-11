'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface InsuranceOption {
  id: string;
  title: string;
  price: number;
  description?: string;
  features?: string[];
}

interface InsuranceSectionProps {
  options: InsuranceOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

// SLI requires RCLI to be selected
const DEPENDENCY_RULES: Record<string, { requires: string; label: string; message: string }> = {
  sli: { requires: 'rcli', label: 'RCLI', message: 'Requires RCLI coverage' },
};

// Rich content for each insurance type
interface InsuranceDetailContent {
  fullTitle: string;
  description: string;
  whyBuyTitle: string;
  whyBuyPoints: string[];
  coverageTitle: string;
  coverageFeatures: string[];
  brochureUrl: string;
}

const INSURANCE_DETAILS: Record<string, InsuranceDetailContent> = {
  cdw: {
    fullTitle: 'Collision Damage Warranty (CDW)',
    description: 'Covers physical damages to the rental vehicle when there is an accident with another vehicle.',
    whyBuyTitle: 'Why buy primary damage?',
    whyBuyPoints: [
      'If you have an auto policy, though prefer not to risk a premium increase in case you damage the rental car. Or..',
      "If you you don't have an auto and/or normally use a credit card that only provides secondary damage insurance. Or..",
      'If you normally drive a commercial vehicle, which has insurance that does not cover you for damage to the rental car.',
    ],
    coverageTitle: 'Affordable Rental Vehicle Damage Insurance',
    coverageFeatures: [
      'Up to $35,000 Damage',
      '$1,000 Deductible',
      'Primary Insurance for accidents between vehicles',
      'Does not cover non-rental vehicle damage',
      'Excludes comprehensive coverage, such as mechanical issues caused by misuse, theft, vandalism, single car accident',
      'Not for commercial use. Not compatible with cars for hire and delivery services such as Uber, Lyft, DoorDash.',
    ],
    brochureUrl: '/bonzah/bonzah-cdw-brochure.pdf',
  },
  rcli: {
    fullTitle: "Renter's Contingent Liability Insurance (RCLI)",
    description: "Covers damage to 3rd parties' property and injury when renter is at fault in accident. Does not cover rental vehicle.",
    whyBuyTitle: 'Why buy primary liability?',
    whyBuyPoints: [
      'If you have an auto policy, though prefer not to risk a premium increase in case of a liability claim up to the state minimum requirement. Or..',
      "If you don't have an auto policy and don't want to be financially responsible for injuries to persons and property up to the state minimum requirement. Or..",
      'If you normally drive a commercial vehicle, which has insurance that does not cover you for liability to other persons or property while driving a rented vehicle.',
    ],
    coverageTitle: 'Primary State Minimum Liability Insurance',
    coverageFeatures: [
      'Bodily Injury - Per Person -',
      'Bodily Injury - Aggregate -',
      'Property Damage -',
    ],
    brochureUrl: '/bonzah/bonzah-rcli-brochure.pdf',
  },
  sli: {
    fullTitle: 'Supplemental Liability Insurance (SLI)',
    description: 'Supplements RCLI coverage to enhanced levels of coverage. Not a standalone or primary policy, must be purchased with RCLI.',
    whyBuyTitle: 'Why buy supplemental liability?',
    whyBuyPoints: [
      'If you have an auto policy with low liability coverage, and want to increase it up to an aggregate of $500,000. Or..',
      'If you have selected the above primary liability insurance (RCLI), and want to increase your coverage beyond the state minimum for injuries to persons and property up to an aggregate of $500,000.',
    ],
    coverageTitle: 'Coverage is in Excess of Any Primary Liability Coverage',
    coverageFeatures: [
      'Bodily Injury - Per Person - Up to $100,000 in total',
      'Bodily Injury - Aggregate - Up to $500,000 in total',
      'Property Damage - $10,000 additional coverage',
    ],
    brochureUrl: '/bonzah/bonzah-sli-brochure.pdf',
  },
  pai: {
    fullTitle: 'Personal Accident / Personal Effects Insurance',
    description: 'Covers life, medical expenses, and lost or damaged items. Not rental vehicle coverage.',
    whyBuyTitle: 'Why buy personal accident & effects coverage?',
    whyBuyPoints: [
      'If there is an accidental death or accidental medical expense, these insurances protect the specified losses.',
      'If you do not have death protection this coverage protects the primary Renter or Sharer and their immediate family for a death while traveling.',
      'Personal Effects Coverage protects Your personal belongings as the primary Renter or Sharer and those of Your immediate family traveling with You.',
    ],
    coverageTitle: 'Accident, Medical & Personal Effects Insurance',
    coverageFeatures: [
      'Renter Loss of Life - $50,000',
      'Passenger Loss of Life - $5,000',
      'Accidental Medical Expense - $1,000',
      'Personal Effects Coverage - $500 with up to $25 deductible will be applied',
    ],
    brochureUrl: '/bonzah/bonzah-pai-brochure.pdf',
  },
};

/* ─── Detail Modal ─── */
function InsuranceDetailModal({
  detail,
  price,
  isSelected,
  disabled,
  onToggle,
  onClose,
}: {
  detail: InsuranceDetailContent;
  price: number;
  isSelected: boolean;
  disabled: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [whyBuyOpen, setWhyBuyOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Image src="/icons/booking/shield.svg" alt="" width={14} height={14} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">{detail.fullTitle}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">${price.toFixed(2)}</span>
            <span className="text-sm text-slate-500">/ 24 hours</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">{detail.description}</p>

          {/* Why Buy — Accordion with slide transition */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setWhyBuyOpen(!whyBuyOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-medium text-primary">{detail.whyBuyTitle}</span>
              <svg
                className={`h-4 w-4 text-primary shrink-0 transition-transform duration-300 ${whyBuyOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className="transition-[grid-template-rows] duration-300 ease-in-out grid"
              style={{ gridTemplateRows: whyBuyOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 border-t border-slate-100">
                  <ul className="mt-3 space-y-3">
                    {detail.whyBuyPoints.map((point, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Features */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-3">{detail.coverageTitle}</h4>
            <ul className="space-y-2.5">
              {detail.coverageFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <svg className="h-5 w-5 shrink-0 text-primary mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Brochure Link */}
          <a
            href={detail.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Description of Coverage
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            disabled={disabled}
            onClick={() => { onToggle(); onClose(); }}
            className={`w-full rounded-lg py-3 text-sm font-semibold transition-colors ${
              disabled
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isSelected
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {disabled ? 'Requires RCLI' : isSelected ? 'Remove Coverage' : 'Add Coverage'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Scroll Arrow ─── */
function ScrollArrow({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const isRight = direction === 'right';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:bg-slate-50 transition-opacity ${
        isRight ? '-right-3' : '-left-3'
      }`}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isRight ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
        />
      </svg>
    </button>
  );
}

/* ─── Main Section ─── */
export function InsuranceSection({ options, selectedIds, onToggle }: InsuranceSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [detailModal, setDetailModal] = useState<string | null>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, options]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(':scope > div')?.clientWidth ?? 200;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  };

  const isDisabled = (optionId: string): boolean => {
    const rule = DEPENDENCY_RULES[optionId];
    if (!rule) return false;
    return !selectedIds.has(rule.requires);
  };

  const getRule = (optionId: string) => DEPENDENCY_RULES[optionId];

  // Find the option for the open modal
  const modalOption = detailModal ? options.find((o) => o.id === detailModal) : null;
  const modalDetail = detailModal ? INSURANCE_DETAILS[detailModal] : null;

  return (
    <section>
      <h2 className="font-manrope text-base font-semibold leading-none tracking-tight-2 text-navy">Insurance</h2>

      <div className="relative mt-5">
        {canScrollLeft && <ScrollArrow direction="left" onClick={() => scroll('left')} />}
        {canScrollRight && <ScrollArrow direction="right" onClick={() => scroll('right')} />}

        <div ref={scrollRef} className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-stretch gap-4">
            {options.map((option) => {
              const isSelected = selectedIds.has(option.id);
              const disabled = isDisabled(option.id);
              const rule = getRule(option.id);
              const isOwn = option.id === 'own';
              const hasDetail = !!INSURANCE_DETAILS[option.id];

              return (
                <div
                  key={option.id}
                  className={`relative flex flex-col overflow-hidden rounded-lg border px-4 py-4 transition-all duration-200 w-[calc((100%-32px)/3)] min-w-[200px] shrink-0 ${
                    disabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50/80'
                      : 'cursor-pointer'
                  } ${
                    isSelected && !disabled
                      ? 'border-primary bg-primary/5'
                      : !disabled
                        ? 'border-surface-subtle hover:border-slate-300'
                        : ''
                  }`}
                  onClick={() => {
                    if (disabled) return;
                    if (hasDetail) {
                      setDetailModal(option.id);
                    } else {
                      onToggle(option.id);
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div className="absolute right-3.5 top-3.5">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        isSelected && !disabled
                          ? 'border-primary bg-primary'
                          : disabled
                            ? 'border-slate-300 bg-slate-100'
                            : 'border-slate-900 bg-white'
                      }`}
                      onClick={(e) => {
                        if (disabled) return;
                        e.stopPropagation();
                        onToggle(option.id);
                      }}
                    >
                      {isSelected && !disabled && (
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {disabled && (
                        <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <Image
                      src="/icons/booking/shield.svg"
                      alt=""
                      width={14}
                      height={14}
                      className={disabled ? 'opacity-40' : ''}
                    />
                    {disabled && rule && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 border border-amber-200/60 px-1 py-0.5 text-[10px] font-medium text-amber-700">
                        Requires {rule.label}
                      </span>
                    )}
                  </div>

                  <h3 className={`min-h-[40px] text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-900'}`}>
                    {option.title}
                  </h3>

                  <div className="mt-3">
                    <span className={`text-xl font-bold leading-none tracking-tight-3 ${
                      disabled ? 'text-slate-300' : isOwn ? 'text-text-muted' : 'text-primary'
                    }`}>
                      ${option.price.toFixed(2)}
                    </span>
                    <span className={`text-xs ${disabled ? 'text-slate-300' : 'text-slate-500'}`}>/day</span>
                  </div>

                  <div className="my-2 h-px w-full bg-surface-subtle" />

                  {/* Features list */}
                  {option.features && option.features.length > 0 && (
                    <ul className="mt-auto space-y-0.5">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className={`text-xs ${disabled ? 'text-slate-300' : 'text-slate-500'}`}>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal && modalDetail && modalOption && (
        <InsuranceDetailModal
          detail={modalDetail}
          price={modalOption.price}
          isSelected={selectedIds.has(detailModal)}
          disabled={isDisabled(detailModal)}
          onToggle={() => onToggle(detailModal)}
          onClose={() => setDetailModal(null)}
        />
      )}
    </section>
  );
}
