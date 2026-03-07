// Tabelas de progressão de magias por classe (PHB 5e)

export type SpellSystem = 'known' | 'prepared' | 'grimoire' | 'none';

export type ClassProgression = {
  system: SpellSystem;
  /** Quantidade de truques conhecidos por nível (índice = nível - 1) */
  cantripsKnown: number[];
  /** Para sistema 'known': quantidade de magias conhecidas por nível */
  spellsKnown?: number[];
  /** Para sistemas 'prepared'/'grimoire': atributo que determina o máximo de preparados */
  prepAttr?: 'int' | 'sab' | 'car';
  /** Paladino: usa metade do nível na fórmula */
  halfLevel?: boolean;
  /** Nível máximo de magia acessível em cada nível de personagem (0 = nenhum) */
  maxSpellLevel: number[];
};

// Índice = nível do personagem - 1 (0..19)
export const CLASS_PROGRESSIONS: Record<string, ClassProgression> = {
  Bardo: {
    system: 'known',
    //                Lv: 1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
    cantripsKnown:      [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    spellsKnown:        [4, 5, 6, 7, 8, 9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
    maxSpellLevel:      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
  },
  Feiticeiro: {
    system: 'known',
    cantripsKnown:      [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    spellsKnown:        [2, 3, 4, 5, 6, 7, 8, 9,10,11,12,12,13,13,14,14,15,15,15,15],
    maxSpellLevel:      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
  },
  Bruxo: {
    system: 'known',
    cantripsKnown:      [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    spellsKnown:        [2, 3, 4, 5, 6, 7, 8, 9,10,10,11,11,12,12,13,13,14,14,15,15],
    maxSpellLevel:      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  },
  Patrulheiro: {
    system: 'known',
    cantripsKnown:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    spellsKnown:        [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9,10,10,11,11],
    maxSpellLevel:      [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  },
  Clérico: {
    system: 'prepared',
    cantripsKnown:      [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    maxSpellLevel:      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
    prepAttr: 'sab',
  },
  Druida: {
    system: 'prepared',
    cantripsKnown:      [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    maxSpellLevel:      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
    prepAttr: 'sab',
  },
  Paladino: {
    system: 'prepared',
    cantripsKnown:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    maxSpellLevel:      [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
    prepAttr: 'car',
    halfLevel: true,
  },
  Mago: {
    system: 'grimoire',
    cantripsKnown:      [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    // Grimório: começa com 6 magias de 1° nível + 2 por nível adicional
    spellsKnown:        [6, 8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44],
    maxSpellLevel:      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
    prepAttr: 'int',
  },
};

export function getClassProgression(className: string): ClassProgression | null {
  return CLASS_PROGRESSIONS[className] ?? null;
}

/** Modificador de atributo D&D: floor((stat - 10) / 2) */
export function attrMod(value: number): number {
  return Math.floor((value - 10) / 2);
}

/** Quantidade máxima de magias preparadas para classes com sistema prepared/grimoire */
export function maxPrepared(prog: ClassProgression, level: number, attrValue: number): number {
  const mod = attrMod(attrValue);
  const base = prog.halfLevel ? Math.floor(level / 2) : level;
  return Math.max(1, base + mod);
}

/** Retorna quantos truques e magias de nível o personagem deveria ter no nível dado */
export function expectedSpellCounts(prog: ClassProgression, level: number) {
  const idx = Math.min(Math.max(level, 1), 20) - 1;
  return {
    cantrips: prog.cantripsKnown[idx] ?? 0,
    leveled: prog.spellsKnown?.[idx] ?? 0,
    maxSpellLevel: prog.maxSpellLevel[idx] ?? 0,
  };
}
