import { http } from "../../shared/http/http";

export type CharacterEquipment = {
  id: number;
  name: string;
  fromClass: boolean;
};

export async function getEquipment(characterId: number | string): Promise<CharacterEquipment[]> {
  const { data } = await http.get<CharacterEquipment[]>(`/equipment/character/${characterId}`);
  return data;
}

export async function addEquipment(
  characterId: number | string,
  payload: { name: string; fromClass?: boolean },
): Promise<CharacterEquipment> {
  const { data } = await http.post<CharacterEquipment>(`/equipment/character/${characterId}`, payload);
  return data;
}

export async function removeEquipment(id: number): Promise<void> {
  await http.delete(`/equipment/${id}`);
}
