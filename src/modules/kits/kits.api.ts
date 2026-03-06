import { http } from "../../shared/http/http";

export type KitItem = {
  name: string;
  quantity: number;
  weight: number;
};

export type Kit = {
  id: number;
  name: string;
  items: KitItem[];
};

export async function listKits(): Promise<Kit[]> {
  const { data } = await http.get<Kit[]>("/kits");
  return data;
}
