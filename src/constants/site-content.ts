// Site-specific content for the homepage and static pages.
// When white-labeling, duplicate this file per company or fetch from API.

export const siteContent = {
  company: {
    name: 'Maheir Rentals',
    logo: '/logos/website-logo.svg',
    monoLogo: '/logos/mono-logo.svg',
    phone: '+1 347-613-0295',
    email: 'ari@maheirrentalmanagement.com',
    address:
      '419 North Federal Highway, Hallandale Beach, FL  (Service Area: Fort Lauderdale / Miami)',
    description:
      'Deliver reliable transportation solutions while creating opportunities for individuals to build scalable income streams.',
  },

  navLinks: [
    { label: 'About', href: '/#about' },
    { label: 'Fleet', href: '/#fleet' },
    { label: 'FAQs', href: '/#faqs' },
  ],

  hero: {
    backgroundImage: '/images/home/hero/hero-bg.jpg',
    mobileBackgroundImage: '/images/home/hero/hero-bg.jpg',
    heading: 'Airport Delivery.\nCleaned & Well-Maintained Vehicles.',
    description:
      'Enjoy a seamless rental experience in Hallandale Beach and beyond. With professionally detailed cars and direct-to-terminal delivery, we make sure your trip starts the moment you land.',
  },

  fleetPreview: {
    title: 'Our Fleet',
    subtitle: 'Ready for Any Destination.',
    description:
      'No middlemen, no hidden fees, no guesswork. Just reliable vehicles and personalized service from a local team you can trust.',
  },

  features: {
    title: 'Why Choose Us',
    subtitle: 'Trust, Quality, & Value',
    items: [
      {
        title: 'Terminal-Direct Delivery',
        description:
          'Skip the shuttle and the long lines. We deliver your vehicle directly to the airport so you can get on the road immediately.',
      },
      {
        title: 'Showroom Cleanliness',
        description:
          'Every vehicle in our fleet is meticulously inspected and professionally cleaned before every booking. Your safety and comfort are our priority.',
      },
      {
        title: 'Seamless Communication',
        description:
          'Experience the “Maheir Standard.” No automated loops, just direct, 24/7 support from a host who values your time.',
      },
    ],
  },

  about: {
    paragraphs: [
      'At Maheir Rentals, we believe renting a car should be simple, reliable, and entirely stress-free. Our mission is to provide high-quality vehicles at competitive prices, backed by the kind of unmatched customer service that turns first-time renters into lifelong clients.',
      'From business travel to family vacations, we offer a selection of vehicles to fit every lifestyle. We don’t just hand over the keys; we ensure every car is carefully inspected for safety, performance, and peak cleanliness.',
      'It’s not just about cars, it’s about trust. From easy booking to flexible pickup options, our team is dedicated to going the extra mile to make your South Florida experience seamless from start to finish.',
    ],
    image: '/images/home/about/founders.jpg',
  },

  testimonials: {
    title: 'What Our Customers Say',
    subtitle: 'Stories of Real Results',
    items: [
      {
        rating: 5,
        quote: 'Great Host! Great communication!',
        content:
          'Easy pick up and drop off. Nice and clean car, will definitely book again. Thank you!',
        author: 'Katricia',
        location: 'BMW X3',
        date: 'April 14, 2026',
      },
      {
        rating: 5,
        quote: 'Car in great condition.',
        content: 'Great communication from host. Will rent again.',
        author: 'I’leah',
        location: 'Kia Sportage',
        date: 'April 18, 2026',
      },
      {
        rating: 5,
        quote: 'Great car, brand new',
        content: 'Great host, great communication. Loved it! Easy and simple.',
        author: 'Jahmel & Shamere',
        location: 'Chevrolet Equinox',
        date: 'April 13, 2026',
      },
    ],
  },

  faqs: {
    title: 'Got any questions?',
    subtitle: 'Frequently Asked Questions',
    description:
      'Your Road Trip, Simplified. Everything You Need to Know About Renting with Maheir Rentals.',
    items: [
      {
        question: 'Do I need insurance?',
        answer:
          'Yes. Protection options are available during the booking process so you can choose the coverage that fits your needs.',
      },
      {
        question: 'Is there a security deposit?',
        answer:
          'Yes. A refundable hold is placed on your card at booking to cover incidentals. The hold is released after the trip ends and the vehicle is returned in good condition.',
      },
      {
        question: 'Can I get the car delivered?',
        answer:
          'Yes. We offer terminal-direct delivery to the airport, plus drop-offs to your hotel or home in the Hallandale Beach, Fort Lauderdale, and Miami service area. Select your pickup location during booking — we’ll confirm the details with you directly.',
      },
      {
        question: 'What do I need to book?',
        answer:
          'A valid driver’s license, a credit or debit card, and a few minutes. International renters may need to provide a passport and an International Driving Permit.',
      },
      {
        question: 'Can I extend my trip?',
        answer:
          'Absolutely. You can extend directly from your booking page as long as the vehicle is available. Additional days are billed at the same daily rate, and your insurance coverage is automatically extended for the new dates.',
      },
    ],
  },

  cta: {
    title: 'Ready to Experience a Better Way to Rent?',
    description:
      'Don’t settle for the rental counter. Book a premium, clean, and reliable vehicle with Maheir Rentals today.',
    backgroundImage: '/images/home/CTA/cta-bg.jpg',
  },
};
