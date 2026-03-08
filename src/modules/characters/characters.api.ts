import { http } from "../../shared/http/http";

export type CharacterListItem = {
  id: number | string;
  name: string;
  pp: number;    // peças de prata
  money: number; // peças de ouro
  pc: number;    // peças de cobre
  health: number;
  maxHealth: number;
  nivel: number;
  xp: number;
  avatarUrl?: string | null;
  race?: { id: number; name: string } | null;
  subRace?: { id: number; name: string } | null;
  dndClass?: { id: number; name: string; icon: string } | null;
  asiPointsUsed?: number;
  freeAttrEdit?: boolean;
};

export type Character = CharacterListItem & {
  inventory?: any[];
  characterSkills?: any[];
  attributes?: any;
  [key: string]: any;
};

export type Skill = {
  id: number;
  name: string;
  attribute?: string | null;
  description?: string | null;
};

export type CreateCharacterPayload = {
  name: string;
  attributes: {
    forca: number;
    destreza: number;
    constituicao: number;
    inteligencia: number;
    sabedoria: number;
    carisma: number;
  };
  selectedSkills: number[];
  pp?: number;
  money: number;
  pc?: number;
  health: number;
  raceId?: number;
  subRaceId?: number;
  classId?: number;
  height?: number;
};

export async function listCharacters() {
  const { data } = await http.get<CharacterListItem[]>("/characters");
  return data;
}

export async function listAllCharacters(): Promise<{ id: number; name: string; dndClass?: { name: string; icon: string } }[]> {
  const { data } = await http.get("/characters/master/all");
  return data;
}

export async function getCharacter(id: number | string) {
  const { data } = await http.get<Character>(`/characters/${id}`);
  return data;
}

export async function deleteCharacter(id: number | string) {
  await http.delete(`/characters/${id}`);
}

export async function updateCharacterHealth(
  characterId: number | string,
  newHealth: number,
  newMaxHealth: number
) {
  const { data } = await http.put(`/characters/${characterId}`, {
    health: newHealth,
    maxHealth: newMaxHealth,
  });
  return data;
}

export async function saveCharacter(character: any) {
  if (!character?.id) throw new Error("Character id is required");
  const payload = {
    health: character.health,
    maxHealth: character.maxHealth,
    pp: character.pp ?? 0,
    money: character.money,
    pc: character.pc ?? 0,
    xp: character.xp ?? 0,
    asiPointsUsed: character.asiPointsUsed ?? 0,
    attributes: { ...(character.idAttribute ?? character.attributes) },
  };
  await http.put(`/characters/${character.id}`, payload);
}

export async function toggleFreeAttrEdit(id: number | string, value: boolean): Promise<void> {
  await http.put(`/characters/${id}`, { freeAttrEdit: value });
}

export async function createCharacter(payload: CreateCharacterPayload) {
  const { data } = await http.post("/characters", payload);
  return data;
}

export async function restCharacter(
  characterId: number | string,
  restType: "long" | "short",
  hitDiceSpent = 0,
): Promise<Character> {
  const { data } = await http.post<Character>(`/characters/${characterId}/rest`, { restType, hitDiceSpent });
  return data;
}

export type SpendHitDiceResult = {
  roll: number;
  conMod: number;
  healing: number;
  newHealth: number;
  hitDiceUsed: number;
  maxDice: number;
  dieSize: number;
};

export async function spendHitDice(characterId: number | string): Promise<SpendHitDiceResult> {
  const { data } = await http.post<SpendHitDiceResult>(`/characters/${characterId}/spend-hit-dice`);
  return data;
}

export async function updateSpellSlots(
  characterId: number | string,
  slots: Record<string, number>,
): Promise<void> {
  await http.put(`/characters/${characterId}`, { spellSlots: slots });
}

export async function removeCharacterAvatar(id: number | string): Promise<Character> {
  const { data } = await http.delete<Character>(`/characters/${id}/avatar`);
  return data;
}

export async function uploadCharacterAvatar(id: number | string, file: File): Promise<Character> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await http.post<Character>(`/characters/${id}/avatar`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listSkills() {
  const { data } = await http.get<Skill[]>("/skills");
  return data;
}