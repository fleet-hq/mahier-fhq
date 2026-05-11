import { Header, Footer } from '@/components/layout';
import {
  HeroSection,
  FleetPreviewClient,
  FeaturesSection,
  AboutSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
} from '@/components/sections';
import { siteContent } from '@/constants/site-content';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection
        backgroundImage={siteContent.hero.backgroundImage}
        mobileBackgroundImage={siteContent.hero.mobileBackgroundImage}
        heading={siteContent.hero.heading}
        description={siteContent.hero.description}
      />
      <FleetPreviewClient
        title={siteContent.fleetPreview.title}
        subtitle={siteContent.fleetPreview.subtitle}
        description={siteContent.fleetPreview.description}
      />
      <FeaturesSection
        title={siteContent.features.title}
        subtitle={siteContent.features.subtitle}
        features={siteContent.features.items}
      />
      <AboutSection
        paragraphs={siteContent.about.paragraphs}
        image={siteContent.about.image}
      />
      <TestimonialsSection
        title={siteContent.testimonials.title}
        subtitle={siteContent.testimonials.subtitle}
        testimonials={siteContent.testimonials.items}
      />
      <FAQSection
        title={siteContent.faqs.title}
        subtitle={siteContent.faqs.subtitle}
        description={siteContent.faqs.description}
        faqs={siteContent.faqs.items}
      />
      <CTASection
        title={siteContent.cta.title}
        description={siteContent.cta.description}
        backgroundImage={siteContent.cta.backgroundImage}
      />
      <Footer hasCTAOverlap />
    </div>
  );
}
