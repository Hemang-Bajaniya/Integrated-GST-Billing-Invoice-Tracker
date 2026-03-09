import api from "./axios.instance";
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
} from "./types/auth.types";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>("/api/Auth/login", data);
    return res.data;
  },

  register: async (data: LoginRequest): Promise<string> => {
    const res = await api.post<string>("/api/Auth/register", data);
    return res.data;
  },

  me: async (): Promise<MeResponse> => {
    const res = await api.get<MeResponse>("/api/auth/me");
    return res.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};
