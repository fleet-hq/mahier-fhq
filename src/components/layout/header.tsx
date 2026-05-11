'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMobilePanel } from '@/contexts';
import { siteContent } from '@/constants/site-content';

const { company, navLinks } = siteContent;

interface HeaderProps {
  showBorderBottom?: boolean;
}

export function Header({ showBorderBottom = false }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobilePanelOpen } = useMobilePanel();

  const logo = company.logo;
  const companyName = company.name;
  const phoneNumber = company.phone;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border-muted">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src={logo}
              alt={companyName}
              width={72}
              height={72}
              className="h-18 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation - Next to Logo */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold tracking-tight-2 text-slate-700 transition-colors hover:text-primary-light"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Phone, Manage Bookings & Book Now */}
        <div className="hidden items-center gap-6 md:flex">
          <a
            href={`tel:${phoneNumber.replace(/\s/g, '')}`}
            className="text-xs font-semibold tracking-tight-2 text-slate-700 hover:text-primary-light"
          >
            {phoneNumber}
          </a>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            href="/manage-booking"
            className="rounded-lg border border-slate-300 px-6 py-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Manage Bookings
          </Link>
          <Link
            href="/fleet"
            className="rounded-lg bg-primary px-10 py-3.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg className="h-7 w-7 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <Image
              src="/icons/header/sidebar-icon.svg"
              alt="Menu"
              width={28}
              height={28}
              className="h-7 w-7"
            />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-t-0'
        }`}
      >
        <nav className="flex flex-col items-start px-6 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-xs font-semibold tracking-tight-2 text-slate-700 hover:text-primary-light"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`tel:${phoneNumber.replace(/\s/g, '')}`}
            className="py-3 text-xs font-semibold tracking-tight-2 text-slate-700 hover:text-primary-light"
          >
            {phoneNumber}
          </a>
          <div className="my-2 w-full border-t border-slate-200" />
          <Link
            href="/manage-booking"
            className="mt-2 w-full rounded-lg border border-slate-300 px-6 py-3 text-center text-xs font-medium text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Manage Bookings
          </Link>
          <Link
            href="/fleet"
            className="mt-2 w-full rounded-lg bg-primary px-6 py-3 text-center text-xs font-medium text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Book Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
