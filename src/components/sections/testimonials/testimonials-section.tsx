import { TestimonialCard } from './testimonial-card';

interface Testimonial {
  rating: number;
  quote: string;
  content: string;
  author: string;
  location: string;
  date: string;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
}

export function TestimonialsSection({
  title = 'What Our Customers Say',
  subtitle = 'Hear directly from our Customers',
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="bg-navy py-20 pb-24 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl mobile-section-padding lg:px-16">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-bold tracking-tight-2 text-primary-light">{title}</p>
          <h2 className="mt-2 text-4xl font-bold leading-[1.17] tracking-tight-2 text-white lg:text-[36px]">
            {subtitle}
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid grid-cols-1 gap-12 sm:mt-16 sm:grid-cols-2 sm:gap-8 lg:mt-20 lg:grid-cols-3 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              rating={testimonial.rating}
              quote={testimonial.quote}
              content={testimonial.content}
              author={testimonial.author}
              location={testimonial.location}
              date={testimonial.date}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
