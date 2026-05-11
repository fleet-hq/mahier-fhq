'use client';

import Link from 'next/link';
import Image from 'next/image';
import { siteContent } from '@/constants/site-content';

const { company: companyInfo, navLinks } = siteContent;

const socialLinks = [
  { label: 'Twitter', href: '#', icon: '/icons/footer/twitter.svg' },
  { label: 'Facebook', href: '#', icon: '/icons/footer/facebook.svg' },
  { label: 'Instagram', href: '#', icon: '/icons/footer/instagram.svg' },
  { label: 'GitHub', href: '#', icon: '/icons/footer/github.svg' },
];

interface FooterProps {
  companyDescription?: string;
  hasCTAOverlap?: boolean;
}

export function Footer({
  companyDescription,
  hasCTAOverlap = false,
}: FooterProps) {
  const logo = companyInfo.monoLogo;
  const companyName = companyInfo.name;
  const phone = companyInfo.phone;
  const email = companyInfo.email;
  const address = companyInfo.address;
  const description = companyDescription || companyInfo.description;

  return (
    <footer id="contact" className={`bg-navy ${hasCTAOverlap ? 'pt-14 sm:pt-56' : 'pt-10'} scroll-mt-20 mt-auto`}>
      <div className="mx-auto max-w-240 footer-padding py-6">
        <div className="flex flex-col gap-6 md:flex-row md:gap-10 md:justify-between">
          {/* Logo & Description */}
          <div className="max-w-full md:max-w-70">
            {/* Logo */}
            <div className="mb-4 sm:mb-6">
              <Image
                src={logo}
                alt={companyName}
                width={80}
                height={80}
                className="h-16 w-auto"
                priority
              />
            </div>
            <p className="mb-4 text-xs font-light leading-tight text-white sm:mb-6">
              {description}
            </p>
            {/* Social Links */}
            <div className="mb-4 flex gap-3 sm:mb-0">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex items-center justify-center transition-opacity hover:opacity-70"
                  aria-label={social.label}
                >
                  <Image src={social.icon} alt={social.label} width={28} height={28} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links & Contact - grouped closer */}
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-primary-light">Quick Links</h3>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs font-light leading-none text-white transition-colors hover:text-primary-light"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-primary-light">Contact</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-3 text-xs font-light leading-none text-white transition-colors hover:text-primary-light"
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="break-all">{phone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 text-xs font-light leading-none text-white transition-colors hover:text-primary-light"
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="break-all">{email}</span>
                  </a>
                </li>
                <li className="flex items-start gap-3 text-xs font-light leading-snug text-white">
                  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="w-56">{address}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mx-auto max-w-240 footer-padding">
        <div className="mt-8 border-t border-[rgba(192,196,201,1)] py-6 pb-20 sm:pb-8">
          <p className="text-center text-2xs font-light leading-none text-white">
            © {new Date().getFullYear()} {companyName}. All rights reserved. | Powered by{' '}
            <a href="https://fleethq.io" className="font-bold text-white hover:underline">
              FleetHQ
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
