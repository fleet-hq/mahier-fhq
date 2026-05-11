'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PolicyPageLayout } from '@/components/layout';
import { RentalAgreementPreview } from '@/components/sections';
import { useAgreementByBooking, useCompanySettings, useDefaultAgreementTemplate } from '@/hooks';
import { useBookingDetails } from '@/hooks';
import { Spinner, ValidationModal } from '@/components/ui';
import { rentalAgreementContent } from '@/data/policies';
import { submitBookingSignature } from '@/services/agreementServices';
import type { AgreementData } from '@/services/agreementServices';
import { setBookingToken } from '@/utils/booking-token';

function RentalAgreementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const urlToken = searchParams.get('token');

  // State for localStorage agreement data
  const [localAgreementData, setLocalAgreementData] = useState<AgreementData | null>(null);
  const [localDataLoaded, setLocalDataLoaded] = useState(false);
  const [tokenReady, setTokenReady] = useState(!urlToken);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationModal, setValidationModal] = useState({ isOpen: false, title: '', message: '' });

  // Store token from URL into sessionStorage so API calls can use it
  useEffect(() => {
    if (urlToken) {
      setBookingToken(urlToken);
      setTokenReady(true);
    }
  }, [urlToken]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pendingAgreement');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalAgreementData(parsed);
      } catch (e) {
        // Invalid stored agreement data; ignore
      }
    }
    setLocalDataLoaded(true);
  }, []);

  // If bookingId is provided, fetch the agreement dynamically (wait for token)
  const { data: apiAgreement, isLoading: apiLoading, isError } = useAgreementByBooking(tokenReady && bookingId ? bookingId : undefined);

  // Fallback: fetch booking details + public clauses + company settings to construct agreement
  const needsFallback = bookingId && localDataLoaded && !apiLoading && (isError || !apiAgreement);
  const { data: bookingData, isLoading: bookingLoading } = useBookingDetails(needsFallback ? bookingId : undefined);
  const { data: companySettings, isLoading: companyLoading } = useCompanySettings();
  const { data: agreementTemplate, isLoading: templateLoading } = useDefaultAgreementTemplate();

  // Build fallback agreement from booking data + public clauses
  const fallbackAgreement = useMemo<AgreementData | null>(() => {
    if (!needsFallback || !bookingData) return null;

    return {
      id: 0,
      status: 'pending',
      signedAt: null,
      signatureImage: null,
      company: {
        name: companySettings?.name || 'N/A',
        address: companySettings?.address || 'N/A',
        email: companySettings?.email || 'N/A',
        phone: companySettings?.phone || 'N/A',
        logo: companySettings?.logo || null,
      },
      customer: {
        name: bookingData.customer.name,
        homeAddress: bookingData.customer.homeAddress || 'N/A',
        city: bookingData.customer.city || 'N/A',
        state: bookingData.customer.state || 'N/A',
        zip: bookingData.customer.zip || 'N/A',
        phone: bookingData.customer.phone,
        birthDate: bookingData.customer.dob || 'N/A',
        licenseNumber: bookingData.customer.licenseNumber || 'N/A',
        licenseExpiry: bookingData.customer.licenseExpiry || 'N/A',
      },
      insurance: {
        carrierName: bookingData.insuranceCoverage
          ? 'Bonzah Insurance'
          : bookingData.hasOwnInsurance
            ? 'Own Insurance'
            : 'N/A',
        policyNumber: bookingData.insuranceCoverage?.policyId || 'N/A',
        expires: 'N/A',
        status: bookingData.insuranceCoverage?.status || 'N/A',
        policyDetails: bookingData.insuranceCoverage
          ? [
              bookingData.insuranceCoverage.cdw && 'Collision Damage Waiver (CDW)',
              bookingData.insuranceCoverage.rcli && 'Rental Car Liability (RCLI)',
              bookingData.insuranceCoverage.sli && 'Supplemental Liability (SLI)',
              bookingData.insuranceCoverage.pai && 'Personal Accident (PAI)',
            ].filter(Boolean).join(', ')
          : bookingData.hasOwnInsurance
            ? 'Customer provided own insurance'
            : 'N/A',
        premiumAmount: bookingData.insuranceCoverage?.premiumAmount || 0,
      },
      vehicle: {
        pickupDateTime: `${bookingData.pickUp.date} ${bookingData.pickUp.time}`,
        dropoffDateTime: `${bookingData.dropOff.date} ${bookingData.dropOff.time}`,
        bookedAt: bookingData.bookedOn,
        vin: bookingData.vehicle.vin,
        vehicleName: bookingData.vehicle.name,
        minimumMiles: bookingData.vehicle.milesUnlimited
          ? 'Unlimited'
          : (bookingData.vehicle.milesPerDay ?? 0) > 0
            ? `${bookingData.vehicle.milesPerDay} miles/day`
            : 'N/A',
        maximumMiles: bookingData.vehicle.milesUnlimited
          ? 'Unlimited'
          : (bookingData.vehicle.milesPerDay ?? 0) > 0
            ? `${bookingData.vehicle.milesPerDay} miles/day`
            : 'N/A',
        overageFee: (bookingData.vehicle.milesOverageRate ?? 0) > 0
          ? `$${bookingData.vehicle.milesOverageRate!.toFixed(2)}/mile`
          : '$0.00',
        minDriverAge: bookingData.vehicle.minDriverAge ?? null,
        maxDriverAge: bookingData.vehicle.maxDriverAge ?? null,
      },
      invoice: {
        rentalTotal: bookingData.invoice.items[0]?.unit === 'hour'
          ? `$${bookingData.invoice.rentalTotal.toFixed(2)} (${bookingData.invoice.items[0].quantity} hrs × $${bookingData.invoice.items[0].pricePerDay.toFixed(2)}/hr)`
          : `$${bookingData.invoice.rentalTotal.toFixed(2)}`,
        fees: bookingData.invoice.fees > 0 ? `$${bookingData.invoice.fees.toFixed(2)}` : undefined,
        discount: bookingData.invoice.discount > 0 ? `-$${bookingData.invoice.discount.toFixed(2)}` : undefined,
        insurance: bookingData.insuranceCoverage
          ? `$${bookingData.insuranceCoverage.premiumAmount.toFixed(2)} (${[
              bookingData.insuranceCoverage.cdw && 'CDW',
              bookingData.insuranceCoverage.rcli && 'RCLI',
              bookingData.insuranceCoverage.sli && 'SLI',
              bookingData.insuranceCoverage.pai && 'PAI',
            ].filter(Boolean).join(', ')})`
          : undefined,
        tax: bookingData.invoice.tax > 0 ? `$${bookingData.invoice.tax.toFixed(2)}` : undefined,
        total: `$${bookingData.invoice.total.toFixed(2)}`,
        deposit: bookingData.invoice.deposit > 0 ? `$${bookingData.invoice.deposit.toFixed(2)}` : undefined,
      },
      clauses: agreementTemplate?.clauses || [],
      template: {
        title: agreementTemplate?.title || 'Vehicle Rental Agreement',
        description: agreementTemplate?.description || 'Please review and sign this rental agreement before pickup.',
      },
    };
  }, [needsFallback, bookingData, companySettings, agreementTemplate]);

  // When bookingId is present, prefer API/fallback data (has real invoice/insurance data)
  // Only use localStorage when no bookingId (pre-booking preview)
  const baseAgreement = bookingId
    ? (apiAgreement || fallbackAgreement || localAgreementData)
    : (localAgreementData || apiAgreement || fallbackAgreement);

  // Always use companySettings for company data (most current source)
  const agreement = useMemo(() => {
    if (!baseAgreement) return baseAgreement;
    if (!companySettings) return baseAgreement;
    return {
      ...baseAgreement,
      company: {
        name: companySettings.name || baseAgreement.company?.name || 'N/A',
        address: companySettings.address || baseAgreement.company?.address || 'N/A',
        email: companySettings.email || baseAgreement.company?.email || 'N/A',
        phone: companySettings.phone || baseAgreement.company?.phone || 'N/A',
        logo: companySettings.logo || baseAgreement.company?.logo || null,
      },
    };
  }, [baseAgreement, companySettings]);
  const isLoading = !localDataLoaded || !tokenReady || (bookingId && apiLoading) || (needsFallback && (bookingLoading || companyLoading || templateLoading));

  const handleSave = async () => {
    if (!signature) {
      setValidationModal({
        isOpen: true,
        title: 'Signature Required',
        message: 'Please sign the agreement before saving.',
      });
      return;
    }

    // Store signature in localStorage
    if (localAgreementData) {
      const signedAgreement = {
        ...localAgreementData,
        status: 'signed',
        signatureImage: signature,
        signedAt: new Date().toISOString(),
      };
      localStorage.setItem('pendingAgreement', JSON.stringify(signedAgreement));
    }

    // Submit signature to backend if we have a real bookingId
    if (bookingId) {
      setIsSaving(true);
      try {
        await submitBookingSignature(bookingId, signature);
      } catch (e) {
        // Signature submission failed; continue to navigate back
      } finally {
        setIsSaving(false);
      }
    }

    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-500">Loading agreement...</p>
        </div>
      </div>
    );
  }

  // Error state when agreement not found (even after fallback)
  if (bookingId && !agreement) {
    return (
      <PolicyPageLayout
        title={rentalAgreementContent.title}
        description={rentalAgreementContent.description}
        primaryButtonLabel="Save"
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-slate-900">Agreement not found</h2>
          <p className="mt-2 text-slate-600">
            No agreement found for this booking. Please contact support.
          </p>
        </div>
      </PolicyPageLayout>
    );
  }

  const isSigned = agreement?.status === 'signed' || !!agreement?.signatureImage;

  return (
    <>
      <PolicyPageLayout
        title={rentalAgreementContent.title}
        description={rentalAgreementContent.description}
        primaryButtonLabel={isSigned ? 'Signed' : isSaving ? 'Saving...' : 'Save'}
        onPrimaryAction={isSigned ? undefined : handleSave}
      >
        <RentalAgreementPreview
          data={agreement || undefined}
          onSignatureChange={setSignature}
        />
      </PolicyPageLayout>

      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal({ isOpen: false, title: '', message: '' })}
        title={validationModal.title}
        message={validationModal.message}
      />
    </>
  );
}

export default function RentalAgreementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RentalAgreementContent />
    </Suspense>
  );
}
