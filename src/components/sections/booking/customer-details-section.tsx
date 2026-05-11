'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  CountrySelector,
  usePhoneInput,
  type ParsedCountry,
} from 'react-international-phone';
import 'react-international-phone/style.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /\d/g;
const MIN_PHONE_DIGITS = 7;

interface CustomerDetailsSectionProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function CustomerDetailsSection({
  firstName,
  lastName,
  email,
  phone,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
}: CustomerDetailsSectionProps) {
  const phoneInput = usePhoneInput({
    defaultCountry: 'us',
    value: phone,
    disableDialCodeAndPrefix: true,
    onChange: (data) => {
      onPhoneChange(data.phone);
    },
  });

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailError = useMemo(() => {
    if (!emailTouched || !email) return '';
    return EMAIL_REGEX.test(email) ? '' : 'Please enter a valid email address.';
  }, [email, emailTouched]);

  const phoneError = useMemo(() => {
    if (!phoneTouched || !phone) return '';
    const digits = phone.match(PHONE_DIGITS_REGEX);
    const digitCount = digits ? digits.length : 0;
    if (digitCount > 0 && digitCount < MIN_PHONE_DIGITS) {
      return `Phone number must have at least ${MIN_PHONE_DIGITS} digits.`;
    }
    return '';
  }, [phone, phoneTouched]);

  const handleCountryChange = useCallback(
    (country: ParsedCountry) => {
      phoneInput.setCountry(country.iso2);
    },
    [phoneInput]
  );

  return (
    <section>
      <h2 className="font-manrope text-base font-semibold leading-none tracking-tight-2 text-navy">Customer Details</h2>

      <div className="mt-5 grid grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-8">
        {/* First Name */}
        <div>
          <label className="block text-xs text-slate-500">First Name</label>
          <input
            type="text"
            placeholder="Enter Your Name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className="mt-3 w-full border-b border-slate-200 pb-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs text-slate-500">Last Name</label>
          <input
            type="text"
            placeholder="Enter Your Name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            className="mt-3 w-full border-b border-slate-200 pb-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs text-slate-500">Email Address</label>
          <div className={`mt-3 flex h-9 items-end border-b pb-2 ${emailError ? 'border-red-400' : 'border-slate-200'}`}>
            <input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs text-slate-500">Phone Number</label>
          <div className={`mt-3 flex h-9 items-end gap-2 border-b pb-2 ${phoneError ? 'border-red-400' : 'border-slate-200'}`}>
            <CountrySelector
              selectedCountry={phoneInput.country.iso2}
              onSelect={handleCountryChange}
              renderButtonWrapper={({ children, rootProps }) => (
                <button
                  {...rootProps}
                  type="button"
                  className="-mb-2 flex items-center gap-1.5 rounded-[3px] bg-border-light px-3 py-2 text-sm text-slate-700 focus:outline-none"
                >
                  {children}
                  <span className="text-sm text-slate-700">+{phoneInput.country.dialCode}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="shrink-0 text-slate-500">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              flagStyle={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
              dropdownArrowStyle={{ display: 'none' }}
              dropdownStyleProps={{
                style: {
                  top: '100%',
                  left: '-8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 50,
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #e2e8f0',
                  marginTop: '8px',
                },
                listItemStyle: {
                  padding: '8px 12px',
                  fontSize: '13px',
                },
              }}
            />
            <input
              type="tel"
              placeholder="Enter Your Phone"
              ref={phoneInput.inputRef}
              value={phoneInput.inputValue}
              onChange={phoneInput.handlePhoneValueChange}
              onBlur={() => setPhoneTouched(true)}
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
        </div>
      </div>
    </section>
  );
}
