'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';
import { Button } from '@/components/ui/button';

interface PolicyPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  primaryButtonLabel?: string;
  onPrimaryAction?: () => void;
}

export function PolicyPageLayout({
  title,
  description,
  children,
  primaryButtonLabel = 'Accept',
  onPrimaryAction,
}: PolicyPageLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkbox = searchParams.get('checkbox');

  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      if (checkbox) {
        sessionStorage.setItem('termsAccepted', checkbox);
      }
      router.back();
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showBorderBottom />

      <main className="mx-auto max-w-7xl mobile-section-padding py-6 md:px-8 md:py-8">
        {/* Go Back Link */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center text-sm font-medium text-primary underline hover:text-primary-hover"
        >
          Go Back
        </button>

        {/* Title Section */}
        <div className="mt-6 flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="md:flex-1">
            <h1 className="font-manrope text-2xl font-semibold leading-none tracking-tight-2 text-navy">
              {title}
            </h1>
            <p className="mt-2 text-xs font-light leading-[1.61] text-slate-500">
              {description}
            </p>
          </div>
          {/* Mobile Download Button */}
          <Button variant="primary" className="mt-4 w-full gap-2.5 text-xs md:hidden">
            <Image src="/icons/download.svg" alt="Download" width={15} height={17} />
            Download PDF
          </Button>
          {/* Desktop Download Button */}
          <Button variant="primary" className="hidden shrink-0 gap-2.5 text-xs md:inline-flex">
            <Image src="/icons/download.svg" alt="Download" width={15} height={17} />
            Download PDF
          </Button>
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-slate-200" />

        {/* Content */}
        {children}

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col gap-3 md:flex-row md:justify-end md:gap-4">
          <Button variant="dark" onClick={handleCancel} className="w-full py-4 text-xs md:w-auto md:min-w-[180px] md:px-12">
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePrimaryAction} className="w-full py-4 text-xs md:w-auto md:min-w-[180px] md:px-12">
            {primaryButtonLabel}
          </Button>
        </div>
      </main>

      {/* Footer - Hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
