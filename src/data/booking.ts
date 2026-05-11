// Booking Details Types
export interface BookingDetails {
  id: string;
  status: string;
  vehicle: {
    name: string;
    licensePlate: string;
    vin: string;
    image: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  bookedOn: string;
  pickUp: {
    address: string;
    date: string;
    time: string;
  };
  dropOff: {
    address: string;
    date: string;
    time: string;
  };
  invoice: {
    number: string;
    items: {
      name: string;
      image: string;
      quantity: number;
      pricePerDay: number;
    }[];
    subtotal: number;
    discount: number;
    discountCode: string;
    tax: number;
    total: number;
    deposit: number;
    balance: number;
  };
  verifications: {
    idVerification: string;
    insuranceVerification: string;
  };
}

// Mock booking details data - in a real app this would come from API/database
export const mockBookingDetails: BookingDetails = {
  id: '13214',
  status: 'successful',
  vehicle: {
    name: 'BMW i8',
    licensePlate: 'LEE-67-889A',
    vin: 'Z812AHSD812',
    image: '/images/vehicles/bmw-i8.jpg',
  },
  customer: {
    name: 'Zaid Irfan',
    email: 'zaid@gmail.com',
    phone: '+1 (321) 213-9874',
  },
  bookedOn: '21st June 2025',
  pickUp: {
    address: 'Am Isfeld 19, 22981, NY, New York',
    date: 'Tue. 02 Dec, 2025',
    time: '09:00 AM',
  },
  dropOff: {
    address: 'Am Isfeld 19, 22981, NY, New York',
    date: 'Tue. 02 Dec, 2025',
    time: '09:00 AM',
  },
  invoice: {
    number: '3522',
    items: [
      {
        name: 'BMW i8 - LEE-67-889A',
        image: '/images/vehicles/bmw-i8.jpg',
        quantity: 2,
        pricePerDay: 50.99,
      },
    ],
    subtotal: 52,
    discount: 2,
    discountCode: 'FLEETHQSALE',
    tax: 0,
    total: 50.99,
    deposit: 40.99,
    balance: 10.0,
  },
  verifications: {
    idVerification: 'pending',
    insuranceVerification: 'pending',
  },
};

// Insurance and Extras Types
export interface InsuranceOption {
  id: string;
  title: string;
  price: number;
  features: string[];
}

export interface Extra {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  hasQuantity: boolean;
}

export const insuranceOptions: InsuranceOption[] = [
  {
    id: 'own',
    title: 'I have my own insurance',
    price: 0,
    features: ['Use your personal coverage'],
  },
  {
    id: 'basic',
    title: 'Basic Protection',
    price: 14.99,
    features: ['Collision damage waiver', 'Theft protection'],
  },
  {
    id: 'premium',
    title: 'Premium Protection',
    price: 29.99,
    features: [
      'Collision damage waiver',
      'Theft protection',
      'Personal accident insurance',
      'Roadside assistance 24/7',
    ],
  },
];

export const extras: Extra[] = [
  {
    id: 'driver',
    title: 'Additional Driver',
    description: 'Add another driver to your rental',
    price: 12.99,
    priceUnit: '/day & driver',
    hasQuantity: true,
  },
  {
    id: 'gps',
    title: 'GPS Navigation',
    description: 'Never get lost with our GPS system',
    price: 9.99,
    priceUnit: '/day',
    hasQuantity: false,
  },
  {
    id: 'child-seat',
    title: 'Child Seat',
    description: 'Safety seat for children under 12',
    price: 7.99,
    priceUnit: '/day',
    hasQuantity: true,
  },
  {
    id: 'wifi',
    title: 'Mobile WiFi Hotspot',
    description: 'Stay connected on the go',
    price: 5.99,
    priceUnit: '/day',
    hasQuantity: false,
  },
];
