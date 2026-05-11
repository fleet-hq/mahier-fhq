'use client';

import { useCallback } from 'react';

export interface FilterState {
  vehicleType: string[];
  make: string[];
  color: string[];
  seats: number[];
  minPrice: number | null;
  maxPrice: number | null;
}

export const INITIAL_FILTERS: FilterState = {
  vehicleType: [],
  make: [],
  color: [],
  seats: [],
  minPrice: null,
  maxPrice: null,
};

interface FilterOptions {
  vehicleTypes: string[];
  makes: string[];
  colors: string[];
  seats: number[];
}

interface FleetFiltersProps {
  isOpen: boolean;
  filters: FilterState;
  options: FilterOptions;
  activeCount: number;
  onFiltersChange: (filters: FilterState) => void;
}

export function FleetFilters({
  isOpen,
  filters,
  options,
  activeCount,
  onFiltersChange,
}: FleetFiltersProps) {
  const toggleChip = useCallback(
    <T extends string | number>(key: keyof FilterState, value: T) => {
      const current = filters[key] as T[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onFiltersChange({ ...filters, [key]: next });
    },
    [filters, onFiltersChange]
  );

  const clearAll = useCallback(() => {
    onFiltersChange(INITIAL_FILTERS);
  }, [onFiltersChange]);

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="border-b border-slate-200 pb-6 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
          {/* Vehicle Type */}
          {options.vehicleTypes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-slate-500">Type:</span>
              <div className="flex flex-wrap gap-1.5">
                {options.vehicleTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleChip('vehicleType', t)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.vehicleType.includes(t)
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Make */}
          {options.makes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-slate-500">Make:</span>
              <div className="flex flex-wrap gap-1.5">
                {options.makes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleChip('make', m)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.make.includes(m)
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          {options.colors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-slate-500">Color:</span>
              <div className="flex flex-wrap gap-1.5">
                {options.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChip('color', c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.color.includes(c)
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seats */}
          {options.seats.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-slate-500">Seats:</span>
              <div className="flex flex-wrap gap-1.5">
                {options.seats.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleChip('seats', s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.seats.includes(s)
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-slate-500">Price:</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-lg border border-slate-200 px-2 py-1">
                <span className="text-xs text-slate-400">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice ?? ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      minPrice: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-14 border-none bg-transparent pl-1 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <span className="text-xs text-slate-400">—</span>
              <div className="flex items-center rounded-lg border border-slate-200 px-2 py-1">
                <span className="text-xs text-slate-400">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      maxPrice: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-14 border-none bg-transparent pl-1 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Clear All */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
