// src/api/adminUsers.service.ts
import api from "./axios.instance";

// ── Types ─────────────────────────────────────────────────────────────────────
// Only Accountant and Viewer can be assigned by an admin.
// Admin role is reserved for the account owner (set at registration).
export type AssignableRole = "Accountant" | "Viewer";
export type AppRole = "Admin" | AssignableRole;

export interface AppUser {
  id: string;
  email: string;
  roles: AppRole[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  roles: AssignableRole[];   // backend rejects Admin role here
}

export interface UpdateUserRolesRequest {
  userId: string;
  roles: AssignableRole[];
}

// ── Service ───────────────────────────────────────────────────────────────────
export const adminUsersService = {

  // GET /api/adminusers
  // Returns users scoped to the calling admin's business only (excluding self)
  getAll: async (): Promise<AppUser[]> => {
    const res = await api.get<AppUser[]>("/api/adminusers");
    return res.data;
  },

  // POST /api/adminusers
  // Creates a user and auto-links them to the admin's business_profile_id
  create: async (data: CreateUserRequest): Promise<string> => {
    const res = await api.post<string>("/api/adminusers", data);
    return res.data;
  },

  // PUT /api/adminusers/roles
  // Updates roles for a user in the same business (Accountant/Viewer only)
  updateRoles: async (data: UpdateUserRolesRequest): Promise<void> => {
    await api.put("/api/adminusers/roles", data);
  },

  // DELETE /api/adminusers/{id}
  // Removes a user from the business — cannot delete admins or yourself
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/api/adminusers/${userId}`);
  },
};