import { create } from "zustand";
import type { Character, CharacterListItem } from "./characters.api";

type CharactersStore = {
  characters: CharacterListItem[];
  setCharacters: (list: CharacterListItem[]) => void;
  removeCharacter: (id: number | string) => void;

  selected: Character | null;
  setSelected: (c: Character | null) => void;
};

export const useCharactersStore = create<CharactersStore>((set) => ({
  characters: [],
  setCharacters: (characters) => set({ characters }),
  removeCharacter: (id) =>
    set((s) => ({ characters: s.characters.filter((c) => c.id !== id) })),

  selected: null,
  setSelected: (selected) => set({ selected }),
}));