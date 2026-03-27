import type { Request, Response, NextFunction } from "express";
import { VendorService } from "../../models/vendor-service.model";

function normalizeToDateOnly(dateLike: Date): Date {
  const d = new Date(dateLike);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function uniqueDateList(dates: Date[]): Date[] {
  const byTime = new Map<number, Date>();
  for (const date of dates) {
    const normalized = normalizeToDateOnly(date);
    byTime.set(normalized.getTime(), normalized);
  }

  return [...byTime.values()].sort((a, b) => a.getTime() - b.getTime());
}

function parseQueryDateOrThrow(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const err = new Error("Invalid date format. Use ISO date, for example 2026-07-01");
    (err as any).statusCode = 400;
    throw err;
  }

  return normalizeToDateOnly(parsed);
}

export async function createVendorService(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      (err as any).statusCode = 401;
      throw err;
    }

    const availableDates = req.body.availableDates
      ? uniqueDateList(req.body.availableDates)
      : [];

    const doc = await VendorService.create({
      ...req.body,
      vendorId: req.user.id,
      currency: req.body.currency || "USD",
      availableDates,
    });

    res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyVendorServices(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      (err as any).statusCode = 401;
      throw err;
    }

    const data = await VendorService.find({ vendorId: req.user.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function listVendorServices(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, category, city, q } = req.query as {
      date?: string;
      category?: string;
      city?: string;
      q?: string;
    };

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (date) {
      filter.availableDates = parseQueryDateOrThrow(date);
    }

    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (city) {
      filter.city = { $regex: new RegExp(`^${city}$`, "i") };
    }

    if (q) {
      filter.$or = [
        { serviceName: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { vendorName: { $regex: q, $options: "i" } },
      ];
    }

    const data = await VendorService.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getVendorServiceById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const doc = await VendorService.findOne({
      _id: id,
      isActive: true,
    });

    if (!doc) {
      const err = new Error("Vendor service not found");
      (err as any).statusCode = 404;
      throw err;
    }

    res.json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateVendorService(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      (err as any).statusCode = 401;
      throw err;
    }

    const { id } = req.params;

    const doc = await VendorService.findById(id);
    if (!doc) {
      const err = new Error("Vendor service not found");
      (err as any).statusCode = 404;
      throw err;
    }

    if (doc.vendorId !== req.user.id) {
      const err = new Error("Forbidden");
      (err as any).statusCode = 403;
      throw err;
    }

    if (req.body.availableDates) {
      req.body.availableDates = uniqueDateList(req.body.availableDates);
    }

    Object.assign(doc, req.body);
    await doc.save();

    res.json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateVendorServiceAvailability(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      const err = new Error("Unauthorized");
      (err as any).statusCode = 401;
      throw err;
    }

    const { id } = req.params;
    const doc = await VendorService.findById(id);

    if (!doc) {
      const err = new Error("Vendor service not found");
      (err as any).statusCode = 404;
      throw err;
    }

    if (doc.vendorId !== req.user.id) {
      const err = new Error("Forbidden");
      (err as any).statusCode = 403;
      throw err;
    }

    doc.availableDates = uniqueDateList(req.body.availableDates || []);
    await doc.save();

    res.json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllServicesForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await VendorService.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateVendorServiceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;

    const doc = await VendorService.findById(id);
    if (!doc) {
      const err = new Error("Vendor service not found");
      (err as any).statusCode = 404;
      throw err;
    }

    if (isActive !== undefined) doc.isActive = isActive;
    // @ts-ignore - assuming status might exist or be added to schema later for better moderation
    if (status !== undefined) doc.status = status;

    await doc.save();

    res.json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}
