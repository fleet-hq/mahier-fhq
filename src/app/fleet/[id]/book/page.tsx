'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { AnnouncementBar, Header, Footer } from '@/components/layout';
import {
  CustomerDetailsSection,
  InsuranceSection,
  ExtrasSection,
  PaymentDetailsSection,
  BookingSidebar,
} from '@/components/sections/booking';
import { ValidationModal } from '@/components/ui';
import {
  useFleet,
  useFleetUnavailableRanges,
  useInsuranceOptions,
  useCreateBooking,
  useCreateCheckoutSession,
  useCompanyLocations,
  useDefaultTaxProfile,
  useBookingInvoice,
} from '@/hooks';
import { useDefaultBranch } from '@/contexts';
import { BookingSidebarProvider } from '@/contexts/BookingSidebarContext';
import type { BookingSidebarContextValue } from '@/contexts/BookingSidebarContext';
import { formatDateForDisplay, localISODate } from '@/lib/utils';
import { formatTimezoneCaption } from '@/lib/branch-time';
import { cancelBooking, validatePromoCode } from '@/services/bookingServices';
// calculateTax is now used internally by useBookingInvoice hook

const MS_PER_DAY = 24 * 60 * 60 * 1000; // 86400000

// Helper to format 24h time to 12h display
function formatTimeForDisplay(time: string): string {
  if (!time) return '—';
  const parts = time.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parts[1] ?? '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
}

// Helper to calculate days between dates
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / MS_PER_DAY);
  return diffDays || 1;
}

export default function BookingPage() {
  return <BookingPageContent />;
}

function BookingPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const vehicleId = params.id as string;

  // Get dates from URL params or use defaults. Build YYYY-MM-DD from
  // *local* components, not UTC — toISOString().split('T')[0] returns
  // the UTC calendar day so a NY user (GMT-4) at 11pm local saw the
  // default as tomorrow's date.
  const getDefaultDate = (daysFromNow: number = 0): string => {
    const date = new Date(Date.now() + daysFromNow * MS_PER_DAY);
    return localISODate(date);
  };
  const initialPickupDate = searchParams.get('pickupDate') || getDefaultDate(0);
  const initialDropoffDate = searchParams.get('dropoffDate') || searchParams.get('returnDate') || getDefaultDate(2);
  // No hardcoded time defaults — the customer must explicitly pick a slot
  // that falls within the branch's operational hours.
  const initialPickupTime = searchParams.get('pickupTime') || '';
  const initialDropoffTime = searchParams.get('dropoffTime') || searchParams.get('returnTime') || '';
  const pickupLocationParam = searchParams.get('pickupLocation') || '';
  const dropoffLocationParam = searchParams.get('dropoffLocation') || '';

  // Editable date/time state
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [dropoffDate, setDropoffDate] = useState(initialDropoffDate);
  const [pickupTime, setPickupTime] = useState(initialPickupTime);
  const [dropoffTime, setDropoffTime] = useState(initialDropoffTime);

  // Single active branch drives time picker bounds + timezone caption
  const branch = useDefaultBranch();

  // Debounce date/time changes before refetching the fleet — picker
  // clicks fire several state updates in a row, and react-query keys
  // on the latest values so without a debounce we'd queue a request
  // for every micro-change. 350 ms feels instant but coalesces clicks.
  const [debouncedPickupDate, setDebouncedPickupDate] = useState(initialPickupDate);
  const [debouncedDropoffDate, setDebouncedDropoffDate] = useState(initialDropoffDate);
  const [debouncedPickupTime, setDebouncedPickupTime] = useState(initialPickupTime);
  const [debouncedDropoffTime, setDebouncedDropoffTime] = useState(initialDropoffTime);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedPickupDate(pickupDate);
      setDebouncedDropoffDate(dropoffDate);
      setDebouncedPickupTime(pickupTime);
      setDebouncedDropoffTime(dropoffTime);
    }, 350);
    return () => clearTimeout(t);
  }, [pickupDate, dropoffDate, pickupTime, dropoffTime]);

  const fleetDateArgs = (() => {
    if (!debouncedPickupDate || !debouncedDropoffDate) return undefined;
    return {
      pickupDatetime: `${debouncedPickupDate}T${debouncedPickupTime || '00:00'}:00`,
      dropoffDatetime: `${debouncedDropoffDate}T${debouncedDropoffTime || '00:00'}:00`,
    };
  })();

  // Fetch vehicle data from API. Re-keys on the debounced date range
  // so dynamic-pricing entries that overlap the selected window are
  // picked up. keepPreviousData (in useFleet) keeps the old price
  // visible during the transition — no loading spinner / page flash.
  const { data: vehicleData, isLoading, isError } = useFleet(
    vehicleId, true, fleetDateArgs,
  );

  // Pull every blocked / booked range for this fleet so the date
  // picker can grey out unavailable days. This complements the
  // backend hard-reject on booking creation.
  const { data: unavailableRanges = [] } = useFleetUnavailableRanges(vehicleId);
  const unavailableDates = useMemo(() => {
    const out = new Set<string>();
    for (const r of unavailableRanges) {
      const start = new Date(r.start);
      const end = new Date(r.end);
      // Iterate every calendar day in [start, end). Half-open so a
      // booking that ends at noon on day X doesn't disable day X for
      // the next pickup.
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const stop = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      while (d <= stop) {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        out.add(`${yyyy}-${mm}-${dd}`);
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }
    return Array.from(out);
  }, [unavailableRanges]);

  // Fetch insurance options once for the URL-committed booking window
  // so per-day rates reflect the actual drop_off_time / duration.
  // Using the initial (URL) dates instead of editable state means we
  // don't refetch — and flicker — every time the customer tweaks the
  // pickup/dropoff. Worst case the rate is slightly off if they pick
  // wildly different dates on the form; the backend re-quotes against
  // the real chosen dates at booking creation either way.
  const insuranceFetchArgs = (() => {
    if (!initialPickupDate || !initialDropoffDate) return undefined;
    const pickup = `${initialPickupDate}T${initialPickupTime || '00:00'}:00`;
    const dropoff = `${initialDropoffDate}T${initialDropoffTime || '00:00'}:00`;
    return { pickupDatetime: pickup, dropoffDatetime: dropoff };
  })();
  const { data: insuranceOptions = [] } = useInsuranceOptions(insuranceFetchArgs);

  // Fetch company locations for pickup/dropoff selection
  const { data: companyLocations = [], isLoading: isLoadingLocations } = useCompanyLocations();

  // Fetch default tax profile (used when vehicle inherits company default)
  const { data: defaultTaxProfile } = useDefaultTaxProfile();

  // Create booking mutation
  const { mutate: createBookingMutation, isPending: isCreatingBooking } = useCreateBooking();

  // Stripe checkout session
  const { mutate: createCheckoutMutation, isPending: isProcessingPayment } = useCreateCheckoutSession();

  // Extras come from the fleet detail response (booking_rule.extras)
  const extras = vehicleData?.extras ?? [];

  // Customer Details State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Insurance State (multi-select)
  const [selectedInsurance, setSelectedInsurance] = useState<Set<string>>(new Set());

  const handleInsuranceToggle = (id: string) => {
    setSelectedInsurance((prev) => {
      const next = new Set(prev);
      if (id === 'own') {
        // "Own insurance" is mutually exclusive with other options
        if (next.has('own')) {
          next.delete('own');
        } else {
          next.clear();
          next.add('own');
        }
        return next;
      }
      // Selecting a Bonzah plan clears "own"
      next.delete('own');
      if (next.has(id)) {
        next.delete(id);
        // If deselecting RCLI, also deselect SLI (dependency)
        if (id === 'rcli') next.delete('sli');
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Extras State
  const [selectedExtras, setSelectedExtras] = useState<Record<string, { enabled: boolean; quantity: number }>>({});

  // Terms State
  const [paymentTermsAccepted, setPaymentTermsAccepted] = useState(false);

  // Validation Modal State
  const [validationModal, setValidationModal] = useState({ isOpen: false, title: '', message: '' });

  // Discount State
  const [discountCode, setDiscountCode] = useState<string | undefined>(undefined);
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // Location State
  const [pickupLocationId, setPickupLocationId] = useState<string | null>(null);
  const [dropoffLocationId, setDropoffLocationId] = useState<string | null>(null);

  const [editingPickup, setEditingPickup] = useState(false);
  const [editingDropoff, setEditingDropoff] = useState(false);

  // Calculate rental hours (rounded up, min 1) from full datetimes —
  // matches the backend ceil-of-seconds in BasePriceCalculator.
  const rentalHours = useMemo(() => {
    if (!pickupDate || !dropoffDate) return 0;
    const pickup = new Date(`${pickupDate}T${pickupTime || '00:00'}:00`);
    const dropoff = new Date(`${dropoffDate}T${dropoffTime || '00:00'}:00`);
    const diffMs = dropoff.getTime() - pickup.getTime();
    if (diffMs <= 0) return 1;
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
  }, [pickupDate, dropoffDate, pickupTime, dropoffTime]);

  // Calendar-dates-touched: every distinct date the rental spans
  // counts as a day, even partial. Sun 1 PM → Wed 1 PM = Sun, Mon,
  // Tue, Wed = 4 days. Matches the backend's calculate_booking_days
  // and Bonzah's Later-mode insurance billing so the rental and
  // insurance lines on the same booking agree on the day count.
  const rentalDays = useMemo(() => {
    if (!pickupDate || !dropoffDate) return 1;
    const [py, pm, pd] = pickupDate.split('-').map(Number) as [number, number, number];
    const [dy, dm, dd] = dropoffDate.split('-').map(Number) as [number, number, number];
    const startUtc = Date.UTC(py, pm - 1, pd);
    const endUtc = Date.UTC(dy, dm - 1, dd);
    const calendarDiff = Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000));
    return Math.max(1, calendarDiff + 1);
  }, [pickupDate, dropoffDate]);

  // Calculate pricing, invoice items, and insurance label via extracted hook
  const { pricing, invoiceItems: hookInvoiceItems, extraInvoiceItems: hookExtraInvoiceItems, insuranceLabel: hookInsuranceLabel } = useBookingInvoice({
    vehicleData: vehicleData ? {
      pricePerDay: vehicleData.pricePerDay,
      pricePerHour: vehicleData.pricePerHour,
      discounts: vehicleData.discounts,
      securityDeposit: vehicleData.securityDeposit,
      bookingFee: vehicleData.bookingFee,
      taxProfile: vehicleData.taxProfile,
      image: vehicleData.image,
      name: vehicleData.name,
      licensePlate: vehicleData.licensePlate,
      description: vehicleData.description,
      extras: vehicleData.extras ?? [],
    } : null,
    rentalDays,
    rentalHours,
    pickupDate,
    dropoffDate,
    selectedInsurance,
    insuranceOptions,
    selectedExtras,
    companyLocations,
    pickupLocationId,
    dropoffLocationId,
    appliedDiscount,
    discountCode,
    defaultTaxProfile,
  });

  // Filter locations to only those available for this vehicle, fall back to all company locations
  const availableLocations = useMemo(() => {
    if (companyLocations.length === 0) return [];
    if (!vehicleData?.availableLocations || vehicleData.availableLocations.length === 0) {
      return companyLocations;
    }
    const filtered = companyLocations.filter((loc) =>
      vehicleData.availableLocations?.includes(Number(loc.id))
    );
    return filtered.length > 0 ? filtered : companyLocations;
  }, [vehicleData?.availableLocations, companyLocations]);

  // Initialize location selection when available locations load
  useEffect(() => {
    if (availableLocations.length > 0 && !pickupLocationId) {
      const pickupLocs = availableLocations.filter((loc) => loc.type === 'pickup' || loc.type === 'both');
      const dropoffLocs = availableLocations.filter((loc) => loc.type === 'dropoff' || loc.type === 'both');

      // Try to match URL param location names
      const matchLocation = (name: string, locs: typeof availableLocations) =>
        locs.find((loc) =>
          loc.name?.toLowerCase().includes(name.toLowerCase()) ||
          loc.address?.toLowerCase().includes(name.toLowerCase())
        );

      const pickupMatch = pickupLocationParam ? matchLocation(pickupLocationParam, pickupLocs) : null;
      const dropoffMatch = dropoffLocationParam ? matchLocation(dropoffLocationParam, dropoffLocs) : null;

      const defaultPickup = pickupLocs.find((loc) => loc.isDefault) || pickupLocs[0];
      const pickupId = pickupMatch?.id || defaultPickup?.id || null;
      setPickupLocationId(pickupId);
      // If no explicit dropoff param, default dropoff to same as pickup
      const dropoffMatch2 = dropoffLocationParam ? dropoffMatch : null;
      const dropoffId = dropoffMatch2?.id || pickupId;
      setDropoffLocationId(dropoffId);
    }
  }, [availableLocations, pickupLocationId, pickupLocationParam, dropoffLocationParam]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
      
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-20 text-center flex-1 flex items-center justify-center">
          <div className="text-slate-500">Loading vehicle details...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // If vehicle not found or error, show error
  if (isError || !vehicleData) {
    return (
      <div className="min-h-screen bg-white">
     
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Vehicle not found</h1>
          <p className="mt-4 text-slate-600">The vehicle you are looking for does not exist.</p>
          <Link href="/fleet" className="mt-6 inline-block text-primary underline">
            Back to Fleet
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Shared sidebar props
  const sidebarVehicle = {
    name: vehicleData.name,
    year: vehicleData.year,
    description: vehicleData.description,
    totalPrice: pricing.subtotal,
    images: vehicleData.images,
    discounts: vehicleData.discounts,
    isPeakPricing: vehicleData.isPeakPricing,
    isPromoPricing: vehicleData.isPromoPricing,
  };

  // Get selected location details for sidebar
  const selectedPickupLocation = availableLocations.find((loc) => loc.id === pickupLocationId);
  const selectedDropoffLocation = availableLocations.find((loc) => loc.id === dropoffLocationId);

  const minTime = branch?.operationalStartTime ?? null;
  const maxTime = branch?.operationalEndTime ?? null;
  const timezoneCaption = formatTimezoneCaption(branch?.timezone);
  const timesDisabled = false;

  const sidebarPickUp = {
    address: selectedPickupLocation?.address || pickupLocationParam || vehicleData.location || 'Select Pickup Location',
    date: formatDateForDisplay(pickupDate),
    time: formatTimeForDisplay(pickupTime),
  };

  const sidebarDropOff = {
    address: selectedDropoffLocation?.address || dropoffLocationParam || pickupLocationParam || vehicleData.location || 'Select Drop-off Location',
    date: formatDateForDisplay(dropoffDate),
    time: formatTimeForDisplay(dropoffTime),
  };

  // Invoice items and extras come from the useBookingInvoice hook
  const invoiceItems = hookInvoiceItems;
  const extraInvoiceItems = hookExtraInvoiceItems;

  const sidebarInvoiceProps = {
    invoiceNumber: String(Math.floor(1000 + Math.random() * 9000)),
    invoiceDescription: vehicleData.description,
    items: invoiceItems,
    extraItems: extraInvoiceItems,
    locationCharges: pricing.locationCharges,
    bookingFee: pricing.bookingFee,
    rentalTotal: pricing.subtotal - pricing.insuranceCost - pricing.extrasCost,
    insuranceCost: pricing.insuranceCost,
    insuranceLabel: hookInsuranceLabel,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    discountCode,
    tax: pricing.tax,
    total: pricing.total,
    deposit: pricing.deposit,
  };

  const handleExtraToggle = (id: string) => {
    setSelectedExtras((prev) => ({
      ...prev,
      [id]: {
        enabled: !prev[id]?.enabled,
        quantity: prev[id]?.quantity || 1,
      },
    }));
  };

  const handleExtraQuantityChange = (id: string, quantity: number) => {
    setSelectedExtras((prev) => ({
      ...prev,
      [id]: {
        enabled: true,
        quantity,
      },
    }));
  };

  const handleApplyDiscount = async (code: string) => {
    if (!code.trim()) return;
    try {
      // Pass each price head separately so the backend can apply the
      // discount only to the components selected on the promo code.
      const baseRental =
        (pricing.subtotal || 0) - (pricing.insuranceCost || 0) - (pricing.extrasCost || 0);
      const result = await validatePromoCode({
        code: code.trim(),
        base_price: baseRental,
        extras_price: (pricing.insuranceCost || 0) + (pricing.extrasCost || 0),
        fees: pricing.bookingFee || 0,
        location_charges: pricing.locationCharges || 0,
      });
      if (result.valid && result.discount_amount) {
        setDiscountCode(code.trim().toUpperCase());
        setAppliedDiscount(parseFloat(result.discount_amount));
      }
    } catch (err: unknown) {
      setDiscountCode('');
      setAppliedDiscount(0);
      const message = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error || 'Invalid promo code.';
      alert(message);
    }
  };

  const handleReserve = async () => {
    // Validate customer details
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setValidationModal({
        isOpen: true,
        title: 'Customer Details Required',
        message: 'Please fill in all customer details before proceeding with your reservation.',
      });
      return;
    }

    // Validate insurance is selected
    if (selectedInsurance.size === 0) {
      setValidationModal({
        isOpen: true,
        title: 'Insurance Required',
        message: 'Please select an insurance option to protect your rental.',
      });
      return;
    }

    // Validate date + time selection — both must be explicitly chosen so
    // the booking falls inside the branch's operational window.
    if (!pickupDate || !pickupTime || !dropoffDate || !dropoffTime) {
      setValidationModal({
        isOpen: true,
        title: 'Pick-up and Return Time Required',
        message:
          'Please select a pick-up date, pick-up time, return date, and return time.',
      });
      return;
    }

    // Build pickup and dropoff datetime strings
    const pickupDatetime = `${pickupDate}T${pickupTime}:00`;
    const dropoffDatetime = `${dropoffDate}T${dropoffTime}:00`;

    // Pre-flight availability check — catch conflicts before creating
    // the booking and opening Stripe checkout.
    const { checkFleetAvailability } = await import('@/services/bookingServices');
    const isAvailable = await checkFleetAvailability(vehicleId, pickupDatetime, dropoffDatetime);
    if (!isAvailable) {
      setValidationModal({
        isOpen: true,
        title: 'Vehicle No Longer Available',
        message: 'This vehicle was just booked by another customer for the selected dates. Please choose a different time slot or vehicle.',
      });
      return;
    }

    // Get selected extras with quantities
    const selectedExtraItems = Object.entries(selectedExtras)
      .filter(([, value]) => value.enabled)
      .map(([id, value]) => ({ id: Number(id), quantity: value.quantity || 1 }))
      .filter((item) => !isNaN(item.id));

    // Validate location selection (only when locations are available to choose from)
    if (availableLocations.length > 0 && !pickupLocationId) {
      setValidationModal({
        isOpen: true,
        title: 'Pickup Location Required',
        message: 'Please select a pickup location for your rental.',
      });
      return;
    }

    if (availableLocations.length > 0 && !dropoffLocationId) {
      setValidationModal({
        isOpen: true,
        title: 'Drop-off Location Required',
        message: 'Please select a drop-off location for your rental.',
      });
      return;
    }

    // Create booking via API, then redirect to Stripe Checkout
    createBookingMutation(
      {
        fleet_id: Number(vehicleId),
        customer: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone_no: phone.trim(),
        },
        pickup_datetime: pickupDatetime,
        dropoff_datetime: dropoffDatetime,
        pickup_location_id: pickupLocationId ? Number(pickupLocationId) : 0,
        dropoff_location_id: dropoffLocationId ? Number(dropoffLocationId) : 0,
        insurance_selected: !selectedInsurance.has('own') && selectedInsurance.size > 0,
        cdw_cover: selectedInsurance.has('cdw'),
        rcli_cover: selectedInsurance.has('rcli'),
        sli_cover: selectedInsurance.has('sli'),
        pai_cover: selectedInsurance.has('pai'),
        extras: selectedExtraItems.length > 0 ? selectedExtraItems : undefined,
        discount_code: discountCode,
        promo_code: discountCode || undefined,
      },
      {
        onSuccess: (data) => {
          if (!data.customerId) {
            setValidationModal({
              isOpen: true,
              title: 'Payment Error',
              message: 'Could not retrieve customer information. Please contact support.',
            });
            return;
          }

          // Create Stripe checkout session and redirect
          const origin = window.location.origin;
          createCheckoutMutation(
            {
              bookingId: data.id,
              customerId: data.customerId,
              successUrl: `${origin}/booking/${data.id}`,
              cancelUrl: `${origin}/fleet/${vehicleId}/book`,
            },
            {
              onSuccess: (checkoutData) => {
                // Redirect to Stripe Checkout page
                window.location.href = checkoutData.checkoutUrl;
              },
              onError: (checkoutError: unknown) => {
                // Cancel the booking so the vehicle slot is released
                cancelBooking(data.id, 'Payment checkout failed').catch(() => {});

                let message = 'Could not initiate payment. Please try again.';
                if (checkoutError && typeof checkoutError === 'object' && 'response' in checkoutError) {
                  const res = (checkoutError as { response?: { data?: { errors?: Record<string, string[]> } } }).response;
                  const errors = res?.data?.errors;
                  if (errors) {
                    const messages = Object.values(errors).flat();
                    if (messages.length > 0) {
                      message = messages.join(' ');
                    }
                  }
                }
                setValidationModal({
                  isOpen: true,
                  title: 'Payment Failed',
                  message,
                });
              },
            }
          );
        },
        onError: (error: unknown) => {
          // Extract API error message — DRF returns validation errors
          // either as { field: ["msg"] } or nested { errors: { field: ["msg"] } }
          let message = 'Something went wrong. Please try again.';
          if (error && typeof error === 'object' && 'response' in error) {
            const res = (error as { response?: { data?: Record<string, unknown> } }).response;
            const data = res?.data;
            if (data) {
              // Try nested { errors: { field: [...] } } first
              const nested = data.errors as Record<string, string[]> | undefined;
              const source = nested ?? data;
              const messages = Object.values(source)
                .flat()
                .filter((v): v is string => typeof v === 'string');
              if (messages.length > 0) {
                message = messages.join(' ');
              }
            }
          }
          setValidationModal({
            isOpen: true,
            title: 'Booking Failed',
            message,
          });
        },
      }
    );
  };

  const handlePickupDateChange = (date: string) => {
    setPickupDate(date);
    // If new pickup date is after current dropoff date, push dropoff forward
    if (date > dropoffDate) {
      setDropoffDate(date);
    }
  };

  const handleDropoffDateChange = (date: string) => {
    setDropoffDate(date);
  };

  const handleEditPickUp = () => {
    setEditingDropoff(false);
    setEditingPickup((prev) => !prev);
  };
  const handleEditDropOff = () => {
    setEditingPickup(false);
    setEditingDropoff((prev) => !prev);
  };

  const handlePickupLocationChange = (id: string) => {
    // If dropoff matches the old pickup (user never changed it), sync dropoff to new pickup
    if (dropoffLocationId === pickupLocationId) {
      setDropoffLocationId(id);
    }
    setPickupLocationId(id);
    setEditingPickup(false);
  };
  const handleDropoffLocationChange = (id: string) => {
    setDropoffLocationId(id);
    setEditingDropoff(false);
  };

  // Build context value so BookingSidebar can consume shared state without prop drilling
  const sidebarContextValue: BookingSidebarContextValue = {
    locationEditing: {
      locations: availableLocations,
      pickupLocationId,
      dropoffLocationId,
      onPickupLocationSelect: handlePickupLocationChange,
      onDropoffLocationSelect: handleDropoffLocationChange,
      editingPickup,
      editingDropoff,
      isLoadingLocations,
    },
    dateTime: {
      pickupDateValue: pickupDate,
      pickupTimeValue: pickupTime,
      dropoffDateValue: dropoffDate,
      dropoffTimeValue: dropoffTime,
      onPickupDateChange: handlePickupDateChange,
      onPickupTimeChange: setPickupTime,
      onDropoffDateChange: handleDropoffDateChange,
      onDropoffTimeChange: setDropoffTime,
      minTime,
      maxTime,
      timezoneCaption,
      timesDisabled,
      unavailableDates,
    },
    invoice: {
      ...sidebarInvoiceProps,
      onApplyDiscount: handleApplyDiscount,
    },
    reserve: {
      paymentTermsAccepted,
      onPaymentTermsChange: setPaymentTermsAccepted,
      onReserve: handleReserve,
      isLoading: isCreatingBooking || isProcessingPayment,
    },
    onEditPickUp: handleEditPickUp,
    onEditDropOff: handleEditDropOff,
  };

  return (
    <div className="min-h-screen bg-white">
   

      <Header showBorderBottom />

      <main className="mx-auto max-w-7xl mobile-section-padding pt-6 pb-0 md:px-8 md:pt-8 md:pb-20">
        {/* Go Back Link */}
        <Link
          href={'/fleet' as const}
          className="inline-flex items-center text-sm font-medium text-primary underline hover:text-primary-hover"
        >
          Go Back
        </Link>

        {/* BookingSidebarProvider supplies shared state (location editing, date/time,
            invoice data, reserve state) via context so each BookingSidebar instance
            only needs variant + core display props. */}
        <BookingSidebarProvider value={sidebarContextValue}>
          {/* Mobile Vehicle Header - Shows on mobile only */}
          <div className="mt-6 -mx-8 lg:hidden">
            <BookingSidebar
              variant="mobile-header"
              vehicle={sidebarVehicle}
              pickUp={sidebarPickUp}
              dropOff={sidebarDropOff}
            />
          </div>

          {/* Main Content */}
          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:gap-12">
            {/* Left Column - Forms */}
            <div className="flex flex-1 flex-col gap-8 max-w-full lg:max-w-160">
              <CustomerDetailsSection
                firstName={firstName}
                lastName={lastName}
                email={email}
                phone={phone}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onEmailChange={setEmail}
                onPhoneChange={setPhone}
              />

              <InsuranceSection
                options={insuranceOptions}
                selectedIds={selectedInsurance}
                onToggle={handleInsuranceToggle}
              />

              <ExtrasSection
                extras={extras}
                selectedExtras={selectedExtras}
                onToggle={handleExtraToggle}
                onQuantityChange={handleExtraQuantityChange}
              />

              <PaymentDetailsSection
                onPayNow={handleReserve}
                isLoading={isCreatingBooking || isProcessingPayment}
                className="lg:flex lg:flex-1 lg:flex-col"
              />

              {/* Mobile Invoice Footer - Shows on mobile only */}
              <div className="-mx-8 lg:hidden">
                <BookingSidebar
                  variant="mobile-footer"
                  vehicle={sidebarVehicle}
                  pickUp={sidebarPickUp}
                  dropOff={sidebarDropOff}
                />
              </div>
            </div>

            {/* Right Column - Sidebar (Desktop only) */}
            <div className="hidden w-130 shrink-0 lg:block">
              <div className="sticky top-8">
                <BookingSidebar
                  vehicle={sidebarVehicle}
                  pickUp={sidebarPickUp}
                  dropOff={sidebarDropOff}
                />
              </div>
            </div>
          </div>
        </BookingSidebarProvider>
      </main>

      {/* Footer - Hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Validation Modal */}
      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal({ isOpen: false, title: '', message: '' })}
        title={validationModal.title}
        message={validationModal.message}
      />
    </div>
  );
}
