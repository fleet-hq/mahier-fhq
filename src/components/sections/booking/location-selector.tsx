'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Location } from '@/services/locationServices';

interface LocationSelectorProps {
  label: string;
  locations: Location[];
  selectedLocationId?: string | null;
  onLocationSelect: (locationId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LocationSelector({
  label,
  locations,
  selectedLocationId,
  onLocationSelect,
  isLoading = false,
  disabled = false,
  placeholder = 'Select City or Airport',
  open,
  onOpenChange,
}: LocationSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);

  // Filter locations based on search
  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside (only for uncontrolled mode)
  useEffect(() => {
    if (isControlled) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isControlled]);

  const handleSelect = (locationId: string) => {
    onLocationSelect(locationId);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="mb-2.25 block font-manrope text-2xs font-normal text-neutral-label">{label}</label>}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`flex w-full items-center gap-3 border-b pb-2 text-left text-sm ${
          disabled || isLoading
            ? 'cursor-not-allowed border-slate-100 text-slate-400'
            : 'cursor-pointer border-slate-200 text-slate-700 hover:border-slate-400'
        }`}
      >
        <Image
          src="/icons/home/hero/pin.svg"
          alt="Location"
          width={24}
          height={24}
          className="shrink-0"
        />
        <span className={`min-w-0 flex-1 truncate ${selectedLocation ? 'text-slate-700' : 'text-neutral-placeholder'}`}>
          {isLoading ? 'Loading locations...' : selectedLocation?.name || placeholder}
        </span>
      </button>

      {selectedLocation && (
        <p className="mt-1 text-xs text-slate-400 truncate">{selectedLocation.address}</p>
      )}

      {/* Dropdown */}
      <div
        className={`absolute left-0 right-0 top-full z-50 mt-2 origin-top rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-out ${
          isOpen && !disabled ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0'
        }`}
      >
        {/* Search input */}
        <div className="border-b border-slate-100 p-2">
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            autoFocus={isOpen}
          />
        </div>

        {/* Options list */}
        <div className="max-h-60 overflow-y-auto">
          {filteredLocations.length === 0 ? (
            <div className="px-4 py-3 text-center text-sm text-slate-400">
              {searchTerm ? 'No locations match your search' : 'No locations available'}
            </div>
          ) : (
            filteredLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => handleSelect(location.id)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                  location.id === selectedLocationId ? 'bg-primary/5' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-sm font-medium ${
                      location.id === selectedLocationId ? 'text-primary' : 'text-slate-700'
                    }`}
                  >
                    {location.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{location.address}</span>
                </div>
                {location.price > 0 && (
                  <span className="ml-3 shrink-0 text-xs font-medium text-primary">${location.price.toFixed(2)}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
