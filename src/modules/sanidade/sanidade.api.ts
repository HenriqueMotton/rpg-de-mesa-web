import { http } from '../../shared/http/http';
import type { SanidadePersonagem } from './sanidade.types';

export async function saveSanidade(
  characterId: number | string,
  sanidade: SanidadePersonagem | null,
): Promise<void> {
  await http.put(`/characters/${characterId}`, { sanidade });
}
