// Policy content types and data

export interface PolicySection {
  title: string;
  paragraphs: string[];
}

export interface PolicyContent {
  title: string;
  description: string;
  sections: PolicySection[];
}

// Terms and Conditions content
export const termsContent: PolicyContent = {
  title: 'Terms and Conditions',
  description:
    'Our Practical Fleet is clean, reliable vehicles for real Alaska adventures. No luxury markup, just honest transportation. We know these roads. We know these islands.',
  sections: [
    {
      title: '1. Rental Agreement',
      paragraphs: [
        'This Rental Agreement is entered into between Kings Car Rental ("Company") and the individual or entity identified as the Renter. By signing this agreement or completing a reservation, the Renter agrees to be bound by all terms and conditions stated herein. The rental period begins at the time of vehicle pickup and ends upon return to the designated Kings Car Rental location in Ketchikan, Alaska.',
        'The Renter acknowledges receipt of the vehicle in good operating condition and agrees to return it in the same condition, subject to normal wear and tear. Any damage, missing parts, or excessive dirt will be assessed and charged to the Renter at current repair or replacement rates.',
      ],
    },
    {
      title: '2. Driver Requirements',
      paragraphs: [
        "All drivers must be at least 21 years of age and possess a valid driver's license that has been held for a minimum of one year. Drivers under 25 years of age may be subject to a young driver surcharge. International renters must present a valid passport and international driving permit in addition to their home country license.",
        'Additional drivers must be registered at the time of rental and meet all driver requirements. An additional driver fee applies per driver per day. Only authorized drivers listed on the rental agreement are permitted to operate the vehicle. Unauthorized drivers void all insurance coverage.',
      ],
    },
    {
      title: '3. Vehicle Use & Restrictions',
      paragraphs: [
        'The vehicle may only be driven on paved roads and designated gravel roads within the Ketchikan area unless specifically authorized for off-road use. The vehicle must remain within the designated rental area and may not be transported off Revillagigedo Island without prior written consent from Kings Car Rental.',
        'The following uses are strictly prohibited: driving under the influence of alcohol or drugs, racing or reckless driving, towing or pushing any vehicle, transporting hazardous materials, smoking in the vehicle, transporting more passengers than the vehicle is designed to carry, and using the vehicle for any illegal purpose.',
        "Given Alaska's unique driving conditions, Renters should exercise extra caution during winter months. Chains may be required during certain conditions and are available for rental. The Renter is responsible for checking road conditions before travel.",
      ],
    },
    {
      title: '4. Insurance & Liability',
      paragraphs: [
        'Basic liability insurance is included with all rentals as required by Alaska state law. This coverage provides minimum protection for third-party bodily injury and property damage. The Renter remains responsible for any damage to the rental vehicle up to the full value of the vehicle unless additional coverage is purchased.',
        "Optional Collision Damage Waiver (CDW) reduces the Renter's liability for damage to the rental vehicle. Premium Protection packages include CDW, theft protection, personal accident insurance, and 24/7 roadside assistance. Insurance does not cover damage caused by prohibited uses, driving on unauthorized roads, or negligence.",
        'In the event of an accident, the Renter must immediately contact local authorities and Kings Car Rental. A police report is required for all accidents. Failure to report an accident may void insurance coverage and result in full liability to the Renter.',
      ],
    },
    {
      title: '5. Payment & Cancellation',
      paragraphs: [
        "A valid credit card in the Renter's name is required at the time of pickup. A security deposit will be held on the card and released within 7-10 business days after the vehicle is returned in satisfactory condition. Debit cards may be accepted with additional verification and a higher deposit requirement.",
        'Cancellations made more than 48 hours before the scheduled pickup time will receive a full refund. Cancellations within 48 hours are subject to a one-day rental charge. No-shows will be charged the full reservation amount. Early returns are not eligible for refunds of unused rental days.',
        'Late returns will be charged at 1.5 times the daily rate for each hour past the scheduled return time, up to a maximum of one additional day. Extensions must be requested and approved before the scheduled return time and are subject to vehicle availability.',
      ],
    },
    {
      title: '6. Vehicle Return',
      paragraphs: [
        'The vehicle must be returned to the Kings Car Rental location specified in the rental agreement by the agreed-upon date and time. The vehicle should be returned with the same fuel level as at pickup; otherwise, a refueling charge plus service fee will apply.',
        'A walk-around inspection will be conducted upon return. The Renter is encouraged to be present during this inspection. Any new damage not documented at pickup will be the responsibility of the Renter. Interior cleaning fees apply if the vehicle is returned excessively dirty.',
        'By accepting these terms, the Renter acknowledges understanding and agreement to all conditions. Kings Car Rental reserves the right to modify these terms with reasonable notice. Alaska state law governs this agreement.',
      ],
    },
  ],
};

// Privacy Policy content
export const privacyContent: PolicyContent = {
  title: 'Privacy Policy',
  description:
    'Your privacy matters to us. This policy explains how Kings Car Rental collects, uses, and protects your personal information when you use our services.',
  sections: [
    {
      title: '1. Information We Collect',
      paragraphs: [
        "Kings Car Rental collects personal information necessary to provide our vehicle rental services. This includes your full name, date of birth, contact information (email address, phone number, mailing address), driver's license details, and payment information. We may also collect passport information for international renters.",
        'When you use our website or mobile application, we automatically collect certain technical information including your IP address, browser type, device identifiers, and browsing behavior. We may use cookies and similar tracking technologies to enhance your experience and analyze usage patterns.',
        'For vehicle tracking and safety purposes, our vehicles may be equipped with GPS systems that collect location data during your rental period. This information is used for vehicle recovery, emergency assistance, and fleet management purposes only.',
      ],
    },
    {
      title: '2. How We Use Your Information',
      paragraphs: [
        'We use your personal information to process reservations, verify your identity and driving eligibility, process payments, and communicate with you about your rental. This includes sending booking confirmations, receipts, and important updates about your reservation.',
        'Your information may be used to improve our services, develop new features, and personalize your experience. We analyze usage data to optimize our website, identify trends, and enhance customer satisfaction. With your consent, we may send promotional communications about special offers and new services.',
        'We may use your information to comply with legal obligations, respond to lawful requests from authorities, protect our rights and property, and ensure the safety of our customers and employees. In case of accidents or incidents, we may share relevant information with insurance companies and law enforcement.',
      ],
    },
    {
      title: '3. Information Sharing',
      paragraphs: [
        'Kings Car Rental does not sell your personal information to third parties. We share information only as necessary to provide our services, including with payment processors, insurance providers, and roadside assistance partners. These service providers are contractually bound to protect your information.',
        'We may share information with affiliated companies within our corporate family for operational purposes. If Kings Car Rental is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction, and you will be notified of any changes to the privacy policy.',
        'We may disclose information when required by law, court order, or government regulation, or when we believe disclosure is necessary to protect our rights, prevent fraud, or ensure the safety of our customers, employees, or the public.',
      ],
    },
    {
      title: '4. Data Security',
      paragraphs: [
        'We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. This includes encryption of sensitive data, secure server infrastructure, access controls, and regular security assessments.',
        'Payment card information is processed through PCI-DSS compliant payment processors. We do not store complete credit card numbers on our servers. All data transmission is encrypted using SSL/TLS technology to ensure secure communication between your device and our systems.',
        'While we take reasonable precautions to protect your information, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security, and you provide information at your own risk.',
      ],
    },
    {
      title: '5. Your Rights & Choices',
      paragraphs: [
        'You have the right to access, correct, or delete your personal information held by Kings Car Rental. You may request a copy of your data or ask us to update inaccurate information by contacting our privacy team. We will respond to legitimate requests within the timeframe required by applicable law.',
        'You may opt out of promotional communications at any time by clicking the unsubscribe link in our emails or contacting customer service. Please note that you may still receive transactional communications related to your reservations and account.',
        'You can manage cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of our website. California residents and EU citizens may have additional rights under CCPA and GDPR respectively, including the right to data portability and the right to object to certain processing activities.',
      ],
    },
    {
      title: '6. Data Retention & Contact',
      paragraphs: [
        'We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce our agreements. Rental records are typically retained for seven years for tax and legal purposes.',
        'This privacy policy may be updated periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes by posting a prominent notice on our website or sending you an email. Your continued use of our services after changes take effect constitutes acceptance of the revised policy.',
        'If you have questions or concerns about this privacy policy or our data practices, please contact us at privacy@kingscarrental.com or write to Kings Car Rental, Privacy Office, Ketchikan, Alaska. We are committed to resolving any complaints about our collection or use of your personal information.',
      ],
    },
  ],
};

// Rental Agreement content
export const rentalAgreementContent = {
  title: 'Rental Agreement',
  description: '',
};
