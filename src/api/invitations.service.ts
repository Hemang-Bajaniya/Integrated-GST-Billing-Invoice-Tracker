// src/api/invitations.service.ts
import api from "./axios.instance";

export type InviteRole = "Accountant" | "Viewer";
export type InvitationStatus = "Pending" | "Accepted" | "Approved" | "Rejected";

export interface InvitationInfo {
  businessName: string;
  assignedRole: InviteRole;
  expiresAt: string;
}
export interface CreatedInvitation {
  token: string;
  assignedRole: InviteRole;
  expiresAt: string;
  businessName: string;
}
export interface PendingUser {
  invitationId: string;
  userId: string;
  email: string;
  assignedRole: InviteRole;
  registeredAt: string;
}
export interface InvitationListItem {
  id: string;
  token: string;
  assignedRole: InviteRole;
  status: InvitationStatus;
  invitedEmail: string | null;
  expiresAt: string;
  createdAt: string;
}

export const invitationsService = {
  // Admin: POST /api/invitations — generate link
  create: async (assignedRole: InviteRole, expiryDays = 7): Promise<CreatedInvitation> => {
    const res = await api.post<CreatedInvitation>("/api/invitations", { assignedRole, expiryDays });
    return res.data;
  },

  // Public: GET /api/invitations/validate/{token} — verify link, get company info
  validate: async (token: string): Promise<InvitationInfo> => {
    const res = await api.get<InvitationInfo>(`/api/invitations/validate/${token}`);
    return res.data;
  },

  // Public: POST /api/invitations/accept — self-register (creates PendingApproval user)
  accept: async (token: string, email: string, password: string) => {
    const res = await api.post<{ message: string }>("/api/invitations/accept", { token, email, password });
    return res.data;
  },

  // Admin: GET /api/invitations/pending
  getPending: async (): Promise<PendingUser[]> => {
    const res = await api.get<PendingUser[]>("/api/invitations/pending");
    return res.data;
  },

  // Admin: PUT /api/invitations/{id}/approve
  approve: async (invitationId: string, role?: InviteRole): Promise<void> => {
    await api.put(`/api/invitations/${invitationId}/approve`, { role: role ?? null });
  },

  // Admin: PUT /api/invitations/{id}/reject
  reject: async (invitationId: string): Promise<void> => {
    await api.put(`/api/invitations/${invitationId}/reject`);
  },

  // Admin: GET /api/invitations — link history
  getAll: async (): Promise<InvitationListItem[]> => {
    const res = await api.get<InvitationListItem[]>("/api/invitations");
    return res.data;
  },

  // Admin: DELETE /api/invitations/{id} — revoke unused link
  revoke: async (id: string): Promise<void> => {
    await api.delete(`/api/invitations/${id}`);
  },
};