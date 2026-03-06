import { http } from "../../shared/http/http";

export type RaceBonuses = {
  forca: number;
  destreza: number;
  constituicao: number;
  inteligencia: number;
  sabedoria: number;
  carisma: number;
};

export type RaceTrait = {
  name: string;
  description: string;
};

export type SubRace = {
  id: number;
  name: string;
  description: string;
  bonuses: RaceBonuses;
  traits: RaceTrait[];
};

export type Race = {
  id: number;
  name: string;
  description: string;
  bonuses: RaceBonuses;
  traits: RaceTrait[];
  subRaces: SubRace[];
};

export async function listRaces(): Promise<Race[]> {
  const { data } = await http.get<Race[]>("/races");
  return data;
}
