import { Schema, model, type Document } from "mongoose";

export interface VendorServiceDocument extends Document {
  vendorId: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorName?: string;
  serviceName: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  city?: string;
  availableDates: Date[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VendorServiceSchema = new Schema<VendorServiceDocument>(
  {
    vendorId: { type: String, required: true, index: true },
    vendorEmail: { type: String, required: true, trim: true },
    vendorPhone: { type: String, required: true, trim: true },
    vendorName: { type: String, trim: true },
    serviceName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD", trim: true },
    city: { type: String, trim: true, index: true },
    availableDates: { type: [Date], default: [], index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

VendorServiceSchema.index({ isActive: 1, category: 1, city: 1, availableDates: 1 });

export const VendorService = model<VendorServiceDocument>(
  "VendorService",
  VendorServiceSchema
);
