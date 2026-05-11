import { BookingForm } from './booking-form';

interface HeroSectionProps {
  backgroundImage?: string;
  mobileBackgroundImage?: string;
  heading?: string;
  description?: string;
}

export function HeroSection({
  backgroundImage = '/images/home/hero/hero-bg.jpg',
  mobileBackgroundImage = '/images/home/hero/hero-bg-mobile.jpg',
  heading = 'Rent the Exact Car You Want',
  description = 'Experience premium vehicles, seamless booking, and great hospitality from a local expert. We handle the car and you enjoy the road.',
}: HeroSectionProps) {
  return (
    <section className="relative z-10 pb-8 sm:pb-0">
      {/* Background Image */}
      <div className="relative h-112.5 bg-cover bg-center bg-no-repeat md:h-135">
        {/* Mobile hero */}
        <div
          className="absolute inset-0 bg-cover bg-center sm:hidden"
          style={{ backgroundImage: `url(${mobileBackgroundImage})` }}
        />
        {/* Desktop hero */}
        <div
          className="absolute inset-0 hidden bg-cover bg-center sm:block"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Hero Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 lg:px-8">
          <h1
            className="font-barlow font-bold text-white text-center whitespace-pre-line text-[28px] sm:text-[36px] md:text-[48px]"
            style={{
              lineHeight: '112%',
              letterSpacing: '-0.02em',
            }}
          >
            {heading}
          </h1>
          <p className="mt-3 sm:mt-4 text-white/90 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Booking Form - Positioned to overlap */}
      <div className="relative mx-auto max-w-[1200px] px-0 sm:px-6 lg:px-8">
        <div className="-mt-16 md:-mt-20">
          <BookingForm />
        </div>
      </div>
    </section>
  );
}
