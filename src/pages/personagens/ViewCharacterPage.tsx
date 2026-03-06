import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  Stack,
  TextField,

  Typography,
} from "@mui/material";

import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

import confetti from "canvas-confetti";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import {
  Glass, Noise, OrbSide, OrbTop, Page,
  BackButton, LoadingBar, PageLabel, PageTitle,
  SectionDivider, SectionIconBox, SectionLabelText,
  HpBarOverlay, HpValueSub, HpValueText,
  GoldAmount, GoldIconBox, GoldLabel, GoldPill,
  AttrGrid, AttrHint, AttrProgressTrack, AttrRangeLabel,
  SkillEmptyBox, SkillIconBox, SkillRow,
} from "./ViewCharacter.styles";

import AppDialog, { AppDialogConfirmButton } from "../../components/ui/AppDialog";
import PendingChangesFab from "../../components/ui/PendingChangesFab";
import {
  getCharacter,
  saveCharacter,
  type Character,
} from "../../modules/characters/characters.api";
import { getInventory } from "../../modules/inventory/inventory.api";
import SpellQuickPanel from "./SpellQuickPanel";
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
  const colors = ["#f0c020", "#7B54FF", "#5B8FFF", "#ff6b9d", "#ffffff", "#4ecdc4"];
  const base = { spread: 70, ticks: 120, gravity: 0.9, colors };

  // left burst
  confetti({ ...base, particleCount: 70, angle: 60, origin: { x: 0, y: 0.65 } });
  // right burst
  confetti({ ...base, particleCount: 70, angle: 120, origin: { x: 1, y: 0.65 } });
  // center shower after short delay
  setTimeout(() => {
    confetti({ ...base, particleCount: 100, angle: 90, spread: 100, origin: { x: 0.5, y: 0.4 } });
  }, 180);
  // final small burst
  setTimeout(() => {
    confetti({ ...base, particleCount: 50, angle: 90, spread: 60, origin: { x: 0.5, y: 0.3 } });
  }, 420);
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
    money: Number(c.money ?? 0), health: Number(c.health ?? 0), maxHealth: Number(c.maxHealth ?? 0),
    xp: Number(c.xp ?? 0),
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

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [original, setOriginal] = useState<Character | null>(null);
  const [draft,    setDraft]    = useState<Character | null>(null);

  const [invWeight,  setInvWeight]  = useState<{ total: number; capacity: number } | null>(null);

  const [hpOpen,     setHpOpen]     = useState(false);
  const [hpAction,   setHpAction]   = useState<HpAction>("damage");
  const [hpAmount,   setHpAmount]   = useState("");

  const [goldOpen,   setGoldOpen]   = useState(false);
  const [goldAction, setGoldAction] = useState<"add" | "remove">("add");
  const [goldAmount, setGoldAmount] = useState("");

  const [xpOpen,   setXpOpen]   = useState(false);
  const [xpAmount, setXpAmount] = useState("");

  const [fabVisible, setFabVisible] = useState(false);

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

  async function handleSave() {
    if (!draft) return;
    setError(null); setSaving(true);
    try {
      await saveCharacter(draft);
      const fresh = await getCharacter(draft.id);
      setOriginal(fresh); setDraft(fresh);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() { setError(null); setDraft(original); }

  function openGold(action: "add" | "remove") {
    setError(null); setGoldAction(action); setGoldAmount(""); setGoldOpen(true);
  }

  function applyGoldToDraft() {
    if (!draft) return;
    setError(null);
    const v = parseInt(goldAmount, 10);
    if (!Number.isFinite(v) || v <= 0) { setError("Informe um número válido maior que 0."); return; }
    const current = Number(draft.money ?? 0);
    const newMoney = goldAction === "add"
      ? current + v
      : Math.max(0, current - v);
    setDraft({ ...draft, money: newMoney });
    setGoldOpen(false); setGoldAmount("");
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
      // pequeno delay para o dialog fechar antes de soltar os confetes
      setTimeout(fireLevelUpConfetti, 120);
    }
  }

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

      <Container maxWidth="sm" sx={{ pt: 2.5, px: 2, pb: 12 }}>

        {/* HEADER */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3.5 }}>
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
          <BackButton
            onClick={() => navigate(ROUTES.personagens)}
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "15px !important" }} />}
          >
            Voltar
          </BackButton>
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
                      <Box sx={{ px: 1.2, py: 0.4, borderRadius: "8px", bgcolor: "rgba(0,0,0,0.28)", border: `1px solid ${hpUi.border}` }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: hpUi.textColor, letterSpacing: "0.04em" }}>
                          {hpUi.label} · {Math.round(hpPct * 100)}%
                        </Typography>
                      </Box>
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

                {/* ── GOLD ───────────────────────────────────────── */}
                <GoldPill
                  onClick={() => openGold("add")}
                  sx={{ cursor: "pointer", transition: "all .15s", "&:hover": { bgcolor: "rgba(255,195,70,0.11)", border: "1px solid rgba(255,195,70,0.26)" } }}
                >
                  <GoldIconBox>
                    <MonetizationOnRoundedIcon sx={{ fontSize: 18, color: "rgba(255,215,100,0.9)" }} />
                  </GoldIconBox>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <GoldLabel>Ouro</GoldLabel>
                    <GoldAmount>
                      {draft.money}
                      <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, opacity: 0.55, ml: 0.5 }}>moedas</Typography>
                    </GoldAmount>
                  </Box>
                </GoldPill>

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
                <Box>
                  <SectionLabel icon="⚡" label="Atributos" />

                  <AttrGrid>
                    {(Object.keys(attrs) as AttrKey[]).map((k) => {
                      const v   = attrs[k];
                      const mod = getModifier(v);
                      const c   = ATTR_COLOR[k];
                      const pct = ((v - ATTR_MIN) / (ATTR_MAX - ATTR_MIN)) * 100;

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
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <LongPressButton onAction={() => changeAttribute(k, -1)} disabled={saving || v <= ATTR_MIN} sx={ctrlBtnSx(saving || v <= ATTR_MIN)}>
                              <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                            </LongPressButton>

                            <AttrRangeLabel>{ATTR_MIN} – {ATTR_MAX}</AttrRangeLabel>

                            <LongPressButton onAction={() => changeAttribute(k, 1)} disabled={saving || v >= ATTR_MAX} sx={ctrlBtnSx(saving || v >= ATTR_MAX)}>
                              <AddRoundedIcon sx={{ fontSize: 16 }} />
                            </LongPressButton>
                          </Stack>
                        </Box>
                      );
                    })}
                  </AttrGrid>
                </Box>

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
        onClose={() => setGoldOpen(false)}
        title="Editar Ouro"
        dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button onClick={() => setGoldOpen(false)} variant="text" startIcon={<CloseRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}
            >
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <AppDialogConfirmButton onClick={applyGoldToDraft} sx={{ px: 4, py: 1.2, borderRadius: "12px" }}>
              Aplicar
            </AppDialogConfirmButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          {/* current balance */}
          <Box sx={{ px: 1.5, py: 1.2, borderRadius: "12px", bgcolor: "rgba(255,195,70,0.07)", border: "1px solid rgba(255,195,70,0.16)", display: "flex", alignItems: "center", gap: 1.2 }}>
            <MonetizationOnRoundedIcon sx={{ fontSize: 16, color: "rgba(255,215,100,0.7)" }} />
            <Typography sx={{ fontSize: 13, color: "rgba(255,215,100,0.85)", fontWeight: 700 }}>
              Saldo atual:{" "}
              <Typography component="span" sx={{ fontWeight: 900, fontSize: 14 }}>
                {draft?.money ?? 0} moedas
              </Typography>
            </Typography>
          </Box>

          {/* add / remove toggle */}
          <Stack direction="row" spacing={1}>
            {([
              { value: "add"    as const, label: "Adicionar", bc: "rgba(75,175,130,0.28)",  bg: "rgba(75,175,130,0.08)",  color: "rgba(130,230,180,0.95)", hbc: "rgba(75,175,130,0.45)",  hbg: "rgba(75,175,130,0.14)" },
              { value: "remove" as const, label: "Remover",   bc: "rgba(220,60,60,0.25)",   bg: "rgba(220,60,60,0.07)",   color: "rgba(255,170,170,0.9)",  hbc: "rgba(220,60,60,0.38)",   hbg: "rgba(220,60,60,0.12)"  },
            ]).map(({ value, label, bc, bg, color, hbc, hbg }) => (
              <Button
                key={value}
                fullWidth
                onClick={() => setGoldAction(value)}
                variant="outlined"
                sx={{
                  borderRadius: "12px", py: 1, textTransform: "none", fontWeight: 800, fontSize: 13,
                  borderColor: goldAction === value ? hbc : bc,
                  bgcolor: goldAction === value ? hbg : "transparent",
                  color,
                  boxShadow: goldAction === value ? `0 0 0 1px ${hbc} inset` : "none",
                  "&:hover": { bgcolor: hbg, borderColor: hbc },
                }}
              >
                {label}
              </Button>
            ))}
          </Stack>

          <TextField
            label="Quantidade"
            value={goldAmount}
            onChange={(e) => setGoldAmount(e.target.value.replace(/\D/g, ""))}
            fullWidth
            type="number"
            inputProps={{ min: 1, step: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MonetizationOnRoundedIcon sx={{ fontSize: 18, color: "rgba(255,195,70,0.5)" }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />

          {/* preview */}
          {goldAmount !== "" && Number(goldAmount) > 0 && (
            <Box sx={{ px: 1.5, py: 1, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                Resultado:{" "}
                <Typography component="span" sx={{ fontWeight: 900, fontSize: 13, color: "rgba(255,220,130,0.9)" }}>
                  {goldAction === "add"
                    ? (Number(draft?.money ?? 0) + Number(goldAmount))
                    : Math.max(0, Number(draft?.money ?? 0) - Number(goldAmount))
                  } moedas
                </Typography>
              </Typography>
            </Box>
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

      {/* ── Spell Quick Panel ───────────────────────────────────────────────── */}
      {id && ((draft as any)?.dndClass?.classSpells?.length ?? 0) > 0 && (
        <SpellQuickPanel characterId={id} />
      )}

    </Page>
  );
}