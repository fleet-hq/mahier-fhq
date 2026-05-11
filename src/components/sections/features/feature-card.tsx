interface FeatureCardProps {
  title: string;
  description: string;
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="w-full rounded-lg bg-[#f8f8f9] px-6 py-6 sm:h-32 sm:w-72 sm:rounded-md sm:px-7 sm:py-6 sm:overflow-hidden">
      <h3 className="text-sm font-bold leading-[1.17] tracking-tight-2 text-slate-900 sm:text-xs sm:leading-[1.08]">{title}</h3>
      <p className="feature-description mt-2">{description}</p>
    </div>
  );
}
