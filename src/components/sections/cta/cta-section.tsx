import Link from 'next/link';

interface CTASectionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  backgroundImage?: string;
}

export function CTASection({
  title = 'Book your ride today!',
  description = "Ready to hit the road? Booking with us is fast and simple. Browse our fleet online, choose your vehicle, and reserve it within minutes. For personalized assistance, feel free to contact our team directly.",
  buttonText = 'Book Now',
  buttonHref = '/book',
  backgroundImage = '/images/cta-bg.jpg',
}: CTASectionProps) {
  return (
    <section className="relative z-10 mx-auto -mb-6 max-w-6xl px-0 sm:-mb-24 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat sm:rounded-2xl"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative px-6 py-12 text-center sm:px-8 sm:py-16 md:px-16 md:py-24">
          <h2 className="text-4xl font-bold leading-[1.17] tracking-tight-2 text-white lg:text-[36px]">{title}</h2>
          <p className="section-paragraph mx-auto mt-4 max-w-2xl text-white">{description}</p>
          <div className="mt-6 sm:mt-8">
            <Link
              href={buttonHref}
              className="inline-block rounded-lg bg-primary-light px-8 py-3 text-xs font-medium text-white transition-colors hover:bg-primary-hover sm:px-10 sm:py-4"
            >
              {buttonText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
