import { http } from '../../shared/http/http';
import type { ExposicaoAmbar } from './exposicao.types';
import type { SanidadePersonagem } from '../sanidade/sanidade.types';

export async function saveExposicao(
  characterId: number | string,
  exposicaoAmbar: ExposicaoAmbar,
  sanidade?: SanidadePersonagem | null,
): Promise<void> {
  const payload: Record<string, unknown> = { exposicaoAmbar };
  if (sanidade !== undefined) payload.sanidade = sanidade;
  await http.put(`/characters/${characterId}`, payload);
}
