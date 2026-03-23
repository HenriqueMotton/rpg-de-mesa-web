import { http } from "../../shared/http/http";

export type TraumaSeverity = "mild" | "moderate" | "severe";

export type Trauma = {
  id: number;
  title: string;
  description: string | null;
  severity: TraumaSeverity;
  isActive: boolean;
  createdAt: string;
  character?: {
    id: number;
    name: string;
    dndClass?: { name: string; icon: string } | null;
    race?: { name: string } | null;
  };
};

export type CreateTraumaPayload = {
  title: string;
  description?: string;
  severity?: TraumaSeverity;
};

export async function getCharacterTraumas(characterId: number | string): Promise<Trauma[]> {
  const { data } = await http.get<Trauma[]>(`/psychology/character/${characterId}`);
  return data;
}

export async function getAllTraumas(): Promise<Trauma[]> {
  const { data } = await http.get<Trauma[]>("/psychology");
  return data;
}

export async function addTrauma(
  characterId: number | string,
  payload: CreateTraumaPayload,
): Promise<Trauma> {
  const { data } = await http.post<Trauma>(`/psychology/character/${characterId}`, payload);
  return data;
}

export async function updateTrauma(
  id: number,
  payload: { title?: string; description?: string; severity?: TraumaSeverity; isActive?: boolean },
): Promise<Trauma> {
  const { data } = await http.patch<Trauma>(`/psychology/${id}`, payload);
  return data;
}

export async function deleteTrauma(id: number): Promise<void> {
  await http.delete(`/psychology/${id}`);
}
