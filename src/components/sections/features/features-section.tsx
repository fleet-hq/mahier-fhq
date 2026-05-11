import { FeatureCard } from './feature-card';

interface Feature {
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  title?: string;
  subtitle?: string;
  features: Feature[];
}

export function FeaturesSection({
  title = 'Why Choose Kings Car Rental',
  subtitle = "We're not just a car rental company — we're your local partner in Ketchikan",
  features,
}: FeaturesSectionProps) {
  return (
    <section className="bg-white pb-4 pt-12 sm:pb-4 sm:pt-16 lg:pt-20">
      <div className="mx-auto max-w-7xl mobile-section-padding">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold tracking-tight-2 text-primary-light">{title}</p>
          <h2 className="mt-2 text-4xl font-bold leading-[1.17] tracking-tight-2 text-slate-900 lg:text-[36px]">
            {subtitle}
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 flex flex-col items-center gap-6 px-6 sm:mt-12 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-5 sm:px-0">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
