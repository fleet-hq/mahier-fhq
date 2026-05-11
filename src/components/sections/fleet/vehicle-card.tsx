'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { DiscountTag } from '@/components/ui/DiscountTag';

const PLACEHOLDER_IMAGE = '/images/vehicles/car_placeholder.png';

interface VehicleCardProps {
  id: string;
  name: string;
  image: string;
  location: string;
  seats: number;
  transmission: string;
  pricePerDay: number;
  pricePerHour?: number;
  maxDiscount?: number;
  bookingQuery?: string;
  /** When true, clicking navigates to /fleet?selectedFleet=id instead of booking page */
  homePreview?: boolean;
  /** Highlight this card as the selected fleet */
  selected?: boolean;
  /** Mark this fleet as unavailable for the selected dates */
  unavailable?: boolean;
}

function formatPriceParts(amount: number) {
  const fixed = amount.toFixed(2);
  const [whole, fraction] = fixed.split('.');
  return { whole, fraction };
}

export function VehicleCard({
  id,
  name,
  image,
  location,
  seats,
  transmission,
  pricePerDay,
  pricePerHour = 0,
  maxDiscount = 0,
  bookingQuery = '',
  homePreview = false,
  selected = false,
  unavailable = false,
}: VehicleCardProps) {
  const [imgSrc, setImgSrc] = useState(image || PLACEHOLDER_IMAGE);
  const cardRef = useRef<HTMLAnchorElement>(null);

  const href = homePreview
    ? `/fleet?selectedFleet=${id}`
    : `/fleet/${id}/book${bookingQuery ? `?${bookingQuery}` : ''}`;

  useEffect(() => {
    if (selected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selected]);

  return (
    <Link ref={cardRef} href={href} className="group block w-full">
      <div
        className={`overflow-hidden rounded-xl border bg-white transition-shadow ${
          selected
            ? 'border-slate-900 shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
            : 'border-slate-100 hover:shadow-lg'
        } ${unavailable ? 'opacity-60' : ''}`}
      >
        {/* Image */}
        <div className="relative aspect-[262/183] w-full overflow-hidden bg-slate-100">
          <Image
            src={imgSrc}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgSrc(PLACEHOLDER_IMAGE)}
          />
          {unavailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
                Not Available
              </span>
            </div>
          )}
          {maxDiscount > 0 && !unavailable && (
            <div className="absolute top-2 left-2">
              <DiscountTag label={`Up to ${maxDiscount}% off`} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-4 text-center">
          <h3 className="truncate text-lg font-medium tracking-tight-3 text-slate-900" title={name}>{name}</h3>
          <p className="truncate py-1 text-[10px] font-normal leading-none tracking-tight-3 text-[#A8A8A8]" title={location}>{location}</p>

          {/* Specs */}
          <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-100 pt-3 md:gap-2">
            <div className="flex items-center gap-1">
              <Image src="/icons/home/choose-us/avatar.svg" alt="Seats" width={14} height={14} />
              <span className="text-xs font-normal leading-none text-slate-500">{seats} Seats</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <Image src="/icons/home/choose-us/transmission.svg" alt="Transmission" width={14} height={14} />
              <span className="text-xs font-normal leading-none text-slate-500">{transmission}</span>
            </div>
          </div>

          {/* Price */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-900">
                {pricePerHour > 0 && pricePerDay > 0 ? 'From' : 'Standard Price'}
              </span>
              <div className="flex items-baseline gap-2">
                {pricePerDay > 0 && (() => {
                  const { whole, fraction } = formatPriceParts(pricePerDay);
                  return (
                    <span>
                      <span className="text-xl font-bold text-slate-900">${whole}.</span>
                      <span className="text-[12px] font-bold text-slate-900">{fraction}</span>
                      <span className="text-2xs text-slate-500">/day</span>
                    </span>
                  );
                })()}
                {pricePerHour > 0 && pricePerDay > 0 && (
                  <span className="text-slate-300">|</span>
                )}
                {pricePerHour > 0 && (() => {
                  const { whole, fraction } = formatPriceParts(pricePerHour);
                  return (
                    <span>
                      <span className={`${pricePerDay > 0 ? 'text-sm' : 'text-xl'} font-bold text-slate-900`}>${whole}.</span>
                      <span className="text-[12px] font-bold text-slate-900">{fraction}</span>
                      <span className="text-2xs text-slate-500">/hr</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
