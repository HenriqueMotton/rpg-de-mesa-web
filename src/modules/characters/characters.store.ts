import { create } from "zustand";
import type { Character, CharacterListItem } from "./characters.api";

type AttrKey =
  | "forca"
  | "destreza"
  | "constituicao"
  | "inteligencia"
  | "sabedoria"
  | "carisma";

type CharacterDraft = {
  name: string;
  attributes: Record<AttrKey, number>;
  pointsRemaining: number;

  money: number;
  health: number;
  maxHealth: number;

  selectedSkills: number[];
  selectedRaceId: number | null;
  selectedSubRaceId: number | null;
};

const DEFAULT_DRAFT: CharacterDraft = {
  name: "",
  attributes: {
    forca: 8,
    destreza: 8,
    constituicao: 8,
    inteligencia: 8,
    sabedoria: 8,
    carisma: 8,
  },
  pointsRemaining: 27,

  money: 1000,
  health: 8,
  maxHealth: 8,

  selectedSkills: [],
  selectedRaceId: null,
  selectedSubRaceId: null,
};

type CharactersStore = {
  characters: CharacterListItem[];
  setCharacters: (list: CharacterListItem[]) => void;
  removeCharacter: (id: number | string) => void;

  selected: Character | null;
  setSelected: (c: Character | null) => void;

  // ✅ Draft de criação
  draft: CharacterDraft;
  resetDraft: () => void;

  setDraftName: (name: string) => void;
  setDraftAttribute: (k: AttrKey, v: number) => void;
  setDraftPointsRemaining: (v: number) => void;

  setDraftMoney: (v: number) => void;
  setDraftHealth: (v: number) => void;
  setDraftMaxHealth: (v: number) => void;

  toggleDraftSkill: (skill: number) => void;
  setDraftSkills: (skills: number[]) => void;

  setDraftRaceId: (id: number | null) => void;
  setDraftSubRaceId: (id: number | null) => void;
};

export const useCharactersStore = create<CharactersStore>((set) => ({
  characters: [],
  setCharacters: (characters) => set({ characters }),
  removeCharacter: (id) =>
    set((s) => ({ characters: s.characters.filter((c) => c.id !== id) })),

  selected: null,
  setSelected: (selected) => set({ selected }),

  draft: DEFAULT_DRAFT,
  resetDraft: () => set({ draft: DEFAULT_DRAFT }),

  setDraftName: (name) => set((s) => ({ draft: { ...s.draft, name } })),

  setDraftAttribute: (k, v) =>
    set((s) => ({
      draft: { ...s.draft, attributes: { ...s.draft.attributes, [k]: v } },
    })),

  setDraftPointsRemaining: (pointsRemaining) =>
    set((s) => ({ draft: { ...s.draft, pointsRemaining } })),

  setDraftMoney: (money) => set((s) => ({ draft: { ...s.draft, money } })),
  setDraftHealth: (health) => set((s) => ({ draft: { ...s.draft, health } })),
  setDraftMaxHealth: (maxHealth) =>
    set((s) => ({ draft: { ...s.draft, maxHealth } })),

  toggleDraftSkill: (skill) =>
    set((s) => {
      const has = s.draft.selectedSkills.includes(skill);
      const selectedSkills = has
        ? s.draft.selectedSkills.filter((x) => x !== skill)
        : [...s.draft.selectedSkills, skill];

      return { draft: { ...s.draft, selectedSkills } };
    }),

  setDraftSkills: (selectedSkills) =>
    set((s) => ({ draft: { ...s.draft, selectedSkills } })),

  setDraftRaceId: (selectedRaceId) =>
    set((s) => ({ draft: { ...s.draft, selectedRaceId } })),

  setDraftSubRaceId: (selectedSubRaceId) =>
    set((s) => ({ draft: { ...s.draft, selectedSubRaceId } })),
}));