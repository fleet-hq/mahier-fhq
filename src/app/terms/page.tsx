'use client';

import { Suspense } from 'react';
import DOMPurify from 'dompurify';
import { PolicyPageLayout } from '@/components/layout';
import { useDefaultAgreementTemplate } from '@/hooks';
import { Spinner } from '@/components/ui';

function TermsAndConditionsContent() {
  const { data: agreementTemplate, isLoading } = useDefaultAgreementTemplate();

  const clauses = agreementTemplate?.clauses || [];

  return (
    <PolicyPageLayout
      title="Terms and Conditions"
      description="Please review our terms and conditions before proceeding with your rental."
      primaryButtonLabel="Accept"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : clauses.length === 0 ? (
        <p className="text-gray-500 italic py-8">No terms and conditions available.</p>
      ) : (
        <div className="space-y-8">
          {clauses.map((clause, index) => (
            <section key={clause.id}>
              <h2 className="font-manrope text-base font-semibold leading-none tracking-tight-2 text-navy">
                {index + 1}. {clause.title}
              </h2>
              <div
                className="mt-4 text-xs font-light leading-[1.61] text-slate-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(clause.content) }}
              />
            </section>
          ))}
        </div>
      )}
    </PolicyPageLayout>
  );
}

export default function TermsAndConditionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <TermsAndConditionsContent />
    </Suspense>
  );
}
