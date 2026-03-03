import { http } from "./http";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string; // ajuste se sua API retornar diferente
};

export async function login(req: LoginRequest) {
  const { data } = await http.post<LoginResponse>("/auth/login", req);
  return data;
}