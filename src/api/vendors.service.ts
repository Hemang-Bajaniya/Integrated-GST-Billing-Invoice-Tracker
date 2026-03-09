// src/api/vendors.service.ts
import api from "./axios.instance";
import type { Vendor } from "@/types/database";

// ── Raw API response shape (camelCase from ASP.NET) ───────────────────────────
interface VendorApiResponse {
    id: string;
    businessId: string;
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
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ── Request body shape (matches UpsertVendorRequest in C#) ─────────────────
export interface UpsertVendorRequest {
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
}

// ── Query params ───────────────────────────────────────────────────────────────
export interface VendorsQueryParams {
    search?: string;
    includeInactive?: boolean;
}

// ── Mapper: API camelCase → app's snake_case Vendor type ─────────────────────
function toVendor(r: VendorApiResponse): Vendor {
    return {
        id: r.id,
        business_id: r.businessId,
        name: r.name,
        gstin: r.gstin,
        pan: r.pan,
        address_line1: r.addressLine1,
        address_line2: r.addressLine2,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        phone: r.phone,
        email: r.email,
        is_active: r.isActive,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
    };
}

// ── Mapper: form snake_case → API camelCase request ───────────────────────────
function toApiRequest(data: Partial<Vendor>): UpsertVendorRequest {
    return {
        name: data.name!,
        gstin: data.gstin || null,
        pan: data.pan || null,
        addressLine1: data.address_line1 || null,
        addressLine2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        phone: data.phone || null,
        email: data.email || null,
    };
}

// ── Service ───────────────────────────────────────────────────────────────────
export const vendorsService = {
    // GET /api/vendors  — returns all vendors for the authenticated user's business
    getAll: async (params: VendorsQueryParams = {}): Promise<Vendor[]> => {
        const res = await api.get<VendorApiResponse[]>("/api/vendors", { params });
        return res.data.map(toVendor);
    },

    // GET /api/vendors/:id  — returns a single vendor by ID
    getById: async (id: string): Promise<Vendor> => {
        const res = await api.get<VendorApiResponse>(`/api/vendors/${id}`);
        return toVendor(res.data);
    },

    // POST /api/vendors  — create new vendor
    create: async (data: Partial<Vendor>): Promise<Vendor> => {
        const res = await api.post<VendorApiResponse>(
            "/api/vendors",
            toApiRequest(data),
        );
        return toVendor(res.data);
    },

    // PUT /api/vendors/:id  — update existing vendor
    update: async (id: string, data: Partial<Vendor>): Promise<void> => {
        await api.put(`/api/vendors/${id}`, toApiRequest(data));
    },

    // DELETE /api/vendors/:id  — delete vendor (soft delete)
    delete: async (id: string): Promise<void> => {
        await api.delete(`/api/vendors/${id}`);
    },
};
