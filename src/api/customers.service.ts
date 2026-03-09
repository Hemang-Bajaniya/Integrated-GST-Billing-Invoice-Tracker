// src/api/customers.service.ts
import api from "./axios.instance";
import type { Customer } from "@/types/database";

// ── Raw API response shape (camelCase from ASP.NET) ───────────────────────────
interface CustomerApiResponse {
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

// ── Request body shape (matches UpsertCustomerRequest in C#) ─────────────────
export interface UpsertCustomerRequest {
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
export interface CustomersQueryParams {
    search?: string;
    includeInactive?: boolean;
}

// ── Mapper: API camelCase → app's snake_case Customer type ────────────────────
function toCustomer(r: CustomerApiResponse): Customer {
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
function toApiRequest(data: Partial<Customer>): UpsertCustomerRequest {
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
export const customersService = {
    // GET /api/customers  — returns all customers for the authenticated user's business
    getAll: async (params: CustomersQueryParams = {}): Promise<Customer[]> => {
        const res = await api.get<CustomerApiResponse[]>("/api/customers", { params });
        return res.data.map(toCustomer);
    },

    // GET /api/customers/:id  — returns a single customer by ID
    getById: async (id: string): Promise<Customer> => {
        const res = await api.get<CustomerApiResponse>(`/api/customers/${id}`);
        return toCustomer(res.data);
    },

    // POST /api/customers  — create new customer
    create: async (data: Partial<Customer>): Promise<Customer> => {
        const res = await api.post<CustomerApiResponse>(
            "/api/customers",
            toApiRequest(data),
        );
        return toCustomer(res.data);
    },

    // PUT /api/customers/:id  — update existing customer
    update: async (id: string, data: Partial<Customer>): Promise<void> => {
        await api.put(`/api/customers/${id}`, toApiRequest(data));
    },

    // DELETE /api/customers/:id  — delete customer (soft delete if has invoices)
    delete: async (id: string): Promise<void> => {
        await api.delete(`/api/customers/${id}`);
    },
};
