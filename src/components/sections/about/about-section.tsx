import Image from 'next/image';

interface AboutSectionProps {
  greeting?: string;
  founders?: {
    name1: string;
    name2: string;
  };
  paragraphs: string[];
  image?: string;
  imageAlt?: string;
}

export function AboutSection({
  paragraphs,
  image = '/images/founders.jpg',
}: AboutSectionProps) {
  return (
    <section id="about" className="bg-white pb-24 pt-8 sm:pb-16 sm:pt-4 lg:pb-20 scroll-mt-20">
      <div className="mx-auto max-w-222 mobile-section-padding lg:px-0">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:justify-between lg:gap-16">
          {/* Text Content */}
          <div className="w-full lg:max-w-95">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mt-4 section-paragraph text-slate-600">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Image — fixed 330×330 square with 10px radius on desktop;
              full-width responsive square on mobile. */}
          <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-[10px] lg:aspect-auto lg:h-82.5 lg:w-82.5">
            <Image
              src={image}
              alt="About us"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
