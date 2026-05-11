import Link from 'next/link';
import { VehicleCard } from './vehicle-card';

interface Vehicle {
  id: string;
  name: string;
  image: string;
  location: string;
  seats: number;
  transmission: string;
  pricePerDay: number;
  pricePerHour?: number;
  maxDiscount?: number;
}

interface FleetPreviewSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  vehicles: Vehicle[];
  showExploreButton?: boolean;
}

export function FleetPreviewSection({
  title = 'Why Choose Kings Car Rental',
  subtitle = "We're not just a car rental company — we're your local partner in Ketchikan",
  description = "Our Practical Fleet is clean, reliable vehicles for real Alaska adventures. No luxury markup, just honest transportation. We know these roads. We know these islands. And we know that in a small town, trust and reliability matter more than flashy marketing. That's why we keep our fleet clean and dependable, our prices fair, and our service genuinely friendly.",
  vehicles,
  showExploreButton = true,
}: FleetPreviewSectionProps) {
  return (
    <section id="fleet" className="fleet-section -mt-28 pt-48 pb-20 sm:-mt-20 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl mobile-section-padding">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold tracking-tight-2 text-primary-light">{title}</p>
          <h2 className="mt-2 text-4xl font-bold leading-[1.17] tracking-tight-2 text-slate-900 lg:text-[36px]">
            {subtitle}
          </h2>
          <p className="section-paragraph mt-4 text-slate-600">{description}</p>
        </div>

        {/* Vehicle Cards */}
        <div className="mt-16 flex flex-col items-center gap-6 sm:mt-12 sm:flex-row sm:flex-wrap sm:justify-center">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="w-full max-w-[262px] sm:w-[262px]">
              <VehicleCard {...vehicle} homePreview />
            </div>
          ))}
        </div>

        {/* Explore More Button */}
        {showExploreButton && (
          <div className="mt-8 text-center sm:mt-12">
            <Link
              href="/fleet"
              className="inline-block rounded-lg bg-primary px-10 py-4 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Explore More
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
