import axios from 'axios';
import { getBookingToken, getBookingTokenHeaders } from '@/utils/booking-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API Types
export type ImageType = 'pre_trip' | 'post_trip';

export interface ApiTripImage {
  id: number;
  image: string;
  image_type: ImageType;
  booking: number;
  uploaded_at?: string;
  created_at?: string;
}

// Frontend Types
export interface TripImage {
  id: string;
  imageUrl: string;
  imageType: 'preTrip' | 'postTrip';
  bookingId: string;
  uploadedAt: string;
}

// Transform API response to frontend format
function transformTripImage(api: ApiTripImage): TripImage {
  return {
    id: String(api.id),
    imageUrl: api.image,
    imageType: api.image_type === 'pre_trip' ? 'preTrip' : 'postTrip',
    bookingId: String(api.booking),
    uploadedAt: api.uploaded_at || api.created_at || new Date().toISOString(),
  };
}

// Upload trip image for a booking (uses X-Booking-Token)
export async function uploadTripImage(
  bookingId: number | string,
  imageFile: File,
  imageType: ImageType
): Promise<TripImage> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('image_type', imageType);

  const token = getBookingToken();
  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
  };
  if (token) {
    headers['X-Booking-Token'] = token;
  }

  const res = await axios.post<ApiTripImage>(
    `${API_URL}/api/bookings/${bookingId}/booking-images/`,
    formData,
    { headers }
  );
  return transformTripImage(res.data);
}

// Upload multiple trip images
export async function uploadMultipleTripImages(
  bookingId: number | string,
  imageFiles: File[],
  imageType: ImageType
): Promise<TripImage[]> {
  const results: TripImage[] = [];

  for (const file of imageFiles) {
    const result = await uploadTripImage(bookingId, file, imageType);
    results.push(result);
  }

  return results;
}

// Get all booking images (uses X-Booking-Token)
export async function getBookingImages(bookingId: number | string): Promise<TripImage[]> {
  try {
    const res = await axios.get<ApiTripImage[] | { results: ApiTripImage[] }>(
      `${API_URL}/api/bookings/${bookingId}/booking-images/`,
      { headers: getBookingTokenHeaders() }
    );
    const images = Array.isArray(res.data) ? res.data : res.data.results || [];
    return images.map(transformTripImage);
  } catch {
    return [];
  }
}

// Get booking images filtered by type (uses X-Booking-Token)
export async function getBookingImagesByType(
  bookingId: number | string,
  imageType: ImageType
): Promise<TripImage[]> {
  try {
    const res = await axios.get<ApiTripImage[] | { results: ApiTripImage[] }>(
      `${API_URL}/api/bookings/${bookingId}/booking-images/`,
      {
        params: { image_type: imageType },
        headers: getBookingTokenHeaders(),
      }
    );
    const images = Array.isArray(res.data) ? res.data : res.data.results || [];
    return images.map(transformTripImage);
  } catch {
    return [];
  }
}

// Delete a booking image (uses X-Booking-Token)
export async function deleteTripImage(
  bookingId: number | string,
  imageId: number | string
): Promise<void> {
  await axios.delete(
    `${API_URL}/api/bookings/${bookingId}/booking-images/${imageId}/`,
    { headers: getBookingTokenHeaders() }
  );
}
