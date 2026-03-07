import { http } from "../../shared/http/http";

export type ClassFeature = {
  name: string;
  description: string;
};

export type ClassSpellEntry = {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  componentV: boolean;
  componentS: boolean;
  componentM: boolean;
  materialComponent?: string;
  description: string;
  unlockLevel: number;
};

export type ClassProficiencies = {
  armor: string[];
  weapons: string[];
  tools: string[];
  savingThrows: string[];
};

export type DndClass = {
  id: number;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  imgGradient: string;
  equipment: string[];
  features: ClassFeature[];
  classSpells: ClassSpellEntry[];
  proficiencies?: ClassProficiencies;
};

export async function listClasses(): Promise<DndClass[]> {
  const { data } = await http.get<DndClass[]>("/classes");
  return data;
}
