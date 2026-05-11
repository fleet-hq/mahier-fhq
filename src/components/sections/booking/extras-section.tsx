'use client';

import Image from 'next/image';

interface Extra {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  hasQuantity?: boolean;
  icon?: string;
}

interface ExtraState {
  enabled: boolean;
  quantity: number;
}

interface ExtrasSectionProps {
  extras: Extra[];
  selectedExtras: Record<string, ExtraState>;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}

function EmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-surface-subtle px-4">
      <p className="text-sm text-slate-400">No extras available for this fleet</p>
    </div>
  );
}

function ExtraItem({
  extra,
  state,
  onToggle,
  onQuantityChange,
}: {
  extra: Extra;
  state: ExtraState;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}) {
  const handleDecrement = () => {
    if (state.quantity <= 1) {
      onToggle(extra.id);
    } else {
      onQuantityChange(extra.id, state.quantity - 1);
    }
  };

  const handleIncrement = () => {
    onQuantityChange(extra.id, state.quantity + 1);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-surface-subtle px-4 py-3">
      <div className="flex items-start gap-3">
        {extra.icon ? (
          <Image
            src={extra.icon}
            alt=""
            width={16}
            height={20}
            className="mt-1"
          />
        ) : (
          <svg className="mt-1 h-5 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        )}
        <div>
          <h3 className="text-sm font-medium text-slate-900">{extra.title}</h3>
          <p className="text-xs text-slate-400">{extra.description}</p>
          <p className="mt-1">
            <span className="text-base font-bold text-slate-900">
              ${extra.price.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500"> {extra.priceUnit}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {state.enabled ? (
          <div className="flex items-center rounded-lg bg-primary py-1 pl-3 pr-1">
            <button
              type="button"
              onClick={handleDecrement}
              className="flex h-5 w-5 items-center justify-center text-white hover:opacity-80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-6 text-center text-sm font-medium text-white">
              {state.quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="flex h-5 w-5 items-center justify-center rounded bg-white text-primary hover:bg-slate-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToggle(extra.id)}
            className="relative h-[27px] w-12 rounded-lg bg-text-muted transition-colors"
          >
            <span className="absolute left-1 top-1 h-[19px] w-[19px] rounded bg-white shadow" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ExtrasSection({
  extras,
  selectedExtras,
  onToggle,
  onQuantityChange,
}: ExtrasSectionProps) {
  return (
    <section>
      <h2 className="font-manrope text-base font-semibold leading-none tracking-tight-2 text-navy">Extras</h2>

      <div className="mt-5 min-h-72 space-y-3">
        {extras.length === 0 ? (
          <EmptyState />
        ) : (
          extras.map((extra) => (
            <ExtraItem
              key={extra.id}
              extra={extra}
              state={selectedExtras[extra.id] || { enabled: false, quantity: 1 }}
              onToggle={onToggle}
              onQuantityChange={onQuantityChange}
            />
          ))
        )}
      </div>
    </section>
  );
}
