export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface MeResponse {
  id: string;
  fullName: string | null;
  email: string;
  roles: string[];
  business: BusinessProfile | null;
}

export interface BusinessProfile {
  id: string;
  name: string;
  gstin?: string;
  pan?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}
