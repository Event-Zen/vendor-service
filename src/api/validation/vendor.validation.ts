import { z } from "zod";

const baseVendorServiceSchema = z.object({
  vendorName: z.string().min(1).optional(),
  serviceName: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().min(1).optional(),
  city: z.string().optional(),
  availableDates: z.array(z.coerce.date()).min(1),
  isActive: z.boolean().optional(),
});

export const createVendorServiceSchema = baseVendorServiceSchema.strict();

export const updateVendorServiceSchema = baseVendorServiceSchema.partial().strict();

export const updateVendorServiceAvailabilitySchema = z
  .object({
    availableDates: z.array(z.coerce.date()),
  })
  .strict();
