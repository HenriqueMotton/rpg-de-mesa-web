import { http } from "../../shared/http/http";

export type LoginRequest = { email: string; password: string };
export type LoginResponse = { access_token: string };

export async function login(req: LoginRequest) {
  const { data } = await http.post<LoginResponse>("/auth/login", req);
  return data;
}

export type CreateUserRequest = { name: string; email: string; password: string };

export async function createUser(req: CreateUserRequest) {
  await http.post("/users", req);
}