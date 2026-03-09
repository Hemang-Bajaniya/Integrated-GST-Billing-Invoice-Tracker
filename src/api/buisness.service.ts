// src/api/business.service.ts
import api from "./axios.instance";
import type { BusinessProfile } from "@/types/database";

// ── Raw API response shape (camelCase from ASP.NET) ───────────────────────────
interface BusinessProfileApiResponse {
  id: string;
  name: string;
  gstin: string | null;
  pan: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  invoicePrefix: string;
  invoiceCounter: number;
  createdAt: string;
  updatedAt: string;
}

// ── Request body shape (camelCase to ASP.NET) ─────────────────────────────────
interface UpsertBusinessProfileRequest {
  name: string;
  gstin?: string | null;
  pan?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  invoicePrefix?: string | null;
}

// ── Mapper: API camelCase → your app's snake_case BusinessProfile type ─────────
function toBusinessProfile(r: BusinessProfileApiResponse): BusinessProfile {
  return {
    id:                   r.id,
    name:                 r.name,
    gstin:                r.gstin,
    pan:                  r.pan,
    address_line1:        r.addressLine1,
    address_line2:        r.addressLine2,
    city:                 r.city,
    state:                r.state,
    pincode:              r.pincode,
    phone:                r.phone,
    email:                r.email,
    bank_name:            r.bankName,
    bank_account_number:  r.bankAccountNumber,
    bank_ifsc:            r.bankIfsc,
    invoice_prefix:       r.invoicePrefix,
    invoice_counter:      r.invoiceCounter,
    created_at:           r.createdAt,
    updated_at:           r.updatedAt,
  };
}

// ── Mapper: form snake_case → API camelCase request ───────────────────────────
function toApiRequest(data: Partial<BusinessProfile>): UpsertBusinessProfileRequest {
  return {
    name:               data.name!,
    gstin:              data.gstin     || null,
    pan:                data.pan       || null,
    addressLine1:       data.address_line1     || null,
    addressLine2:       data.address_line2     || null,
    city:               data.city      || null,
    state:              data.state     || null,
    pincode:            data.pincode   || null,
    phone:              data.phone     || null,
    email:              data.email     || null,
    bankName:           data.bank_name          || null,
    bankAccountNumber:  data.bank_account_number || null,
    bankIfsc:           data.bank_ifsc           || null,
    invoicePrefix:      data.invoice_prefix      || "INV",
  };
}

// ── Service ───────────────────────────────────────────────────────────────────
export const businessService = {
  // GET /api/businessprofiles  — returns the authenticated user's business
  get: async (): Promise<BusinessProfile> => {
    const res = await api.get<BusinessProfileApiResponse>("/api/businessprofiles");
    return toBusinessProfile(res.data);
  },

  // POST /api/businessprofiles  — create new (Admin only)
  create: async (data: Partial<BusinessProfile>): Promise<BusinessProfile> => {
    const res = await api.post<BusinessProfileApiResponse>(
      "/api/businessprofiles",
      toApiRequest(data)
    );
    return toBusinessProfile(res.data);
  },

  // PUT /api/businessprofiles/{id}  — update existing (Admin only)
  update: async (id: string, data: Partial<BusinessProfile>): Promise<void> => {
    await api.put(`/api/businessprofiles/${id}`, toApiRequest(data));
  },
};