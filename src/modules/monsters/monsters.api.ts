import { http } from "../../shared/http/http";

export type MonsterAttack = {
  name: string;
  bonus: number;
  reach: string;
  damage: string;
  damageType: string;
  notes?: string;
};

export type MonsterTrait = {
  name: string;
  description: string;
};

export type DndMonster = {
  id: number;
  slug: string | null;
  name: string;
  type: string;
  size: string;
  cr: string;
  xp: number;
  ac: number;
  acType?: string;
  hp: number;
  speed: string;
  attacks: MonsterAttack[];
  traits?: MonsterTrait[];
  isCustom: boolean;
};

export type CreateMonsterPayload = Omit<DndMonster, "id" | "slug" | "isCustom">;
export type UpdateMonsterPayload = Partial<CreateMonsterPayload>;

export async function getDndMonsters(params?: { type?: string; cr?: string }): Promise<DndMonster[]> {
  const { data } = await http.get<DndMonster[]>("/monsters", { params });
  return data;
}

export async function createMonster(payload: CreateMonsterPayload): Promise<DndMonster> {
  const { data } = await http.post<DndMonster>("/monsters", payload);
  return data;
}

export async function updateMonster(id: number, payload: UpdateMonsterPayload): Promise<DndMonster> {
  const { data } = await http.patch<DndMonster>(`/monsters/${id}`, payload);
  return data;
}

export async function deleteMonster(id: number): Promise<void> {
  await http.delete(`/monsters/${id}`);
}
