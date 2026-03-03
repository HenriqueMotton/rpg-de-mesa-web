import { http } from "../../shared/http/http";

export type CharacterListItem = {
  id: number | string;
  name: string;
  money: number;
  health: number;
  maxHealth: number;
  nivel: number;
};

export type Character = CharacterListItem & {
  inventory?: any[];
  characterSkills?: any[];
  attributes?: any;
  [key: string]: any;
};

export async function listCharacters() {
  const { data } = await http.get<CharacterListItem[]>("/characters");
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
    money: character.money,
    attributes: { ...(character.idAttribute ?? character.attributes) },
  };
  await http.put(`/characters/${character.id}`, payload);
}