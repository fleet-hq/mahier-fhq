'use client';

import Image from 'next/image';
import DOMPurify from 'dompurify';
import { SignaturePad } from '@/components/ui/signature-pad';
import type { AgreementData } from '@/services/agreementServices';

interface FieldRowProps {
  label: string;
  value: string;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="flex items-baseline">
      <span className="font-manrope font-bold text-[12px] leading-[161%] tracking-tight-2 whitespace-nowrap">
        {label}:
      </span>
      <span
        className="font-light text-[12px] leading-[161%] ml-1"
        style={{ color: 'rgba(51, 51, 51, 1)' }}
      >
        {value}
      </span>
    </div>
  );
}

interface InlineFieldsProps {
  fields: { label: string; value: string }[];
}

function InlineFields({ fields }: InlineFieldsProps) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {fields.map((field, i) => (
        <div key={i} className="flex items-baseline">
          <span className="font-manrope font-bold text-[12px] leading-[161%] tracking-tight-2 whitespace-nowrap">
            {field.label}:
          </span>
          <span
            className="font-light text-[12px] leading-[161%] ml-1"
            style={{ color: 'rgba(51, 51, 51, 1)' }}
          >
            {field.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  );
}

interface RentalAgreementPreviewProps {
  data?: AgreementData;
  onSignatureChange?: (signature: string | null) => void;
}

export function RentalAgreementPreview({ data, onSignatureChange }: RentalAgreementPreviewProps) {
  // Fallback data for when no data is passed (preview mode)
  const defaultData: AgreementData = {
    id: 0,
    status: 'pending',
    signedAt: null,
    signatureImage: null,
    company: {
      name: 'Company Name',
      address: 'Company Address',
      email: 'company@email.com',
      phone: '+1 (000) 000-0000',
      logo: null,
    },
    customer: {
      name: 'Customer Name',
      homeAddress: 'Customer Address',
      city: 'City',
      state: 'State',
      zip: '00000',
      phone: '+1 (000) 000-0000',
      birthDate: 'January 1, 1990',
      licenseNumber: 'XX-0000000',
      licenseExpiry: 'December 31, 2026',
    },
    insurance: {
      carrierName: 'Insurance Carrier',
      policyNumber: 'POL-000000',
      expires: 'December 31, 2026',
      policyDetails: 'Policy Details',
    },
    vehicle: {
      pickupDateTime: 'January 1, 2026 at 10:00 AM',
      dropoffDateTime: 'January 7, 2026 at 10:00 AM',
      bookedAt: 'December 25, 2025',
      vin: '0000000000000000',
      vehicleName: '2024 Vehicle Name',
      minimumMiles: 'Unlimited',
      maximumMiles: 'Unlimited',
      overageFee: '$0.00',
    },
    invoice: {
      rentalTotal: '$0.00',
      total: '$0.00',
    },
    clauses: [],
    template: {
      title: 'Rental Agreement',
      description: '',
    },
  };

  const agreementData = data || defaultData;

  return (
    <div className="text-sm text-black">
      {/* Company Information */}
      <Section title="Company Information">
        <div className="flex items-center gap-6">
          {agreementData.company.logo ? (
            <Image
              src={agreementData.company.logo}
              alt="Company Logo"
              width={80}
              height={80}
              className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="h-20 w-20 flex-shrink-0 rounded-md bg-gray-300" />
          )}
          <div className="space-y-2">
            <FieldRow label="Company Name" value={agreementData.company.name} />
            <FieldRow label="Address" value={agreementData.company.address} />
            <FieldRow label="Email Address" value={agreementData.company.email} />
            <FieldRow label="Phone Number" value={agreementData.company.phone} />
          </div>
        </div>
      </Section>

      {/* Customer Information */}
      <Section title="Customer Information">
        <FieldRow label="Customer Name" value={agreementData.customer.name} />
        <FieldRow label="Home Address" value={agreementData.customer.homeAddress} />
        <InlineFields
          fields={[
            { label: 'City', value: agreementData.customer.city },
            { label: 'State', value: agreementData.customer.state },
            { label: 'Zip', value: agreementData.customer.zip },
          ]}
        />
        <FieldRow label="Phone Number" value={agreementData.customer.phone} />
        <FieldRow label="Birth Date" value={agreementData.customer.birthDate} />
        <InlineFields
          fields={[
            { label: 'Drivers License Number', value: agreementData.customer.licenseNumber },
            { label: 'Driver license Expiry Date', value: agreementData.customer.licenseExpiry },
          ]}
        />
      </Section>

      {/* Insurance Information */}
      <Section title="Insurance Information">
        <FieldRow label="Provider" value={agreementData.insurance.carrierName} />
        {agreementData.insurance.policyNumber && agreementData.insurance.policyNumber !== 'N/A' ? (
          <FieldRow label="Policy Number" value={agreementData.insurance.policyNumber} />
        ) : null}
        <FieldRow label="Coverage" value={agreementData.insurance.policyDetails} />
        {agreementData.insurance.premiumAmount ? (
          <FieldRow label="Premium" value={`$${agreementData.insurance.premiumAmount.toFixed(2)}`} />
        ) : null}
        {agreementData.insurance.status && agreementData.insurance.status !== 'N/A' ? (
          <FieldRow label="Status" value={agreementData.insurance.status} />
        ) : null}
      </Section>

      {/* Rental Vehicle Information */}
      <Section title="Rental Vehicle Information">
        <FieldRow label="Pickup Date & Time" value={agreementData.vehicle.pickupDateTime} />
        <FieldRow label="Dropoff Date & Time" value={agreementData.vehicle.dropoffDateTime} />
        <FieldRow label="Booked at" value={agreementData.vehicle.bookedAt} />
        <FieldRow label="VIN" value={agreementData.vehicle.vin} />
        <FieldRow label="Vehicle Name" value={agreementData.vehicle.vehicleName} />
        <InlineFields
          fields={[
            { label: 'Minimum Miles', value: agreementData.vehicle.minimumMiles },
            { label: 'Maximum Miles', value: agreementData.vehicle.maximumMiles },
          ]}
        />
        <FieldRow label="Overage Fee" value={agreementData.vehicle.overageFee} />
        <FieldRow
          label="Driver Age Requirement"
          value={
            agreementData.vehicle.minDriverAge != null && agreementData.vehicle.maxDriverAge != null
              ? `${agreementData.vehicle.minDriverAge} – ${agreementData.vehicle.maxDriverAge} years`
              : agreementData.vehicle.minDriverAge != null
                ? `Minimum ${agreementData.vehicle.minDriverAge} years`
                : agreementData.vehicle.maxDriverAge != null
                  ? `Maximum ${agreementData.vehicle.maxDriverAge} years`
                  : 'No restriction'
          }
        />
      </Section>

      {/* Invoice */}
      {agreementData.invoice && (
        <Section title="Invoice">
          <FieldRow label="Rental Total" value={agreementData.invoice.rentalTotal} />
          {agreementData.invoice.fees && <FieldRow label="Booking Fees" value={agreementData.invoice.fees} />}
          {agreementData.invoice.discount && <FieldRow label="Discount" value={agreementData.invoice.discount} />}
          {agreementData.invoice.insurance && <FieldRow label="Insurance" value={agreementData.invoice.insurance} />}
          {agreementData.invoice.tax && <FieldRow label="Tax" value={agreementData.invoice.tax} />}
          <FieldRow label="Total" value={agreementData.invoice.total} />
          {agreementData.invoice.deposit && <FieldRow label="Security Deposit" value={agreementData.invoice.deposit} />}
        </Section>
      )}

      {/* Terms & Conditions */}
      <Section title="Terms & Conditions">
        {agreementData.clauses.length === 0 ? (
          <p className="text-gray-500 italic">No terms and conditions available.</p>
        ) : (
          agreementData.clauses.map((clause, index) => (
            <div key={clause.id} className="mb-6">
              <h3 className="mb-3 font-bold">
                {index + 1}. {clause.title}
              </h3>
              <div
                className="text-sm leading-relaxed text-black prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(clause.content) }}
              />
            </div>
          ))
        )}
      </Section>

      {/* Signature */}
      <Section title="Signature">
        {agreementData.signatureImage ? (
          <div className="space-y-2">
            <p className="font-manrope font-bold text-[12px] leading-none tracking-tight-2">
              Customer Signature:
            </p>
            <div className="w-64 rounded-lg border border-gray-300 bg-white p-2">
              <Image
                src={agreementData.signatureImage}
                alt="Customer Signature"
                width={240}
                height={100}
                className="object-contain"
              />
            </div>
            <p className="text-xs text-green-600">
              Signed on {agreementData.signedAt ? new Date(agreementData.signedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        ) : (
          <SignaturePad
            label="Customer Signature"
            onSignatureChange={onSignatureChange}
          />
        )}
      </Section>
    </div>
  );
}
