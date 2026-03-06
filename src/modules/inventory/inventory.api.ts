import { http } from "../../shared/http/http";

export type InventoryItem = {
  id: number;
  name: string;
  quantity: number;
  weight: number;
  category: string | null;
  description: string | null;
};

export type InventoryResponse = {
  items: InventoryItem[];
  totalWeight: number;
  carryingCapacity: number;
};

export type InventoryItemPayload = {
  name: string;
  quantity: number;
  weight: number;
  category?: string;
  description?: string;
};

export async function getInventory(characterId: number | string): Promise<InventoryResponse> {
  const { data } = await http.get<InventoryResponse>(`/inventory/character/${characterId}`);
  return data;
}

export async function addInventoryItem(
  characterId: number | string,
  payload: InventoryItemPayload,
): Promise<InventoryItem> {
  const { data } = await http.post<InventoryItem>(`/inventory/character/${characterId}`, payload);
  return data;
}

export async function updateInventoryItem(
  id: number,
  payload: Partial<InventoryItemPayload>,
): Promise<InventoryItem> {
  const { data } = await http.put<InventoryItem>(`/inventory/${id}`, payload);
  return data;
}

export async function deleteInventoryItem(id: number): Promise<void> {
  await http.delete(`/inventory/${id}`);
}
