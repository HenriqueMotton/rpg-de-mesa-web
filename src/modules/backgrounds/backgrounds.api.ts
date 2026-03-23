import { http } from "../../shared/http/http";

export type Background = {
  id: number;
  name: string;
  icon: string;
  description: string;
  skillGrants: string[];
  feature?: { name: string; description: string };
  equipment: string[];
};

export async function listBackgrounds(): Promise<Background[]> {
  const { data } = await http.get<Background[]>("/backgrounds");
  return data;
}
