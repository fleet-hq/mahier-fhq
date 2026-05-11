'use client';

import { useMemo } from 'react';
import { useFleets, useBranchLocations } from '@/hooks';
import { FleetPreviewSection } from './fleet-preview-section';

interface FleetPreviewClientProps {
  title?: string;
  subtitle?: string;
  description?: string;
  showExploreButton?: boolean;
}

export function FleetPreviewClient({
  title,
  subtitle,
  description,
  showExploreButton = true,
}: FleetPreviewClientProps) {
  const { data, isLoading } = useFleets(1, '');

  // available_at stores branch IDs - resolve to location address
  const firstBranchId = data?.results?.[0]?.availableLocations?.[0];
  const { data: branchLocations } = useBranchLocations(firstBranchId);

  const vehicles = useMemo(() => {
    const raw = data?.results?.slice(0, 3) || [];
    const address = branchLocations?.[0]?.address;
    if (!address) return raw;

    return raw.map((vehicle) => ({
      ...vehicle,
      location: vehicle.location || address,
    }));
  }, [data, branchLocations]);

  if (isLoading) {
    return (
      <section className="py-20 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <div className="text-slate-500">Loading vehicles...</div>
        </div>
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section id="fleet" className="py-20 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wide-12 text-primary">Our Fleet</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight-2 text-slate-900 sm:text-4xl">
            Browse Our Vehicles
          </h2>
          <div className="mx-auto mt-12 flex min-h-60 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-surface">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-500">No active vehicles available at the moment</p>
              <p className="mt-1 text-xs text-slate-400">Please check back later</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <FleetPreviewSection
      title={title}
      subtitle={subtitle}
      description={description}
      vehicles={vehicles}
      showExploreButton={showExploreButton}
    />
  );
}
