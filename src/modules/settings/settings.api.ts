import { http } from '../../shared/http/http';

export type GlobalSettings = {
  id: number;
  sanidadeEnabled: boolean;
};

export async function getSettings(): Promise<GlobalSettings> {
  const { data } = await http.get<GlobalSettings>('/settings');
  return data;
}

export async function updateSettings(dto: Partial<Pick<GlobalSettings, 'sanidadeEnabled'>>): Promise<GlobalSettings> {
  const { data } = await http.put<GlobalSettings>('/settings', dto);
  return data;
}
