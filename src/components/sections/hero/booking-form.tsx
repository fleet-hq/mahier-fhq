'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMobilePanel, useDefaultBranch } from '@/contexts';
import { DatePicker, TimePicker } from '@/components/ui';
import { useCompanyLocations } from '@/hooks';
import type { Location } from '@/services/locationServices';
import { todayLocalISODate } from '@/lib/utils';

interface BookingFormProps {
  onSubmit?: (data: BookingFormData) => void;
}

interface BookingFormData {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  differentLocation: boolean;
}

export function BookingForm({ onSubmit }: BookingFormProps) {
  const router = useRouter();
  const { isMobilePanelOpen: mobilePanelOpen, setIsMobilePanelOpen: setMobilePanelOpen } = useMobilePanel();
  const { data: apiLocations } = useCompanyLocations();

  const locations: Location[] = apiLocations || [];
  const pickupLocations = locations.filter((loc) => loc.type === 'pickup' || loc.type === 'both');
  const dropoffLocations = locations.filter((loc) => loc.type === 'dropoff' || loc.type === 'both');
  const [differentLocation, setDifferentLocation] = useState(false);
  const [mobileLocationDropdownOpen, setMobileLocationDropdownOpen] = useState(false);
  const [pickupDropdownOpen, setPickupDropdownOpen] = useState(false);
  const [dropoffDropdownOpen, setDropoffDropdownOpen] = useState(false);
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');

  const filteredPickupLocations = pickupLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(pickupSearch.toLowerCase()) ||
      loc.address.toLowerCase().includes(pickupSearch.toLowerCase())
  );
  const filteredDropoffLocations = dropoffLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(dropoffSearch.toLowerCase()) ||
      loc.address.toLowerCase().includes(dropoffSearch.toLowerCase())
  );
  const todayStr = todayLocalISODate();
  const [formData, setFormData] = useState<BookingFormData>({
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: '',
    differentLocation: false,
  });

  const handlePickupDateChange = (v: string) => {
    const updated: Partial<BookingFormData> = { pickupDate: v };
    if (formData.returnDate && v > formData.returnDate) {
      updated.returnDate = '';
    }
    setFormData({ ...formData, ...updated });
  };

  // The customer site operates against a single active branch, so the
  // time pickers always use the company's default branch hours and
  // timezone. Pickers are usable from the start — no "select location
  // first" gating.
  const branch = useDefaultBranch();
  const minTime = branch?.operationalStartTime ?? null;
  const maxTime = branch?.operationalEndTime ?? null;
  const canSubmit =
    !!formData.pickupLocation &&
    !!formData.pickupDate &&
    !!formData.pickupTime &&
    !!formData.returnDate &&
    !!formData.returnTime &&
    (!differentLocation || !!formData.dropoffLocation);

  // Refs for desktop dropdowns
  const desktopPickupRef = useRef<HTMLDivElement>(null);
  const desktopDropoffRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when mobile panel is open (iOS fix)
  useEffect(() => {
    if (mobilePanelOpen) {
      // Scroll to top first so the sticky header remains visible
      window.scrollTo(0, 0);
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [mobilePanelOpen]);

  // Close desktop dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check desktop pickup ref
      if (desktopPickupRef.current && !desktopPickupRef.current.contains(target)) {
        setPickupDropdownOpen(false);
      }
      // Check desktop dropoff ref
      if (desktopDropoffRef.current && !desktopDropoffRef.current.contains(target)) {
        setDropoffDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    const params = new URLSearchParams();
    if (formData.pickupLocation) params.set('pickupLocation', formData.pickupLocation);
    if (formData.dropoffLocation) params.set('dropoffLocation', formData.dropoffLocation);
    if (formData.pickupDate) params.set('pickupDate', formData.pickupDate);
    if (formData.pickupTime) params.set('pickupTime', formData.pickupTime);
    if (formData.returnDate) params.set('returnDate', formData.returnDate);
    if (formData.returnTime) params.set('returnTime', formData.returnTime);
    const query = params.toString();
    const url = `/fleet${query ? `?${query}` : ''}`;
    router.push(url);
  };

  const handlePickupSelect = (location: Location) => {
    setFormData({ ...formData, pickupLocation: location.name });
    setPickupDropdownOpen(false);
    setPickupSearch('');
  };

  const handleDropoffSelect = (location: Location) => {
    setFormData({ ...formData, dropoffLocation: location.name });
    setDropoffDropdownOpen(false);
    setDropoffSearch('');
  };

  const handleSwapLocations = () => {
    setFormData({
      ...formData,
      pickupLocation: formData.dropoffLocation,
      dropoffLocation: formData.pickupLocation,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-border bg-white px-8 pt-6 pb-3 sm:px-6">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-6 lg:hidden">
        {/* Pick-up Location - Trigger */}
        <div className="pt-2">
          <label className="block font-manrope text-2xs font-normal text-neutral-label">Pick-up</label>
          <button
            type="button"
            onClick={() => {
              setMobilePanelOpen(true);
              setMobileLocationDropdownOpen(false);
            }}
            className="mt-2 flex w-full items-center gap-3"
          >
            <Image
              src="/icons/home/hero/pin.svg"
              alt="Location"
              width={24}
              height={24}
              className="shrink-0"
            />
            <span className="flex-1 text-left text-base text-slate-700">
              {formData.pickupLocation || <span className="text-neutral-placeholder">Select City or Airport</span>}
            </span>
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Show Available Cars
          <ArrowRightIcon />
        </button>
      </div>

      {/* Mobile Slide-Down Panel - Below header */}
      <div
        className={`fixed inset-x-0 top-20 z-40 overflow-hidden lg:hidden transition-all duration-300 ease-out ${
          mobilePanelOpen ? (differentLocation ? 'max-h-175' : 'max-h-140') : 'max-h-0'
        }`}
      >
        <div className="rounded-b-2xl bg-white px-8 pt-14 pb-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)]">
          <div className="flex flex-col gap-6">
            {/* Pick-up Location */}
            <div className="relative">
              <label className="block font-manrope text-2xs font-normal text-neutral-label">Pick-up</label>
              <button
                type="button"
                onClick={() => setMobileLocationDropdownOpen(!mobileLocationDropdownOpen)}
                className="mt-2 flex w-full items-center gap-3"
              >
                <Image
                  src="/icons/home/hero/pin.svg"
                  alt="Location"
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                <span className="flex-1 text-left text-sm text-slate-700">
                  {formData.pickupLocation || <span className="text-neutral-placeholder">Select City or Airport</span>}
                </span>
              </button>
              {/* Mobile Location Dropdown */}
              <div
                className={`absolute left-0 right-0 top-full z-50 mt-2 origin-top rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-200 ${
                  mobileLocationDropdownOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0'
                }`}
              >
                <div className="border-b border-slate-100 p-2">
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={pickupSearch}
                    onChange={(e) => setPickupSearch(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredPickupLocations.length === 0 ? (
                    <div className="px-4 py-3 text-center text-sm text-slate-400">
                      {pickupSearch ? 'No locations match your search' : 'No locations available'}
                    </div>
                  ) : (
                    filteredPickupLocations.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, pickupLocation: location.name });
                          setMobileLocationDropdownOpen(false);
                          setPickupSearch('');
                        }}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                          formData.pickupLocation === location.name ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className={`text-sm font-medium ${formData.pickupLocation === location.name ? 'text-primary' : 'text-slate-700'}`}>
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

            {/* Drop-off Location - Only shown when checkbox is checked */}
            {differentLocation && (
              <>
                {/* Full-width Horizontal Divider between Pick-up and Drop-off */}
                <div className="-my-2 border-t border-slate-200" />

                <div className="flex items-center gap-3">
                  {/* Swap Arrows - centered vertically */}
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    className="flex h-6 w-6 shrink-0 items-center justify-center"
                  >
                    <Image
                      src="/icons/home/hero/inverse-phone.svg"
                      alt="Swap"
                      width={20}
                      height={20}
                    />
                  </button>
                  {/* Vertical Divider */}
                  <div className="h-10 w-px bg-slate-200" />
                  {/* Drop-off Field */}
                  <div className="flex-1 pl-1">
                    <label className="block font-manrope text-2xs font-normal text-neutral-label">Drop-off</label>
                    <button
                      type="button"
                      onClick={() => setDropoffDropdownOpen(!dropoffDropdownOpen)}
                      className="mt-2 flex w-full items-center gap-3"
                    >
                      <Image
                        src="/icons/home/hero/pin.svg"
                        alt="Location"
                        width={24}
                        height={24}
                        className="shrink-0"
                      />
                      <span className="flex-1 text-left text-sm text-slate-700">
                        {formData.dropoffLocation || <span className="text-neutral-placeholder">Select City or Airport</span>}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Checkbox */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={differentLocation}
                onChange={(e) => {
                  setDifferentLocation(e.target.checked);
                  setFormData({ ...formData, differentLocation: e.target.checked });
                }}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-slate-600">Return car to different location</span>
            </label>

            {/* Date & Time */}
            <div className="space-y-0">
              {/* Labels */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
                <span className="block font-manrope text-2xs font-normal text-neutral-label">Pick-up Date & Time</span>
                <div />
                <span className="block pl-4 font-manrope text-2xs font-normal text-neutral-label">Return Date & Time</span>
              </div>

              {/* Date row */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0">
                <DatePicker
                  value={formData.pickupDate}
                  onChange={handlePickupDateChange}
                  minDate={todayStr}
                  placeholder="Select Date"
                  icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                  className="mt-3 pb-3"
                  aria-label="Pick-up date"
                />
                <div className="mx-3 h-4 w-px bg-slate-200" />
                <DatePicker
                  value={formData.returnDate}
                  onChange={(v) => setFormData({ ...formData, returnDate: v })}
                  minDate={formData.pickupDate || todayStr}
                  highlightDate={formData.pickupDate}
                  placeholder="Select Date"
                  icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                  className="mt-3 pb-3 pl-1"
                  aria-label="Return date"
                />
              </div>

              {/* Horizontal divider */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
                <div className="border-t border-slate-200" />
                <div />
                <div className="border-t border-slate-200" />
              </div>

              {/* Time row */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0">
                <TimePicker
                  value={formData.pickupTime}
                  onChange={(v) => setFormData({ ...formData, pickupTime: v })}
                  placeholder="Select Time"
                  icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={20} height={20} className="shrink-0" />}
                  className="pt-3"
                  aria-label="Pick-up time"
                  minTime={minTime}
                  maxTime={maxTime}
                />
                <div className="mx-3 h-4 w-px bg-slate-200" />
                <TimePicker
                  value={formData.returnTime}
                  onChange={(v) => setFormData({ ...formData, returnTime: v })}
                  placeholder="Select Time"
                  icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={20} height={20} className="shrink-0" />}
                  className="pt-3 pl-1"
                  aria-label="Return time"
                  minTime={minTime}
                  maxTime={maxTime}
                />
              </div>
            </div>

            {/* Submit in panel */}
            <button
              type="submit"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                setMobilePanelOpen(false);
                setMobileLocationDropdownOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
            >
              Show Available Cars
              <ArrowRightIcon />
            </button>
          </div>
          {/* Drag Handle */}
          <div className="mt-4 flex justify-center pt-6">
            <div className="h-1 w-12 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      {/* Backdrop for mobile panel */}
      <div
        className={`fixed inset-0 top-20 z-30 bg-black/60 lg:hidden transition-opacity duration-300 ${
          mobilePanelOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => {
          setMobilePanelOpen(false);
          setMobileLocationDropdownOpen(false);
        }}
      />

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-4">
          {/* Pick-up Location */}
          <div className={`relative min-w-0 flex-[0.7] ${differentLocation ? '' : 'border-r border-slate-200'} pr-4`} ref={desktopPickupRef}>
            <label className="mb-2.25 block font-manrope text-2xs font-normal text-neutral-label">Pick-up</label>
            <div className="flex items-center gap-3">
              <Image
                src="/icons/home/hero/pin.svg"
                alt="Location"
                width={24}
                height={24}
                className="shrink-0"
              />
              <button
                type="button"
                onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)}
                className="min-w-0 flex-1 truncate text-left text-sm text-slate-700"
              >
                {formData.pickupLocation || <span className="text-neutral-placeholder">Select City or Airport</span>}
              </button>
            </div>
            {/* Dropdown */}
            <div
              className={`absolute left-0 right-0 top-full z-50 mt-2 origin-top rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-out ${
                pickupDropdownOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0'
              }`}
            >
              <div className="border-b border-slate-100 p-2">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  autoFocus={pickupDropdownOpen}
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredPickupLocations.length === 0 ? (
                  <div className="px-4 py-3 text-center text-sm text-slate-400">
                    {pickupSearch ? 'No locations match your search' : 'No locations available'}
                  </div>
                ) : (
                  filteredPickupLocations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => handlePickupSelect(location)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        formData.pickupLocation === location.name ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`text-sm font-medium ${formData.pickupLocation === location.name ? 'text-primary' : 'text-slate-700'}`}>
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

          {/* Swap Arrows */}
          {differentLocation && (
            <>
              <div className="h-6 w-px shrink-0 bg-slate-200" />
              <button
                type="button"
                onClick={handleSwapLocations}
                className="shrink-0 cursor-pointer rounded-md p-1 transition-colors hover:bg-slate-100"
                title="Swap locations"
              >
                <Image
                  src="/icons/home/hero/inverse-arrows.svg"
                  alt="Swap locations"
                  width={24}
                  height={24}
                />
              </button>
              <div className="h-6 w-px shrink-0 bg-slate-200" />
            </>
          )}

          {/* Drop-off Location - Animated show/hide */}
          <div
            className={`relative min-w-0 transition-all duration-300 ease-out ${
              differentLocation ? 'flex-[0.7] border-r border-slate-200 pr-4 opacity-100' : 'w-0 flex-none overflow-hidden p-0 opacity-0'
            }`}
            ref={desktopDropoffRef}
          >
            <label className="mb-2.25 block whitespace-nowrap font-manrope text-2xs font-normal text-neutral-label">Drop-off</label>
            <div className="flex items-center gap-3">
              <Image
                src="/icons/home/hero/pin.svg"
                alt="Location"
                width={24}
                height={24}
                className="shrink-0"
              />
              <button
                type="button"
                onClick={() => setDropoffDropdownOpen(!dropoffDropdownOpen)}
                className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm text-slate-700"
              >
                {formData.dropoffLocation || <span className="text-neutral-placeholder">Select City or Airport</span>}
              </button>
            </div>
            {/* Dropdown */}
            <div
              className={`absolute left-0 right-0 top-full z-50 mt-2 origin-top rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-out ${
                dropoffDropdownOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0'
              }`}
            >
              <div className="border-b border-slate-100 p-2">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={dropoffSearch}
                  onChange={(e) => setDropoffSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  autoFocus={dropoffDropdownOpen}
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredDropoffLocations.length === 0 ? (
                  <div className="px-4 py-3 text-center text-sm text-slate-400">
                    {dropoffSearch ? 'No locations match your search' : 'No locations available'}
                  </div>
                ) : (
                  filteredDropoffLocations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => handleDropoffSelect(location)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                        formData.dropoffLocation === location.name ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`text-sm font-medium ${formData.dropoffLocation === location.name ? 'text-primary' : 'text-slate-700'}`}>
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

          {/* Pick-up Date & Time */}
          <div className="min-w-0 flex-1 space-y-2.25 border-r border-slate-200 pr-2">
            <span className="block whitespace-nowrap font-manrope text-2xs font-normal text-neutral-label">Pick-up Date & Time</span>
            <div className="flex items-center whitespace-nowrap">
              <DatePicker
                value={formData.pickupDate}
                onChange={handlePickupDateChange}
                minDate={todayStr}
                placeholder="Select Date"
                icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                className="min-w-0 flex-1"
                aria-label="Pick-up date"
              />
              <div className="mx-3 h-4 w-px shrink-0 bg-slate-200" />
              <TimePicker
                value={formData.pickupTime}
                onChange={(v) => setFormData({ ...formData, pickupTime: v })}
                placeholder="Select Time"
                icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={20} height={20} className="shrink-0" />}
                className="min-w-0 flex-1"
                aria-label="Pick-up time"
                minTime={minTime}
                maxTime={maxTime}
              />
            </div>
          </div>

          {/* Return Date & Time */}
          <div className="min-w-0 flex-1 space-y-2.25">
            <span className="block whitespace-nowrap font-manrope text-2xs font-normal text-neutral-label">Return Date & Time</span>
            <div className="flex items-center whitespace-nowrap">
              <DatePicker
                value={formData.returnDate}
                onChange={(v) => setFormData({ ...formData, returnDate: v })}
                minDate={formData.pickupDate || todayStr}
                highlightDate={formData.pickupDate}
                placeholder="Select Date"
                icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                className="min-w-0 flex-1"
                aria-label="Return date"
              />
              <div className="mx-3 h-4 w-px shrink-0 bg-slate-200" />
              <TimePicker
                value={formData.returnTime}
                onChange={(v) => setFormData({ ...formData, returnTime: v })}
                placeholder="Select Time"
                icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={20} height={20} className="shrink-0" />}
                className="min-w-0 flex-1"
                aria-label="Return time"
                minTime={minTime}
                maxTime={maxTime}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-3 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={differentLocation}
              onChange={(e) => {
                setDifferentLocation(e.target.checked);
                setFormData({ ...formData, differentLocation: e.target.checked });
              }}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-600">Return car to different location</span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
          >
            Show Available Cars
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </form>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
