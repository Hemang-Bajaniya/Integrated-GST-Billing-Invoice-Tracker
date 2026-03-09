// src/lib/api/productsApi.ts

import api from "@/api/axios.instance";

// ── Types (mirror C# DTOs) ─────────────────────────────────

export interface ProductDto {
    id: string;
    businessId: string;
    name: string;
    description?: string;
    hsnSacCode?: string;
    unit: string;
    unitPrice: number;
    gstRateId: string;
    gstRate?: number;
    isService?: boolean;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface GstRateDto {
    id: string;
    rate: number;
    effectiveFrom?: string;
    effectiveTo?: string;
}

export interface UpsertProductRequest {
    name: string;
    description?: string;
    hsnSacCode?: string;
    unit?: string;
    unitPrice: number;
    gstRateId: string;
    isService: boolean;
}

export interface ProductsQueryParams {
    search?: string;
    includeInactive?: boolean;
}

export interface GstSuggestionRequest {
    hsnSacCode?: string;
    isService: boolean;
}

export interface GstSuggestionResponse {
    suggestedRate?: number;
    isAutomatic: boolean;
    message: string;
    availableRates: number[];
}

// ── API Service ───────────────────────────────────────────

export const productsApi = {

    /** GET /api/products */
    getAll: async (params: ProductsQueryParams = {}): Promise<ProductDto[]> => {
        const res = await api.get<ProductDto[]>("/api/products", { params });
        return res.data;
    },


    /** GET /api/products/:id */
    getById: async (id: string): Promise<ProductDto> => {
        const res = await api.get<ProductDto>(`/api/products/${id}`);
        return res.data;
    },


    /** POST /api/products */
    create: async (payload: UpsertProductRequest): Promise<ProductDto> => {
        const res = await api.post<ProductDto>("/api/products", payload);
        return res.data;
    },


    /** PUT /api/products/:id */
    update: async (id: string, payload: UpsertProductRequest): Promise<void> => {
        await api.put(`/api/products/${id}`, payload);
    },


    /** DELETE /api/products/:id */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/api/products/${id}`);
    },


    /** GET /api/products/gst-rates */
    getGstRates: async (): Promise<GstRateDto[]> => {
        const res = await api.get<GstRateDto[]>("/api/products/gst-rates");
        return res.data;
    },

    /** POST /api/products/suggest-gst-rate */
    suggestGstRate: async (request: GstSuggestionRequest): Promise<GstSuggestionResponse> => {
        const res = await api.post<GstSuggestionResponse>("/api/products/suggest-gst-rate", request);
        return res.data;
    },

}