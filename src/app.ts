import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { healthRouter } from "./api/routes/health.routes";
import { errorHandler } from "./api/middlewares/errorHandler";
import { requireAuth, requireRole } from "./api/middlewares/auth";
import { validateBody } from "./api/middlewares/validate";
import {
  createVendorService,
  getMyVendorServices,
  getVendorServiceById,
  listVendorServices,
  updateVendorService,
  updateVendorServiceAvailability,
  getAllServicesForAdmin,
  updateVendorServiceStatus,
} from "./api/controllers/vendor.controller";
import {
  createVendorServiceSchema,
  updateVendorServiceAvailabilitySchema,
  updateVendorServiceSchema,
} from "./api/validation/vendor.validation";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use("/health", healthRouter);

  // Admin moderation endpoints
  app.get("/api/vendor-services/admin", requireAuth, requireRole("admin", "ADMIN"), getAllServicesForAdmin);
  app.patch("/api/vendor-services/:id/status", requireAuth, requireRole("admin", "ADMIN"), updateVendorServiceStatus);

  // Public list for service page, with optional date/category/city filters.
  app.get("/api/vendor-services", listVendorServices);
  app.get("/api/vendor-services/:id", getVendorServiceById);

  // Vendor dashboard endpoints.
  app.get(
    "/api/vendor-services/me",
    requireAuth,
    requireRole("vendor", "VENDOR"),
    getMyVendorServices
  );
  app.post(
    "/api/vendor-services",
    requireAuth,
    requireRole("vendor", "VENDOR"),
    validateBody(createVendorServiceSchema),
    createVendorService
  );
  app.put(
    "/api/vendor-services/:id",
    requireAuth,
    requireRole("vendor", "VENDOR"),
    validateBody(updateVendorServiceSchema),
    updateVendorService
  );
  app.put(
    "/api/vendor-services/:id/availability",
    requireAuth,
    requireRole("vendor", "VENDOR"),
    validateBody(updateVendorServiceAvailabilitySchema),
    updateVendorServiceAvailability
  );

  app.use((_req, _res, next) => {
    const err = new Error("Not Found");
    (err as any).statusCode = 404;
    next(err);
  });

  app.use(errorHandler);

  return app;
}
