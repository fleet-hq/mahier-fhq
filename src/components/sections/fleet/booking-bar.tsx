'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { DatePicker, TimePicker } from '@/components/ui';
import { useCompanyLocations } from '@/hooks';
import { useDefaultBranch } from '@/contexts';
import type { Location } from '@/services/locationServices';
import { formatTimezoneCaption } from '@/lib/branch-time';
import { todayLocalISODate } from '@/lib/utils';

export function BookingBar() {
  const { data: apiLocations } = useCompanyLocations();

  const locations: Location[] = apiLocations || [];
  const pickupLocations = locations.filter((loc) => loc.type === 'pickup' || loc.type === 'both');
  const dropoffLocations = locations.filter((loc) => loc.type === 'dropoff' || loc.type === 'both');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobileLocationDropdownOpen, setMobileLocationDropdownOpen] = useState(false);
  const [mobileDropoffDropdownOpen, setMobileDropoffDropdownOpen] = useState(false);
  const [differentLocation, setDifferentLocation] = useState(false);
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
  const [formData, setFormData] = useState(() => {
    return {
      pickupLocation: '',
      dropoffLocation: '',
      pickupDate: '',
      pickupTime: '',
      returnDate: '',
      returnTime: '',
    };
  });

  // Initialize from URL search params (passed from hero booking form)
  useEffect(() => {
    const pickupLocation = searchParams.get('pickupLocation') || '';
    const dropoffLocation = searchParams.get('dropoffLocation') || '';
    const pickupDate = searchParams.get('pickupDate') || '';
    const pickupTime = searchParams.get('pickupTime') || '';
    const returnDate = searchParams.get('returnDate') || '';
    const returnTime = searchParams.get('returnTime') || '';

    if (pickupLocation || dropoffLocation || pickupDate || pickupTime || returnDate || returnTime) {
      setFormData({ pickupLocation, dropoffLocation, pickupDate, pickupTime, returnDate, returnTime });
      if (dropoffLocation && dropoffLocation !== pickupLocation) {
        setDifferentLocation(true);
      }
    }
  }, [searchParams]);

  const desktopPickupRef = useRef<HTMLDivElement>(null);
  const desktopDropoffRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when mobile panel is open
  useEffect(() => {
    if (mobilePanelOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
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
      if (desktopPickupRef.current && !desktopPickupRef.current.contains(target)) {
        setPickupDropdownOpen(false);
      }
      if (desktopDropoffRef.current && !desktopDropoffRef.current.contains(target)) {
        setDropoffDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync form data to URL search params
  const syncToUrl = useCallback((data: typeof formData) => {
    const params = new URLSearchParams(searchParams.toString());
    const fields = [
      ['pickupLocation', data.pickupLocation],
      ['dropoffLocation', data.dropoffLocation],
      ['pickupDate', data.pickupDate],
      ['pickupTime', data.pickupTime],
      ['returnDate', data.returnDate],
      ['returnTime', data.returnTime],
    ] as const;
    fields.forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const updateFormData = useCallback((newData: typeof formData) => {
    setFormData(newData);
    syncToUrl(newData);
  }, [syncToUrl]);

  const handleSwapLocations = () => {
    updateFormData({
      ...formData,
      pickupLocation: formData.dropoffLocation,
      dropoffLocation: formData.pickupLocation,
    });
  };

  // The customer site operates against a single active branch, so the
  // time pickers always use the company's default branch hours and
  // timezone.
  const branch = useDefaultBranch();
  const minTime = branch?.operationalStartTime ?? null;
  const maxTime = branch?.operationalEndTime ?? null;
  const timezoneCaption = formatTimezoneCaption(branch?.timezone);

  return (
    <>
      {/* Mobile Layout */}
      <div className="mt-4 md:hidden">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <div className="flex flex-col">
            <p className="text-2xs font-normal text-slate-500">Pick-up</p>
            <div className="mt-2 flex items-center gap-3">
              <Image
                src="/icons/home/hero/pin.svg"
                alt="Location"
                width={24}
                height={24}
                className="shrink-0"
              />
              <span className="text-sm text-slate-700">
                {formData.pickupLocation || 'Select City or Airport'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobilePanelOpen(true)}
            className="flex h-12 w-12 items-center justify-center"
          >
            <Image
              src="/icons/fleet/pen.svg"
              alt="Edit"
              width={20}
              height={20}
            />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Panel */}
      <div
        className={`fixed inset-x-0 top-20 z-40 overflow-hidden md:hidden transition-all duration-300 ease-out ${
          mobilePanelOpen ? (differentLocation ? 'max-h-175' : 'max-h-140') : 'max-h-0'
        }`}
      >
        <div className="rounded-b-2xl bg-white px-8 pt-10 pb-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)]">
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
                          updateFormData({ ...formData, pickupLocation: location.name });
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
                <div className="-my-2 border-t border-slate-200" />
                <div className="flex items-center gap-3">
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
                  <div className="h-10 w-px bg-slate-200" />
                  <div className="relative flex-1 pl-1">
                    <label className="block font-manrope text-2xs font-normal text-neutral-label">Drop-off</label>
                    <button
                      type="button"
                      onClick={() => setMobileDropoffDropdownOpen(!mobileDropoffDropdownOpen)}
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
                    {/* Mobile Dropoff Dropdown */}
                    <div
                      className={`absolute left-0 right-0 top-full z-50 mt-2 origin-top rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-200 ${
                        mobileDropoffDropdownOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0'
                      }`}
                    >
                      <div className="border-b border-slate-100 p-2">
                        <input
                          type="text"
                          placeholder="Search locations..."
                          value={dropoffSearch}
                          onChange={(e) => setDropoffSearch(e.target.value)}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredDropoffLocations.length === 0 ? (
                          <div className="px-4 py-3 text-center text-sm text-slate-400">
                            {dropoffSearch ? 'No locations match your search' : 'No locations available'}
                          </div>
                        ) : (
                          filteredDropoffLocations.map((location) => (
                            <button
                              key={location.id}
                              type="button"
                              onClick={() => {
                                updateFormData({ ...formData, dropoffLocation: location.name });
                                setMobileDropoffDropdownOpen(false);
                                setDropoffSearch('');
                              }}
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
                </div>
              </>
            )}

            {/* Checkbox */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={differentLocation}
                onChange={(e) => setDifferentLocation(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-slate-600">Return car to different location</span>
            </label>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block font-manrope text-2xs font-normal text-neutral-label">Pick-up Date & Time</span>
                <DatePicker
                  value={formData.pickupDate}
                  onChange={(v) => {
                    const updated = { ...formData, pickupDate: v };
                    if (formData.returnDate && v > formData.returnDate) updated.returnDate = '';
                    updateFormData(updated);
                  }}
                  minDate={todayLocalISODate()}
                  placeholder="Select Date"
                  icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                  className="mt-3 pb-3"
                  aria-label="Pick-up date"
                />
                <div className="border-t border-slate-200" />
                <TimePicker
                  value={formData.pickupTime}
                  onChange={(v) => updateFormData({ ...formData, pickupTime: v })}
                  placeholder="Select Time"
                  icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={20} height={20} className="shrink-0" />}
                  className="pt-3"
                  aria-label="Pick-up time"
                  minTime={minTime}
                  maxTime={maxTime}
                />
              </div>

              <div>
                <span className="block font-manrope text-2xs font-normal text-neutral-label">Return Date & Time</span>
                <DatePicker
                  value={formData.returnDate}
                  onChange={(v) => updateFormData({ ...formData, returnDate: v })}
                  minDate={formData.pickupDate || todayLocalISODate()}
                  highlightDate={formData.pickupDate}
                  placeholder="Select Date"
                  icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                  className="mt-3 pb-3"
                  aria-label="Return date"
                />
                <div className="border-t border-slate-200" />
                <TimePicker
                  value={formData.returnTime}
                  onChange={(v) => updateFormData({ ...formData, returnTime: v })}
                  placeholder="Select Time"
                  icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={20} height={20} className="shrink-0" />}
                  className="pt-3"
                  aria-label="Return time"
                  minTime={minTime}
                  maxTime={maxTime}
                />
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={() => {
                setMobilePanelOpen(false);
                setMobileLocationDropdownOpen(false);
                setMobileDropoffDropdownOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Apply Filters
            </button>
          </div>
          {/* Drag Handle */}
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-12 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      {/* Backdrop for mobile panel */}
      <div
        className={`fixed inset-0 top-20 z-30 bg-black/60 md:hidden transition-opacity duration-300 ${
          mobilePanelOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => {
          setMobilePanelOpen(false);
          setMobileLocationDropdownOpen(false);
          setMobileDropoffDropdownOpen(false);
        }}
      />

      {/* Desktop Layout */}
      <div className="hidden border-y border-slate-200 bg-slate-50 md:block">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-4">
          <div className="flex items-end">
            {/* Pick-up Location */}
            <div className={`relative flex min-w-0 flex-[0.7] items-end gap-3 ${differentLocation ? '' : 'border-r border-slate-200'} pr-4`} ref={desktopPickupRef}>
              <Image
                src="/icons/home/hero/pin.svg"
                alt="Location"
                width={24}
                height={24}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-normal text-slate-400">Pick-up</p>
                <button
                  type="button"
                  onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)}
                  className="w-full truncate p-0 text-left text-sm text-slate-700"
                >
                  {formData.pickupLocation || <span className="text-neutral-placeholder">Select City or Airport</span>}
                </button>
              </div>
              <label className="absolute left-0 top-full mt-1.5 flex cursor-pointer items-center gap-3">
                <div className="flex w-6 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={differentLocation}
                    onChange={(e) => setDifferentLocation(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </div>
                <span className="whitespace-nowrap text-xs text-slate-500">Different drop-off</span>
              </label>
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
                        onClick={() => {
                          updateFormData({ ...formData, pickupLocation: location.name });
                          setPickupDropdownOpen(false);
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
                    width={20}
                    height={20}
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
              <div className="flex items-end gap-3">
                <Image
                  src="/icons/home/hero/pin.svg"
                  alt="Location"
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="whitespace-nowrap text-2xs font-normal text-slate-400">Drop-off</p>
                  <button
                    type="button"
                    onClick={() => setDropoffDropdownOpen(!dropoffDropdownOpen)}
                    className="w-full truncate p-0 text-left text-sm text-slate-700"
                  >
                    {formData.dropoffLocation || <span className="text-neutral-placeholder">Select City or Airport</span>}
                  </button>
                </div>
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
                        onClick={() => {
                          updateFormData({ ...formData, dropoffLocation: location.name });
                          setDropoffDropdownOpen(false);
                          setDropoffSearch('');
                        }}
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
            <div className="min-w-0 flex-1 border-r border-slate-200 px-4">
              <p className="text-2xs font-normal text-slate-400">Pick-up Date & Time</p>
              <div className="mt-1 flex items-center whitespace-nowrap">
                <DatePicker
                  value={formData.pickupDate}
                  onChange={(v) => {
                    const updated = { ...formData, pickupDate: v };
                    if (formData.returnDate && v > formData.returnDate) updated.returnDate = '';
                    updateFormData(updated);
                  }}
                  minDate={todayLocalISODate()}
                  placeholder="Select Date"
                  icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                  className="min-w-0 flex-1"
                  aria-label="Pick-up date"
                />
                <div className="mx-2 h-4 w-px shrink-0 bg-slate-200" />
                <TimePicker
                  value={formData.pickupTime}
                  onChange={(v) => updateFormData({ ...formData, pickupTime: v })}
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
            <div className="min-w-0 flex-1 pl-4">
              <p className="text-2xs font-normal text-slate-400">Return Date & Time</p>
              <div className="mt-1 flex items-center whitespace-nowrap">
                <DatePicker
                  value={formData.returnDate}
                  onChange={(v) => updateFormData({ ...formData, returnDate: v })}
                  minDate={formData.pickupDate || todayLocalISODate()}
                  highlightDate={formData.pickupDate}
                  placeholder="Select Date"
                  icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                  className="min-w-0 flex-1"
                  aria-label="Return date"
                />
                <div className="mx-2 h-4 w-px shrink-0 bg-slate-200" />
                <TimePicker
                  value={formData.returnTime}
                  onChange={(v) => updateFormData({ ...formData, returnTime: v })}
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
        </div>
      </div>
    </>
  );
}
