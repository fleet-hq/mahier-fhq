'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PolicyPageLayout } from '@/components/layout';
import { RentalAgreementPreview } from '@/components/sections';
import { useAgreement, useAcceptAgreement } from '@/hooks';
import { Spinner, ValidationModal } from '@/components/ui';
import { rentalAgreementContent } from '@/data/policies';
import type { AgreementData } from '@/services/agreementServices';

function RentalAgreementContent() {
  const params = useParams();
  const router = useRouter();
  const agreementId = params.agreementId as string;

  // Check if this is a temp agreement (stored in localStorage)
  const isTempAgreement = agreementId.startsWith('temp-agreement-');

  // State for localStorage agreement data
  const [localAgreementData, setLocalAgreementData] = useState<AgreementData | null>(null);
  const [localDataLoaded, setLocalDataLoaded] = useState(false);
  const [localDataError, setLocalDataError] = useState<string | null>(null);

  // Load from localStorage for temp agreements
  useEffect(() => {
    if (isTempAgreement) {
      const stored = localStorage.getItem('pendingAgreement');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLocalAgreementData(parsed);
        } catch (e) {
          console.error('Failed to parse stored agreement data:', e);
          setLocalDataError('The stored agreement data is corrupted. Please create a new booking.');
        }
      }
      setLocalDataLoaded(true);
    }
  }, [isTempAgreement]);

  const [signature, setSignature] = useState<string | null>(null);
  const [validationModal, setValidationModal] = useState({ isOpen: false, title: '', message: '' });

  // Only fetch from API if not a temp agreement
  const { data: apiAgreement, isLoading: apiLoading, isError: apiError } = useAgreement(
    isTempAgreement ? undefined : agreementId
  );
  const { mutate: acceptAgreement, isPending: isAccepting } = useAcceptAgreement();

  // Use local data for temp agreements, API data otherwise
  const agreement = isTempAgreement ? localAgreementData : apiAgreement;
  const isLoading = isTempAgreement ? !localDataLoaded : apiLoading;
  const isError = isTempAgreement ? (localDataLoaded && !localAgreementData) || !!localDataError : apiError;

  const handleSave = () => {
    if (!signature) {
      setValidationModal({
        isOpen: true,
        title: 'Signature Required',
        message: 'Please sign the agreement before saving.',
      });
      return;
    }

    // For temp agreements, store signature in localStorage and navigate back
    if (isTempAgreement && localAgreementData) {
      const signedAgreement = {
        ...localAgreementData,
        status: 'signed',
        signatureImage: signature,
        signedAt: new Date().toISOString(),
      };
      localStorage.setItem('pendingAgreement', JSON.stringify(signedAgreement));
      router.back();
      return;
    }

    acceptAgreement(
      { agreementId, signatureData: signature },
      {
        onSuccess: () => {
          // Navigate back to the previous page after successful signing
          router.back();
        },
        onError: (error) => {
          setValidationModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to sign agreement. Please try again.',
          });
        },
      }
    );
  };

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

  if (isError || !agreement) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Agreement not found</h1>
          <p className="mt-2 text-slate-600">
            {localDataError || 'The agreement you are looking for does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  // If already signed, show read-only view
  const isSigned = agreement.status === 'signed' || !!agreement.signatureImage;

  return (
    <>
      <PolicyPageLayout
        title={rentalAgreementContent.title}
        description={rentalAgreementContent.description}
        primaryButtonLabel={isSigned ? 'Signed' : isAccepting ? 'Saving...' : 'Save'}
        onPrimaryAction={isSigned ? undefined : handleSave}
      >
        <RentalAgreementPreview
          data={agreement}
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
