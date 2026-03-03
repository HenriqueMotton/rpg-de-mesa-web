import { http } from "./http";

export type HealthResponse = {
  ok: boolean;
  name?: string;
  version?: string;
};

export async function healthCheck() {
  const { data } = await http.get<HealthResponse>("/health");
  return data;
}