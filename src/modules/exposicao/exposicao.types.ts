export type TipoExposicaoAmbar =
  | 'toque_bruto'
  | 'toque_refinado'
  | 'toque_saturado'
  | 'uso_alquimico'
  | 'eco_direcionado'
  | 'zona_instabilidade'
  | 'uso_reliquia'
  | 'exposicao_prolongada'
  | 'custom';

export type EstadoMental =
  | 'sem_exposicao'
  | 'em_acumulo'
  | 'ativo';

export type EventoExposicao = {
  id: string;
  sessao: number;
  tipoEvento: TipoExposicaoAmbar;
  pontosGanhos: number;
  descricaoNarrativa: string;
  timestamp: string;
};

export type ExposicaoAmbar = {
  pontosAcumulados: number;
  limiarAtivacao: number;
  barraAtiva: boolean;
  primeiraExposicao?: string;
  historicoExposicao: EventoExposicao[];
};
