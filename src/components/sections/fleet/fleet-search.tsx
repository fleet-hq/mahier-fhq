'use client';

import Image from 'next/image';

interface FleetSearchProps {
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  activeFilterCount?: number;
}

export function FleetSearch({
  title = 'Pick your next ride from our fleet.',
  searchValue = '',
  onSearchChange,
  onFilterClick,
  activeFilterCount = 0,
}: FleetSearchProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-0">
      <h1 className="px-4 text-xl font-semibold tracking-tight text-slate-900 md:px-0 md:text-2xl">{title}</h1>

      <div className="flex items-center gap-4 px-8 md:px-0">
        {/* Search Input */}
        <div className="flex flex-1 items-center gap-3 border-b border-slate-300 pb-2 md:flex-none">
          <Image
            src="/icons/fleet/search.svg"
            alt="Search"
            width={20}
            height={20}
          />
          <input
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none md:w-48"
          />
        </div>

        {/* Filter Button */}
        <button
          type="button"
          onClick={onFilterClick}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50"
        >
          <Image
            src="/icons/fleet/filters.svg"
            alt="Filters"
            width={13}
            height={13}
          />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
