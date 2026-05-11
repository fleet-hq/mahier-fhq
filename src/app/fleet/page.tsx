'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnnouncementBar, Header, Footer } from '@/components/layout';
import {
  BookingBar,
  FleetSearch,
  FleetGrid,
  Pagination,
} from '@/components/sections/fleet';
import { FleetFilters, INITIAL_FILTERS, type FilterState } from '@/components/sections/fleet/fleet-filters';
import { useFleets, useBranchLocations, useFleetAvailability } from '@/hooks';

const ITEMS_PER_PAGE = 12;

export default function FleetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <FleetPageContent />
    </Suspense>
  );
}

function FleetPageContent() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const selectedFleetId = searchParams.get('selectedFleet') || undefined;

  // Build booking query string to forward to book pages
  const bookingQuery = useMemo(() => {
    const params = new URLSearchParams();
    ['pickupDate', 'pickupTime', 'returnDate', 'returnTime', 'pickupLocation', 'dropoffLocation'].forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [searchParams]);

  const { data, isLoading, error } = useFleets(currentPage, searchValue, 12);

  // Build pickup/dropoff datetimes from URL params for availability check
  const pickupDatetime = useMemo(() => {
    const date = searchParams.get('pickupDate');
    const time = searchParams.get('pickupTime');
    if (!date) return null;
    return `${date}T${time || '10:00'}:00`;
  }, [searchParams]);

  const dropoffDatetime = useMemo(() => {
    const date = searchParams.get('returnDate');
    const time = searchParams.get('returnTime');
    if (!date) return null;
    return `${date}T${time || '10:00'}:00`;
  }, [searchParams]);

  // Check availability for all vehicles when dates are provided
  const fleetIds = useMemo(() => (data?.results || []).map((v) => v.id), [data]);
  const { data: availability, isLoading: isAvailabilityLoading } = useFleetAvailability(fleetIds, pickupDatetime, dropoffDatetime);

  // available_at stores branch IDs - resolve to location address
  const firstBranchId = data?.results?.[0]?.availableLocations?.[0];
  const { data: branchLocations } = useBranchLocations(firstBranchId);

  const vehicles = useMemo(() => {
    const raw = data?.results || [];
    const address = branchLocations?.[0]?.address;

    return raw.map((vehicle) => ({
      ...vehicle,
      location: vehicle.location || address || '',
    }));
  }, [data, branchLocations]);

  // Track which fleets are unavailable for the selected dates
  const unavailableFleetIds = useMemo(() => {
    const ids = new Set<string>();
    if (!availability) return ids;
    for (const [id, available] of Object.entries(availability)) {
      if (available === false) ids.add(id);
    }
    return ids;
  }, [availability]);

  // Extract unique filter options from vehicles
  const filterOptions = useMemo(() => ({
    vehicleTypes: [...new Set(vehicles.map((v) => v.vehicleType).filter(Boolean))].sort(),
    makes: [...new Set(vehicles.map((v) => v.make).filter(Boolean))].sort(),
    colors: [...new Set(vehicles.map((v) => v.color).filter(Boolean))].sort(),
    seats: [...new Set(vehicles.map((v) => v.seats))].sort((a, b) => a - b),
  }), [vehicles]);

  // Apply client-side filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (filters.vehicleType.length && !filters.vehicleType.includes(v.vehicleType)) return false;
      if (filters.make.length && !filters.make.includes(v.make)) return false;
      if (filters.color.length && !filters.color.includes(v.color)) return false;
      if (filters.seats.length && !filters.seats.includes(v.seats)) return false;
      if (filters.minPrice != null && v.pricePerDay < filters.minPrice) return false;
      if (filters.maxPrice != null && v.pricePerDay > filters.maxPrice) return false;
      return true;
    });
  }, [vehicles, filters]);

  const activeFilterCount =
    filters.vehicleType.length +
    filters.make.length +
    filters.color.length +
    filters.seats.length +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0);

  // Wait for availability check before showing vehicles when dates are selected
  const needsAvailabilityCheck = !!pickupDatetime && !!dropoffDatetime;
  const isFullyLoaded = !isLoading && (!needsAvailabilityCheck || !isAvailabilityLoading);

  const totalResults = filteredVehicles.length;
  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Bar */}
   

      {/* Header */}
      <Header />

      {/* Booking Bar */}
      <BookingBar />

      {/* Main Content */}
      <main className="mx-auto max-w-296 mobile-section-padding py-8 md:py-12 min-h-[60vh]">
        {/* Search Header */}
        <FleetSearch
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onFilterClick={() => setFiltersOpen((o) => !o)}
          activeFilterCount={activeFilterCount}
        />

        {/* Filters Panel */}
        <FleetFilters
          isOpen={filtersOpen}
          filters={filters}
          options={filterOptions}
          activeCount={activeFilterCount}
          onFiltersChange={setFilters}
        />

        {/* Loading State */}
        {!isFullyLoaded && !error && (
          <div className="mt-10 flex justify-center items-center min-h-[40vh]">
            <div className="text-slate-500">Loading vehicles...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-10 flex justify-center">
            <div className="text-red-500">
              Failed to load vehicles. Please try again.
            </div>
          </div>
        )}

        {/* Vehicle Grid */}
        {isFullyLoaded && !error && (
          <>
            <div className="mt-10">
              <FleetGrid
                vehicles={filteredVehicles}
                bookingQuery={bookingQuery}
                selectedFleetId={selectedFleetId}
                unavailableFleetIds={unavailableFleetIds}
              />
            </div>

            {/* No results after filtering */}
            {filteredVehicles.length === 0 && vehicles.length > 0 && (
              <div className="mt-10 flex justify-center">
                <p className="text-sm text-slate-500">No vehicles match your filters.</p>
              </div>
            )}

            {/* Pagination */}
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                totalResults={totalResults}
                resultsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
