import { http } from "../../shared/http/http";

export type PriceCategory = "food" | "weapon" | "armor" | "potion" | "transport";

export type PriceItem = {
  id: number;
  slug: string | null;
  name: string;
  category: string;
  priceGp: number;
  priceLabel: string;
  notes: string | null;
  isCustom: boolean;
};

export type CreatePriceItemPayload = {
  name: string;
  category: string;
  priceGp: number;
  priceLabel: string;
  notes?: string;
};

export type UpdatePriceItemPayload = Partial<CreatePriceItemPayload>;

export async function getPriceItems(category?: string): Promise<PriceItem[]> {
  const { data } = await http.get<PriceItem[]>("/price-items", {
    params: category ? { category } : undefined,
  });
  return data;
}

export async function createPriceItem(payload: CreatePriceItemPayload): Promise<PriceItem> {
  const { data } = await http.post<PriceItem>("/price-items", payload);
  return data;
}

export async function updatePriceItem(id: number, payload: UpdatePriceItemPayload): Promise<PriceItem> {
  const { data } = await http.patch<PriceItem>(`/price-items/${id}`, payload);
  return data;
}

export async function deletePriceItem(id: number): Promise<void> {
  await http.delete(`/price-items/${id}`);
}
