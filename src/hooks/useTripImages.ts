'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadTripImage,
  uploadMultipleTripImages,
  getBookingImages,
  getBookingImagesByType,
  deleteTripImage,
  type ImageType,
} from '@/services/tripImageServices';

export const useBookingImages = (bookingId?: number | string) =>
  useQuery({
    queryKey: ['bookingImages', bookingId],
    queryFn: () => getBookingImages(bookingId!),
    enabled: !!bookingId,
  });

export const useBookingImagesByType = (bookingId?: number | string, imageType?: ImageType) =>
  useQuery({
    queryKey: ['bookingImages', bookingId, imageType],
    queryFn: () => getBookingImagesByType(bookingId!, imageType!),
    enabled: !!bookingId && !!imageType,
  });

export const useUploadTripImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      imageFile,
      imageType,
    }: {
      bookingId: number | string;
      imageFile: File;
      imageType: ImageType;
    }) => uploadTripImage(bookingId, imageFile, imageType),
    onSuccess: (_, variables) => {
      // Invalidate booking images cache
      queryClient.invalidateQueries({ queryKey: ['bookingImages', variables.bookingId] });
    },
  });
};

export const useUploadMultipleTripImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      imageFiles,
      imageType,
    }: {
      bookingId: number | string;
      imageFiles: File[];
      imageType: ImageType;
    }) => uploadMultipleTripImages(bookingId, imageFiles, imageType),
    onSuccess: (_, variables) => {
      // Invalidate booking images cache
      queryClient.invalidateQueries({ queryKey: ['bookingImages', variables.bookingId] });
    },
  });
};

export const useDeleteTripImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      imageId,
    }: {
      bookingId: number | string;
      imageId: number | string;
    }) => deleteTripImage(bookingId, imageId),
    onSuccess: (_, variables) => {
      // Invalidate booking images cache
      queryClient.invalidateQueries({ queryKey: ['bookingImages', variables.bookingId] });
    },
  });
};
