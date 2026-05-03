export type ModificadorTipo = 'ambar' | 'trauma' | 'horror' | 'vinculo' | 'treinamento';

export type ModificadorSanidade = {
  id: string;
  nome: string;
  valor: number;
  tipo: ModificadorTipo;
};

export type EstagioSanidade = {
  numero: 1 | 2 | 3 | 4 | 5;
  nome: string;
  descricao: string;
  efeitoMecanico: string;
  corUI: string;
};

export type EventoSanidade = {
  id: string;
  sessao: number;
  vetorId: string;
  danoRolado: number;
  descricaoNarrativa: string;
  timestamp: string;
};

export type SanidadePersonagem = {
  hpPsiquicoTotal: number;
  danoAcumulado: number;
  estagioAtual: 1 | 2 | 3 | 4 | 5;
  modificadores: string[];
  historicoEventos: EventoSanidade[];
  traumaMultiplicador: number; // 1 | 1.25 | 1.5 | 2.0
  // ── campos de cura ──
  temAncoraTemporalAtiva: boolean;
  estabilizadoAte?: string;            // ISO date string
  rituaisConsecutivos: number;
  gatilhosUsadosNaSessao: string[];
  memoriaAncoraUsadaPorEstagio: Record<number, boolean>;
};

export type VetorDanoCategoria = 'ambar' | 'trauma' | 'horror' | 'maldade';

export type VetorDano = {
  id: string;
  nome: string;
  categoria: VetorDanoCategoria;
  dadoDano: string;
  valorFixo?: number;
  testeResistencia?: {
    atributo: 'SAB' | 'CON' | 'INT';
    cd: number;
    efeitoFalha: string;
  };
  descricao: string;
};

export type GatilhoEmocional = {
  id: string;
  nome: string;
  dado: string;
  descricao: string;
  limitePorSessao?: number;
  limiteporEstagio?: boolean;
  estagiosEficazes: number[];
  estagiosEstabiliza: number[];
  estagiosSemEfeito: number[];
};

export type RitualArcano = {
  id: string;
  nome: string;
  nivel: 'basico' | 'avancado';
  requisitos: string[];
  duracaoHoras: number;
  teste: {
    atributo: string;
    cd: number;
    cdIncrementoConsecutivo: number;
    aliado?: {
      pericia: string;
      cd: number;
    };
  };
  sucessoEfeito: {
    removeEstagios: number;
    estabilizaDias?: number;
  };
  falhaEfeito: string;
  falhaCriticaEfeito?: string;
  funcioanaNoEstagio5: boolean;
};

export type ResultadoCuraEmocional = {
  novoDano: number;
  novoEstagio: 1 | 2 | 3 | 4 | 5;
  mudouEstagio: boolean;
  estabilizouSemRegredir: boolean;
  semEfeito: boolean;
};

export type ResultadoRitual = {
  novoDano: number;
  novoEstagio: 1 | 2 | 3 | 4 | 5;
  estabilizadoAte?: string;
  praticanteDanoPsiquico?: number;
  mensagem: string;
};
