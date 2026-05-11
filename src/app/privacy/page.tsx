'use client';

import { Suspense } from 'react';
import { PolicyPageLayout } from '@/components/layout';
import { PolicySections } from '@/components/sections';
import { privacyContent } from '@/data/policies';

function PrivacyPolicyContent() {
  return (
    <PolicyPageLayout
      title={privacyContent.title}
      description={privacyContent.description}
      primaryButtonLabel="Accept"
    >
      <PolicySections sections={privacyContent.sections} />
    </PolicyPageLayout>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PrivacyPolicyContent />
    </Suspense>
  );
}
