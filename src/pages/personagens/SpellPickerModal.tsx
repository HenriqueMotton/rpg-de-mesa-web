import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import { getDndSpells, type DndSpellData } from "../../modules/spells/spells.api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpellPickerTarget {
  cantripsToPick: number;   // how many NEW cantrips to choose (0 = skip)
  leveledToPick: number;    // how many NEW leveled spells to choose (0 = skip)
  maxSpellLevel: number;    // highest spell level accessible
  alreadyKnownNames: Set<string>; // names already in grimoire (will show as locked)
  className: string;
  /** label override for the dialog title */
  title?: string;
}

interface Props {
  open: boolean;
  target: SpellPickerTarget | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (spells: DndSpellData[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SCHOOL_ICONS: Record<string, string> = {
  Abjuração: "🛡️", Adivinhação: "🔮", Conjuração: "✨",
  Encantamento: "💫", Evocação: "🔥", Ilusão: "🌀",
  Necromancia: "💀", Transmutação: "⚗️",
};
function schoolIcon(s: string | null) {
  return s ? (SCHOOL_ICONS[s] ?? "✨") : "✨";
}
function levelColor(level: number) {
  if (level === 0) return { bg: "rgba(80,160,120,0.12)", border: "rgba(80,160,120,0.22)", text: "rgba(100,220,160,0.9)" };
  if (level <= 2)  return { bg: "rgba(80,120,200,0.12)", border: "rgba(80,120,200,0.22)", text: "rgba(120,170,255,0.9)" };
  if (level <= 4)  return { bg: "rgba(120,80,220,0.12)", border: "rgba(120,80,220,0.22)", text: "rgba(170,130,255,0.9)" };
  if (level <= 6)  return { bg: "rgba(180,80,180,0.12)", border: "rgba(180,80,180,0.22)", text: "rgba(230,140,230,0.9)" };
  return             { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.22)",  text: "rgba(255,130,130,0.9)" };
}

// ─── SpellRow ─────────────────────────────────────────────────────────────────

function SpellRow({
  spell, selected, locked, disabled, onToggle,
}: {
  spell: DndSpellData;
  selected: boolean;
  locked: boolean;
  /** limit reached for this spell type — not selectable, visually dimmed */
  disabled: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lc = levelColor(spell.level);
  const inactive = locked || disabled;

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: selected
          ? "1.5px solid rgba(120,85,255,0.55)"
          : locked
          ? "1px solid rgba(255,255,255,0.05)"
          : disabled
          ? "1px solid rgba(255,255,255,0.04)"
          : "1px solid rgba(255,255,255,0.08)",
        bgcolor: selected
          ? "rgba(120,85,255,0.1)"
          : inactive
          ? "rgba(255,255,255,0.012)"
          : "rgba(255,255,255,0.025)",
        opacity: inactive ? 0.4 : 1,
        overflow: "hidden",
        transition: "all .14s",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.25, pl: 1.25, pr: 0.75, py: 1, cursor: inactive ? "default" : "pointer" }}
        onClick={() => { if (!inactive) onToggle(); }}
      >
        {/* School icon */}
        <Box sx={{ width: 30, height: 30, borderRadius: "8px", display: "grid", placeItems: "center", bgcolor: lc.bg, border: `1px solid ${lc.border}`, fontSize: 14, flexShrink: 0 }}>
          {schoolIcon(spell.school)}
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {spell.name}
          </Typography>
          <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            {spell.level === 0 ? "Truque" : `${spell.level}°`} · {spell.school}
            {spell.castingTime ? ` · ${spell.castingTime}` : ""}
          </Typography>
        </Box>

        {/* State indicator */}
        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 0.5 }}>
          {locked && (
            <Chip label="Já possui" size="small" sx={{ height: 16, fontSize: 8.5, fontWeight: 800, bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", "& .MuiChip-label": { px: 0.6 } }} />
          )}
          {!locked && selected && (
            <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: "rgba(120,85,255,0.8)", display: "grid", placeItems: "center" }}>
              <CheckRoundedIcon sx={{ fontSize: 13, color: "#fff" }} />
            </Box>
          )}
          {!locked && !selected && (
            <Box sx={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)" }} />
          )}
          <Box
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            sx={{ cursor: "pointer", display: "grid", placeItems: "center", ml: 0.25 }}
          >
            <ExpandMoreRoundedIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.2)", transition: "transform .15s", transform: expanded ? "rotate(180deg)" : "none" }} />
          </Box>
        </Box>
      </Box>

      <Collapse in={expanded} timeout={150}>
        <Box sx={{ px: 1.5, pb: 1.25, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.6, mt: 1 }}>
            {[
              { label: "Tempo", value: spell.castingTime ?? "—" },
              { label: "Alcance", value: spell.range ?? "—" },
              { label: "Duração", value: spell.duration ?? "—" },
              { label: "Componentes", value: [spell.componentV && "V", spell.componentS && "S", spell.componentM && "M"].filter(Boolean).join(", ") || "Nenhum" },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ borderRadius: "8px", px: 1, py: 0.65, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography sx={{ fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.2)", mb: 0.2 }}>{label}</Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
          {spell.description && (
            <Typography sx={{ mt: 0.75, fontSize: 11.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              {spell.description}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SpellPickerModal({ open, target, saving, onClose, onConfirm }: Props) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"todos" | "truques" | "leveled">("todos");
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [catalogSpells, setCatalogSpells] = useState<DndSpellData[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(false);

  // Reset when target changes
  const [prevTarget, setPrevTarget] = useState<SpellPickerTarget | null>(null);
  if (target !== prevTarget) {
    setPrevTarget(target);
    setSelectedNames(new Set());
    setSearch("");
    setLevelFilter("todos");
    setCatalogSpells([]);
    setCatalogError(false);
  }

  const { cantripsToPick = 0, leveledToPick = 0, maxSpellLevel = 0, alreadyKnownNames = new Set(), className = "" } = target ?? {};

  // Fetch catalog from API when dialog opens
  useEffect(() => {
    if (!open || !className) return;
    setCatalogLoading(true);
    setCatalogError(false);
    getDndSpells({ class: className, maxLevel: maxSpellLevel })
      .then(setCatalogSpells)
      .catch(() => setCatalogError(true))
      .finally(() => setCatalogLoading(false));
  }, [open, className, maxSpellLevel]);

  const availableSpells = useMemo(() =>
    catalogSpells.filter((s) =>
      s.level === 0 || s.level <= maxSpellLevel
    ), [catalogSpells, maxSpellLevel]
  );

  const filteredSpells = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableSpells.filter((s) => {
      if (levelFilter === "truques" && s.level !== 0) return false;
      if (levelFilter === "leveled" && s.level === 0) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.school?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [availableSpells, search, levelFilter]);

  const selectedCantrips = useMemo(() =>
    [...selectedNames].filter((n) => availableSpells.find((s) => s.name === n)?.level === 0).length,
    [selectedNames, availableSpells]
  );
  const selectedLeveled = useMemo(() =>
    [...selectedNames].filter((n) => (availableSpells.find((s) => s.name === n)?.level ?? 0) > 0).length,
    [selectedNames, availableSpells]
  );

  function toggle(spell: DndSpellData) {
    const isCantrip = spell.level === 0;
    const currentCount = isCantrip ? selectedCantrips : selectedLeveled;
    const limit = isCantrip ? cantripsToPick : leveledToPick;

    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(spell.name)) {
        next.delete(spell.name);
      } else if (currentCount < limit) {
        next.add(spell.name);
      }
      return next;
    });
  }

  function handleConfirm() {
    const spells = availableSpells.filter((s) => selectedNames.has(s.name));
    onConfirm(spells);
  }

  const canConfirm = selectedCantrips === cantripsToPick && selectedLeveled === leveledToPick;
  const hasCantrips = cantripsToPick > 0;
  const hasLeveled = leveledToPick > 0;

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.88)", fontSize: 13,
      "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(120,85,255,0.45)", borderWidth: 1.5 },
    },
    "& .MuiInputAdornment-root": { color: "rgba(255,255,255,0.3)" },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: "rgba(9,7,20,0.99)", backgroundImage: "none" } }}
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Header */}
        <Box sx={{ px: 2.5, pt: 3, pb: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <AutoStoriesRoundedIcon sx={{ fontSize: 18, color: "rgba(160,130,255,0.7)" }} />
            <Typography sx={{ fontWeight: 900, fontSize: 17, color: "rgba(255,255,255,0.92)" }}>
              {target?.title ?? "Escolher Magias"}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)", mb: 1.5 }}>
            {className} · magias disponíveis até {maxSpellLevel > 0 ? `nível ${maxSpellLevel}` : "truques apenas"}
          </Typography>

          {/* Counters */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {hasCantrips && (
              <Box sx={{ px: 1.5, py: 0.75, borderRadius: "10px", border: selectedCantrips === cantripsToPick ? "1.5px solid rgba(100,220,160,0.5)" : "1px solid rgba(255,255,255,0.1)", bgcolor: selectedCantrips === cantripsToPick ? "rgba(80,160,120,0.12)" : "rgba(255,255,255,0.04)" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: selectedCantrips === cantripsToPick ? "rgba(100,220,160,0.9)" : "rgba(255,255,255,0.5)" }}>
                  Truques {selectedCantrips}/{cantripsToPick}
                  {selectedCantrips === cantripsToPick && " ✓"}
                </Typography>
              </Box>
            )}
            {hasLeveled && (
              <Box sx={{ px: 1.5, py: 0.75, borderRadius: "10px", border: selectedLeveled === leveledToPick ? "1.5px solid rgba(120,170,255,0.5)" : "1px solid rgba(255,255,255,0.1)", bgcolor: selectedLeveled === leveledToPick ? "rgba(80,120,200,0.12)" : "rgba(255,255,255,0.04)" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: selectedLeveled === leveledToPick ? "rgba(120,170,255,0.9)" : "rgba(255,255,255,0.5)" }}>
                  Magias {selectedLeveled}/{leveledToPick}
                  {selectedLeveled === leveledToPick && " ✓"}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Search + Filters */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
          <TextField
            placeholder="Buscar por nome ou escola…"
            size="small" fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={inputSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
          />
          <Stack direction="row" spacing={0.6} sx={{ mt: 1 }}>
            {[
              { v: "todos",   l: "Todos" },
              { v: "truques", l: "Truques" },
              { v: "leveled", l: "Leveled" },
            ].map(({ v, l }) => {
              const act = levelFilter === v;
              return (
                <Box key={v} onClick={() => setLevelFilter(v as any)} sx={{ px: 1.2, py: 0.35, borderRadius: "8px", cursor: "pointer", border: act ? "1px solid rgba(120,85,255,0.5)" : "1px solid rgba(255,255,255,0.08)", bgcolor: act ? "rgba(120,85,255,0.12)" : "rgba(255,255,255,0.03)", transition: "all .13s" }}>
                  <Typography sx={{ fontSize: 11, fontWeight: act ? 800 : 600, color: act ? "rgba(200,175,255,0.95)" : "rgba(255,255,255,0.4)" }}>{l}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

        {/* Spell List */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
          {catalogLoading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress size={24} sx={{ color: "rgba(160,130,255,0.7)" }} />
            </Box>
          ) : catalogError ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, color: "rgba(255,100,100,0.7)", fontStyle: "italic" }}>
                Não foi possível carregar o catálogo de magias.
              </Typography>
            </Box>
          ) : filteredSpells.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                Nenhuma magia encontrada.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.75}>
              {filteredSpells.map((spell) => {
                const isSelected = selectedNames.has(spell.name);
                const isLocked = alreadyKnownNames.has(spell.name);
                const isCantrip = spell.level === 0;
                const limitReached = isCantrip
                  ? selectedCantrips >= cantripsToPick
                  : selectedLeveled >= leveledToPick;
                const isDisabled = !isSelected && !isLocked && limitReached;
                return (
                  <SpellRow
                    key={spell.name}
                    spell={spell}
                    selected={isSelected}
                    locked={isLocked}
                    disabled={isDisabled}
                    onToggle={() => toggle(spell)}
                  />
                );
              })}
            </Stack>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 2, flexShrink: 0 }}>
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={onClose}
              variant="text"
              sx={{ textTransform: "none", fontWeight: 800, color: "rgba(255,255,255,0.3)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}
            >
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm || saving}
              variant="contained"
              sx={{
                px: 3.5, py: 1, borderRadius: "12px", textTransform: "none", fontWeight: 800, fontSize: 13.5,
                background: canConfirm ? "linear-gradient(135deg, rgba(120,85,255,0.9), rgba(90,143,255,0.9))" : undefined,
                boxShadow: canConfirm ? "0 4px 20px rgba(100,70,230,0.4)" : "none",
                "&:hover": { background: "linear-gradient(135deg, rgba(130,95,255,1), rgba(100,153,255,1))" },
                "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" },
              }}
            >
              {saving ? <CircularProgress size={14} sx={{ color: "rgba(255,255,255,0.6)" }} /> : "Confirmar"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
