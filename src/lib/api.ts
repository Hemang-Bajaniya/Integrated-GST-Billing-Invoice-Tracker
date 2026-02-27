// Central API client – talks to the .NET Core InvoiceFlow backend.
// All requests automatically attach the stored JWT token.

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ── Token helpers ─────────────────────────────────────────────────────────────

export const TOKEN_KEY = 'invoiceflow_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Surface the error text if available
    let message = `HTTP ${res.status}`;
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {}
    throw new Error(message);
  }

  // 204 No Content → nothing to parse
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ── Exported helpers ──────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
}

export interface MeResponse {
  id: string;
  email: string;
  roles: string[];
  business: {
    id: string;
    name: string;
    gstin: string | null;
    state: string | null;
  } | null;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  register: (email: string, password: string, fullName?: string) =>
    api.post<LoginResponse>('/auth/register', { email, password, fullName }),
  me: () => api.get<MeResponse>('/auth/me'),
};

// ── Customers ─────────────────────────────────────────────────────────────────

export interface CustomerDto {
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

export const customersApi = {
  getAll: (search?: string, includeInactive = false) =>
    api.get<CustomerDto[]>(
      `/customers?includeInactive=${includeInactive}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    ),
  get: (id: string) => api.get<CustomerDto>(`/customers/${id}`),
  create: (data: UpsertCustomerRequest) =>
    api.post<CustomerDto>('/customers', data),
  update: (id: string, data: UpsertCustomerRequest) =>
    api.put<void>(`/customers/${id}`, data),
  delete: (id: string) => api.delete<void>(`/customers/${id}`),
};

// ── Vendors ───────────────────────────────────────────────────────────────────

export interface VendorDto {
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

export const vendorsApi = {
  getAll: (search?: string, includeInactive = false) =>
    api.get<VendorDto[]>(
      `/vendors?includeInactive=${includeInactive}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    ),
  get: (id: string) => api.get<VendorDto>(`/vendors/${id}`),
  create: (data: UpsertVendorRequest) =>
    api.post<VendorDto>('/vendors', data),
  update: (id: string, data: UpsertVendorRequest) =>
    api.put<void>(`/vendors/${id}`, data),
  delete: (id: string) => api.delete<void>(`/vendors/${id}`),
};

// ── Products ──────────────────────────────────────────────────────────────────

export interface GstRateDto {
  id: string;
  rate: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

export interface ProductDto {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  hsnSacCode: string | null;
  unit: string;
  unitPrice: number;
  gstRateId: string;
  gstRate: number | null;
  isService: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProductRequest {
  name: string;
  description?: string | null;
  hsnSacCode?: string | null;
  unit?: string;
  unitPrice: number;
  gstRateId: string;
  isService: boolean;
}

export const productsApi = {
  getAll: (search?: string, includeInactive = false) =>
    api.get<ProductDto[]>(
      `/products?includeInactive=${includeInactive}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    ),
  get: (id: string) => api.get<ProductDto>(`/products/${id}`),
  create: (data: UpsertProductRequest) =>
    api.post<ProductDto>('/products', data),
  update: (id: string, data: UpsertProductRequest) =>
    api.put<void>(`/products/${id}`, data),
  delete: (id: string) => api.delete<void>(`/products/${id}`),
  getGstRates: () => api.get<GstRateDto[]>('/products/gst-rates'),
};

// ── Invoices ──────────────────────────────────────────────────────────────────

export interface InvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number | null;
  amountPaid: number | null;
  status: string;
  invoiceType: string;
}

export interface InvoiceItemDto {
  id: string;
  productId: string | null;
  description: string | null;
  hsnSacCode: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  discountPercent: number | null;
  taxableAmount: number | null;
  gstRateId: string;
  gstRate: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  igstAmount: number | null;
  totalAmount: number | null;
}

export interface InvoiceDetailDto extends InvoiceSummaryDto {
  businessId: string;
  placeOfSupply: string | null;
  isInterState: boolean | null;
  subtotal: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  igstAmount: number | null;
  totalTax: number | null;
  notes: string | null;
  terms: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  items: InvoiceItemDto[];
}

export interface CreateInvoiceItemRequest {
  productId?: string | null;
  description: string;
  hsnSacCode?: string | null;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  gstRateId: string;
}

export interface CreateInvoiceRequest {
  customerId: string;
  invoiceType?: string;
  invoiceDate?: string;
  dueDate?: string | null;
  placeOfSupply?: string | null;
  notes?: string | null;
  terms?: string | null;
  items: CreateInvoiceItemRequest[];
}

export interface UpdateInvoiceStatusRequest {
  status: string;
}

export const invoicesApi = {
  getAll: (search?: string, status?: string) =>
    api.get<InvoiceSummaryDto[]>(
      `/invoices?${search ? `search=${encodeURIComponent(search)}&` : ''}${status ? `status=${status}` : ''}`
    ),
  get: (id: string) => api.get<InvoiceDetailDto>(`/invoices/${id}`),
  create: (data: CreateInvoiceRequest) =>
    api.post<InvoiceDetailDto>('/invoices', data),
  updateStatus: (id: string, status: string) =>
    api.put<void>(`/invoices/${id}/status`, { status }),
  cancel: (id: string) => api.delete<void>(`/invoices/${id}`),
};

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentDto {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  status: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string | null;
}

export interface CreatePaymentRequest {
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}

export const paymentsApi = {
  getAll: (invoiceId: string) =>
    api.get<PaymentDto[]>(`/invoices/${invoiceId}/payments`),
  create: (invoiceId: string, data: CreatePaymentRequest) =>
    api.post<PaymentDto>(`/invoices/${invoiceId}/payments`, data),
  delete: (invoiceId: string, paymentId: string) =>
    api.delete<void>(`/invoices/${invoiceId}/payments/${paymentId}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummaryDto {
  totalRevenueFY: number | null;
  totalOutstanding: number | null;
  totalOverdue: number | null;
  totalInvoices: number | null;
  activeCustomers: number | null;
  activeProducts: number | null;
  statusBreakdown: Record<string, number>;
  monthlyTrend: { year: number; month: number; revenue: number | null; invoiced: number | null }[];
  topCustomers: { id: string; name: string | null; totalRevenue: number | null }[];
}

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummaryDto>('/dashboard'),
  getStatusCounts: () => api.get<Record<string, number>>('/dashboard/status-counts'),
};

// ── Business Profiles ─────────────────────────────────────────────────────────

export interface BusinessProfileDto {
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
  invoicePrefix: string | null;
  invoiceCounter: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpsertBusinessProfileRequest {
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

export const businessApi = {
  get: () => api.get<BusinessProfileDto>('/businessprofiles'),
  create: (data: UpsertBusinessProfileRequest) =>
    api.post<BusinessProfileDto>('/businessprofiles', data),
  update: (id: string, data: UpsertBusinessProfileRequest) =>
    api.put<void>(`/businessprofiles/${id}`, data),
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportsApi = {
  gstr1: (year: number, month: number) =>
    api.get<any>(`/reports/gstr1?year=${year}&month=${month}`),
  sales: (from: string, to: string) =>
    api.get<any>(`/reports/sales?from=${from}&to=${to}`),
  aging: () => api.get<any>('/reports/aging'),
};
