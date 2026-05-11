import { FAQItem } from './faq-item';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  faqs: FAQ[];
}

export function FAQSection({
  title = 'Got any questions?',
  subtitle = 'Frequently Asked Questions',
  description = "Our Practical Fleet is clean, reliable vehicles for real Alaska adventures. No luxury markup, just honest transportation. We know these roads. We know these islands.",
  faqs,
}: FAQSectionProps) {
  return (
    <section id="faqs" className="bg-white pt-20 pb-16 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16 scroll-mt-20">
      <div className="mx-auto max-w-5xl mobile-section-padding sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Left Side - Title & Description */}
          <div className="w-full shrink-0 text-center lg:w-80 lg:text-left">
            <p className="text-sm font-bold tracking-tight-2 text-primary-light">{title}</p>
            <h2 className="mt-2 text-4xl font-bold leading-[1.17] tracking-tight-2 text-slate-900 lg:text-[36px]">
              {subtitle}
            </h2>
            <p className="section-paragraph mt-4 text-slate-600">{description}</p>
          </div>

          {/* Right Side - FAQ Accordion */}
          <div className="flex-1">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
