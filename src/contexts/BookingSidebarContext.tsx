'use client';

import { createContext, useContext } from 'react';
import type { Location as LocationOption } from '@/services/locationServices';

export interface LocationEditingState {
  locations: LocationOption[];
  pickupLocationId: string | null;
  dropoffLocationId: string | null;
  onPickupLocationSelect?: (id: string) => void;
  onDropoffLocationSelect?: (id: string) => void;
  editingPickup: boolean;
  editingDropoff: boolean;
  isLoadingLocations: boolean;
}

export interface DateTimeState {
  pickupDateValue?: string;
  pickupTimeValue?: string;
  dropoffDateValue?: string;
  dropoffTimeValue?: string;
  onPickupDateChange?: (date: string) => void;
  onPickupTimeChange?: (time: string) => void;
  onDropoffDateChange?: (date: string) => void;
  onDropoffTimeChange?: (time: string) => void;
  /** Branch operational hours (HH:mm) used to constrain the time picker. */
  minTime?: string | null;
  maxTime?: string | null;
  /** Friendly label like ``"Times shown in branch local time (America/Anchorage)"``. */
  timezoneCaption?: string;
  /** True when no pick-up location is selected yet. */
  timesDisabled?: boolean;
  /** YYYY-MM-DD strings the customer can't book — admin-set
   *  unavailability blocks plus existing booking ranges. */
  unavailableDates?: string[];
}

export interface InvoiceData {
  invoiceNumber?: string;
  invoiceDescription?: string;
  items?: {
    image: string;
    name: string;
    licensePlate: string;
    quantity: number;
    /** Per-unit price (per day or per hour) */
    unitPrice?: number;
    /** day | hour — defaults to 'day' */
    unit?: 'day' | 'hour';
    /** @deprecated use unitPrice */
    pricePerDay?: number;
    periodLabel?: string;
  }[];
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
}

export interface ReserveState {
  paymentTermsAccepted?: boolean;
  onPaymentTermsChange?: (accepted: boolean) => void;
  onReserve?: () => void;
  isLoading?: boolean;
}

export interface BookingSidebarContextValue {
  locationEditing: LocationEditingState;
  dateTime: DateTimeState;
  invoice: InvoiceData;
  reserve: ReserveState;
  onEditPickUp: () => void;
  onEditDropOff: () => void;
}

const BookingSidebarContext = createContext<BookingSidebarContextValue | null>(null);

export function BookingSidebarProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: BookingSidebarContextValue;
}) {
  return (
    <BookingSidebarContext.Provider value={value}>
      {children}
    </BookingSidebarContext.Provider>
  );
}

export function useBookingSidebarContext(): BookingSidebarContextValue {
  const context = useContext(BookingSidebarContext);
  if (context === null) {
    throw new Error('useBookingSidebarContext must be used within a BookingSidebarProvider');
  }
  return context;
}
