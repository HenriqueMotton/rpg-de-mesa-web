import { useEffect, useState, useCallback, useRef } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  Slide,
  Stack,
  TextField,
  Tooltip,
  Typography,
  MenuItem,
  Select,
} from "@mui/material";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import AppDialog, { AppDialogConfirmButton } from "../../components/ui/AppDialog";
import { getSpells, updateSpell, type CharacterSpell } from "../../modules/spells/spells.api";
import { getCharacter, updateSpellSlots } from "../../modules/characters/characters.api";

// ─── Spell Slot Tables ────────────────────────────────────────────────────────

// Index = characterLevel - 1; values = max slots for slot levels [1..9]
const FULL_CASTER_TABLE: number[][] = [
  [2,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],
  [4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],
  [4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],
  [4,3,3,3,2,1,1,0,0],
  [4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],
  [4,3,3,3,3,1,1,1,1],
  [4,3,3,3,3,2,1,1,1],
  [4,3,3,3,3,2,2,1,1],
];

const HALF_CASTER_TABLE: number[][] = [
  [0,0,0,0,0,0,0,0,0],
  [2,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],
  [4,3,3,0,0,0,0,0,0],
  [4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],
];

// Bruxo: pact magic — poucos slots, todos no mesmo nível
const WARLOCK_TABLE: { count: number; slotLevel: number }[] = [
  {count:1,slotLevel:1},{count:2,slotLevel:1},{count:2,slotLevel:2},{count:2,slotLevel:2},
  {count:2,slotLevel:3},{count:2,slotLevel:3},{count:2,slotLevel:4},{count:2,slotLevel:4},
  {count:2,slotLevel:5},{count:2,slotLevel:5},{count:3,slotLevel:5},{count:3,slotLevel:5},
  {count:3,slotLevel:5},{count:3,slotLevel:5},{count:3,slotLevel:5},{count:3,slotLevel:5},
  {count:4,slotLevel:5},{count:4,slotLevel:5},{count:4,slotLevel:5},{count:4,slotLevel:5},
];

const FULL_CASTERS = ["Mago", "Feiticeiro", "Bardo", "Druida", "Clérico"];
const HALF_CASTERS = ["Paladino", "Patrulheiro"];

function getMaxSlots(className: string, level: number): number[] {
  const idx = Math.min(Math.max(level, 1), 20) - 1;
  if (FULL_CASTERS.includes(className)) return FULL_CASTER_TABLE[idx];
  if (HALF_CASTERS.includes(className)) return HALF_CASTER_TABLE[idx];
  if (className === "Bruxo") {
    const d = WARLOCK_TABLE[idx];
    const arr = [0,0,0,0,0,0,0,0,0];
    arr[d.slotLevel - 1] = d.count;
    return arr;
  }
  return [0,0,0,0,0,0,0,0,0];
}

// ─── Casting-time category ────────────────────────────────────────────────────

type CastCategory = "ação" | "bônus" | "reação" | "outro";

function castCategory(t: string | null): CastCategory {
  if (!t) return "outro";
  const s = t.toLowerCase();
  if (s.includes("bônus") || s.includes("bonus")) return "bônus";
  if (s.includes("reação") || s.includes("reacao")) return "reação";
  if (s.includes("ação") || s.includes("acao")) return "ação";
  return "outro";
}

const CAST_GROUPS: { key: CastCategory; label: string; icon: string }[] = [
  { key: "ação",   label: "Ação",       icon: "⚔️" },
  { key: "bônus",  label: "Ação Bônus", icon: "⚡" },
  { key: "reação", label: "Reação",     icon: "🛡️" },
  { key: "outro",  label: "Outras",     icon: "⏱️" },
];

// ─── School icon ─────────────────────────────────────────────────────────────

const SCHOOL_ICONS: Record<string, string> = {
  "Abjuração":    "🛡️",
  "Adivinhação":  "🔮",
  "Conjuração":   "✨",
  "Encantamento": "💫",
  "Evocação":     "🔥",
  "Ilusão":       "🌀",
  "Necromancia":  "💀",
  "Transmutação": "⚗️",
};
function schoolIcon(school: string | null) {
  return school ? (SCHOOL_ICONS[school] ?? "✨") : "✨";
}

// ─── Duration helpers ─────────────────────────────────────────────────────────

/** Parse a D&D duration string to seconds. Returns null for indefinite/instant. */
function parseDurationToSeconds(duration: string | null): number | null {
  if (!duration) return null;
  const s = duration.toLowerCase();
  if (s.includes("instantâneo") || s.includes("instantaneo")) return null;
  if (s.includes("até dissipada") || s.includes("ate dissipada") || s.includes("especial") || s.includes("permanente")) return null;
  const num = parseFloat(s.replace(",", ".").match(/[\d.,]+/)?.[0] ?? "0");
  if (!num) return null;
  if (s.includes("dia")) return num * 86400;
  if (s.includes("hora")) return num * 3600;
  if (s.includes("minuto") || s.includes("min")) return num * 60;
  if (s.includes("turno") || s.includes("round")) return num * 6;
  return null;
}

type DurationUnit = "s" | "m" | "h";

const PRESETS: { label: string; seconds: number | null }[] = [
  { label: "1 Turno",   seconds: 6 },
  { label: "1 Min",     seconds: 60 },
  { label: "10 Min",    seconds: 600 },
  { label: "1 Hora",    seconds: 3600 },
  { label: "8 Horas",   seconds: 28800 },
  { label: "Sem prazo", seconds: null },
];

function remainingSeconds(activeUntil: string | null): number {
  if (!activeUntil) return -1;
  return Math.max(0, Math.floor((new Date(activeUntil).getTime() - Date.now()) / 1000));
}

function formatCountdown(secs: number): string {
  if (secs < 0)   return "∞";
  if (secs === 0) return "0s";
  if (secs < 60)  return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return `${m}:${String(s).padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

// ─── SpellCard ────────────────────────────────────────────────────────────────

interface CardProps {
  spell: CharacterSpell;
  onActivate: (spell: CharacterSpell) => void;
  onDeactivate: (spell: CharacterSpell) => void;
  loading: boolean;
}

function SpellCard({ spell, onActivate, onDeactivate, loading }: CardProps) {
  const [secsLeft, setSecsLeft] = useState(() => remainingSeconds(spell.activeUntil));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecsLeft(remainingSeconds(spell.activeUntil));
  }, [spell.activeUntil, spell.isActive]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!spell.isActive || !spell.activeUntil) return;
    intervalRef.current = setInterval(() => {
      const s = remainingSeconds(spell.activeUntil);
      setSecsLeft(s);
      if (s === 0) { onDeactivate(spell); clearInterval(intervalRef.current!); }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [spell.isActive, spell.activeUntil]); // eslint-disable-line

  const active          = spell.isActive;
  const hasTimer        = active && spell.activeUntil !== null;
  // Spells with no timer (null activeUntil) don't show the red active styling unless racial
  const isRacialSpent   = spell.isRacial && spell.level > 0 && active;
  const showActive      = (active && spell.activeUntil !== null);
  const countdownStr    = hasTimer ? formatCountdown(secsLeft) : null;

  function levelAccent() {
    const l = spell.level;
    if (l === 0) return { border: "rgba(80,160,120,0.3)",  glow: "rgba(80,160,120,0.15)",  text: "rgba(100,220,160,0.9)" };
    if (l <= 2)  return { border: "rgba(80,120,200,0.3)",  glow: "rgba(80,120,200,0.15)",  text: "rgba(120,170,255,0.9)" };
    if (l <= 4)  return { border: "rgba(120,80,220,0.3)",  glow: "rgba(120,80,220,0.15)",  text: "rgba(170,130,255,0.9)" };
    if (l <= 6)  return { border: "rgba(180,80,180,0.3)",  glow: "rgba(180,80,180,0.15)",  text: "rgba(230,140,230,0.9)" };
    return         { border: "rgba(200,60,60,0.3)",   glow: "rgba(200,60,60,0.15)",   text: "rgba(255,130,130,0.9)" };
  }
  const accent = levelAccent();

  return (
    <Box
      onClick={() => {
        if (loading || isRacialSpent) return;
        active ? onDeactivate(spell) : onActivate(spell);
      }}
      sx={{
        position: "relative",
        width: { xs: "calc(25% - 6px)", sm: "calc(20% - 6px)" },
        aspectRatio: "1",
        borderRadius: "14px",
        cursor: (loading || isRacialSpent) ? "default" : "pointer",
        border: showActive ? "1px solid rgba(220,70,70,0.35)" : isRacialSpent ? "1px solid rgba(200,140,40,0.3)" : `1px solid ${accent.border}`,
        bgcolor: showActive ? "rgba(180,50,50,0.1)" : isRacialSpent ? "rgba(180,120,30,0.08)" : accent.glow,
        overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 0.4, p: 1, transition: "all .18s",
        boxShadow: showActive ? "0 0 12px rgba(220,70,70,0.15) inset" : isRacialSpent ? "0 0 10px rgba(180,120,30,0.1) inset" : "none",
        opacity: isRacialSpent ? 0.6 : 1,
        "&:hover": { transform: (loading || isRacialSpent) ? "none" : "scale(1.03)", borderColor: showActive ? "rgba(220,70,70,0.55)" : isRacialSpent ? "rgba(200,140,40,0.3)" : "rgba(160,130,255,0.5)" },
        "&:active": { transform: "scale(0.97)" },
      }}
    >
      <Typography sx={{ fontSize: 16, lineHeight: 1, opacity: showActive ? 0.45 : 1 }}>
        {schoolIcon(spell.school)}
      </Typography>
      <Typography sx={{
        fontSize: 9.5, fontWeight: 700,
        color: showActive ? "rgba(255,180,180,0.55)" : "rgba(255,255,255,0.88)",
        textAlign: "center", lineHeight: 1.25,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden", wordBreak: "break-word",
        textDecoration: showActive ? "line-through" : "none", px: 0.25,
      }}>
        {spell.name}
      </Typography>
      <Box sx={{
        px: 0.6, py: 0.15, borderRadius: "5px",
        bgcolor: showActive ? "rgba(220,70,70,0.15)" : "rgba(120,85,255,0.18)",
        border: `1px solid ${showActive ? "rgba(220,70,70,0.2)" : accent.border}`,
      }}>
        <Typography sx={{ fontSize: 9, fontWeight: 900, color: showActive ? "rgba(255,150,150,0.6)" : accent.text, lineHeight: 1 }}>
          {spell.level === 0 ? "Truque" : `${spell.level}°`}
        </Typography>
      </Box>

      {showActive && (
        <Box sx={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "14px",
          background: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(220,60,60,0.04) 5px, rgba(220,60,60,0.04) 10px)",
          pointerEvents: "none",
        }}>
          {loading ? (
            <CircularProgress size={18} thickness={3} sx={{ color: "rgba(255,160,160,0.7)" }} />
          ) : (
            <Box sx={{ px: 1.2, py: 0.4, borderRadius: "8px", bgcolor: "rgba(0,0,0,0.55)", border: "1px solid rgba(220,70,70,0.3)", backdropFilter: "blur(4px)" }}>
              <Typography sx={{ fontSize: countdownStr === "∞" ? 16 : 11, fontWeight: 900, color: "rgba(255,160,160,0.95)", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                {countdownStr}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {isRacialSpent && (
        <Box sx={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "14px", pointerEvents: "none",
        }}>
          <Box sx={{ px: 1.1, py: 0.35, borderRadius: "7px", bgcolor: "rgba(0,0,0,0.5)", border: "1px solid rgba(200,140,40,0.3)", backdropFilter: "blur(4px)" }}>
            <Typography sx={{ fontSize: 9.5, fontWeight: 900, color: "rgba(255,180,80,0.85)", lineHeight: 1, letterSpacing: "0.04em" }}>
              Usado
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── Slot display (read-only) ─────────────────────────────────────────────────

interface SlotDisplayRowProps {
  slotLevel: number;
  max: number;
  used: number;
}

function SlotDisplayRow({ slotLevel, max, used }: SlotDisplayRowProps) {
  const available = max - used;
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      {/* Level label */}
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: "rgba(190,165,255,0.7)", minWidth: 44, lineHeight: 1 }}>
        Nível {slotLevel}
      </Typography>

      {/* Pips */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        {Array.from({ length: max }).map((_, i) => {
          const isAvailable = i >= used; // spent first (left), available last (right)
          return (
            <Box key={i} sx={{
              width: 13, height: 13, borderRadius: "50%",
              border: isAvailable
                ? "1.5px solid rgba(160,130,255,0.8)"
                : "1.5px solid rgba(120,85,255,0.2)",
              bgcolor: isAvailable ? "rgba(140,105,255,0.6)" : "transparent",
              transition: "all .15s",
            }} />
          );
        })}
      </Stack>

      {/* Available count */}
      <Typography sx={{ fontSize: 10.5, color: available > 0 ? "rgba(200,180,255,0.6)" : "rgba(255,100,100,0.5)", lineHeight: 1, fontWeight: 700 }}>
        {available > 0 ? `${available} livre${available !== 1 ? "s" : ""}` : "sem slots"}
      </Typography>
    </Stack>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  characterId: string | number;
}

export default function SpellQuickPanel({ characterId }: Props) {
  const [open, setOpen]       = useState(false);
  const [spells, setSpells]   = useState<CharacterSpell[]>([]);
  const [loading, setLoading] = useState(false);

  // Character/slot data
  const [usedSlots, setUsedSlots]           = useState<Record<string, number>>({});
  const [characterLevel, setCharacterLevel] = useState(1);
  const [className, setClassName]           = useState("");
  const [slotPersisting, setSlotPersisting] = useState(false);

  // Cooldown + slot modal
  const [modalSpell, setModalSpell]         = useState<CharacterSpell | null>(null);
  const [selectedSlotLevel, setSelectedSlotLevel] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(6);
  const [customValue, setCustomValue]       = useState("1");
  const [customUnit, setCustomUnit]         = useState<DurationUnit>("m");
  const [useCustom, setUseCustom]           = useState(false);
  const [saving, setSaving]                 = useState(false);

  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [spellData, charData] = await Promise.all([
        getSpells(characterId),
        getCharacter(characterId),
      ]);
      setSpells(spellData);
      setCharacterLevel(charData.nivel ?? 1);
      setClassName(charData.dndClass?.name ?? "");
      setUsedSlots(charData.spellSlots ?? {});
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (open) load(); }, [open, load]);

  // Derived slot data
  const maxSlotsArr = getMaxSlots(className, characterLevel);
  const slotRows = maxSlotsArr
    .map((max, i) => ({ level: i + 1, max, used: Number(usedSlots[String(i + 1)] ?? 0) }))
    .filter((r) => r.max > 0);

  function openCooldownModal(spell: CharacterSpell) {
    // Racial limited spells (level > 0): 1×/rest — mark as used, no timer, no modal
    if (spell.isRacial && spell.level > 0) {
      castSpell(spell, null, null);
      return;
    }

    // Class/racial cantrips (isCustom=false, level=0) → cast directly with auto-duration, no modal
    if (!spell.isCustom && spell.level === 0) {
      const secs = parseDurationToSeconds(spell.duration);
      const activeUntil = secs !== null ? new Date(Date.now() + secs * 1000).toISOString() : null;
      castSpell(spell, null, activeUntil);
      return;
    }

    setOpen(false);
    setModalSpell(spell);
    setSelectedPreset(6);
    setCustomValue("1");
    setCustomUnit("m");
    setUseCustom(false);

    // Pre-select lowest available slot >= spell level (or spell level itself if none available)
    if (spell.level > 0) {
      const bestLevel = slotRows.find(
        (r) => r.level >= spell.level && r.used < r.max
      )?.level ?? spell.level;
      setSelectedSlotLevel(bestLevel);
    } else {
      setSelectedSlotLevel(null); // cantrip — no slot needed
    }
  }

  async function castSpell(
    spell: CharacterSpell,
    slotLevel: number | null,
    activeUntil: string | null,
  ) {
    setSaving(true);
    try {
      if (spell.level > 0 && slotLevel !== null) {
        const key = String(slotLevel);
        const currentUsed = Number(usedSlots[key] ?? 0);
        const slotMax = maxSlotsArr[slotLevel - 1] ?? 0;
        if (currentUsed < slotMax) {
          const newSlots = { ...usedSlots, [key]: currentUsed + 1 };
          setUsedSlots(newSlots);
          setSlotPersisting(true);
          await updateSpellSlots(characterId, newSlots);
          setSlotPersisting(false);
        }
      }
      const updated = await updateSpell(spell.id, { isActive: true, activeUntil });
      setSpells((prev) => prev.map((s) => (s.id === spell.id ? updated : s)));
      setModalSpell(null);
    } finally {
      setSaving(false);
    }
  }

  async function confirmActivate() {
    if (!modalSpell) return;

    let activeUntil: string | null = null;

    if (modalSpell.isCustom) {
      // Custom spells: use picker selection
      if (useCustom) {
        const val = Number(customValue);
        if (val > 0) {
          const multiplier = customUnit === "s" ? 1 : customUnit === "m" ? 60 : 3600;
          activeUntil = new Date(Date.now() + val * multiplier * 1000).toISOString();
        }
      } else if (selectedPreset !== null) {
        activeUntil = new Date(Date.now() + selectedPreset * 1000).toISOString();
      }
    } else {
      // Class spells: auto-parse duration from D&D string
      const secs = parseDurationToSeconds(modalSpell.duration);
      activeUntil = secs !== null ? new Date(Date.now() + secs * 1000).toISOString() : null;
    }

    await castSpell(modalSpell, selectedSlotLevel, activeUntil);
  }

  async function deactivate(spell: CharacterSpell) {
    setTogglingIds((prev) => new Set(prev).add(spell.id));
    try {
      const updated = await updateSpell(spell.id, { isActive: false, activeUntil: null });
      setSpells((prev) => prev.map((s) => (s.id === spell.id ? updated : s)));
    } finally {
      setTogglingIds((prev) => { const n = new Set(prev); n.delete(spell.id); return n; });
    }
  }

  async function resetCooldowns() {
    const active = spells.filter((s) => s.isActive);
    await Promise.all(active.map((s) => updateSpell(s.id, { isActive: false, activeUntil: null })));
    setSpells((prev) => prev.map((s) => ({ ...s, isActive: false, activeUntil: null })));
  }

  // Only count spells with an actual timer as "active" (no-timer spells are invisible)
  const activeCount    = spells.filter((s) => s.isActive && s.activeUntil !== null).length;
  const availableCount = spells.filter((s) => !s.isActive || s.activeUntil === null).length;
  const slotsExpended = slotRows.reduce((sum, r) => sum + r.used, 0);

  const grouped = CAST_GROUPS
    .map((g) => ({ ...g, list: spells.filter((s) => castCategory(s.castingTime) === g.key) }))
    .filter((g) => g.list.length > 0);

  const customSeconds = (() => {
    const v = Number(customValue);
    if (!v || v <= 0) return 0;
    return v * (customUnit === "s" ? 1 : customUnit === "m" ? 60 : 3600);
  })();

  // Slot options available in the modal for the current spell
  const modalSlotOptions = modalSpell && modalSpell.level > 0
    ? slotRows.filter((r) => r.level >= modalSpell.level)
    : [];
  const noSlotsAvailable = modalSlotOptions.every((r) => r.used >= r.max);

  const inputSx = {
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13 },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgba(160,130,255,0.9)" },
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.92)", fontSize: 14,
      "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
    },
  };

  const selectSx = {
    borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.92)", fontSize: 14,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
    "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.4)" },
  };

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <Box sx={{ position: "fixed", bottom: 150, right: 16, zIndex: 1200 }}>
        <Tooltip title="Magias rápidas" placement="left">
          <Badge
            badgeContent={activeCount > 0 ? activeCount : 0}
            sx={{ "& .MuiBadge-badge": { bgcolor: "rgba(220,70,70,0.92)", color: "#fff", fontSize: 10, fontWeight: 900, minWidth: 17, height: 17, border: "1.5px solid rgba(7,9,15,0.9)" } }}
          >
            <Box
              onClick={() => setOpen(true)}
              sx={{
                width: 50, height: 50, borderRadius: "15px",
                display: "grid", placeItems: "center", cursor: "pointer",
                background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)",
                boxShadow: "0 4px 20px rgba(100,70,230,0.55), 0 0 0 1px rgba(180,150,255,0.15) inset",
                transition: "transform .15s, box-shadow .15s",
                "&:hover": { transform: "scale(1.07)", boxShadow: "0 6px 28px rgba(100,70,230,0.7)" },
                "&:active": { transform: "scale(0.95)" },
              }}
            >
              <AutoStoriesRoundedIcon sx={{ fontSize: 23, color: "#fff" }} />
            </Box>
          </Badge>
        </Tooltip>
      </Box>

      {/* ── Backdrop ────────────────────────────────────────────────────────── */}
      <Fade in={open}>
        <Box onClick={() => setOpen(false)} sx={{ position: "fixed", inset: 0, zIndex: 1300, bgcolor: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)" }} />
      </Fade>

      {/* ── Panel ───────────────────────────────────────────────────────────── */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box sx={{
          position: "fixed", bottom: 0, zIndex: 1400,
          left: { xs: 0, sm: "50%", },
          right: { xs: 0, sm: "auto" },
          transform: { xs: "none", sm: "translateX(-50%)" },
          width: { xs: "100%", sm: 480 },
          maxHeight: "80vh", display: "flex", flexDirection: "column",
          borderRadius: { xs: "22px 22px 0 0", sm: "22px 22px 0 0" },
          bgcolor: "rgba(9,7,20,0.97)",
          border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.7)", backdropFilter: "blur(24px)",
          overflow: "hidden",
          "&::before": {
            content: '""', position: "absolute", top: 0, left: "50%",
            transform: "translateX(-50%)", width: "45%", height: "1.5px",
            background: "linear-gradient(90deg, transparent, rgba(120,85,255,0.7), transparent)",
          },
        }}>
          {/* Drag indicator */}
          <Box sx={{ display: "flex", justifyContent: "center", pt: 1.25, pb: 0.5 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 99, bgcolor: "rgba(255,255,255,0.12)" }} />
          </Box>

          {/* Header */}
          <Stack direction="row" alignItems="center" sx={{ px: 2.5, pt: 0.5, pb: 1.25, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <AutoStoriesRoundedIcon sx={{ fontSize: 15, color: "rgba(160,130,255,0.6)", mr: 1 }} />
            <Typography sx={{ fontWeight: 900, fontSize: 15, color: "rgba(255,255,255,0.9)", flex: 1 }}>
              Magias
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mr: 1 }}>
              <Chip label={`${availableCount} ok`} size="small" sx={{ height: 19, fontSize: 10, fontWeight: 800, bgcolor: "rgba(60,180,120,0.1)", border: "1px solid rgba(60,180,120,0.22)", color: "rgba(100,220,160,0.9)", "& .MuiChip-label": { px: 0.9 } }} />
              {activeCount > 0 && (
                <Chip label={`${activeCount} ativa${activeCount !== 1 ? "s" : ""}`} size="small" sx={{ height: 19, fontSize: 10, fontWeight: 800, bgcolor: "rgba(220,70,70,0.1)", border: "1px solid rgba(220,70,70,0.2)", color: "rgba(255,140,140,0.9)", "& .MuiChip-label": { px: 0.9 } }} />
              )}
            </Stack>

            {activeCount > 0 && (
              <Tooltip title="Limpar efeitos ativos" placement="top">
                <IconButton size="small" onClick={resetCooldowns} sx={{ color: "rgba(255,255,255,0.28)", mr: 0.25, "&:hover": { color: "rgba(255,200,100,0.8)", bgcolor: "rgba(255,180,60,0.08)" } }}>
                  <RefreshRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "rgba(255,255,255,0.28)", "&:hover": { color: "rgba(255,255,255,0.7)", bgcolor: "rgba(255,255,255,0.06)" } }}>
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          {/* Body */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                <CircularProgress size={22} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
              </Box>
            ) : (
              <Stack spacing={2.5} sx={{ pb: 2 }}>

                {/* ── Spell Slots ── */}
                {slotRows.length > 0 && (
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.25 }}>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                        Slots de Magia
                      </Typography>
                      <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255,255,255,0.06)" }} />
                      {slotsExpended > 0 && (
                        <Typography sx={{ fontSize: 9.5, color: "rgba(255,160,80,0.6)", fontWeight: 700 }}>
                          {slotsExpended} gasto{slotsExpended !== 1 ? "s" : ""}
                        </Typography>
                      )}
                    </Stack>

                    <Box sx={{ borderRadius: "12px", border: "1px solid rgba(120,85,255,0.12)", bgcolor: "rgba(120,85,255,0.04)", px: 1.75, py: 1.25 }}>
                      <Stack spacing={1}>
                        {slotRows.map((row) => (
                          <SlotDisplayRow
                            key={row.level}
                            slotLevel={row.level}
                            max={row.max}
                            used={row.used}
                          />
                        ))}
                      </Stack>

                      {/* Legend */}
                      <Stack direction="row" spacing={1.5} sx={{ mt: 1.25, pt: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "rgba(140,105,255,0.6)", border: "1px solid rgba(160,130,255,0.8)" }} />
                          <Typography sx={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)" }}>disponível</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Box sx={{ width: 9, height: 9, borderRadius: "50%", border: "1px solid rgba(120,85,255,0.2)" }} />
                          <Typography sx={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)" }}>gasto</Typography>
                        </Stack>
                        {slotPersisting && <CircularProgress size={9} thickness={3} sx={{ color: "rgba(140,90,255,0.6)", ml: "auto !important" }} />}
                      </Stack>
                    </Box>
                  </Box>
                )}

                {/* ── Spell groups ── */}
                {spells.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                      Nenhuma magia no grimório.
                    </Typography>
                  </Box>
                ) : (
                  grouped.map((group) => (
                    <Box key={group.key}>
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.25 }}>
                        <Typography sx={{ fontSize: 13 }}>{group.icon}</Typography>
                        <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                          {group.label}
                        </Typography>
                        <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255,255,255,0.06)" }} />
                      </Stack>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {group.list.map((spell) => (
                          <SpellCard
                            key={spell.id}
                            spell={spell}
                            onActivate={openCooldownModal}
                            onDeactivate={deactivate}
                            loading={togglingIds.has(spell.id)}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))
                )}
              </Stack>
            )}
          </Box>
        </Box>
      </Slide>

      {/* ── Activation modal (slot + cooldown) ───────────────────────────────── */}
      <AppDialog
        open={modalSpell !== null}
        onClose={() => setModalSpell(null)}
        title={modalSpell?.name ?? ""}
        dividers
        dialogProps={{
          sx: { "& .MuiDialog-container": { alignItems: "flex-start" } },
          PaperProps: {
            sx: {
              borderRadius: "18px",
              background: "rgba(12,15,23,0.97)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
              mx: 2, mt: 8,
            },
          },
        }}
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button
              onClick={() => setModalSpell(null)} variant="text" startIcon={<CloseRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "10px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}
            >
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <AppDialogConfirmButton
              onClick={confirmActivate}
              disabled={saving}
              sx={{ px: 3.5, py: 1.1, borderRadius: "10px" }}
            >
              {saving
                ? <CircularProgress size={13} sx={{ color: "rgba(200,180,255,0.7)" }} />
                : "Conjurar"
              }
            </AppDialogConfirmButton>
          </Stack>
        }
      >
        <Stack spacing={2.5}>

          {/* ── Slot selector (non-cantrips only) ── */}
          {modalSpell && modalSpell.level > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", mb: 1 }}>
                Slot de Magia a Gastar
              </Typography>

              {modalSlotOptions.length === 0 ? (
                <Typography sx={{ fontSize: 12.5, color: "rgba(255,160,80,0.7)", fontStyle: "italic" }}>
                  Nenhum slot disponível para o nível desta magia.
                </Typography>
              ) : (
                <Stack spacing={0.75}>
                  {modalSlotOptions.map((row) => {
                    const available = row.max - row.used;
                    const isSelected = selectedSlotLevel === row.level;
                    const isEmpty = available <= 0;
                    return (
                      <Box
                        key={row.level}
                        onClick={() => !isEmpty && setSelectedSlotLevel(row.level)}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1.25,
                          px: 1.5, py: 1,
                          borderRadius: "10px", cursor: isEmpty ? "default" : "pointer",
                          border: isSelected
                            ? "1px solid rgba(120,85,255,0.55)"
                            : "1px solid rgba(255,255,255,0.07)",
                          bgcolor: isSelected ? "rgba(120,85,255,0.14)" : "rgba(255,255,255,0.02)",
                          opacity: isEmpty ? 0.4 : 1,
                          transition: "all .14s",
                          "&:hover": isEmpty ? {} : { borderColor: "rgba(120,85,255,0.35)", bgcolor: "rgba(120,85,255,0.08)" },
                        }}
                      >
                        {/* Level label */}
                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: isSelected ? "rgba(200,180,255,0.95)" : "rgba(255,255,255,0.55)", minWidth: 52 }}>
                          Nível {row.level}
                          {row.level > (modalSpell?.level ?? 0) && (
                            <Typography component="span" sx={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,200,100,0.7)", ml: 0.5 }}>
                              (upcasting)
                            </Typography>
                          )}
                        </Typography>

                        {/* Pips */}
                        <Stack direction="row" spacing={0.4} sx={{ flex: 1 }}>
                          {Array.from({ length: row.max }).map((_, i) => {
                            const isAvail = i >= row.used;
                            return (
                              <Box key={i} sx={{
                                width: 11, height: 11, borderRadius: "50%",
                                border: isAvail ? "1.5px solid rgba(160,130,255,0.8)" : "1.5px solid rgba(120,85,255,0.15)",
                                bgcolor: isAvail ? "rgba(140,105,255,0.6)" : "transparent",
                              }} />
                            );
                          })}
                        </Stack>

                        {/* Available count */}
                        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: isEmpty ? "rgba(255,100,100,0.5)" : "rgba(200,180,255,0.55)", whiteSpace: "nowrap" }}>
                          {isEmpty ? "sem slots" : `${available}/${row.max}`}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {noSlotsAvailable && (
                <Typography sx={{ fontSize: 11, color: "rgba(255,160,80,0.6)", mt: 1 }}>
                  Sem slots disponíveis. Você pode conjurar assim mesmo (sem gastar slot).
                </Typography>
              )}
            </Box>
          )}

          {/* ── Cooldown picker (custom spells only) ── */}
          {modalSpell?.isCustom ? (
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", mb: 1 }}>
                Duração do Efeito
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {PRESETS.map((p) => {
                  const isSelected = !useCustom && selectedPreset === p.seconds;
                  return (
                    <Box
                      key={p.label}
                      onClick={() => { setUseCustom(false); setSelectedPreset(p.seconds); }}
                      sx={{
                        px: 1.5, py: 0.6, borderRadius: "9px", cursor: "pointer",
                        border: isSelected ? "1px solid rgba(120,85,255,0.55)" : "1px solid rgba(255,255,255,0.09)",
                        bgcolor: isSelected ? "rgba(120,85,255,0.18)" : "rgba(255,255,255,0.03)",
                        transition: "all .14s",
                        "&:hover": { borderColor: "rgba(120,85,255,0.35)", bgcolor: "rgba(120,85,255,0.1)" },
                      }}
                    >
                      <Typography sx={{ fontSize: 12.5, fontWeight: isSelected ? 800 : 600, color: isSelected ? "rgba(200,175,255,0.95)" : "rgba(255,255,255,0.5)" }}>
                        {p.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField
                  value={customValue}
                  onChange={(e) => { setCustomValue(e.target.value.replace(/\D/g, "")); setUseCustom(true); setSelectedPreset(null); }}
                  onFocus={() => { setUseCustom(true); setSelectedPreset(null); }}
                  type="number" inputProps={{ min: 1, step: 1 }}
                  sx={{ ...inputSx, flex: 1 }}
                />
                <Select
                  value={customUnit}
                  onChange={(e) => { setCustomUnit(e.target.value as DurationUnit); setUseCustom(true); setSelectedPreset(null); }}
                  sx={{ ...selectSx, width: 120 }}
                  MenuProps={{ PaperProps: { sx: { bgcolor: "rgba(14,11,26,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", "& .MuiMenuItem-root": { color: "rgba(255,255,255,0.8)", fontSize: 13.5, "&:hover": { bgcolor: "rgba(120,85,255,0.12)" }, "&.Mui-selected": { bgcolor: "rgba(120,85,255,0.18)" } } } } }}
                >
                  <MenuItem value="s">segundos</MenuItem>
                  <MenuItem value="m">minutos</MenuItem>
                  <MenuItem value="h">horas</MenuItem>
                </Select>
              </Stack>

              {useCustom && customSeconds > 0 && (
                <Typography sx={{ fontSize: 11.5, color: "rgba(160,130,255,0.6)", mt: 0.75, ml: 0.25 }}>
                  ≈ {formatCountdown(customSeconds)} de efeito
                </Typography>
              )}
            </Box>
          ) : modalSpell && (
            <Box sx={{ px: 1.5, py: 1, borderRadius: "10px", bgcolor: "rgba(120,85,255,0.06)", border: "1px solid rgba(120,85,255,0.12)" }}>
              <Typography sx={{ fontSize: 11.5, color: "rgba(190,165,255,0.7)" }}>
                <strong>Duração:</strong> {modalSpell.duration ?? "—"}
              </Typography>
              {modalSpell.duration && parseDurationToSeconds(modalSpell.duration) !== null && (
                <Typography sx={{ fontSize: 10.5, color: "rgba(160,130,255,0.5)", mt: 0.25 }}>
                  O temporizador será definido automaticamente.
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </AppDialog>
    </>
  );
}
