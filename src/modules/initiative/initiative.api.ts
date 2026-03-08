import { http } from "../../shared/http/http";
import type { MonsterAttack, MonsterTrait } from "../monsters/monsters.api";

export type InitiativeEntry = {
  characterId?: number | null;
  name: string;
  initiative: number;
  // Monster-specific
  isMonster?: boolean;
  monsterId?: string;
  monsterType?: string;
  size?: string;
  cr?: string;
  xp?: number;
  ac?: number;
  acType?: string;
  maxHp?: number;
  currentHp?: number;
  dead?: boolean;
  speed?: string;
  attacks?: MonsterAttack[];
  traits?: MonsterTrait[];
};

export type InitiativeSession = {
  id: number;
  isActive: boolean;
  entries: InitiativeEntry[];
  currentTurnIndex: number;
  updatedAt: string;
} | null;

export type XpSummary = {
  total: number;
  defeated: { name: string; xp: number; cr: string }[];
};

export async function getActiveInitiative(): Promise<InitiativeSession> {
  const { data } = await http.get<InitiativeSession>("/initiative/active");
  return data;
}

export async function publishInitiative(entries: InitiativeEntry[]): Promise<void> {
  await http.post("/initiative/publish", { entries });
}

export async function setInitiativeTurn(index: number): Promise<void> {
  await http.patch("/initiative/active/turn", { index });
}

export async function deactivateInitiative(): Promise<void> {
  await http.delete("/initiative/active");
}

export async function updateEntryHp(index: number, currentHp: number): Promise<void> {
  await http.patch("/initiative/active/entry-hp", { index, currentHp });
}

export async function getXpSummary(): Promise<XpSummary> {
  const { data } = await http.get<XpSummary>("/initiative/active/xp-summary");
  return data;
}
