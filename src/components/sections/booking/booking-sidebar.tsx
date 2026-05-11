'use client';

import Image from 'next/image';
import { useState } from 'react';
import { LocationSelector } from './location-selector';
import { todayLocalISODate } from '@/lib/utils';
import { DatePicker, TimePicker } from '@/components/ui';
import { useBookingSidebarContext } from '@/contexts/BookingSidebarContext';
import type { Location as LocationOption } from '@/services/locationServices';
import { DiscountTag } from '@/components/ui/DiscountTag';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.png';

interface FleetDiscount {
  unitType: string;
  units: number;
  percentage: number;
}

interface Vehicle {
  name: string;
  year: number;
  description: string;
  totalPrice: number;
  images: string[];
  discounts?: FleetDiscount[];
  /** Override raises the average per-day rate above base for the
   *  selected window — show an amber peak-pricing hint. */
  isPeakPricing?: boolean;
  /** Override lowers the average per-day rate below base — show a
   *  green promo-pricing hint. */
  isPromoPricing?: boolean;
}

interface Location {
  address: string;
  date: string;
  time: string;
}

interface InvoiceItem {
  image: string;
  name: string;
  licensePlate: string;
  quantity: number;
  /** Per-unit price (per day or per hour) */
  unitPrice?: number;
  /** day | hour — defaults to 'day' for back-compat */
  unit?: 'day' | 'hour';
  /** @deprecated kept for back-compat — use `unitPrice` */
  pricePerDay?: number;
  periodLabel?: string;
}

/**
 * BookingSidebarProps - reduced from 40+ props to core display props.
 *
 * Location editing, date/time, invoice data, and reserve state are now
 * provided via BookingSidebarContext (see BookingSidebarProvider).
 *
 * Direct props are still accepted and take precedence over context values
 * for backward compatibility.
 */
interface BookingSidebarProps {
  variant?: 'desktop' | 'mobile-header' | 'mobile-footer';
  vehicle: Vehicle;
  pickUp: Location;
  dropOff: Location;

  // These props are now optional — they can come from context instead.
  invoiceNumber?: string;
  invoiceDescription?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  discount?: number;
  discountCode?: string;
  tax?: number;
  total?: number;
  deposit?: number;
  locationCharges?: number;
  bookingFee?: number;
  rentalTotal?: number;
  insuranceCost?: number;
  insuranceLabel?: string;
  extraItems?: { name: string; price: number }[];
  onApplyDiscount?: (code: string) => void;
  onEditPickUp?: () => void;
  onEditDropOff?: () => void;
  locations?: LocationOption[];
  pickupLocationId?: string | null;
  dropoffLocationId?: string | null;
  onPickupLocationSelect?: (id: string) => void;
  onDropoffLocationSelect?: (id: string) => void;
  editingPickup?: boolean;
  editingDropoff?: boolean;
  isLoadingLocations?: boolean;
  pickupDateValue?: string;
  pickupTimeValue?: string;
  dropoffDateValue?: string;
  dropoffTimeValue?: string;
  onPickupDateChange?: (date: string) => void;
  onPickupTimeChange?: (time: string) => void;
  onDropoffDateChange?: (date: string) => void;
  onDropoffTimeChange?: (time: string) => void;
  paymentTermsAccepted?: boolean;
  onPaymentTermsChange?: (accepted: boolean) => void;
  onReserve?: () => void;
  isLoading?: boolean;
}

export function BookingSidebar(props: BookingSidebarProps) {
  const ctx = useBookingSidebarContext();

  // Merge: direct props take precedence over context values
  const {
    variant = 'desktop',
    vehicle,
    pickUp,
    dropOff,
  } = props;

  // Invoice data
  const invoiceNumber = props.invoiceNumber ?? ctx?.invoice.invoiceNumber;
  const invoiceDescription = props.invoiceDescription ?? ctx?.invoice.invoiceDescription;
  const items = props.items ?? ctx?.invoice.items;
  const subtotal = props.subtotal ?? ctx?.invoice.subtotal;
  const discount = props.discount ?? ctx?.invoice.discount;
  const discountCode = props.discountCode ?? ctx?.invoice.discountCode;
  const tax = props.tax ?? ctx?.invoice.tax;
  const total = props.total ?? ctx?.invoice.total;
  const deposit = props.deposit ?? ctx?.invoice.deposit;
  const locationCharges = props.locationCharges ?? ctx?.invoice.locationCharges;
  const bookingFee = props.bookingFee ?? ctx?.invoice.bookingFee;
  const rentalTotal = props.rentalTotal ?? ctx?.invoice.rentalTotal;
  const insuranceCost = props.insuranceCost ?? ctx?.invoice.insuranceCost;
  const insuranceLabel = props.insuranceLabel ?? ctx?.invoice.insuranceLabel;
  const extraItems = props.extraItems ?? ctx?.invoice.extraItems;
  const onApplyDiscount = props.onApplyDiscount ?? ctx?.invoice.onApplyDiscount;

  // Edit handlers
  const onEditPickUp = props.onEditPickUp ?? ctx?.onEditPickUp ?? (() => {});
  const onEditDropOff = props.onEditDropOff ?? ctx?.onEditDropOff ?? (() => {});

  // Location editing
  const locations = props.locations ?? ctx?.locationEditing.locations ?? [];
  const pickupLocationId = props.pickupLocationId ?? ctx?.locationEditing.pickupLocationId;
  const dropoffLocationId = props.dropoffLocationId ?? ctx?.locationEditing.dropoffLocationId;
  const onPickupLocationSelect = props.onPickupLocationSelect ?? ctx?.locationEditing.onPickupLocationSelect;
  const onDropoffLocationSelect = props.onDropoffLocationSelect ?? ctx?.locationEditing.onDropoffLocationSelect;
  const editingPickup = props.editingPickup ?? ctx?.locationEditing.editingPickup ?? false;
  const editingDropoff = props.editingDropoff ?? ctx?.locationEditing.editingDropoff ?? false;
  const isLoadingLocations = props.isLoadingLocations ?? ctx?.locationEditing.isLoadingLocations ?? false;

  // Date/time
  const pickupDateValue = props.pickupDateValue ?? ctx?.dateTime.pickupDateValue;
  const pickupTimeValue = props.pickupTimeValue ?? ctx?.dateTime.pickupTimeValue;
  const dropoffDateValue = props.dropoffDateValue ?? ctx?.dateTime.dropoffDateValue;
  const dropoffTimeValue = props.dropoffTimeValue ?? ctx?.dateTime.dropoffTimeValue;
  const onPickupDateChange = props.onPickupDateChange ?? ctx?.dateTime.onPickupDateChange;
  const onPickupTimeChange = props.onPickupTimeChange ?? ctx?.dateTime.onPickupTimeChange;
  const onDropoffDateChange = props.onDropoffDateChange ?? ctx?.dateTime.onDropoffDateChange;
  const onDropoffTimeChange = props.onDropoffTimeChange ?? ctx?.dateTime.onDropoffTimeChange;
  // Branch operational hours + timezone caption used to constrain the
  // time pickers and label the timezone the customer is looking at.
  const minTime = ctx?.dateTime.minTime ?? null;
  const maxTime = ctx?.dateTime.maxTime ?? null;
  const timezoneCaption = ctx?.dateTime.timezoneCaption;
  const timesDisabled = ctx?.dateTime.timesDisabled ?? false;
  const unavailableDates = ctx?.dateTime.unavailableDates ?? [];

  // Reserve state
  const paymentTermsAccepted = props.paymentTermsAccepted ?? ctx?.reserve.paymentTermsAccepted;
  const onPaymentTermsChange = props.onPaymentTermsChange ?? ctx?.reserve.onPaymentTermsChange;
  const onReserve = props.onReserve ?? ctx?.reserve.onReserve;
  const isLoading = props.isLoading ?? ctx?.reserve.isLoading;

  const [promoCode, setPromoCode] = useState('');
  const [mainImage, setMainImage] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [invoiceImageErrors, setInvoiceImageErrors] = useState<Set<number>>(new Set());

  const getVehicleImage = (index: number) => {
    if (imageErrors.has(index) || !vehicle.images[index]) {
      return PLACEHOLDER_IMAGE;
    }
    return vehicle.images[index];
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const handleInvoiceImageError = (index: number) => {
    setInvoiceImageErrors((prev) => new Set(prev).add(index));
  };

  const showHeader = variant === 'desktop' || variant === 'mobile-header';
  const showInvoice = variant === 'desktop' || variant === 'mobile-footer';
  const isMobile = variant === 'mobile-header' || variant === 'mobile-footer';

  return (
    <div className={`bg-surface ${isMobile ? '' : 'rounded-lg border border-slate-200'}`}>
      {/* Vehicle Header - Only show for desktop and mobile-header */}
      {showHeader && (
        <>
          <div className={isMobile ? 'px-4 py-3' : 'p-6'}>
            <div className="flex items-start justify-between">
              <div>
                {vehicle.discounts && vehicle.discounts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {vehicle.discounts.map((d, i) => (
                      <DiscountTag
                        key={i}
                        label={`${d.percentage}% off · ${d.units}+ ${d.unitType === 'hour' ? 'hrs' : 'days'}`}
                      />
                    ))}
                  </div>
                )}
                <h2 className="text-xl font-bold text-slate-900">
                  {vehicle.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{vehicle.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold leading-tight text-slate-900">${vehicle.totalPrice.toFixed(2)}</p>
                <p className="text-xs text-slate-500">Total before taxes</p>
              </div>
            </div>

            {/* Breaker */}
            <div className="my-4 h-px w-full bg-border-muted" />

            {/* Image Gallery */}
            <div className="flex gap-2">
              <div className="relative aspect-[4/3] flex-1 overflow-hidden rounded-lg">
                <Image
                  src={getVehicleImage(mainImage)}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(mainImage)}
                />
              </div>
              <div className="flex w-24 flex-col gap-2">
                {(vehicle.images.length > 0 ? vehicle.images.slice(0, 3) : [PLACEHOLDER_IMAGE]).map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setMainImage(index)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-lg ${
                      mainImage === index ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <Image
                      src={getVehicleImage(index)}
                      alt={`${vehicle.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(index)}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Breaker */}
          <div className={`h-px bg-border-muted ${isMobile ? 'mx-4 w-[calc(100%-32px)]' : 'mx-6 w-[calc(100%-48px)]'}`} />

          {/* Pick Up / Drop Off */}
          <div className={isMobile ? 'p-4' : 'p-6'}>
            <div className="flex gap-3">
              {/* Icons with dotted line */}
              <div className="flex flex-col items-center">
                <Image src="/icons/booking/pick-up.svg" alt="Pick up" width={8} height={8} className="mt-1 shrink-0" />
                <div className="my-2 flex-1 w-px border-l border-dashed border-slate-300" />
                <Image src="/icons/booking/drop-off.svg" alt="Drop off" width={8} height={8} className="mb-1 shrink-0" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                {/* Pick Up */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] font-medium leading-none tracking-tight-3 text-slate-500">Pick up</p>
                      {/* Static view */}
                      <div className={`transition-all duration-300 ease-out overflow-hidden ${editingPickup ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                        <p className="mt-1 text-sm font-bold leading-[1.09] tracking-tight-2 text-navy">{pickUp.address}</p>
                        <p className="mt-1 text-[10px] font-light leading-none tracking-tight-3 text-text-secondary">
                          {pickUp.date}, {pickUp.time}
                        </p>
                      </div>
                      {/* Edit view */}
                      <div
                        className={`transition-[max-height,opacity] duration-300 ease-out ${editingPickup ? 'max-h-60 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}
                      >
                        <div className="mt-1.5 space-y-2">
                          <LocationSelector
                            label=""
                            locations={locations.filter((loc) => loc.type === 'pickup' || loc.type === 'both')}
                            selectedLocationId={pickupLocationId}
                            onLocationSelect={(id) => {
                              onPickupLocationSelect?.(id);
                            }}
                            isLoading={isLoadingLocations}
                            placeholder="Select pickup location"
                          />
                          {onPickupDateChange && onPickupTimeChange && (
                            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                              <DatePicker
                                value={pickupDateValue || ''}
                                onChange={onPickupDateChange}
                                minDate={todayLocalISODate()}
                                unavailableDates={unavailableDates}
                                icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                                aria-label="Pickup date"
                              />
                              <div className="h-5 w-px bg-slate-200" />
                              <TimePicker
                                value={pickupTimeValue || ''}
                                onChange={onPickupTimeChange ?? (() => {})}
                                icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={20} height={20} className="shrink-0" />}
                                aria-label="Pickup time"
                                minTime={minTime}
                                maxTime={maxTime}
                                disabled={timesDisabled}
                              />
                            </div>
                          )}
                          {(timesDisabled || timezoneCaption) && (
                            <p className="mt-2 text-[10px] text-text-secondary">
                              {timesDisabled
                                ? 'Select a pick-up location to choose a time.'
                                : timezoneCaption}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={onEditPickUp} className="shrink-0 ml-2">
                      <Image src="/icons/booking/edit.svg" alt="Edit" width={18} height={17} />
                    </button>
                  </div>
                </div>

                {/* Drop Off */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] font-medium leading-none tracking-tight-3 text-slate-500">Drop off</p>
                      {/* Static view */}
                      <div className={`transition-all duration-300 ease-out overflow-hidden ${editingDropoff ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                        <p className="mt-1 text-sm font-bold leading-[1.09] tracking-tight-2 text-navy">{dropOff.address}</p>
                        <p className="mt-1 text-[10px] font-light leading-none tracking-tight-3 text-text-secondary">
                          {dropOff.date}, {dropOff.time}
                        </p>
                      </div>
                      {/* Edit view */}
                      <div
                        className={`transition-[max-height,opacity] duration-300 ease-out ${editingDropoff ? 'max-h-60 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}
                      >
                        <div className="mt-1.5 space-y-2">
                          <LocationSelector
                            label=""
                            locations={locations.filter((loc) => loc.type === 'dropoff' || loc.type === 'both')}
                            selectedLocationId={dropoffLocationId}
                            onLocationSelect={(id) => {
                              onDropoffLocationSelect?.(id);
                            }}
                            isLoading={isLoadingLocations}
                            placeholder="Select drop-off location"
                          />
                          {onDropoffDateChange && onDropoffTimeChange && (
                            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                              <DatePicker
                                value={dropoffDateValue || ''}
                                onChange={onDropoffDateChange}
                                minDate={pickupDateValue || todayLocalISODate()}
                                highlightDate={pickupDateValue}
                                unavailableDates={unavailableDates}
                                icon={<Image src="/icons/home/hero/calendar.svg" alt="Calendar" width={24} height={24} className="shrink-0" />}
                                aria-label="Drop-off date"
                              />
                              <div className="h-5 w-px bg-slate-200" />
                              <TimePicker
                                value={dropoffTimeValue || ''}
                                onChange={onDropoffTimeChange ?? (() => {})}
                                icon={<Image src="/icons/home/hero/clock.svg" alt="Clock" width={20} height={20} className="shrink-0" />}
                                aria-label="Drop-off time"
                                minTime={minTime}
                                maxTime={maxTime}
                                disabled={timesDisabled}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={onEditDropOff} className="shrink-0 ml-2">
                      <Image src="/icons/booking/edit.svg" alt="Edit" width={18} height={17} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Peak / promo notice — fires only when the override actually
          raises (peak) or lowers (promo) the average per-day rate vs
          the base. The backend computes which by averaging the
          per-day prices across the booked window and comparing to
          bookingprice.price_per_day, so mixed-day windows (some days
          base, some days override) get the right hint based on the
          net direction. */}
      {vehicle.isPeakPricing && (
        <div className={`${isMobile ? 'px-4' : 'px-6'} pb-2`}>
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
            Peak-day pricing is in effect for the selected dates.
          </p>
        </div>
      )}
      {vehicle.isPromoPricing && (
        <div className={`${isMobile ? 'px-4' : 'px-6'} pb-2`}>
          <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1.5">
            Promo pricing is in effect for the selected dates.
          </p>
        </div>
      )}

      {/* Hourly rate note */}
      {items?.some((item) => item.unit === 'hour') && (
        <div className={`${isMobile ? 'px-4' : 'px-6'} pb-2`}>
          <p className="text-[10px] text-slate-400 italic">Hourly rate applied | bookings under 24 hours are charged per hour.</p>
        </div>
      )}


      {/* Invoice - Only show for desktop and mobile-footer */}
      {showInvoice && (
        <>
          {/* Breaker - only needed if header is also shown */}
          {showHeader && <div className={`h-px bg-border-muted ${isMobile ? 'mx-4 w-[calc(100%-32px)]' : 'mx-6 w-[calc(100%-48px)]'}`} />}

          <div className={isMobile ? 'p-4' : 'p-6'}>
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-semibold text-slate-900">Invoice</h3>
          <span className="text-xs font-light text-navy">#{invoiceNumber}</span>
        </div>

        {/* Breaker */}
        <div className="my-5 h-px w-full bg-border-muted" />

        {/* Items */}
        <div className="space-y-4">
          {items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <div className={`relative h-12 w-16 overflow-hidden rounded ${item.image.endsWith('.svg') ? 'bg-slate-100 flex items-center justify-center' : ''}`}>
                    <Image
                      src={invoiceImageErrors.has(index) ? PLACEHOLDER_IMAGE : item.image}
                      alt={item.name}
                      fill
                      className={item.image.endsWith('.svg') ? 'object-contain p-2' : 'object-cover'}
                      onError={() => handleInvoiceImageError(index)}
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-16 items-center justify-center rounded bg-slate-100">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity}x {item.periodLabel || `Base price per ${item.unit ?? 'day'}`}
                  </p>
                </div>
              </div>
              <p className="font-medium text-slate-900">
                ${((item.unitPrice ?? item.pricePerDay ?? 0) * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Breaker */}
        <div className="my-4 h-px w-full bg-border-muted" />

        {/* Discount Code */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Image src="/icons/booking/discount.svg" alt="Discount" width={20} height={20} />
          <input
            type="text"
            placeholder="Add Discount Code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onApplyDiscount?.(promoCode)}
            className="cursor-pointer text-sm font-semibold text-slate-900 transition-all active:scale-95 active:opacity-60"
          >
            Apply
          </button>
        </div>

        {/* Breaker */}
        <div className="my-4 h-px w-full bg-border-muted" />

        {/* Totals */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Rental total</span>
            <span className="text-slate-900">${(rentalTotal ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Location charges</span>
            <span className="text-slate-900">${(locationCharges ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Booking fees</span>
            <span className="text-slate-900">${(bookingFee ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Extras in totals */}
        {extraItems && extraItems.length > 0 && (
          <>
            <div className="my-4 h-px w-full bg-border-muted" />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Extras</h4>
              {extraItems.map((extra, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-slate-600">{extra.name}</span>
                  <span className="text-slate-900">${extra.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Discount & Insurance */}
        <div className="my-4 h-px w-full bg-border-muted" />
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Discount</span>
              {discountCode && <span className="text-sm font-medium text-slate-900">{discountCode}</span>}
            </div>
            <span className="text-slate-900">-${(discount ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Insurance{insuranceLabel ? ` (${insuranceLabel})` : ''}</span>
            <span className="text-slate-900">${(insuranceCost ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Total charges — rental + insurance + extras + location + fees,
            pre-tax. `subtotal` from useBookingInvoice already bakes in
            insurance + extras, so we only add bookingFee and
            locationCharges here; adding insuranceCost again was a
            double-count and ignoring locationCharges silently
            understated the line. */}
        <div className="my-4 h-px w-full bg-border-muted" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Total charges</span>
          <span className="text-sm font-bold text-slate-900">
            ${((subtotal ?? 0) + (bookingFee ?? 0) + (locationCharges ?? 0)).toFixed(2)}
          </span>
        </div>

        {/* Tax & Total */}
        <div className="my-4 h-px w-full bg-border-muted" />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tax calculation</span>
            <span className="text-slate-900">${(tax ?? 0).toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">Total</span>
          <div className="text-right">
            <span className="text-xs text-slate-500">USD </span>
            <span className="text-xl font-bold text-slate-900">${total?.toFixed(2).split('.')[0]}</span>
            <span className="text-xs font-bold text-slate-900">.{total?.toFixed(2).split('.')[1]}</span>
          </div>
        </div>

        {/* Security deposit */}
        <div className="my-4 h-px w-full bg-border-muted" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Security deposit</span>
          <span className="text-sm font-bold text-slate-900">${(deposit ?? 0).toFixed(2)}</span>
        </div>

        {/* Breaker */}
        <div className="mt-4 h-px w-full bg-border-muted" />
      </div>

      {/* Terms & Reserve */}
      <div className={isMobile ? 'p-4' : 'p-6'}>
        {/* Terms Checkbox */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={paymentTermsAccepted}
              onChange={(e) => onPaymentTermsChange?.(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-primary"
            />
            <span className="font-manrope text-[10px] leading-[1.4] text-slate-600">
              I have read and accept the rental information and the{' '}
              <a href="/terms?checkbox=payment" className="font-extrabold text-slate-900 underline">
                terms and conditions
              </a>
              . I confirm that I am booking a prepaid rate, where the entire price of the
              reservation will be immediately debited from the payment method I have provided.
            </span>
          </label>
        </div>

        {/* Reserve Button */}
        <button
          type="button"
          onClick={onReserve}
          disabled={!paymentTermsAccepted || isLoading}
          className="mt-6 w-full rounded-lg bg-[#5a6a7a] py-4 text-xs font-medium text-white transition-colors enabled:bg-primary enabled:hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Creating Booking...' : 'Reserve'}
        </button>
      </div>
        </>
      )}
    </div>
  );
}
