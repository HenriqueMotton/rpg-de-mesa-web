import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  IconButton,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

import confetti from "canvas-confetti";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import {
  Glass, Noise, OrbSide, OrbTop, Page,
  BackButton, LoadingBar, PageLabel, PageTitle,
  SectionDivider, SectionIconBox, SectionLabelText,
  HpBarOverlay, HpValueSub, HpValueText,
  AttrGrid, AttrHint, AttrProgressTrack, AttrRangeLabel,
  SkillEmptyBox, SkillIconBox, SkillRow,
} from "./ViewCharacter.styles";

import AppDialog, { AppDialogConfirmButton } from "../../components/ui/AppDialog";
import PendingChangesFab from "../../components/ui/PendingChangesFab";
import {
  getCharacter,
  saveCharacter,
  toggleFreeAttrEdit,
  uploadCharacterAvatar,
  removeCharacterAvatar,
  type Character,
} from "../../modules/characters/characters.api";
import { useAuthStore } from "../../modules/auth/auth.store";
import { getInventory } from "../../modules/inventory/inventory.api";
import SpellQuickPanel from "./SpellQuickPanel";
import InitiativeWidget from "./InitiativeWidget";
import { useCharactersStore } from "../../modules/characters/characters.store";


type AttrKey = "forca" | "destreza" | "constituicao" | "inteligencia" | "sabedoria" | "carisma";

const ATTR_MIN = 8;
const ATTR_MAX = 20;

const ATTR_BADGE: Record<AttrKey, string> = {
  forca: "FOR", destreza: "DES", constituicao: "CON",
  inteligencia: "INT", sabedoria: "SAB", carisma: "CAR",
};
const ATTR_LABEL: Record<AttrKey, string> = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  inteligencia: "Inteligência", sabedoria: "Sabedoria", carisma: "Carisma",
};
const ATTR_ICON: Record<AttrKey, string> = {
  forca: "🏋️", destreza: "🏃", constituicao: "🫀",
  inteligencia: "🧠", sabedoria: "👁️", carisma: "🗣️",
};
const ATTR_COLOR: Record<AttrKey, { accent: string; glow: string; bg: string; border: string }> = {
  forca:        { accent: "rgba(255,110,100,0.95)", glow: "rgba(255,80,80,0.25)",   bg: "rgba(255,90,80,0.07)",   border: "rgba(255,90,80,0.18)"   },
  destreza:     { accent: "rgba(80,220,160,0.95)",  glow: "rgba(60,200,140,0.25)",  bg: "rgba(60,200,140,0.07)",  border: "rgba(60,200,140,0.18)"  },
  constituicao: { accent: "rgba(80,170,255,0.95)",  glow: "rgba(60,150,255,0.25)",  bg: "rgba(60,150,255,0.07)",  border: "rgba(60,150,255,0.18)"  },
  inteligencia: { accent: "rgba(175,130,255,0.95)", glow: "rgba(150,100,255,0.25)", bg: "rgba(150,100,255,0.07)", border: "rgba(150,100,255,0.18)" },
  sabedoria:    { accent: "rgba(255,210,80,0.95)",  glow: "rgba(255,190,60,0.25)",  bg: "rgba(255,190,60,0.07)",  border: "rgba(255,190,60,0.18)"  },
  carisma:      { accent: "rgba(255,140,90,0.95)",  glow: "rgba(255,130,70,0.25)",  bg: "rgba(255,130,70,0.07)",  border: "rgba(255,130,70,0.18)"  },
};

type HpAction = "damage" | "heal" | "increaseMaxHealth";

const HIT_DICE_BY_CLASS: Record<string, number> = {
  "Bárbaro": 12, "Bardo": 8, "Bruxo": 8, "Clérico": 8, "Druida": 8,
  "Feiticeiro": 6, "Guerreiro": 10, "Ladino": 8, "Mago": 6,
  "Monge": 8, "Paladino": 10, "Patrulheiro": 10,
};

const ASI_LEVELS_BY_CLASS: Record<string, number[]> = {
  "Bárbaro":     [4, 8, 12, 16, 19],
  "Bardo":       [4, 8, 12, 16, 19],
  "Bruxo":       [4, 8, 12, 16, 19],
  "Clérico":     [4, 8, 12, 16, 19],
  "Druida":      [4, 8, 12, 16, 19],
  "Feiticeiro":  [4, 8, 12, 16, 19],
  "Guerreiro":   [4, 6, 8, 12, 14, 16, 19],
  "Ladino":      [4, 8, 10, 12, 16, 19],
  "Mago":        [4, 8, 12, 16, 19],
  "Monge":       [4, 8, 12, 16, 19],
  "Paladino":    [4, 8, 12, 16, 19],
  "Patrulheiro": [4, 8, 12, 16, 19],
};
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];

function getAsiOpportunities(nivel: number, className: string): number {
  const levels = ASI_LEVELS_BY_CLASS[className] ?? DEFAULT_ASI_LEVELS;
  return levels.filter((l) => l <= nivel).length;
}

const RACE_ICON: Record<string, string> = {
  "Anão": "⛏️", "Elfo": "🌿", "Meio-Elfo": "🌟", "Humano": "🏛️",
  "Draconato": "🐉", "Gnomo": "⚙️", "Meio-Orc": "💪", "Hobbit": "🌻",
};

const XP_THRESHOLDS = [0, 300, 900, 1800, 3800, 7500, 14000, 23000, 34000, 48000, 64000, 83000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000];

function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 20);
}

function fireLevelUpConfetti() {
  // Use a dedicated canvas placed above MUI dialogs (z-index > 1300)
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;pointer-events:none;";
  document.body.appendChild(canvas);
  const fire = confetti.create(canvas, { resize: true });

  const colors = ["#f0c020", "#7B54FF", "#5B8FFF", "#ff6b9d", "#ffffff", "#4ecdc4"];
  const base = { spread: 70, ticks: 120, gravity: 0.9, colors };

  fire({ ...base, particleCount: 70, angle: 60, origin: { x: 0, y: 0.65 } });
  fire({ ...base, particleCount: 70, angle: 120, origin: { x: 1, y: 0.65 } });
  setTimeout(() => {
    fire({ ...base, particleCount: 100, angle: 90, spread: 100, origin: { x: 0.5, y: 0.4 } });
  }, 180);
  setTimeout(() => {
    fire({ ...base, particleCount: 50, angle: 90, spread: 60, origin: { x: 0.5, y: 0.3 } });
    setTimeout(() => canvas.remove(), 4000);
  }, 420);
}

function getProficiencyBonus(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9)  return 4;
  if (level >= 5)  return 3;
  return 2;
}

function getXpProgress(xp: number) {
  const level   = getLevelFromXp(xp);
  if (level >= 20) return { level, current: xp, floor: XP_THRESHOLDS[19], ceiling: XP_THRESHOLDS[19], pct: 1, isMax: true };
  const floor   = XP_THRESHOLDS[level - 1];
  const ceiling = XP_THRESHOLDS[level];
  const pct     = (xp - floor) / (ceiling - floor);
  return { level, current: xp, floor, ceiling, pct, isMax: false };
}


function getModifier(v: number) { return Math.floor((v - 10) / 2); }
function fmtMod(m: number) { return m >= 0 ? `+${m}` : `${m}`; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function hpConfig(pct: number) {
  if (pct > 0.5) return { fill: "linear-gradient(90deg,#1fa863,#2ecc8a)", glow: "rgba(46,204,130,0.4)", track: "rgba(46,204,130,0.08)", border: "rgba(46,204,130,0.22)", textColor: "rgba(100,240,170,0.95)", label: "Saudável" };
  if (pct > 0.25) return { fill: "linear-gradient(90deg,#c88000,#f0aa20)", glow: "rgba(240,170,30,0.4)", track: "rgba(240,170,30,0.08)", border: "rgba(240,170,30,0.22)", textColor: "rgba(255,215,100,0.95)", label: "Ferido" };
  return { fill: "linear-gradient(90deg,#aa2020,#e03535)", glow: "rgba(220,50,50,0.45)", track: "rgba(220,50,50,0.08)", border: "rgba(220,50,50,0.25)", textColor: "rgba(255,130,130,0.95)", label: "Crítico" };
}

function getSkillIconByAttr(attr?: string | null) {
  const a = (attr || "").toLowerCase();
  if (a.includes("for")) return "🏋️";
  if (a.includes("des")) return "🏃";
  if (a.includes("con")) return "🫀";
  if (a.includes("int")) return "🧠";
  if (a.includes("sab")) return "👁️";
  if (a.includes("car")) return "🗣️";
  return "✨";
}

function getAttrsFrom(c?: any): Record<AttrKey, number> {
  const a = c?.idAttribute ?? c?.attributes ?? {};
  return {
    forca: Number(a.forca ?? 8), destreza: Number(a.destreza ?? 8),
    constituicao: Number(a.constituicao ?? 8), inteligencia: Number(a.inteligencia ?? 8),
    sabedoria: Number(a.sabedoria ?? 8), carisma: Number(a.carisma ?? 8),
  };
}
function withAttrs(base: any, nextAttrs: Record<AttrKey, number>) {
  const out = { ...base };
  if (base?.idAttribute) out.idAttribute = { ...(base.idAttribute ?? {}), ...nextAttrs };
  else out.attributes = { ...(base.attributes ?? {}), ...nextAttrs };
  return out;
}
function makeComparableState(c: any) {
  if (!c) return null;
  return {
    id: c.id, name: c.name,
    pp: Number(c.pp ?? 0), money: Number(c.money ?? 0), pc: Number(c.pc ?? 0),
    health: Number(c.health ?? 0), maxHealth: Number(c.maxHealth ?? 0),
    xp: Number(c.xp ?? 0),
    asiPointsUsed: Number(c.asiPointsUsed ?? 0),
    attrs: getAttrsFrom(c),
  };
}

const inputSx = {
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13.5 },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(160,130,255,0.9)" },
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.92)", fontSize: 14,
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
  },
  "& .MuiInputAdornment-root svg": { color: "rgba(255,255,255,0.25)", fontSize: 18 },
};

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <SectionIconBox>{icon}</SectionIconBox>
      <SectionLabelText>{label}</SectionLabelText>
      <SectionDivider />
    </Stack>
  );
}

interface LongPressButtonProps {
  onAction: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  sx?: object;
}

function LongPressButton({ onAction, disabled, children, sx }: LongPressButtonProps) {
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const accelRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef     = useRef(280);
  const isTouchRef   = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current)  clearTimeout(timeoutRef.current);
    if (accelRef.current)    clearInterval(accelRef.current);
    intervalRef.current = timeoutRef.current = accelRef.current = null;
    speedRef.current = 280;
  }, []);

  const startRepeat = useCallback(() => {
    const tick = () => onAction();
    intervalRef.current = setInterval(tick, speedRef.current);
    accelRef.current = setInterval(() => {
      if (speedRef.current > 55) {
        speedRef.current = Math.max(55, speedRef.current - 45);
        clearInterval(intervalRef.current!);
        intervalRef.current = setInterval(tick, speedRef.current);
      }
    }, 600);
  }, [onAction]);

  const start = useCallback(() => {
    if (disabled) return;
    onAction();
    timeoutRef.current = setTimeout(startRepeat, 500);
  }, [disabled, onAction, startRepeat]);

  useEffect(() => () => stop(), [stop]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isTouchRef.current) return;
    e.preventDefault();
    start();
  }, [start]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isTouchRef.current = true;
    start();
    setTimeout(() => { isTouchRef.current = false; }, 600);
  }, [start]);

  return (
    <Box
      onMouseDown={handleMouseDown}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={handleTouchStart}
      onTouchEnd={stop}
      onTouchCancel={stop}
      sx={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export default function ViewCharacterPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const setSelected = useCharactersStore((s) => s.setSelected);
  const isMaster = useAuthStore((s) => s.isMaster);

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [original, setOriginal] = useState<Character | null>(null);
  const [draft,    setDraft]    = useState<Character | null>(null);

  const [invWeight,  setInvWeight]  = useState<{ total: number; capacity: number } | null>(null);

  const [hpOpen,       setHpOpen]       = useState(false);
  const [hpAction,     setHpAction]     = useState<HpAction>("damage");
  const [hpAmount,     setHpAmount]     = useState("");
  const [hpLevelUpOpen,      setHpLevelUpOpen]      = useState(false);
  const [hpLevelUpRoll,      setHpLevelUpRoll]      = useState("");
  const [asiGainedOnLevelUp, setAsiGainedOnLevelUp] = useState(0);

  const [goldOpen,   setGoldOpen]   = useState(false);
  const [goldTab,    setGoldTab]    = useState<"ganhar" | "gastar" | "converter">("ganhar");
  const [goldAction, setGoldAction] = useState<"add" | "remove">("add");
  const [goldPP,     setGoldPP]     = useState("");
  const [goldPO,     setGoldPO]     = useState("");
  const [goldPC,     setGoldPC]     = useState("");
  const [cvtMode,    setCvtMode]    = useState<"po-pp" | "pp-pc" | "pp-po" | "pc-pp">("po-pp");
  const [cvtQty,     setCvtQty]     = useState("");

  const [xpOpen,   setXpOpen]   = useState(false);
  const [xpAmount, setXpAmount] = useState("");

  const [fabVisible, setFabVisible] = useState(false);
  const [avatarUploading,  setAvatarUploading]  = useState(false);
  const [avatarOpen,       setAvatarOpen]       = useState(false);
  const [profAnchor,       setProfAnchor]       = useState<HTMLElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        if (!id) throw new Error("ID do personagem não informado.");
        const data = await getCharacter(id);
        if (!alive) return;
        setOriginal(data); setDraft(data);
        setSelected(data);
        getInventory(id).then((inv) => {
          if (!alive) return;
          setInvWeight({ total: inv.totalWeight, capacity: inv.carryingCapacity });
        }).catch(() => {});
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "Não foi possível carregar o personagem.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const dirty = useMemo(() =>
    JSON.stringify(makeComparableState(original as any)) !== JSON.stringify(makeComparableState(draft as any)),
    [original, draft]
  );

  useEffect(() => {
    const t = setTimeout(() => setFabVisible(dirty), 30);
    return () => clearTimeout(t);
  }, [dirty]);

  const attrs = useMemo(() => getAttrsFrom(draft as any), [draft]);
  const skills = useMemo(() => ((draft as any)?.characterSkills ?? []) as Array<any>, [draft]);

  const hp    = draft?.health    ?? 0;
  const maxHp = draft?.maxHealth ?? 1;
  const hpPct = maxHp > 0 ? clamp(hp / maxHp, 0, 1) : 0;
  const hpUi  = hpConfig(hpPct);

  function openHp(action: HpAction) {
    setError(null); setHpAction(action); setHpAmount(""); setHpOpen(true);
  }
  function hpTitle() {
    if (hpAction === "damage") return "Aplicar Dano";
    if (hpAction === "heal")   return "Aplicar Cura";
    return "Ajustar Vitalidade";
  }
  function hpHelper() {
    if (hpAction === "damage") return "Informe quanto de dano o personagem recebeu.";
    if (hpAction === "heal")   return "Informe quanto de cura o personagem recebeu.";
    return "Informe quanto deseja aumentar ou reduzir a Vida Máxima.";
  }
  function applyHpToDraft(mode: "apply" | "removeMax") {
    if (!draft) return;
    setError(null);
    const v = parseInt(hpAmount, 10);
    if (!Number.isFinite(v) || v <= 0) { setError("Informe um número válido maior que 0."); return; }
    let newHealth = Number(draft.health ?? 0);
    let newMaxHealth = Number(draft.maxHealth ?? 1);
    if (hpAction === "damage") {
      newHealth = clamp(newHealth - v, 0, newMaxHealth);
    } else if (hpAction === "heal") {
      newHealth = clamp(newHealth + v, 0, newMaxHealth);
    } else {
      if (mode === "apply") { newMaxHealth = Math.max(1, newMaxHealth + v); newHealth = clamp(newHealth, 0, newMaxHealth); }
      else                  { newMaxHealth = Math.max(1, newMaxHealth - v); newHealth = clamp(newHealth, 0, newMaxHealth); }
    }
    setDraft({ ...draft, health: newHealth, maxHealth: newMaxHealth });
    setHpOpen(false); setHpAmount("");
  }

  function changeAttribute(k: AttrKey, delta: 1 | -1) {
    if (!draft) return;
    const cur  = getAttrsFrom(draft);
    const next = clamp(cur[k] + delta, ATTR_MIN, ATTR_MAX);
    if (next === cur[k]) return;

    let updated = withAttrs(draft, { ...cur, [k]: next });

    if (k === "constituicao") {
      const modDiff = getModifier(next) - getModifier(cur.constituicao);
      if (modDiff !== 0) {
        const nivel       = Number((draft as any).nivel ?? 1);
        const newMaxHp    = Math.max(1, (draft.maxHealth ?? 1) + modDiff * nivel);
        const newHp       = Math.min(draft.health ?? 0, newMaxHp);
        updated = { ...updated, health: newHp, maxHealth: newMaxHp };
      }
    }

    setDraft(updated);
  }

  function spendAsiPoint(k: AttrKey) {
    if (!draft) return;
    const cur = getAttrsFrom(draft);
    if (cur[k] >= 20) return;
    const nivel = Number((draft as any).nivel ?? 1);
    const className = (draft as any)?.dndClass?.name ?? "";
    const earned = getAsiOpportunities(nivel, className) * 2;
    const used = Number((draft as any).asiPointsUsed ?? 0);
    if (used >= earned) return;
    const next = cur[k] + 1;
    let updated = withAttrs(draft, { ...cur, [k]: next });
    if (k === "constituicao") {
      const modDiff = getModifier(next) - getModifier(cur.constituicao);
      if (modDiff !== 0) {
        const newMaxHp = Math.max(1, (draft.maxHealth ?? 1) + modDiff * nivel);
        const newHp = Math.min(draft.health ?? 0, newMaxHp);
        updated = { ...updated, health: newHp, maxHealth: newMaxHp };
      }
    }
    setDraft({ ...updated, asiPointsUsed: used + 1 } as any);
  }

  async function handleFreeAttrToggle() {
    if (!draft) return;
    const newVal = !(draft as any).freeAttrEdit;
    try {
      await toggleFreeAttrEdit(draft.id, newVal);
      const updated = { ...draft, freeAttrEdit: newVal } as any;
      setDraft(updated);
      setOriginal(updated);
    } catch {
      setError("Não foi possível alterar o modo de edição.");
    }
  }

  async function handleSave() {
    if (!draft) return;
    setError(null); setSaving(true);
    try {
      await saveCharacter(draft);
      const fresh = await getCharacter(draft.id);
      setOriginal(fresh); setDraft(fresh); setSelected(fresh);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() { setError(null); setDraft(original); }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft?.id) return;
    setAvatarUploading(true);
    try {
      const updated = await uploadCharacterAvatar(draft.id, file);
      setDraft((prev) => prev ? { ...prev, avatarUrl: (updated as any).avatarUrl } : prev);
      setOriginal((prev) => prev ? { ...prev, avatarUrl: (updated as any).avatarUrl } : prev);
    } catch {
      setError("Não foi possível enviar a imagem.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }


  async function handleAvatarRemove(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!draft?.id) return;
    setAvatarUploading(true);
    try {
      await removeCharacterAvatar(draft.id);
      setDraft((prev) => prev ? { ...prev, avatarUrl: null } : prev);
      setOriginal((prev) => prev ? { ...prev, avatarUrl: null } : prev);
    } catch {
      setError("Não foi possível remover a imagem.");
    } finally {
      setAvatarUploading(false);
    }
  }

  function openGoldDialog(tab: "ganhar" | "gastar" | "converter" = "ganhar") {
    setError(null);
    setGoldTab(tab);
    setGoldAction(tab === "gastar" ? "remove" : "add");
    setGoldPP(""); setGoldPO(""); setGoldPC("");
    setCvtQty(""); setCvtMode("po-pp");
    setGoldOpen(true);
  }

  function applyGoldToDraft() {
    if (!draft) return;
    setError(null);
    const pp = parseInt(goldPP, 10) || 0;
    const po = parseInt(goldPO, 10) || 0;
    const pc = parseInt(goldPC, 10) || 0;
    if (pp === 0 && po === 0 && pc === 0) { setError("Informe ao menos um valor."); return; }
    const sign = goldAction === "add" ? 1 : -1;
    setDraft({
      ...draft,
      pp:    Math.max(0, Number(draft.pp    ?? 0) + sign * pp),
      money: Math.max(0, Number(draft.money ?? 0) + sign * po),
      pc:    Math.max(0, Number(draft.pc    ?? 0) + sign * pc),
    });
    setGoldOpen(false);
    setGoldPP(""); setGoldPO(""); setGoldPC("");
  }

  function applyConversion() {
    if (!draft) return;
    setError(null);
    const qty = parseInt(cvtQty, 10);
    if (!Number.isFinite(qty) || qty < 1) { setError("Informe um valor válido maior que 0."); return; }
    const pp = Number(draft.pp    ?? 0);
    const po = Number(draft.money ?? 0);
    const pc = Number(draft.pc    ?? 0);
    let newPP = pp, newPO = po, newPC = pc;
    if (cvtMode === "po-pp") {
      if (po < qty) { setError(`Você só tem ${po} PO.`); return; }
      newPO = po - qty; newPP = pp + qty * 10;
    } else if (cvtMode === "pp-pc") {
      if (pp < qty) { setError(`Você só tem ${pp} PP.`); return; }
      newPP = pp - qty; newPC = pc + qty * 10;
    } else if (cvtMode === "pp-po") {
      const needed = qty * 10;
      if (pp < needed) { setError(`Você precisa de ${needed} PP (você tem ${pp}).`); return; }
      newPP = pp - needed; newPO = po + qty;
    } else if (cvtMode === "pc-pp") {
      const needed = qty * 10;
      if (pc < needed) { setError(`Você precisa de ${needed} PC (você tem ${pc}).`); return; }
      newPC = pc - needed; newPP = pp + qty;
    }
    setDraft({ ...draft, pp: newPP, money: newPO, pc: newPC });
    setGoldOpen(false); setCvtQty("");
  }

  function applyXpToDraft() {
    if (!draft) return;
    setError(null);
    const v = parseInt(xpAmount, 10);
    if (!Number.isFinite(v) || v <= 0) { setError("Informe um número válido maior que 0."); return; }
    const oldNivel = getLevelFromXp(Number((draft as any).xp ?? 0));
    const newXp    = Math.max(0, Number((draft as any).xp ?? 0) + v);
    const newNivel = getLevelFromXp(newXp);
    setDraft({ ...draft, xp: newXp, nivel: newNivel } as any);
    setXpOpen(false); setXpAmount("");
    if (newNivel > oldNivel) {
      const className = (draft as any)?.dndClass?.name ?? "";
      const asiGained = (getAsiOpportunities(newNivel, className) - getAsiOpportunities(oldNivel, className)) * 2;
      setAsiGainedOnLevelUp(asiGained);
      setTimeout(fireLevelUpConfetti, 120);
      setHpLevelUpRoll("");
      setHpLevelUpOpen(true);
    }
  }

  function applyHpLevelUp() {
    if (!draft) return;
    setError(null);
    const dieSize = HIT_DICE_BY_CLASS[(draft as any)?.dndClass?.name ?? ""] ?? 8;
    const roll = parseInt(hpLevelUpRoll, 10);
    if (!Number.isFinite(roll) || roll < 1 || roll > dieSize) {
      setError(`Informe um número entre 1 e ${dieSize}.`);
      return;
    }
    const conMod = getModifier(getAttrsFrom(draft).constituicao);
    const hpGain = Math.max(1, roll + conMod);
    const newMaxHp = (draft.maxHealth ?? 0) + hpGain;
    setDraft({ ...draft, maxHealth: newMaxHp });
    setHpLevelUpOpen(false);
    setHpLevelUpRoll("");
  }

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

      <Container maxWidth="sm" sx={{ pt: 2.5, px: 2, pb: 12 }}>

        {/* HEADER */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3.5 }}>
          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
            {/* Avatar thumbnail — click opens modal */}
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Box
                onClick={() => !avatarUploading && setAvatarOpen(true)}
                sx={{
                  width: 62, height: 62, borderRadius: "18px",
                  overflow: "hidden", cursor: "pointer", flexShrink: 0,
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  bgcolor: "rgba(255,255,255,0.05)",
                  display: "grid", placeItems: "center",
                  transition: "border-color .15s",
                  "&:hover": { borderColor: "rgba(160,130,255,0.45)" },
                  "&:hover .cam-overlay": { opacity: 1 },
                }}
              >
                {(draft as any)?.avatarUrl ? (
                  <Box
                    component="img"
                    src={`${import.meta.env.VITE_API_BASE_URL}${(draft as any).avatarUrl}`}
                    alt="avatar"
                    sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <Typography sx={{ fontSize: 28, lineHeight: 1 }}>
                    {(draft as any)?.dndClass?.icon ?? "🧙"}
                  </Typography>
                )}
                <Box className="cam-overlay" sx={{
                  position: "absolute", inset: 0,
                  display: "grid", placeItems: "center",
                  bgcolor: "rgba(0,0,0,0.45)", opacity: 0, transition: "opacity .15s",
                  borderRadius: "18px",
                }}>
                  {avatarUploading
                    ? <CircularProgress size={18} sx={{ color: "rgba(255,255,255,0.7)" }} />
                    : <CameraAltRoundedIcon sx={{ fontSize: 20, color: "rgba(255,255,255,0.85)" }} />}
                </Box>
              </Box>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </Box>

            {/* Avatar expanded modal */}
            <Dialog
              open={avatarOpen}
              onClose={() => setAvatarOpen(false)}
              PaperProps={{
                sx: {
                  bgcolor: "transparent", boxShadow: "none",
                  m: 2, maxWidth: 340, width: "100%",
                },
              }}
              slotProps={{ backdrop: { sx: { backdropFilter: "blur(12px)", bgcolor: "rgba(0,0,0,0.75)" } } }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                {/* Image / placeholder */}
                <Box sx={{
                  width: "100%", aspectRatio: "1/1", borderRadius: "24px",
                  overflow: "hidden", bgcolor: "rgba(255,255,255,0.05)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  display: "grid", placeItems: "center",
                }}>
                  {(draft as any)?.avatarUrl ? (
                    <Box
                      component="img"
                      src={`${import.meta.env.VITE_API_BASE_URL}${(draft as any).avatarUrl}`}
                      alt="avatar"
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: 72, lineHeight: 1 }}>
                      {(draft as any)?.dndClass?.icon ?? "🧙"}
                    </Typography>
                  )}
                </Box>

                {/* Actions */}
                <Stack direction="row" spacing={1.5} justifyContent="center">
                  {/* Change */}
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                    <IconButton
                      onClick={() => { setAvatarOpen(false); setTimeout(() => avatarInputRef.current?.click(), 100); }}
                      disabled={avatarUploading}
                      sx={{
                        width: 52, height: 52, borderRadius: "16px",
                        bgcolor: "rgba(120,85,255,0.15)", border: "1px solid rgba(120,85,255,0.3)",
                        color: "rgba(180,150,255,0.9)",
                        "&:hover": { bgcolor: "rgba(120,85,255,0.25)" },
                      }}
                    >
                      <CameraAltRoundedIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Alterar</Typography>
                  </Box>

                  {/* Delete — only if has avatar */}
                  {(draft as any)?.avatarUrl && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                      <IconButton
                        onClick={async (e) => { setAvatarOpen(false); await handleAvatarRemove(e); }}
                        disabled={avatarUploading}
                        sx={{
                          width: 52, height: 52, borderRadius: "16px",
                          bgcolor: "rgba(220,60,60,0.1)", border: "1px solid rgba(220,60,60,0.25)",
                          color: "rgba(255,100,100,0.85)",
                          "&:hover": { bgcolor: "rgba(220,60,60,0.2)" },
                        }}
                      >
                        <DeleteRoundedIcon sx={{ fontSize: 22 }} />
                      </IconButton>
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Excluir</Typography>
                    </Box>
                  )}

                  {/* Close */}
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                    <IconButton
                      onClick={() => setAvatarOpen(false)}
                      sx={{
                        width: 52, height: 52, borderRadius: "16px",
                        bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.5)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Fechar</Typography>
                  </Box>
                </Stack>
              </Box>
            </Dialog>

            {/* Name / class / race */}
            <Box>
              <PageLabel>{loading ? " " : "Ficha do Personagem"}</PageLabel>
              <PageTitle>{loading ? "Carregando…" : (draft?.name ?? "Personagem")}</PageTitle>
              {!loading && ((draft as any)?.dndClass || (draft as any)?.race) && (
                <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.28)", mt: 0.25, letterSpacing: "0.01em" }}>
                  {(draft as any).dndClass && `${(draft as any).dndClass.icon} ${(draft as any).dndClass.name}`}
                  {(draft as any).dndClass && (draft as any).race && " · "}
                  {(draft as any).race && `${RACE_ICON[(draft as any).race.name] ?? "🎲"} ${(draft as any).race.name}${(draft as any).subRace ? ` · ${(draft as any).subRace.name}` : ""}`}
                </Typography>
              )}
              {(loading || saving) && <LoadingBar />}
            </Box>
          </Stack>

          <Stack alignItems="flex-end" spacing={0.75}>
            <BackButton
              onClick={() => navigate(ROUTES.personagens)}
              startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "15px !important" }} />}
            >
              Voltar
            </BackButton>

            {!loading && draft && (() => {
              const nivel = (draft as any).nivel ?? 1;
              const bonus = getProficiencyBonus(nivel);
              return (
                <>
                  <Box
                    onClick={(e) => setProfAnchor(e.currentTarget)}
                    sx={{
                      display: "inline-flex", alignItems: "center", gap: 0.6,
                      px: 1, py: 0.35, borderRadius: "8px", cursor: "pointer",
                      bgcolor: "rgba(60,140,255,0.1)", border: "1px solid rgba(60,140,255,0.22)",
                      transition: "all .15s",
                      "&:hover": { bgcolor: "rgba(60,140,255,0.18)", borderColor: "rgba(60,140,255,0.38)" },
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: "rgba(120,185,255,0.9)" }}>
                      Prof.
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: "rgba(140,200,255,0.95)" }}>
                      +{bonus}
                    </Typography>
                  </Box>

                  <Popover
                    open={Boolean(profAnchor)}
                    anchorEl={profAnchor}
                    onClose={() => setProfAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                      sx: {
                        mt: 0.75, maxWidth: 260, borderRadius: "14px",
                        bgcolor: "rgba(14,18,30,0.97)", border: "1px solid rgba(60,140,255,0.2)",
                        backdropFilter: "blur(16px)", boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                        p: 1.75,
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(120,185,255,0.6)", mb: 0.6 }}>
                      Bônus de Proficiência
                    </Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 900, color: "rgba(140,200,255,0.95)", lineHeight: 1, mb: 1 }}>
                      +{bonus}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, mb: 1.25 }}>
                      Adicionado a ataques, testes e salvaguardas em que você tem proficiência. Aumenta conforme o nível.
                    </Typography>
                    <Stack spacing={0.4}>
                      {([
                        [1,  4,  2],
                        [5,  8,  3],
                        [9,  12, 4],
                        [13, 16, 5],
                        [17, 20, 6],
                      ] as [number, number, number][]).map(([min, max, val]) => {
                        const active = nivel >= min && nivel <= max;
                        return (
                          <Stack key={min} direction="row" alignItems="center" justifyContent="space-between"
                            sx={{ px: 1, py: 0.35, borderRadius: "8px", bgcolor: active ? "rgba(60,140,255,0.12)" : "transparent", border: `1px solid ${active ? "rgba(60,140,255,0.28)" : "transparent"}` }}
                          >
                            <Typography sx={{ fontSize: 11.5, color: active ? "rgba(180,215,255,0.9)" : "rgba(255,255,255,0.28)", fontWeight: active ? 700 : 400 }}>
                              Nível {min}–{max}
                            </Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: active ? "rgba(140,200,255,0.95)" : "rgba(255,255,255,0.2)" }}>
                              +{val}
                            </Typography>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Popover>
                </>
              );
            })()}
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px", py: 0.5, bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)", fontSize: 13, "& .MuiAlert-icon": { color: "rgba(255,110,110,0.7)", fontSize: 18 } }}>
            {error}
          </Alert>
        )}

        {/* ── XP CARD ──────────────────────────────────────────────────────── */}
        {!loading && draft && (() => {
          const xpData = getXpProgress(Number((draft as any).xp ?? 0));
          const nivel  = (draft as any).nivel ?? xpData.level;
          return (
            <Box
              onClick={() => { setXpAmount(""); setXpOpen(true); }}
              sx={{
                mb: 1.5, px: 2, pt: 1.75, pb: 1.5, borderRadius: "20px",
                bgcolor: "rgba(255,195,60,0.06)",
                border: "1px solid rgba(255,195,60,0.15)",
                cursor: "pointer", transition: "all .15s",
                "&:hover": { bgcolor: "rgba(255,195,60,0.1)", borderColor: "rgba(255,195,60,0.28)" },
              }}
            >
              {/* Row 1: badge + info + icon */}
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.25 }}>

                {/* Level circle */}
                <Box sx={{
                  flexShrink: 0, width: 46, height: 46, borderRadius: "50%",
                  background: "linear-gradient(135deg, #b87000 0%, #f0c020 100%)",
                  boxShadow: "0 4px 14px rgba(200,160,0,0.35)",
                  display: "grid", placeItems: "center",
                }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#1c1100", lineHeight: 1 }}>
                    {nivel}
                  </Typography>
                </Box>

                {/* Labels */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,210,80,0.5)", lineHeight: 1, mb: 0.4 }}>
                    Experiência
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 900, color: "rgba(255,215,100,0.93)", lineHeight: 1 }}>
                    {xpData.current.toLocaleString("pt-BR")}
                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, ml: 0.5, opacity: 0.6 }}>XP</Typography>
                  </Typography>
                </Box>

                <AddRoundedIcon sx={{ fontSize: 18, color: "rgba(255,195,60,0.38)", flexShrink: 0 }} />
              </Stack>

              {/* Row 2: progress bar */}
              <Box sx={{ borderRadius: 99, height: 7, bgcolor: "rgba(0,0,0,0.22)", overflow: "hidden", mb: 0.65 }}>
                <Box sx={{
                  height: "100%", width: `${Math.round(xpData.pct * 100)}%`,
                  background: "linear-gradient(90deg, #b87000, #f0c020)",
                  borderRadius: 99, boxShadow: "0 0 10px rgba(240,192,32,0.45)",
                  transition: "width .5s cubic-bezier(.4,0,.2,1)",
                }} />
              </Box>

              {/* Row 3: hint */}
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.28)", pl: 0.25 }}>
                {xpData.isMax
                  ? "Nível máximo atingido"
                  : `faltam ${(xpData.ceiling - xpData.current).toLocaleString("pt-BR")} XP para o nível ${xpData.level + 1}`}
              </Typography>
            </Box>
          );
        })()}

<Glass elevation={0}>
          <Box sx={{ p: { xs: 2, sm: 2.25 } }}>
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
                <CircularProgress size={32} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
                <Typography sx={{ mt: 2, fontSize: 12, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>Carregando personagem…</Typography>
              </Box>
            ) : !draft ? (
              <Typography sx={{ color: "rgba(255,255,255,0.55)", textAlign: "center", py: 8 }}>Personagem não encontrado.</Typography>
            ) : (
              <Stack spacing={3}>

                {/* ── HP ─────────────────────────────────────────── */}
                <Box>
                  <SectionLabel
                    icon={<FavoriteRoundedIcon sx={{ fontSize: 14, color: hpUi.textColor }} />}
                    label="Pontos de Vida"
                  />

                  {/* Bar */}
                  <Box sx={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: `1px solid ${hpUi.border}`, bgcolor: hpUi.track, mb: 1.5 }}>
                    <Box sx={{ height: 52, width: `${Math.round(hpPct * 100)}%`, background: hpUi.fill, transition: "width .5s cubic-bezier(.4,0,.2,1)", boxShadow: `4px 0 20px ${hpUi.glow}` }} />
                    <HpBarOverlay>
                      <HpValueText>
                        {draft.health}
                        <HpValueSub component="span">{" "}/ {draft.maxHealth} HP</HpValueSub>
                      </HpValueText>
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        {/* Hit dice badge */}
                        {(() => {
                          const dieSize = HIT_DICE_BY_CLASS[(draft as any)?.dndClass?.name ?? ""] ?? 0;
                          if (!dieSize) return null;
                          const available = (draft.nivel ?? 1) - ((draft as any).hitDiceUsed ?? 0);
                          return (
                            <Tooltip title="Dados de vida" placement="top" arrow>
                              <Box sx={{ px: 1.1, py: 0.4, borderRadius: "8px", bgcolor: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.1)", cursor: "default" }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: available > 0 ? "rgba(255,255,255,0.6)" : "rgba(255,100,100,0.7)", letterSpacing: "0.03em", lineHeight: 1 }}>
                                  d{dieSize} · {available}
                                </Typography>
                              </Box>
                            </Tooltip>
                          );
                        })()}
                        {/* HP status badge */}
                        <Box sx={{ px: 1.2, py: 0.4, borderRadius: "8px", bgcolor: "rgba(0,0,0,0.28)", border: `1px solid ${hpUi.border}` }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: hpUi.textColor, letterSpacing: "0.04em" }}>
                            {hpUi.label} · {Math.round(hpPct * 100)}%
                          </Typography>
                        </Box>
                      </Stack>
                    </HpBarOverlay>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={1}>
                    {[
                      { action: "damage" as HpAction,            label: "Dano",       bc: "rgba(220,60,60,0.25)",  bg: "rgba(220,60,60,0.07)",  color: "rgba(255,170,170,0.9)",  hbc: "rgba(220,60,60,0.35)",  hbg: "rgba(220,60,60,0.12)"  },
                      { action: "heal" as HpAction,              label: "Cura",       bc: "rgba(75,175,130,0.28)", bg: "rgba(75,175,130,0.08)", color: "rgba(130,230,180,0.95)", hbc: "rgba(75,175,130,0.4)",  hbg: "rgba(75,175,130,0.13)" },
                      { action: "increaseMaxHealth" as HpAction, label: "Vitalidade", bc: "rgba(255,195,80,0.28)", bg: "rgba(255,195,80,0.08)", color: "rgba(255,215,130,0.95)", hbc: "rgba(255,195,80,0.42)", hbg: "rgba(255,195,80,0.13)" },
                    ].map(({ action, label, bc, bg, color, hbc, hbg }) => (
                      <Button key={action} onClick={() => openHp(action)} fullWidth variant="outlined"
                        sx={{ borderRadius: "14px", py: 1.1, textTransform: "none", fontWeight: 800, borderColor: bc, bgcolor: bg, color, "&:hover": { bgcolor: hbg, borderColor: hbc } }}
                      >
                        {label}
                      </Button>
                    ))}
                  </Stack>
                </Box>


                {/* ── MOEDAS ─────────────────────────────────────── */}
                <Box
                  onClick={() => openGoldDialog("ganhar")}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    px: 2, py: 1.5, borderRadius: "18px",
                    border: "1px solid rgba(255,195,70,0.18)",
                    bgcolor: "rgba(255,195,70,0.04)",
                    cursor: "pointer", transition: "all .15s",
                    "&:hover": { bgcolor: "rgba(255,195,70,0.09)", borderColor: "rgba(255,195,70,0.32)" },
                  }}
                >
                  <Box sx={{
                    width: 42, height: 42, borderRadius: "13px", flexShrink: 0,
                    bgcolor: "rgba(255,195,60,0.12)", border: "1px solid rgba(255,195,60,0.22)",
                    display: "grid", placeItems: "center",
                  }}>
                    <AccountBalanceWalletRoundedIcon sx={{ fontSize: 20, color: "rgba(255,215,100,0.88)" }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,195,60,0.5)", lineHeight: 1, mb: 0.35 }}>
                      Carteira
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Typography component="span" sx={{ color: "rgba(255,220,120,0.92)", fontWeight: 900 }}>{Number((draft as any).money ?? 0)} PO</Typography>
                      <Typography component="span" sx={{ color: "rgba(255,255,255,0.22)", mx: 0.6 }}>·</Typography>
                      <Typography component="span" sx={{ color: "rgba(200,215,235,0.85)", fontWeight: 900 }}>{Number((draft as any).pp ?? 0)} PP</Typography>
                      <Typography component="span" sx={{ color: "rgba(255,255,255,0.22)", mx: 0.6 }}>·</Typography>
                      <Typography component="span" sx={{ color: "rgba(205,127,50,0.9)", fontWeight: 900 }}>{Number((draft as any).pc ?? 0)} PC</Typography>
                    </Typography>
                  </Box>
                  <AddRoundedIcon sx={{ fontSize: 16, color: "rgba(255,195,60,0.32)", flexShrink: 0 }} />
                </Box>

                {/* ── CARGA ──────────────────────────────────────── */}
                {invWeight && (() => {
                  const pct = invWeight.capacity > 0 ? invWeight.total / invWeight.capacity : 0;
                  const clr = pct > 1
                    ? { fill: "linear-gradient(90deg,#aa2020,#e03535)", glow: "rgba(220,50,50,0.35)", border: "rgba(220,50,50,0.22)", track: "rgba(220,50,50,0.07)", label: "Sobrecarregado", text: "rgba(255,130,130,0.9)" }
                    : pct > 0.75
                    ? { fill: "linear-gradient(90deg,#c05800,#e87820)", glow: "rgba(230,120,30,0.35)", border: "rgba(230,120,30,0.22)", track: "rgba(230,120,30,0.07)", label: "Pesado",          text: "rgba(255,185,110,0.9)" }
                    : pct > 0.5
                    ? { fill: "linear-gradient(90deg,#c88000,#f0aa20)", glow: "rgba(240,170,30,0.35)", border: "rgba(240,170,30,0.2)",  track: "rgba(240,170,30,0.07)", label: "Moderado",        text: "rgba(255,215,100,0.95)" }
                    : { fill: "linear-gradient(90deg,#1fa863,#2ecc8a)", glow: "rgba(46,204,130,0.35)", border: "rgba(46,204,130,0.2)",  track: "rgba(46,204,130,0.07)", label: "Tranquilo",       text: "rgba(100,240,170,0.95)" };
                  return (
                    <Box>
                      <SectionLabel icon="🎒" label="Carga" />
                      <Box sx={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: `1px solid ${clr.border}`, bgcolor: clr.track }}>
                        <Box sx={{ height: 40, width: `${Math.min(pct, 1) * 100}%`, background: clr.fill, transition: "width .5s cubic-bezier(.4,0,.2,1)", boxShadow: `4px 0 16px ${clr.glow}` }} />
                        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.75, pointerEvents: "none" }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.9)" }}>
                            {invWeight.total} kg
                            <Typography component="span" sx={{ fontSize: 11.5, fontWeight: 600, opacity: 0.5, ml: 0.5 }}>
                              / {invWeight.capacity} kg
                            </Typography>
                          </Typography>
                          <Box sx={{ px: 1.1, py: 0.3, borderRadius: "8px", bgcolor: "rgba(0,0,0,0.28)", border: `1px solid ${clr.border}` }}>
                            <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: clr.text, letterSpacing: "0.04em" }}>
                              {clr.label} · {Math.min(Math.round(pct * 100), 999)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}

                {/* ── ATTRIBUTES ─────────────────────────────────── */}
                {(() => {
                  const nivel = Number((draft as any).nivel ?? 1);
                  const className = (draft as any)?.dndClass?.name ?? "";
                  const freeAttrEdit = !!(draft as any).freeAttrEdit;
                  const showFreeEdit = isMaster || freeAttrEdit;
                  const asiEarned = getAsiOpportunities(nivel, className) * 2;
                  const asiUsed = Number((draft as any).asiPointsUsed ?? 0);
                  const asiAvailable = asiEarned - asiUsed;

                  return (
                    <Box>
                      {/* Section header */}
                      <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
                        <SectionIconBox>⚡</SectionIconBox>
                        <SectionLabelText>Atributos</SectionLabelText>
                        <SectionDivider />
                        {/* Master toggle */}
                        {isMaster && (
                          <Box
                            onClick={handleFreeAttrToggle}
                            sx={{
                              ml: 1, flexShrink: 0, px: 1.1, py: 0.35, borderRadius: "8px", cursor: "pointer",
                              border: `1px solid ${freeAttrEdit ? "rgba(220,60,60,0.35)" : "rgba(120,85,255,0.28)"}`,
                              bgcolor: freeAttrEdit ? "rgba(220,60,60,0.08)" : "rgba(120,85,255,0.08)",
                              transition: "all .15s",
                              "&:hover": { opacity: 0.8 },
                            }}
                          >
                            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", color: freeAttrEdit ? "rgba(255,130,130,0.9)" : "rgba(160,130,255,0.9)" }}>
                              {freeAttrEdit ? "🔓 Livre" : "🔒 ASI"}
                            </Typography>
                          </Box>
                        )}
                      </Stack>

                      {/* ASI banner (player view, not free edit) */}
                      {!showFreeEdit && asiEarned > 0 && (
                        <Box sx={{
                          mb: 1.5, px: 1.75, py: 1.1, borderRadius: "14px",
                          bgcolor: asiAvailable > 0 ? "rgba(120,85,255,0.08)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${asiAvailable > 0 ? "rgba(120,85,255,0.28)" : "rgba(255,255,255,0.07)"}`,
                          display: "flex", alignItems: "center", gap: 1.5,
                        }}>
                          <Box sx={{
                            width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
                            bgcolor: asiAvailable > 0 ? "rgba(120,85,255,0.18)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${asiAvailable > 0 ? "rgba(120,85,255,0.35)" : "rgba(255,255,255,0.08)"}`,
                            display: "grid", placeItems: "center",
                          }}>
                            <Typography sx={{ fontSize: 17, lineHeight: 1 }}>⬆️</Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: asiAvailable > 0 ? "rgba(160,130,255,0.7)" : "rgba(255,255,255,0.25)", lineHeight: 1, mb: 0.3 }}>
                              Ability Score Improvement
                            </Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 900, color: asiAvailable > 0 ? "rgba(200,175,255,0.95)" : "rgba(255,255,255,0.35)", lineHeight: 1 }}>
                              {asiAvailable > 0
                                ? `${asiAvailable} ponto${asiAvailable > 1 ? "s" : ""} disponíve${asiAvailable > 1 ? "is" : "l"}`
                                : "Nenhum ponto disponível"}
                            </Typography>
                          </Box>
                          {asiAvailable > 0 && (
                            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                              <Typography sx={{ fontSize: 22, fontWeight: 900, color: "rgba(175,150,255,0.95)", lineHeight: 1 }}>{asiAvailable}</Typography>
                              <Typography sx={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>/ {asiEarned}</Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      <AttrGrid>
                        {(Object.keys(attrs) as AttrKey[]).map((k) => {
                          const v   = attrs[k];
                          const mod = getModifier(v);
                          const c   = ATTR_COLOR[k];
                          const pct = ((v - ATTR_MIN) / (ATTR_MAX - ATTR_MIN)) * 100;
                          const canSpendAsi = !showFreeEdit && asiAvailable > 0 && v < 20;

                          const ctrlBtnSx = (isDisabled: boolean) => ({
                            width: 34, height: 34, borderRadius: "11px",
                            border: `1px solid ${isDisabled ? "rgba(255,255,255,0.06)" : c.border}`,
                            bgcolor: isDisabled ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.22)",
                            color: isDisabled ? "rgba(255,255,255,0.14)" : c.accent,
                            flexShrink: 0,
                            opacity: isDisabled ? 0.5 : 1,
                            transition: "transform .12s, background-color .12s",
                            "&:hover": !isDisabled ? { bgcolor: "rgba(0,0,0,0.35)", transform: "scale(1.1)" } : {},
                            "&:active": !isDisabled ? { transform: "scale(0.92)" } : {},
                          });

                          return (
                            <Box key={k} sx={{
                              borderRadius: "16px", border: `1px solid ${c.border}`, bgcolor: c.bg,
                              px: 1.4, pt: 1.4, pb: 1.3,
                              position: "relative", overflow: "hidden",
                              transition: "box-shadow .2s",
                              "&:hover": { boxShadow: `0 6px 22px ${c.glow}` },
                            }}>
                              {/* glow blob */}
                              <Box sx={{ position: "absolute", top: -14, right: -14, width: 64, height: 64, borderRadius: "50%", bgcolor: c.glow, filter: "blur(20px)", pointerEvents: "none" }} />

                              {/* icon + label + value */}
                              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
                                <Box>
                                  <Typography sx={{ fontSize: 18, lineHeight: 1, mb: 0.5 }}>{ATTR_ICON[k]}</Typography>
                                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "rgba(255,255,255,0.82)", lineHeight: 1.2 }}>{ATTR_LABEL[k]}</Typography>
                                  <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", mt: 0.2 }}>
                                    mod <Typography component="span" sx={{ fontWeight: 800, color: c.accent, fontSize: 10.5 }}>{fmtMod(mod)}</Typography>
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: "right" }}>
                                  <Typography sx={{ fontSize: 30, fontWeight: 900, color: c.accent, lineHeight: 1 }}>{v}</Typography>
                                  <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: c.accent, opacity: 0.6 }}>{ATTR_BADGE[k]}</Typography>
                                </Box>
                              </Stack>

                              {/* progress */}
                              <AttrProgressTrack>
                                <Box sx={{ height: "100%", width: `${pct}%`, background: c.accent, borderRadius: 99, opacity: 0.75, transition: "width .2s ease" }} />
                              </AttrProgressTrack>

                              {/* controls */}
                              {showFreeEdit ? (
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                                  <LongPressButton onAction={() => changeAttribute(k, -1)} disabled={saving || v <= ATTR_MIN} sx={ctrlBtnSx(saving || v <= ATTR_MIN)}>
                                    <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                                  </LongPressButton>
                                  <AttrRangeLabel>{ATTR_MIN} – {ATTR_MAX}</AttrRangeLabel>
                                  <LongPressButton onAction={() => changeAttribute(k, 1)} disabled={saving || v >= ATTR_MAX} sx={ctrlBtnSx(saving || v >= ATTR_MAX)}>
                                    <AddRoundedIcon sx={{ fontSize: 16 }} />
                                  </LongPressButton>
                                </Stack>
                              ) : canSpendAsi ? (
                                <Box
                                  onClick={() => !saving && spendAsiPoint(k)}
                                  sx={{
                                    mt: 1, width: "100%", py: 0.6, borderRadius: "10px", cursor: saving ? "default" : "pointer",
                                    border: "1px solid rgba(120,85,255,0.35)",
                                    bgcolor: "rgba(120,85,255,0.1)",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5,
                                    transition: "all .12s",
                                    "&:hover": { bgcolor: "rgba(120,85,255,0.2)", borderColor: "rgba(120,85,255,0.5)" },
                                    "&:active": { transform: "scale(0.97)" },
                                  }}
                                >
                                  <AddRoundedIcon sx={{ fontSize: 13, color: "rgba(175,150,255,0.9)" }} />
                                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: "rgba(175,150,255,0.9)", letterSpacing: "0.04em" }}>
                                    +1 ASI
                                  </Typography>
                                </Box>
                              ) : (
                                <Box sx={{ mt: 1, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.18)", fontWeight: 600 }}>
                                    {v >= 20 ? "máximo" : ""}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </AttrGrid>
                    </Box>
                  );
                })()}

                {/* ── SKILLS ─────────────────────────────────────── */}
                <Box>
                  <SectionLabel icon="✨" label="Perícias" />
                  {skills.length === 0 ? (
                    <SkillEmptyBox>
                      <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Nenhuma perícia cadastrada.</Typography>
                    </SkillEmptyBox>
                  ) : (
                    <Stack spacing={0.75}>
                      {skills.map((sk: any, i: number) => (
                        <SkillRow key={sk?.id ?? i}>
                          <SkillIconBox>{getSkillIconByAttr(sk?.attribute)}</SkillIconBox>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: "rgba(255,255,255,0.88)", lineHeight: 1.2 }}>{sk?.name}</Typography>
                            {sk?.attribute && <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>{sk.attribute}</Typography>}
                          </Box>
                        </SkillRow>
                      ))}
                    </Stack>
                  )}
                </Box>


              </Stack>
            )}
          </Box>
        </Glass>
      </Container>

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <PendingChangesFab
        visible={fabVisible}
        saving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      {/* ── HP DIALOG ───────────────────────────────────────────────────────── */}
      <AppDialog
        open={hpOpen}
        onClose={() => setHpOpen(false)}
        title={hpTitle()}
        dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button onClick={() => setHpOpen(false)} variant="text" startIcon={<CloseRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}
            >
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            {hpAction === "increaseMaxHealth" && (
              <Button onClick={() => applyHpToDraft("removeMax")} variant="outlined"
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: "12px", borderColor: "rgba(220,60,60,0.25)", color: "rgba(255,170,170,0.9)", "&:hover": { borderColor: "rgba(220,60,60,0.4)", bgcolor: "rgba(220,60,60,0.08)" } }}
              >
                Remover
              </Button>
            )}
            <AppDialogConfirmButton onClick={() => applyHpToDraft("apply")} sx={{ px: 4, py: 1.2, borderRadius: "12px" }}>
              Aplicar
            </AppDialogConfirmButton>
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{hpHelper()}</Typography>
          <TextField
            label="Quantidade" value={hpAmount}
            onChange={(e) => setHpAmount(e.target.value.replace(/\D/g, ""))}
            fullWidth type="number" inputProps={{ min: 1, step: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><FavoriteRoundedIcon /></InputAdornment> }}
            sx={inputSx}
          />
        </Stack>
      </AppDialog>
      {/* ── GOLD DIALOG ──────────────────────────────────────────────────────── */}
      <AppDialog
        open={goldOpen}
        onClose={() => { setGoldOpen(false); setError(null); }}
        title="Carteira"
        dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button onClick={() => { setGoldOpen(false); setError(null); }} variant="text" startIcon={<CloseRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}
            >
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <AppDialogConfirmButton
              onClick={goldTab === "converter" ? applyConversion : applyGoldToDraft}
              sx={{ px: 4, py: 1.2, borderRadius: "12px" }}
            >
              {goldTab === "converter" ? "Converter" : "Aplicar"}
            </AppDialogConfirmButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          {/* Saldo atual */}
          <Stack direction="row" spacing={1} justifyContent="center">
            {[
              { label: "PO", value: Number((draft as any)?.money ?? 0), color: "rgba(255,220,120,0.92)" },
              { label: "PP", value: Number((draft as any)?.pp    ?? 0), color: "rgba(200,215,235,0.85)" },
              { label: "PC", value: Number((draft as any)?.pc    ?? 0), color: "rgba(205,127,50,0.9)" },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ flex: 1, textAlign: "center", px: 1, py: 0.9, borderRadius: "12px", bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value}</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", mt: 0.2 }}>{label}</Typography>
              </Box>
            ))}
          </Stack>

          {/* Tabs: Ganhar / Gastar / Converter */}
          <Stack direction="row" spacing={0.75}>
            {([
              { tab: "ganhar"    as const, label: "Ganhar",    bc: "rgba(75,175,130,0.3)",  bg: "rgba(75,175,130,0.12)",  color: "rgba(130,230,180,0.95)" },
              { tab: "gastar"    as const, label: "Gastar",    bc: "rgba(220,60,60,0.28)",  bg: "rgba(220,60,60,0.1)",    color: "rgba(255,170,170,0.9)"  },
              { tab: "converter" as const, label: "Converter", bc: "rgba(120,85,255,0.3)",  bg: "rgba(120,85,255,0.1)",   color: "rgba(175,150,255,0.95)" },
            ]).map(({ tab, label, bc, bg, color }) => {
              const active = goldTab === tab;
              return (
                <Button key={tab} fullWidth onClick={() => {
                  setGoldTab(tab);
                  if (tab !== "converter") setGoldAction(tab === "gastar" ? "remove" : "add");
                  setError(null);
                }} variant="outlined"
                  sx={{ borderRadius: "10px", py: 0.85, textTransform: "none", fontWeight: 800, fontSize: 12.5,
                    borderColor: active ? bc : "rgba(255,255,255,0.08)", bgcolor: active ? bg : "transparent",
                    color: active ? color : "rgba(255,255,255,0.3)",
                    "&:hover": { bgcolor: bg, borderColor: bc, color } }}
                >{label}</Button>
              );
            })}
          </Stack>

          {/* GANHAR / GASTAR */}
          {goldTab !== "converter" && ([
            { label: "Ouro (PO)",   value: goldPO,  set: setGoldPO,  cur: Number((draft as any)?.money ?? 0), color: "rgba(255,220,120,0.92)", icon: "🥇" },
            { label: "Prata (PP)",  value: goldPP,  set: setGoldPP,  cur: Number((draft as any)?.pp    ?? 0), color: "rgba(200,215,235,0.85)", icon: "🥈" },
            { label: "Cobre (PC)",  value: goldPC,  set: setGoldPC,  cur: Number((draft as any)?.pc    ?? 0), color: "rgba(205,127,50,0.9)",   icon: "🪙" },
          ].map(({ label, value, set, cur, color, icon }) => {
            const delta = parseInt(value, 10) || 0;
            const after = goldTab === "ganhar" ? cur + delta : Math.max(0, cur - delta);
            return (
              <Box key={label}>
                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.6 }}>
                  <Typography sx={{ fontSize: 14, lineHeight: 1 }}>{icon}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>{label}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.22)", ml: "auto !important" }}>
                    atual: <b style={{ color }}>{cur}</b>
                  </Typography>
                </Stack>
                <TextField
                  value={value}
                  onChange={(e) => set(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  inputMode="numeric"
                  fullWidth
                  sx={inputSx}
                />
                {delta > 0 && (
                  <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", mt: 0.5, pl: 0.5 }}>
                    → <b style={{ color }}>{after}</b> {label.split(" ")[0].toLowerCase()}
                  </Typography>
                )}
              </Box>
            );
          }))}

          {/* CONVERTER */}
          {goldTab === "converter" && (
            <Stack spacing={1.75}>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                Escolha o tipo de conversão e informe a quantidade.
              </Typography>
              {/* 4 opções de conversão */}
              <Stack spacing={0.75}>
                {([
                  { mode: "po-pp" as const, from: "PO", to: "PP", rate: "1 PO → 10 PP",  label: "Fragmentar Ouro",  desc: "trocar ouro por prata" },
                  { mode: "pp-pc" as const, from: "PP", to: "PC", rate: "1 PP → 10 PC",  label: "Fragmentar Prata", desc: "trocar prata por cobre" },
                  { mode: "pp-po" as const, from: "PP", to: "PO", rate: "10 PP → 1 PO",  label: "Consolidar Prata", desc: "fundir prata em ouro" },
                  { mode: "pc-pp" as const, from: "PC", to: "PP", rate: "10 PC → 1 PP",  label: "Consolidar Cobre", desc: "fundir cobre em prata" },
                ] as { mode: "po-pp" | "pp-pc" | "pp-po" | "pc-pp"; from: string; to: string; rate: string; label: string; desc: string }[]).map(({ mode, rate, label, desc }) => {
                  const active = cvtMode === mode;
                  return (
                    <Box key={mode} onClick={() => { setCvtMode(mode); setError(null); setCvtQty(""); }}
                      sx={{
                        px: 1.5, py: 1, borderRadius: "12px", cursor: "pointer",
                        border: `1px solid ${active ? "rgba(120,85,255,0.4)" : "rgba(255,255,255,0.07)"}`,
                        bgcolor: active ? "rgba(120,85,255,0.1)" : "rgba(255,255,255,0.03)",
                        transition: "all .12s",
                        "&:hover": { bgcolor: "rgba(120,85,255,0.08)", borderColor: "rgba(120,85,255,0.3)" },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: active ? "rgba(180,155,255,0.95)" : "rgba(255,255,255,0.6)", lineHeight: 1 }}>{label}</Typography>
                          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)", mt: 0.2 }}>{desc}</Typography>
                        </Box>
                        <Box sx={{ px: 1, py: 0.35, borderRadius: "8px", bgcolor: active ? "rgba(120,85,255,0.18)" : "rgba(255,255,255,0.05)", border: `1px solid ${active ? "rgba(120,85,255,0.35)" : "rgba(255,255,255,0.08)"}` }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: active ? "rgba(175,150,255,0.9)" : "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{rate}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>

              {/* Quantidade */}
              <Box>
                <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", mb: 0.75 }}>
                  Quantidade a converter{" "}
                  <Typography component="span" sx={{ color: "rgba(175,150,255,0.7)", fontWeight: 700 }}>
                    ({cvtMode === "po-pp" ? "de PO" : cvtMode === "pp-pc" ? "de PP" : cvtMode === "pp-po" ? "de dezenas de PP" : "de dezenas de PC"})
                  </Typography>
                </Typography>
                <TextField
                  value={cvtQty}
                  onChange={(e) => { setCvtQty(e.target.value.replace(/\D/g, "")); setError(null); }}
                  placeholder="0"
                  inputMode="numeric"
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><SwapHorizRoundedIcon /></InputAdornment> }}
                  sx={inputSx}
                />
                {(() => {
                  const qty = parseInt(cvtQty, 10);
                  if (!Number.isFinite(qty) || qty < 1) return null;
                  let fromStr = "", toStr = "";
                  if (cvtMode === "po-pp") { fromStr = `${qty} PO`; toStr = `${qty * 10} PP`; }
                  else if (cvtMode === "pp-pc") { fromStr = `${qty} PP`; toStr = `${qty * 10} PC`; }
                  else if (cvtMode === "pp-po") { fromStr = `${qty * 10} PP`; toStr = `${qty} PO`; }
                  else if (cvtMode === "pc-pp") { fromStr = `${qty * 10} PC`; toStr = `${qty} PP`; }
                  return (
                    <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", mt: 0.6, pl: 0.5 }}>
                      Gastar <b style={{ color: "rgba(255,200,100,0.85)" }}>{fromStr}</b>{" "}→ receber <b style={{ color: "rgba(130,230,180,0.9)" }}>{toStr}</b>
                    </Typography>
                  );
                })()}
              </Box>
            </Stack>
          )}

          {error && (
            <Typography sx={{ fontSize: 12, color: "rgba(255,100,100,0.8)", fontWeight: 600 }}>{error}</Typography>
          )}
        </Stack>
      </AppDialog>

      {/* ── XP DIALOG ────────────────────────────────────────────────────── */}
      <AppDialog
        open={xpOpen}
        onClose={() => setXpOpen(false)}
        title="Adicionar Experiência"
        dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button onClick={() => setXpOpen(false)} variant="text" startIcon={<CloseRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}
            >
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <AppDialogConfirmButton onClick={applyXpToDraft} sx={{ px: 4, py: 1.2, borderRadius: "12px" }}>
              Aplicar
            </AppDialogConfirmButton>
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Informe o XP ganho na sessão. O nível sobe automaticamente.
          </Typography>
          <Box sx={{ px: 1.5, py: 1.2, borderRadius: "12px", bgcolor: "rgba(255,195,60,0.07)", border: "1px solid rgba(255,195,60,0.16)", display: "flex", alignItems: "center", gap: 1.2 }}>
            <StarRoundedIcon sx={{ fontSize: 16, color: "rgba(255,215,100,0.7)" }} />
            <Typography sx={{ fontSize: 13, color: "rgba(255,215,100,0.85)", fontWeight: 700 }}>
              XP atual:{" "}
              <Typography component="span" sx={{ fontWeight: 900, fontSize: 14 }}>
                {Number((draft as any)?.xp ?? 0).toLocaleString("pt-BR")}
              </Typography>
              {"  ·  "}Nível{" "}
              <Typography component="span" sx={{ fontWeight: 900, fontSize: 14 }}>
                {(draft as any)?.nivel ?? 1}
              </Typography>
            </Typography>
          </Box>
          <TextField
            label="XP ganho"
            value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value.replace(/\D/g, ""))}
            fullWidth
            type="number"
            inputProps={{ min: 1, step: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <StarRoundedIcon sx={{ fontSize: 18, color: "rgba(255,195,70,0.5)" }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
          {xpAmount !== "" && Number(xpAmount) > 0 && (() => {
            const newXp    = Number((draft as any)?.xp ?? 0) + Number(xpAmount);
            const newNivel = getLevelFromXp(newXp);
            const oldNivel = (draft as any)?.nivel ?? 1;
            return (
              <Box sx={{ px: 1.5, py: 1, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  Novo total:{" "}
                  <Typography component="span" sx={{ fontWeight: 900, fontSize: 13, color: "rgba(255,220,130,0.9)" }}>
                    {newXp.toLocaleString("pt-BR")} XP
                  </Typography>
                  {newNivel > oldNivel && (
                    <Typography component="span" sx={{ ml: 1, fontWeight: 900, fontSize: 13, color: "rgba(120,220,140,0.9)" }}>
                      🎉 Nível {newNivel}!
                    </Typography>
                  )}
                </Typography>
              </Box>
            );
          })()}
        </Stack>
      </AppDialog>

      {/* ── LEVEL-UP HP DIALOG ───────────────────────────────────────────── */}
      {(() => {
        const dieSize = HIT_DICE_BY_CLASS[(draft as any)?.dndClass?.name ?? ""] ?? 8;
        const conMod  = draft ? getModifier(getAttrsFrom(draft).constituicao) : 0;
        const roll    = parseInt(hpLevelUpRoll, 10);
        const preview = !Number.isNaN(roll) && roll >= 1 && roll <= dieSize;
        const nivel   = (draft as any)?.nivel ?? 1;
        return (
          <AppDialog
            open={hpLevelUpOpen}
            onClose={() => setHpLevelUpOpen(false)}
            title="Subiu de Nível! 🎉"
            dividers
            actions={
              <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                <Button
                  onClick={() => setHpLevelUpOpen(false)}
                  variant="text"
                  startIcon={<CloseRoundedIcon />}
                  sx={{ textTransform: "none", fontWeight: 800, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}
                >
                  Pular
                </Button>
                <Box sx={{ flex: 1 }} />
                <AppDialogConfirmButton onClick={applyHpLevelUp} sx={{ px: 4, py: 1.2, borderRadius: "12px" }}>
                  Aplicar
                </AppDialogConfirmButton>
              </Stack>
            }
          >
            <Stack spacing={2}>
              {/* Level banner */}
              <Box sx={{ px: 1.5, py: 1.25, borderRadius: "12px", bgcolor: "rgba(255,195,60,0.08)", border: "1px solid rgba(255,195,60,0.2)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#b87000,#f0c020)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 900, color: "#1c1100", lineHeight: 1 }}>{nivel}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,210,80,0.6)", lineHeight: 1, mb: 0.3 }}>
                    Nível {nivel} alcançado!
                  </Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "rgba(255,215,100,0.9)", lineHeight: 1.2 }}>
                    Role seu dado de vida para aumentar o HP máximo
                  </Typography>
                </Box>
              </Box>

              {/* ASI banner */}
              {asiGainedOnLevelUp > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.1, borderRadius: "12px", bgcolor: "rgba(120,85,255,0.1)", border: "1px solid rgba(120,85,255,0.3)" }}>
                  <Typography sx={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>⬆️</Typography>
                  <Box>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(160,130,255,0.7)", lineHeight: 1, mb: 0.3 }}>
                      Ability Score Improvement
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 900, color: "rgba(200,175,255,0.95)", lineHeight: 1.3 }}>
                      +{asiGainedOnLevelUp} ponto{asiGainedOnLevelUp > 1 ? "s" : ""} de atributo desbloqueado{asiGainedOnLevelUp > 1 ? "s" : ""}!
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "rgba(175,150,255,0.6)", mt: 0.3 }}>
                      Distribua na seção de Atributos da ficha.
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Die info */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.25, borderRadius: "12px", bgcolor: "rgba(75,175,130,0.07)", border: "1px solid rgba(75,175,130,0.18)" }}>
                <Typography sx={{ fontSize: 26, lineHeight: 1 }}>🎲</Typography>
                <Box>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(100,220,160,0.6)", lineHeight: 1, mb: 0.25 }}>
                    Dado de Vida — {(draft as any)?.dndClass?.name ?? "Classe"}
                  </Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 900, color: "rgba(130,240,180,0.95)", lineHeight: 1.2 }}>
                    1d{dieSize}
                  </Typography>
                  {conMod !== 0 && (
                    <Typography sx={{ fontSize: 12, color: "rgba(120,185,255,0.8)", mt: 0.25 }}>
                      + Mod. CON {conMod > 0 ? `+${conMod}` : conMod} (mín. 1 HP)
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Input */}
              <TextField
                label={`Resultado do dado (1–${dieSize})`}
                value={hpLevelUpRoll}
                onChange={(e) => { setHpLevelUpRoll(e.target.value.replace(/\D/g, "")); setError(null); }}
                inputMode="numeric"
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><FavoriteRoundedIcon sx={{ fontSize: 18, color: "rgba(75,200,130,0.45)" }} /></InputAdornment> }}
                sx={inputSx}
              />

              {/* Preview */}
              {preview && (
                <Box sx={{ px: 1.5, py: 1, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Ganho de HP</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 900, color: "rgba(100,240,170,0.95)" }}>
                    +{Math.max(1, roll + conMod)} HP
                    {conMod !== 0 && (
                      <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, opacity: 0.65, ml: 0.5 }}>
                        ({roll} {conMod > 0 ? `+${conMod}` : conMod})
                      </Typography>
                    )}
                  </Typography>
                </Box>
              )}

              {error && (
                <Typography sx={{ fontSize: 12, color: "rgba(255,100,100,0.8)", fontWeight: 600 }}>{error}</Typography>
              )}
            </Stack>
          </AppDialog>
        );
      })()}

      {/* ── Spell Quick Panel ───────────────────────────────────────────────── */}
      {id && ((draft as any)?.dndClass?.classSpells?.length ?? 0) > 0 && (
        <SpellQuickPanel characterId={id} />
      )}

      <InitiativeWidget />

    </Page>
  );
}