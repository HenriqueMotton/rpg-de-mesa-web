import type { ExposicaoAmbar, EventoExposicao, EstadoMental, TipoExposicaoAmbar } from './exposicao.types';
import type { SanidadePersonagem } from '../sanidade/sanidade.types';
import { calcularHPPsiquico } from '../sanidade/sanidade.utils';

// ─── Constantes ───────────────────────────────────────────────────────────────

export const PONTOS_EXPOSICAO: Record<TipoExposicaoAmbar, number> = {
  toque_bruto:          5,
  toque_refinado:       3,
  toque_saturado:       15,
  uso_alquimico:        8,
  eco_direcionado:      12,
  zona_instabilidade:   20,
  uso_reliquia:         25,
  exposicao_prolongada: 10,
  custom:               0,
};

export const TIPO_INFO: Record<TipoExposicaoAmbar, { nome: string; descricao: string }> = {
  toque_bruto:          { nome: 'Toque bruto',             descricao: 'Tocou fragmento bruto sem luvas' },
  toque_refinado:       { nome: 'Toque refinado',          descricao: 'Tocou pedra refinada' },
  toque_saturado:       { nome: 'Toque saturado',          descricao: 'Tocou âmbar saturado' },
  uso_alquimico:        { nome: 'Uso alquímico',           descricao: 'Usou ou criou preparo com âmbar' },
  eco_direcionado:      { nome: 'Eco direcionado',         descricao: 'Participou de eco direcionado' },
  zona_instabilidade:   { nome: 'Zona de instabilidade',   descricao: 'Atravessou zona de instabilidade temporal' },
  uso_reliquia:         { nome: 'Uso de relíquia',         descricao: 'Usou relíquia de pérola' },
  exposicao_prolongada: { nome: 'Exposição prolongada',    descricao: 'Ambiente saturado por período longo' },
  custom:               { nome: 'Evento personalizado',    descricao: 'Evento definido pelo mestre' },
};

// ─── Limiar de ativação ───────────────────────────────────────────────────────

export function calcularLimiarAtivacao(
  sabedoria: number,
  constituicao: number,
  nivel: number,
  temSensibilidadeNatural: boolean,
  temTreinamentoCinzentos: boolean,
): number {
  const media = Math.ceil((sabedoria + constituicao) / 2);
  const base = media * nivel * 3;
  let mods = 0;
  if (temSensibilidadeNatural) mods -= 15;
  if (temTreinamentoCinzentos) mods += 25;
  const minimo = Math.max(50, nivel * 15);
  return Math.max(minimo, base + mods);
}

// ─── Estado mental ────────────────────────────────────────────────────────────

export function getEstadoMental(exposicao: ExposicaoAmbar): EstadoMental {
  if (exposicao.barraAtiva) return 'ativo';
  if (exposicao.pontosAcumulados > 0) return 'em_acumulo';
  return 'sem_exposicao';
}

// ─── Default para personagens sem exposição registrada ───────────────────────

export function exposicaoDefault(
  sabedoria: number,
  constituicao: number,
  nivel: number,
): ExposicaoAmbar {
  return {
    pontosAcumulados: 0,
    limiarAtivacao: calcularLimiarAtivacao(sabedoria, constituicao, nivel, false, false),
    barraAtiva: false,
    historicoExposicao: [],
  };
}

// ─── Registro de exposição ────────────────────────────────────────────────────

type PersonagemParaRegistro = {
  exposicaoAmbar: ExposicaoAmbar;
  sanidade?: SanidadePersonagem | null;
  nivel?: number;
  attributes?: Record<string, number>;
  idAttribute?: Record<string, number>;
};

function getAttr(p: PersonagemParaRegistro, key: string): number {
  const attrs = p.idAttribute ?? p.attributes ?? {};
  return Number(attrs[key] ?? 8);
}

function inicializarSanidade(p: PersonagemParaRegistro): SanidadePersonagem {
  const sab = getAttr(p, 'sabedoria');
  const con = getAttr(p, 'constituicao');
  const nivel = p.nivel ?? 1;
  return {
    hpPsiquicoTotal: calcularHPPsiquico(sab, con, nivel, []),
    danoAcumulado: 0,
    estagioAtual: 1,
    modificadores: [],
    historicoEventos: [],
    temAncoraTemporalAtiva: false,
    traumaMultiplicador: 1,
    rituaisConsecutivos: 0,
    gatilhosUsadosNaSessao: [],
    memoriaAncoraUsadaPorEstagio: {},
  };
}

export function ativarBarraManualmente(
  personagem: PersonagemParaRegistro,
): { exposicaoAtualizada: ExposicaoAmbar; sanidadeIniciada: SanidadePersonagem } {
  return {
    exposicaoAtualizada: { ...personagem.exposicaoAmbar, barraAtiva: true },
    sanidadeIniciada: inicializarSanidade(personagem),
  };
}

export type ResultadoRegistroExposicao = {
  exposicaoAtualizada: ExposicaoAmbar;
  sanidadeIniciada: SanidadePersonagem | null;
  barraAtivouAgora: boolean;
  pontosGanhos: number;
  estadoMentalAnterior: EstadoMental;
  estadoMentalNovo: EstadoMental;
};

export function registrarExposicao(
  personagem: PersonagemParaRegistro,
  tipo: TipoExposicaoAmbar,
  descricao: string,
  pontosCustom?: number,
  sessaoAtual?: number,
): ResultadoRegistroExposicao {
  const pontos = tipo === 'custom' ? (pontosCustom ?? 0) : PONTOS_EXPOSICAO[tipo];
  const novoTotal = personagem.exposicaoAmbar.pontosAcumulados + pontos;
  const barraJaAtiva = personagem.exposicaoAmbar.barraAtiva;
  const barraAtivouAgora = !barraJaAtiva && novoTotal >= personagem.exposicaoAmbar.limiarAtivacao;

  const evento: EventoExposicao = {
    id: crypto.randomUUID(),
    sessao: sessaoAtual ?? 0,
    tipoEvento: tipo,
    pontosGanhos: pontos,
    descricaoNarrativa: descricao,
    timestamp: new Date().toISOString(),
  };

  const exposicaoAtualizada: ExposicaoAmbar = {
    ...personagem.exposicaoAmbar,
    pontosAcumulados: novoTotal,
    barraAtiva: barraJaAtiva || barraAtivouAgora,
    primeiraExposicao: personagem.exposicaoAmbar.primeiraExposicao ?? new Date().toISOString(),
    historicoExposicao: [...personagem.exposicaoAmbar.historicoExposicao, evento],
  };

  const estadoMentalAnterior: EstadoMental = barraJaAtiva ? 'ativo'
    : personagem.exposicaoAmbar.pontosAcumulados > 0 ? 'em_acumulo'
    : 'sem_exposicao';

  const estadoMentalNovo: EstadoMental = barraAtivouAgora || barraJaAtiva ? 'ativo'
    : novoTotal > 0 ? 'em_acumulo'
    : 'sem_exposicao';

  return {
    exposicaoAtualizada,
    sanidadeIniciada: barraAtivouAgora ? inicializarSanidade(personagem) : null,
    barraAtivouAgora,
    pontosGanhos: pontos,
    estadoMentalAnterior,
    estadoMentalNovo,
  };
}
