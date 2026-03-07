import { http } from "../../shared/http/http";

export type CharacterSpell = {
  id: number;
  name: string;
  level: number;
  school: string | null;
  castingTime: string | null;
  range: string | null;
  duration: string | null;
  componentV: boolean;
  componentS: boolean;
  componentM: boolean;
  materialComponent: string | null;
  description: string | null;
  prepared: boolean;
  isActive: boolean;
  activeUntil: string | null; // ISO date string from backend
  isCustom: boolean;
  isRacial: boolean;
};

export type SpellPayload = {
  name: string;
  level: number;
  school?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  componentV?: boolean;
  componentS?: boolean;
  componentM?: boolean;
  materialComponent?: string;
  description?: string;
  prepared?: boolean;
  isActive?: boolean;
  activeUntil?: string | null;
  isCustom?: boolean;
  isRacial?: boolean;
};

export type MasterSpellEntry = CharacterSpell & {
  character: {
    id: number;
    name: string;
    dndClass?: { name: string; icon: string } | null;
    race?: { name: string } | null;
  };
};

export async function listAllSpellsForMaster(): Promise<MasterSpellEntry[]> {
  const { data } = await http.get<MasterSpellEntry[]>("/spells/master/all");
  return data;
}

export async function getSpells(characterId: number | string): Promise<CharacterSpell[]> {
  const { data } = await http.get<CharacterSpell[]>(`/spells/character/${characterId}`);
  return data;
}

export async function addSpell(
  characterId: number | string,
  payload: SpellPayload,
): Promise<CharacterSpell> {
  const { data } = await http.post<CharacterSpell>(`/spells/character/${characterId}`, payload);
  return data;
}

export async function updateSpell(
  id: number,
  payload: Partial<SpellPayload>,
): Promise<CharacterSpell> {
  const { data } = await http.put<CharacterSpell>(`/spells/${id}`, payload);
  return data;
}

export async function deleteSpell(id: number): Promise<void> {
  await http.delete(`/spells/${id}`);
}

export async function bulkAddSpells(
  characterId: number | string,
  spells: SpellPayload[],
): Promise<CharacterSpell[]> {
  const { data } = await http.post<CharacterSpell[]>(`/spells/character/${characterId}/bulk`, { spells });
  return data;
}

export async function bulkSetPrepared(
  characterId: number | string,
  preparedIds: number[],
): Promise<void> {
  await http.put(`/spells/character/${characterId}/prepare`, { preparedIds });
}
