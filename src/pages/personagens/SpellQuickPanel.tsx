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

type DurationUnit = "s" | "m" | "h";

const PRESETS: { label: string; seconds: number | null }[] = [
  { label: "1 Turno",  seconds: 6 },
  { label: "1 Min",    seconds: 60 },
  { label: "10 Min",   seconds: 600 },
  { label: "1 Hora",   seconds: 3600 },
  { label: "8 Horas",  seconds: 28800 },
  { label: "Sem prazo", seconds: null },
];

function remainingSeconds(activeUntil: string | null): number {
  if (!activeUntil) return -1; // -1 means "no timer" (manual)
  return Math.max(0, Math.floor((new Date(activeUntil).getTime() - Date.now()) / 1000));
}

function formatCountdown(secs: number): string {
  if (secs < 0)   return "∞";
  if (secs === 0) return "0s";
  if (secs < 60)  return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60)     return `${m}:${String(s).padStart(2, "0")}`;
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

  // Sync when spell data changes
  useEffect(() => {
    setSecsLeft(remainingSeconds(spell.activeUntil));
  }, [spell.activeUntil, spell.isActive]);

  // Tick down when there's a timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!spell.isActive || !spell.activeUntil) return;

    intervalRef.current = setInterval(() => {
      const s = remainingSeconds(spell.activeUntil);
      setSecsLeft(s);
      if (s === 0) {
        // Auto-deactivate when expired
        onDeactivate(spell);
        clearInterval(intervalRef.current!);
      }
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [spell.isActive, spell.activeUntil]); // eslint-disable-line

  const active       = spell.isActive;
  const hasTimer     = active && spell.activeUntil !== null;
  const countdownStr = hasTimer ? formatCountdown(secsLeft) : active ? "∞" : null;

  // Color by level
  function levelAccent() {
    const l = spell.level;
    if (l === 0) return { border: "rgba(80,160,120,0.3)", glow: "rgba(80,160,120,0.15)", text: "rgba(100,220,160,0.9)" };
    if (l <= 2)  return { border: "rgba(80,120,200,0.3)", glow: "rgba(80,120,200,0.15)", text: "rgba(120,170,255,0.9)" };
    if (l <= 4)  return { border: "rgba(120,80,220,0.3)", glow: "rgba(120,80,220,0.15)", text: "rgba(170,130,255,0.9)" };
    if (l <= 6)  return { border: "rgba(180,80,180,0.3)", glow: "rgba(180,80,180,0.15)", text: "rgba(230,140,230,0.9)" };
    return         { border: "rgba(200,60,60,0.3)",  glow: "rgba(200,60,60,0.15)",  text: "rgba(255,130,130,0.9)" };
  }

  const accent = levelAccent();

  return (
    <Box
      onClick={() => !loading && (active ? onDeactivate(spell) : onActivate(spell))}
      sx={{
        position: "relative",
        width: "calc(25% - 6px)",
        aspectRatio: "1",
        borderRadius: "14px",
        cursor: loading ? "default" : "pointer",
        border: active
          ? "1px solid rgba(220,70,70,0.35)"
          : `1px solid ${accent.border}`,
        bgcolor: active
          ? "rgba(180,50,50,0.1)"
          : accent.glow,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.4,
        p: 1,
        transition: "all .18s",
        boxShadow: active
          ? "0 0 12px rgba(220,70,70,0.15) inset"
          : "none",
        "&:hover": {
          transform: loading ? "none" : "scale(1.03)",
          borderColor: active ? "rgba(220,70,70,0.55)" : "rgba(160,130,255,0.5)",
        },
        "&:active": { transform: "scale(0.97)" },
      }}
    >
      {/* School emoji */}
      <Typography sx={{ fontSize: 16, lineHeight: 1, opacity: active ? 0.45 : 1 }}>
        {schoolIcon(spell.school)}
      </Typography>

      {/* Spell name */}
      <Typography
        sx={{
          fontSize: 9.5,
          fontWeight: 700,
          color: active ? "rgba(255,180,180,0.55)" : "rgba(255,255,255,0.88)",
          textAlign: "center",
          lineHeight: 1.25,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
          textDecoration: active ? "line-through" : "none",
          px: 0.25,
        }}
      >
        {spell.name}
      </Typography>

      {/* Level badge */}
      <Box
        sx={{
          px: 0.6,
          py: 0.15,
          borderRadius: "5px",
          bgcolor: active ? "rgba(220,70,70,0.15)" : "rgba(120,85,255,0.18)",
          border: `1px solid ${active ? "rgba(220,70,70,0.2)" : accent.border}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 9,
            fontWeight: 900,
            color: active ? "rgba(255,150,150,0.6)" : accent.text,
            lineHeight: 1,
          }}
        >
          {spell.level === 0 ? "T" : `${spell.level}°`}
        </Typography>
      </Box>

      {/* ── Countdown overlay ── */}
      {active && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "14px",
            // diagonal lines background
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(220,60,60,0.04) 5px, rgba(220,60,60,0.04) 10px)",
            pointerEvents: "none",
          }}
        >
          {loading ? (
            <CircularProgress size={18} thickness={3} sx={{ color: "rgba(255,160,160,0.7)" }} />
          ) : (
            <Box
              sx={{
                px: 1.2,
                py: 0.4,
                borderRadius: "8px",
                bgcolor: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(220,70,70,0.3)",
                backdropFilter: "blur(4px)",
              }}
            >
              <Typography
                sx={{
                  fontSize: countdownStr === "∞" ? 16 : 11,
                  fontWeight: 900,
                  color: "rgba(255,160,160,0.95)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {countdownStr}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
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

  // Cooldown modal state
  const [modalSpell, setModalSpell]       = useState<CharacterSpell | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(6); // seconds
  const [customValue, setCustomValue]     = useState("1");
  const [customUnit, setCustomUnit]       = useState<DurationUnit>("m");
  const [useCustom, setUseCustom]         = useState(false);
  const [saving, setSaving]               = useState(false);

  // IDs currently being toggled
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSpells(characterId);
      setSpells(data);
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (open) load(); }, [open, load]);

  function openCooldownModal(spell: CharacterSpell) {
    setModalSpell(spell);
    setSelectedPreset(6);
    setCustomValue("1");
    setCustomUnit("m");
    setUseCustom(false);
  }

  async function confirmActivate() {
    if (!modalSpell) return;
    setSaving(true);

    let activeUntil: string | null = null;

    if (useCustom) {
      const val = Number(customValue);
      if (val > 0) {
        const multiplier = customUnit === "s" ? 1 : customUnit === "m" ? 60 : 3600;
        activeUntil = new Date(Date.now() + val * multiplier * 1000).toISOString();
      }
    } else if (selectedPreset !== null) {
      activeUntil = new Date(Date.now() + selectedPreset * 1000).toISOString();
    }
    // selectedPreset === null → "Sem prazo" → activeUntil stays null

    try {
      const updated = await updateSpell(modalSpell.id, {
        isActive: true,
        activeUntil,
      });
      setSpells((prev) => prev.map((s) => (s.id === modalSpell.id ? updated : s)));
      setModalSpell(null);
    } finally {
      setSaving(false);
    }
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

  async function resetAll() {
    const active = spells.filter((s) => s.isActive);
    await Promise.all(active.map((s) =>
      updateSpell(s.id, { isActive: false, activeUntil: null })
    ));
    setSpells((prev) => prev.map((s) => ({ ...s, isActive: false, activeUntil: null })));
  }

  const activeCount    = spells.filter((s) => s.isActive).length;
  const availableCount = spells.filter((s) => !s.isActive).length;

  const grouped = CAST_GROUPS
    .map((g) => ({ ...g, list: spells.filter((s) => castCategory(s.castingTime) === g.key) }))
    .filter((g) => g.list.length > 0);

  // Custom duration in seconds for preview
  const customSeconds = (() => {
    const v = Number(customValue);
    if (!v || v <= 0) return 0;
    return v * (customUnit === "s" ? 1 : customUnit === "m" ? 60 : 3600);
  })();

  const inputSx = {
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13 },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgba(160,130,255,0.9)" },
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.92)",
      fontSize: 14,
      "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
    },
  };

  const selectSx = {
    borderRadius: "10px",
    backgroundColor: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
    "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.4)" },
  };

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <Box sx={{ position: "fixed", bottom: 80, right: 16, zIndex: 1200 }}>
        <Tooltip title="Magias rápidas" placement="left">
          <Badge
            badgeContent={activeCount > 0 ? activeCount : 0}
            sx={{
              "& .MuiBadge-badge": {
                bgcolor: "rgba(220,70,70,0.92)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 900,
                minWidth: 17,
                height: 17,
                border: "1.5px solid rgba(7,9,15,0.9)",
              },
            }}
          >
            <Box
              onClick={() => setOpen(true)}
              sx={{
                width: 50,
                height: 50,
                borderRadius: "15px",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)",
                boxShadow: "0 4px 20px rgba(100,70,230,0.55), 0 0 0 1px rgba(180,150,255,0.15) inset",
                transition: "transform .15s, box-shadow .15s",
                "&:hover": {
                  transform: "scale(1.07)",
                  boxShadow: "0 6px 28px rgba(100,70,230,0.7)",
                },
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
        <Box
          onClick={() => setOpen(false)}
          sx={{
            position: "fixed", inset: 0, zIndex: 1300,
            bgcolor: "rgba(0,0,0,0.62)",
            backdropFilter: "blur(4px)",
          }}
        />
      </Fade>

      {/* ── Panel ───────────────────────────────────────────────────────────── */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1400,
            maxHeight: "75vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "22px 22px 0 0",
            bgcolor: "rgba(9,7,20,0.97)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "none",
            boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
            backdropFilter: "blur(24px)",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0, left: "50%",
              transform: "translateX(-50%)",
              width: "45%", height: "1.5px",
              background: "linear-gradient(90deg, transparent, rgba(120,85,255,0.7), transparent)",
            },
          }}
        >
          {/* Drag indicator */}
          <Box sx={{ display: "flex", justifyContent: "center", pt: 1.25, pb: 0.5 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 99, bgcolor: "rgba(255,255,255,0.12)" }} />
          </Box>

          {/* Header */}
          <Stack
            direction="row" alignItems="center"
            sx={{ px: 2.5, pt: 0.5, pb: 1.25, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <AutoStoriesRoundedIcon sx={{ fontSize: 15, color: "rgba(160,130,255,0.6)", mr: 1 }} />
            <Typography sx={{ fontWeight: 900, fontSize: 15, color: "rgba(255,255,255,0.9)", flex: 1 }}>
              Magias
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mr: 1 }}>
              <Chip
                label={`${availableCount} ok`}
                size="small"
                sx={{
                  height: 19, fontSize: 10, fontWeight: 800,
                  bgcolor: "rgba(60,180,120,0.1)", border: "1px solid rgba(60,180,120,0.22)",
                  color: "rgba(100,220,160,0.9)", "& .MuiChip-label": { px: 0.9 },
                }}
              />
              {activeCount > 0 && (
                <Chip
                  label={`${activeCount} ativa${activeCount !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    height: 19, fontSize: 10, fontWeight: 800,
                    bgcolor: "rgba(220,70,70,0.1)", border: "1px solid rgba(220,70,70,0.2)",
                    color: "rgba(255,140,140,0.9)", "& .MuiChip-label": { px: 0.9 },
                  }}
                />
              )}
            </Stack>

            {activeCount > 0 && (
              <Tooltip title="Resetar todas" placement="top">
                <IconButton
                  size="small" onClick={resetAll}
                  sx={{
                    color: "rgba(255,255,255,0.28)", mr: 0.25,
                    "&:hover": { color: "rgba(255,200,100,0.8)", bgcolor: "rgba(255,180,60,0.08)" },
                  }}
                >
                  <RefreshRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            <IconButton
              size="small" onClick={() => setOpen(false)}
              sx={{
                color: "rgba(255,255,255,0.28)",
                "&:hover": { color: "rgba(255,255,255,0.7)", bgcolor: "rgba(255,255,255,0.06)" },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          {/* Body */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                <CircularProgress size={22} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
              </Box>
            ) : spells.length === 0 ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                  Nenhuma magia no grimório.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2.5} sx={{ pb: 2 }}>
                {grouped.map((group) => (
                  <Box key={group.key}>
                    {/* Group label */}
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.25 }}>
                      <Typography sx={{ fontSize: 13 }}>{group.icon}</Typography>
                      <Typography
                        sx={{
                          fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em",
                          textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        {group.label}
                      </Typography>
                      <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255,255,255,0.06)" }} />
                    </Stack>

                    {/* Card grid — 3 per row */}
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
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Slide>

      {/* ── Cooldown modal ───────────────────────────────────────────────────── */}
      <AppDialog
        open={modalSpell !== null}
        onClose={() => setModalSpell(null)}
        title={`Cooldown — ${modalSpell?.name ?? ""}`}
        dividers
        dialogProps={{
          sx: { "& .MuiDialog-container": { alignItems: "flex-start" } },
          PaperProps: {
            sx: {
              borderRadius: "18px",
              background: "rgba(12, 15, 23, 0.97)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
              mx: 2,
              mt: 8,
            },
          },
        }}
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button
              onClick={() => setModalSpell(null)}
              variant="text"
              startIcon={<CloseRoundedIcon />}
              sx={{
                textTransform: "none", fontWeight: 800, borderRadius: "10px",
                color: "rgba(255,255,255,0.3)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" },
              }}
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
                : "Ativar"
              }
            </AppDialogConfirmButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            Por quanto tempo a magia ficará em cooldown?
          </Typography>

          {/* Preset chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {PRESETS.map((p) => {
              const isSelected = !useCustom && selectedPreset === p.seconds;
              return (
                <Box
                  key={p.label}
                  onClick={() => { setUseCustom(false); setSelectedPreset(p.seconds); }}
                  sx={{
                    px: 1.5, py: 0.6,
                    borderRadius: "9px",
                    cursor: "pointer",
                    border: isSelected
                      ? "1px solid rgba(120,85,255,0.55)"
                      : "1px solid rgba(255,255,255,0.09)",
                    bgcolor: isSelected
                      ? "rgba(120,85,255,0.18)"
                      : "rgba(255,255,255,0.03)",
                    transition: "all .14s",
                    "&:hover": {
                      borderColor: "rgba(120,85,255,0.35)",
                      bgcolor: "rgba(120,85,255,0.1)",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? "rgba(200,175,255,0.95)" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {p.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Custom duration */}
          <Box>
            <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", mb: 0.75, ml: 0.25 }}>
              Ou tempo personalizado
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value.replace(/\D/g, ""));
                  setUseCustom(true);
                  setSelectedPreset(null);
                }}
                onFocus={() => { setUseCustom(true); setSelectedPreset(null); }}
                type="number"
                inputProps={{ min: 1, step: 1 }}
                sx={{ ...inputSx, flex: 1 }}
              />
              <Select
                value={customUnit}
                onChange={(e) => {
                  setCustomUnit(e.target.value as DurationUnit);
                  setUseCustom(true);
                  setSelectedPreset(null);
                }}
                sx={{ ...selectSx, width: 120 }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "rgba(14,11,26,0.97)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      "& .MuiMenuItem-root": {
                        color: "rgba(255,255,255,0.8)", fontSize: 13.5,
                        "&:hover": { bgcolor: "rgba(120,85,255,0.12)" },
                        "&.Mui-selected": { bgcolor: "rgba(120,85,255,0.18)" },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="s">segundos</MenuItem>
                <MenuItem value="m">minutos</MenuItem>
                <MenuItem value="h">horas</MenuItem>
              </Select>
            </Stack>

            {/* Preview */}
            {useCustom && customSeconds > 0 && (
              <Typography sx={{ fontSize: 11.5, color: "rgba(160,130,255,0.6)", mt: 0.75, ml: 0.25 }}>
                ≈ {formatCountdown(customSeconds)} de cooldown
              </Typography>
            )}
          </Box>
        </Stack>
      </AppDialog>
    </>
  );
}
