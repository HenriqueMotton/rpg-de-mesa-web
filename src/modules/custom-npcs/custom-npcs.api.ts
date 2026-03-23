import { http } from "../../shared/http/http";

export type NpcStatus = "alive" | "dead" | "missing";

export type CustomNpc = {
  id: number;
  name: string;
  race: string | null;
  role: string | null;
  location: string | null;
  appearance: string | null;
  personality: string | null;
  motivation: string | null;
  secret: string | null;
  faction: string | null;
  notes: string | null;
  maxHp: number | null;
  currentHp: number | null;
  status: NpcStatus;
  createdAt: string;
};

export type CustomNpcPayload = Partial<Omit<CustomNpc, "id" | "createdAt">> & { name: string };

export async function listCustomNpcs(): Promise<CustomNpc[]> {
  const { data } = await http.get<CustomNpc[]>("/custom-npcs");
  return data;
}

export async function createCustomNpc(payload: CustomNpcPayload): Promise<CustomNpc> {
  const { data } = await http.post<CustomNpc>("/custom-npcs", payload);
  return data;
}

export async function updateCustomNpc(id: number, payload: Partial<CustomNpcPayload>): Promise<CustomNpc> {
  const { data } = await http.patch<CustomNpc>(`/custom-npcs/${id}`, payload);
  return data;
}

export async function deleteCustomNpc(id: number): Promise<void> {
  await http.delete(`/custom-npcs/${id}`);
}
