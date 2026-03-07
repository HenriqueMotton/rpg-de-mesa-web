import { http } from "../../shared/http/http";

export type InitiativeEntry = {
  characterId: number;
  name: string;
  initiative: number;
};

export type InitiativeSession = {
  id: number;
  isActive: boolean;
  entries: InitiativeEntry[];
  currentTurnIndex: number;
  updatedAt: string;
} | null;

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
