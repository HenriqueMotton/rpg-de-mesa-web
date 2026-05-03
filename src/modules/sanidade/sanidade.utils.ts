import type {
  EstagioSanidade,
  GatilhoEmocional,
  ModificadorSanidade,
  ResultadoCuraEmocional,
  ResultadoRitual,
  RitualArcano,
  SanidadePersonagem,
  VetorDano,
} from './sanidade.types';

// ─── Constantes ──────────────────────────────────────────────────────────────

export const MODIFICADORES_PADRAO: ModificadorSanidade[] = [
  { id: 'treinamento_cinzentos',  nome: 'Treinamento formal (Cinzentos)',                valor: 4, tipo: 'treinamento' },
  { id: 'resistencia_arcana',     nome: 'Resistência arcana treinada',                   valor: 6, tipo: 'treinamento' },
  { id: 'estabilidade_emocional', nome: 'Estabilidade emocional ativa',                  valor: 2, tipo: 'treinamento' },
  { id: 'vinculo_ativo',          nome: 'Vínculo próximo ativo (+2 por aliado, máx +6)', valor: 2, tipo: 'vinculo'    },
];

export const ESTAGIOS: EstagioSanidade[] = [
  {
    numero: 1,
    nome: 'Lampejos',
    descricao: 'Fragmentos de ecos antes que aconteçam. Parece uma vantagem.',
    efeitoMecanico: '1x por sessão: rola 2d20 na iniciativa, fica com o maior resultado.',
    corUI: '#4CAF50',
  },
  {
    numero: 2,
    nome: 'Sobreposição',
    descricao: 'Ecos espontâneos sobrepõem a visão em momentos de estresse.',
    efeitoMecanico: 'Desvantagem em Percepção situacional.',
    corUI: '#FFC107',
  },
  {
    numero: 3,
    nome: 'Dissociação',
    descricao: 'Perde a âncora do presente. Age como se fosse outro momento.',
    efeitoMecanico: 'Desvantagem em INT e SAB. Mestre controla 1 turno por encontro.',
    corUI: '#FF9800',
  },
  {
    numero: 4,
    nome: 'Dissolução',
    descricao: 'Identidade fragmentada. Não sabe se é ele mesmo.',
    efeitoMecanico: 'Desvantagem em SAB. 20% de regredir ao E5 espontaneamente por sessão.',
    corUI: '#F44336',
  },
  {
    numero: 5,
    nome: 'Eco do Tempo',
    descricao: 'Consciência dissolvida. Torna-se criatura atemporal.',
    efeitoMecanico: 'Personagem fora do controle do jogador. Fim de arco.',
    corUI: '#1a1a2e',
  },
];

export const VETORES_DANO: VetorDano[] = [
  { id: 'eco_passivo',          nome: 'Eco passivo involuntário',                    categoria: 'ambar',    dadoDano: '1d4', testeResistencia: { atributo: 'SAB', cd: 11, efeitoFalha: 'sofre o dano' },  descricao: 'Tocar fragmento bruto sem luvas' },
  { id: 'eco_coletivo',         nome: 'Eco coletivo — âmbar saturado',               categoria: 'ambar',    dadoDano: '1d8', testeResistencia: { atributo: 'CON', cd: 15, efeitoFalha: 'desmaia' },         descricao: 'Âmbar com carga emocional densa de muitas pessoas' },
  { id: 'zona_instabilidade',   nome: 'Zona de instabilidade temporal',              categoria: 'ambar',    dadoDano: '1d6', descricao: 'Por rodada de exposição sem proteção' },
  { id: 'eco_forcado',          nome: 'Eco forçado negativo',                        categoria: 'ambar',    dadoDano: '2d6', descricao: 'Tentar repetir memória de dor ou falha' },
  { id: 'morte_aliado',         nome: 'Morte de aliado próximo presenciada',         categoria: 'trauma',   dadoDano: '1d6', descricao: 'Se causada pelo personagem: 1d8' },
  { id: 'traicao',              nome: 'Traição de confiança profunda',               categoria: 'trauma',   dadoDano: '1d4', descricao: 'Se era âncora emocional: 1d6' },
  { id: 'verdade_reescreve',    nome: 'Descoberta que reescreve o passado',          categoria: 'trauma',   dadoDano: '1d6', descricao: 'Crença firmemente mantida revelada como falsa' },
  { id: 'ato_moral',            nome: 'Participação em ato moralmente grave',        categoria: 'maldade',  dadoDano: '1d4', descricao: 'Se consciente da gravidade: 1d6' },
  { id: 'primeiro_eco_tempo',   nome: 'Ver Eco do Tempo pela 1ª vez',               categoria: 'horror',   dadoDano: '1d4', testeResistencia: { atributo: 'SAB', cd: 12, efeitoFalha: 'atordoado 1 rodada' }, descricao: 'Ver alguém dissolvido que o personagem conhecia' },
  { id: 'combate_fragmento',    nome: 'Combate prolongado com criatura de memória',  categoria: 'horror',   dadoDano: '1',   descricao: 'Por rodada além da 3ª — acumulativo' },
  { id: 'organizacao_corrupta', nome: 'Organização de confiança revelada como maligna', categoria: 'maldade', dadoDano: '1d6', descricao: 'Quando organização em que confiava causou mal deliberado' },
  { id: 'ruptura_moral',        nome: 'Violação dos próprios valores centrais',      categoria: 'maldade',  dadoDano: '1d8', descricao: 'Reservado para momentos de ruptura moral genuína' },
];

// ─── Funções ──────────────────────────────────────────────────────────────────

export function calcularHPPsiquico(
  sab: number,
  con: number,
  nivel: number,
  modificadoresIds: string[],
): number {
  const media = Math.ceil((sab + con) / 2);
  const base = (media * nivel) + (nivel * 2);

  let mods = 0;
  if (modificadoresIds.includes('treinamento_cinzentos'))  mods += 4;
  if (modificadoresIds.includes('resistencia_arcana'))     mods += 6;
  if (modificadoresIds.includes('estabilidade_emocional')) mods += 2;

  const vinculos = modificadoresIds.filter((id) => id === 'vinculo_ativo').length;
  mods += Math.min(6, vinculos * 2);

  const minimo = Math.max(30, nivel * 10);
  return Math.max(minimo, base + mods);
}

export function calcularEstagio(
  danoAcumulado: number,
  hpPsiquicoTotal: number,
): 1 | 2 | 3 | 4 | 5 {
  const faixa = Math.ceil(hpPsiquicoTotal / 4);
  if (danoAcumulado >= hpPsiquicoTotal) return 5;
  if (danoAcumulado >= faixa * 3) return 4;
  if (danoAcumulado >= faixa * 2) return 3;
  if (danoAcumulado >= faixa) return 2;
  return 1;
}

export function calcularFaixas(hpTotal: number) {
  const f = Math.ceil(hpTotal / 4);
  return { e1: f, e2: f * 2, e3: f * 3, e4: hpTotal };
}

const VETORES_EMOCIONAIS = [
  'morte_aliado', 'traicao', 'verdade_reescreve', 'ruptura_moral', 'organizacao_corrupta',
];

export function aplicarDanoComTrauma(
  danoBase: number,
  traumaMultiplicador: number,
  vetor: VetorDano,
): number {
  if (VETORES_EMOCIONAIS.includes(vetor.id)) {
    return Math.ceil(danoBase * traumaMultiplicador);
  }
  return danoBase;
}

export function aplicarDano(
  danoAtual: number,
  novoDano: number,
  hpTotal: number,
  vetor?: VetorDano,
  traumaMultiplicador = 1,
) {
  const danoFinal = vetor ? aplicarDanoComTrauma(novoDano, traumaMultiplicador, vetor) : novoDano;
  const novoTotal = Math.min(danoAtual + danoFinal, hpTotal);
  const estagioAnterior = calcularEstagio(danoAtual, hpTotal);
  const novoEstagio = calcularEstagio(novoTotal, hpTotal);
  return { novoDano: novoTotal, novoEstagio, mudouEstagio: novoEstagio !== estagioAnterior };
}

export function curarDano(danoAtual: number, valorCura: number): number {
  return Math.max(0, danoAtual - valorCura);
}

export function rolarDado(expr: string): number {
  const fixed = parseInt(expr, 10);
  if (!isNaN(fixed) && !expr.includes('d')) return fixed;
  const match = expr.match(/^(\d+)d(\d+)$/);
  if (!match) return 0;
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  return total;
}

export function getEstagioInfo(numero: 1 | 2 | 3 | 4 | 5): EstagioSanidade {
  return ESTAGIOS[numero - 1];
}

export const CATEGORIA_COR: Record<string, string> = {
  ambar:   'rgba(255, 180, 50, 0.85)',
  trauma:  'rgba(200, 100, 255, 0.85)',
  horror:  'rgba(255, 100, 100, 0.85)',
  maldade: 'rgba(120, 90, 220, 0.85)',
};

// ─── Constantes de cura ───────────────────────────────────────────────────────

export const GATILHOS_EMOCIONAIS: GatilhoEmocional[] = [
  {
    id: 'vinculo_confianca',
    nome: 'Vínculo de confiança',
    dado: '1d6',
    descricao: 'Conversa genuína com alguém de confiança profunda — não sobre o âmbar, sobre algo real e pessoal.',
    limitePorSessao: 1,
    estagiosEficazes: [1, 2],
    estagiosEstabiliza: [3],
    estagiosSemEfeito: [4, 5],
  },
  {
    id: 'momento_resolucao',
    nome: 'Momento de resolução',
    dado: '1d8',
    descricao: 'Personagem enfrenta algo que estava evitando emocionalmente — medo, culpa, verdade. Mestre julga se qualifica.',
    estagiosEficazes: [1, 2],
    estagiosEstabiliza: [3],
    estagiosSemEfeito: [4, 5],
  },
  {
    id: 'memoria_ancora',
    nome: 'Memória âncora',
    dado: '2d6',
    descricao: 'Alguém próximo evoca a memória central do personagem de forma específica e verdadeira. A mesma memória perde força com repetição.',
    limiteporEstagio: true,
    estagiosEficazes: [1, 2],
    estagiosEstabiliza: [3],
    estagiosSemEfeito: [4, 5],
  },
  {
    id: 'perda_significativa',
    nome: 'Perda significativa',
    dado: '2d8',
    descricao: 'Personagem perde algo real e importante no presente. A dor do agora é mais forte que os ecos do passado. Custo narrativo real.',
    estagiosEficazes: [1, 2],
    estagiosEstabiliza: [3],
    estagiosSemEfeito: [4, 5],
  },
];

export const RITUAIS: RitualArcano[] = [
  {
    id: 'extracao_ecos',
    nome: 'Ritual de Extração de Ecos',
    nivel: 'basico',
    requisitos: [
      'Âmbar refinado (1 pedra por estágio do portador)',
      'Câmara silenciosa',
      '1 hora sem interrupção',
      'Praticante com proficiência em Arcanismo',
    ],
    duracaoHoras: 1,
    teste: {
      atributo: 'Arcanismo',
      cd: 14,
      cdIncrementoConsecutivo: 2,
    },
    sucessoEfeito: { removeEstagios: 1 },
    falhaEfeito: 'Não progride. Dano acumulado permanece.',
    falhaCriticaEfeito: 'Praticante absorve 1d4 de dano psíquico do portador.',
    funcioanaNoEstagio5: false,
  },
  {
    id: 'ancoragem_identidade',
    nome: 'Ritual de Ancoragem de Identidade',
    nivel: 'avancado',
    requisitos: [
      'Âmbar ancestral (raríssimo)',
      'Objeto de profundo vínculo pessoal do portador',
      'Presença de aliado emocionalmente próximo durante todo o ritual',
      '4 horas sem interrupção',
    ],
    duracaoHoras: 4,
    teste: {
      atributo: 'Arcanismo',
      cd: 18,
      cdIncrementoConsecutivo: 2,
      aliado: { pericia: 'Persuasão ou História', cd: 13 },
    },
    sucessoEfeito: { removeEstagios: 2, estabilizaDias: 30 },
    falhaEfeito: 'Não progride.',
    funcioanaNoEstagio5: false,
  },
];

// ─── Funções de cura ──────────────────────────────────────────────────────────

export function verificarGatilhoDisponivel(
  gatilhoId: string,
  sanidade: SanidadePersonagem,
): { disponivel: boolean; motivo?: string } {
  const gatilho = GATILHOS_EMOCIONAIS.find((g) => g.id === gatilhoId);
  if (!gatilho) return { disponivel: false, motivo: 'Gatilho não encontrado.' };

  if (gatilho.estagiosSemEfeito.includes(sanidade.estagioAtual)) {
    return { disponivel: false, motivo: `Sem efeito no Estágio ${sanidade.estagioAtual}.` };
  }

  if (gatilho.limitePorSessao) {
    const usosNaSessao = (sanidade.gatilhosUsadosNaSessao ?? []).filter((id) => id === gatilhoId).length;
    if (usosNaSessao >= gatilho.limitePorSessao) {
      return { disponivel: false, motivo: `Já usado ${gatilho.limitePorSessao}x nesta sessão.` };
    }
  }

  if (gatilho.limiteporEstagio) {
    const usadoNesteEstagio = (sanidade.memoriaAncoraUsadaPorEstagio ?? {})[sanidade.estagioAtual];
    if (usadoNesteEstagio) {
      return { disponivel: false, motivo: 'Já usado neste estágio.' };
    }
  }

  return { disponivel: true };
}

export function calcularCDRitual(ritual: RitualArcano, sanidade: SanidadePersonagem): number {
  return ritual.teste.cd + (sanidade.rituaisConsecutivos ?? 0) * ritual.teste.cdIncrementoConsecutivo;
}

export function aplicarCuraEmocional(
  danoAtual: number,
  hpTotal: number,
  valorCura: number,
  estagioAtual: 1 | 2 | 3 | 4 | 5,
  gatilho: GatilhoEmocional,
): ResultadoCuraEmocional {
  if (gatilho.estagiosSemEfeito.includes(estagioAtual)) {
    return { novoDano: danoAtual, novoEstagio: estagioAtual, mudouEstagio: false, estabilizouSemRegredir: false, semEfeito: true };
  }

  if (gatilho.estagiosEstabiliza.includes(estagioAtual)) {
    const faixa = Math.ceil(hpTotal / 4);
    const limiteEstagio = faixa * (estagioAtual - 1) + 1;
    const novoDano = Math.max(limiteEstagio, danoAtual - valorCura);
    return { novoDano, novoEstagio: estagioAtual, mudouEstagio: false, estabilizouSemRegredir: true, semEfeito: false };
  }

  const novoDano = Math.max(0, danoAtual - valorCura);
  const novoEstagio = calcularEstagio(novoDano, hpTotal);
  return {
    novoDano,
    novoEstagio,
    mudouEstagio: novoEstagio < estagioAtual,
    estabilizouSemRegredir: false,
    semEfeito: false,
  };
}

export function aplicarRitual(
  danoAtual: number,
  hpTotal: number,
  estagioAtual: 1 | 2 | 3 | 4 | 5,
  ritual: RitualArcano,
  sucessoTeste: boolean,
  falhaCritica: boolean,
): ResultadoRitual {
  if (!ritual.funcioanaNoEstagio5 && estagioAtual === 5) {
    return { novoDano: danoAtual, novoEstagio: 5, mensagem: 'Ritual não funciona no Estágio 5.' };
  }

  if (falhaCritica && ritual.falhaCriticaEfeito) {
    const danoPraticante = rolarDado('1d4');
    return { novoDano: danoAtual, novoEstagio: estagioAtual, praticanteDanoPsiquico: danoPraticante, mensagem: ritual.falhaCriticaEfeito };
  }

  if (!sucessoTeste) {
    return { novoDano: danoAtual, novoEstagio: estagioAtual, mensagem: ritual.falhaEfeito };
  }

  const faixa = Math.ceil(hpTotal / 4);
  const novoEstagio = Math.max(1, estagioAtual - ritual.sucessoEfeito.removeEstagios) as 1 | 2 | 3 | 4 | 5;
  const novoDano = Math.max(0, faixa * (novoEstagio - 1));
  const estabilizadoAte = ritual.sucessoEfeito.estabilizaDias
    ? new Date(Date.now() + ritual.sucessoEfeito.estabilizaDias * 86_400_000).toISOString()
    : undefined;

  return {
    novoDano,
    novoEstagio,
    estabilizadoAte,
    mensagem: `Sucesso. Regrediu ${ritual.sucessoEfeito.removeEstagios} estágio(s). Agora: Estágio ${novoEstagio}.`,
  };
}

export function aplicarAncoraTemporalSeNecessario(
  sanidade: SanidadePersonagem,
  hpTotal: number,
): SanidadePersonagem {
  if (
    sanidade.temAncoraTemporalAtiva &&
    sanidade.estagioAtual === 4 &&
    calcularEstagio(sanidade.danoAcumulado, hpTotal) >= 4
  ) {
    const faixa = Math.ceil(hpTotal / 4);
    const novoDano = faixa * 2; // topo do E3
    return {
      ...sanidade,
      danoAcumulado: novoDano,
      estagioAtual: 3,
      temAncoraTemporalAtiva: false,
    };
  }
  return sanidade;
}

export function iniciarNovaSessao(sanidade: SanidadePersonagem): SanidadePersonagem {
  return { ...sanidade, gatilhosUsadosNaSessao: [] };
}

/** Defaults para personagens criados antes dos campos de cura existirem */
export function normalizarSanidade(s: Partial<SanidadePersonagem>): SanidadePersonagem {
  return {
    hpPsiquicoTotal: s.hpPsiquicoTotal ?? 0,
    danoAcumulado: s.danoAcumulado ?? 0,
    estagioAtual: s.estagioAtual ?? 1,
    modificadores: s.modificadores ?? [],
    historicoEventos: s.historicoEventos ?? [],
    traumaMultiplicador: s.traumaMultiplicador ?? 1,
    temAncoraTemporalAtiva: s.temAncoraTemporalAtiva ?? false,
    estabilizadoAte: s.estabilizadoAte,
    rituaisConsecutivos: s.rituaisConsecutivos ?? 0,
    gatilhosUsadosNaSessao: s.gatilhosUsadosNaSessao ?? [],
    memoriaAncoraUsadaPorEstagio: s.memoriaAncoraUsadaPorEstagio ?? {},
  };
}
