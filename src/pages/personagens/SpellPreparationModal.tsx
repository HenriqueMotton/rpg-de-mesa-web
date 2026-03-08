import { useMemo, useState } from "react";
import {
  Box,
  Button,
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
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import type { CharacterSpell, DndSpellData } from "../../modules/spells/spells.api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrepareTarget {
  className: string;
  system: 'prepared' | 'grimoire';
  maxPrepared: number;
  maxSpellLevel: number;
  /** For grimoire: names in spellbook. For prepared: all class spells accessible. */
  availableSpells: DndSpellData[];
  /** Currently prepared CharacterSpells (to pre-check) */
  currentPrepared: CharacterSpell[];
}

interface Props {
  open: boolean;
  target: PrepareTarget | null;
  saving: boolean;
  onClose: () => void;
  /** ids of CharacterSpells to mark prepared; new spells to add from catalog */
  onConfirm: (preparedSpellNames: string[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SCHOOL_ICONS: Record<string, string> = {
  Abjuração: "🛡️", Adivinhação: "🔮", Conjuração: "✨",
  Encantamento: "💫", Evocação: "🔥", Ilusão: "🌀",
  Necromancia: "💀", Transmutação: "⚗️",
};
function schoolIcon(s: string | null) { return s ? (SCHOOL_ICONS[s] ?? "✨") : "✨"; }
function levelColor(level: number) {
  if (level === 0) return { bg: "rgba(80,160,120,0.12)", border: "rgba(80,160,120,0.22)", text: "rgba(100,220,160,0.9)" };
  if (level <= 2)  return { bg: "rgba(80,120,200,0.12)", border: "rgba(80,120,200,0.22)", text: "rgba(120,170,255,0.9)" };
  if (level <= 4)  return { bg: "rgba(120,80,220,0.12)", border: "rgba(120,80,220,0.22)", text: "rgba(170,130,255,0.9)" };
  if (level <= 6)  return { bg: "rgba(180,80,180,0.12)", border: "rgba(180,80,180,0.22)", text: "rgba(230,140,230,0.9)" };
  return             { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.22)",  text: "rgba(255,130,130,0.9)" };
}

// ─── SpellRow ─────────────────────────────────────────────────────────────────

function PrepRow({
  spell, selected, canSelect, onToggle,
}: {
  spell: DndSpellData;
  selected: boolean;
  canSelect: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lc = levelColor(spell.level);

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: selected
          ? "1.5px solid rgba(255,195,60,0.5)"
          : "1px solid rgba(255,255,255,0.07)",
        bgcolor: selected ? "rgba(255,195,60,0.07)" : "rgba(255,255,255,0.02)",
        opacity: (!selected && !canSelect) ? 0.45 : 1,
        overflow: "hidden", transition: "all .13s",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.25, pl: 1.25, pr: 0.75, py: 1, cursor: (selected || canSelect) ? "pointer" : "default" }}
        onClick={() => { if (selected || canSelect) onToggle(); }}
      >
        <Box sx={{ width: 28, height: 28, borderRadius: "8px", display: "grid", placeItems: "center", bgcolor: lc.bg, border: `1px solid ${lc.border}`, fontSize: 13, flexShrink: 0 }}>
          {schoolIcon(spell.school)}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {spell.name}
          </Typography>
          <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            {spell.level === 0 ? "Truque" : `${spell.level}°`} · {spell.school}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
          {selected ? (
            <Box sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: "rgba(255,195,60,0.7)", display: "grid", placeItems: "center" }}>
              <CheckRoundedIcon sx={{ fontSize: 13, color: "#000" }} />
            </Box>
          ) : (
            <Box sx={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)" }} />
          )}
          <Box onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }} sx={{ cursor: "pointer", display: "grid", placeItems: "center" }}>
            <ExpandMoreRoundedIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.2)", transition: "transform .15s", transform: expanded ? "rotate(180deg)" : "none" }} />
          </Box>
        </Stack>
      </Box>

      <Collapse in={expanded} timeout={150}>
        <Box sx={{ px: 1.5, pb: 1.25, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {spell.description && (
            <Typography sx={{ mt: 1, fontSize: 11.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              {spell.description}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SpellPreparationModal({ open, target, saving, onClose, onConfirm }: Props) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | "todos">("todos");
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  // Reset when target changes
  const [prevTarget, setPrevTarget] = useState<PrepareTarget | null>(null);
  if (target !== prevTarget) {
    setPrevTarget(target);
    setSearch("");
    setLevelFilter("todos");
    const preparedSet = new Set(target?.currentPrepared.map((s) => s.name) ?? []);
    setSelectedNames(preparedSet);
  }

  const { className = "", system = 'prepared', maxPrepared = 0, maxSpellLevel = 0, availableSpells = [] } = target ?? {};

  const leveledSpells = availableSpells.filter((s) => s.level > 0);
  const cantripSpells = availableSpells.filter((s) => s.level === 0);
  const selectedLeveled = [...selectedNames].filter((n) => leveledSpells.some((s) => s.name === n)).length;
  const canSelectMore = selectedLeveled < maxPrepared;

  const filteredSpells = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableSpells.filter((s) => {
      if (levelFilter !== "todos" && s.level !== levelFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.school?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [availableSpells, search, levelFilter]);

  function toggle(spell: DndSpellData) {
    const isCantrip = spell.level === 0;
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(spell.name)) {
        next.delete(spell.name);
      } else if (isCantrip || canSelectMore) {
        next.add(spell.name);
      }
      return next;
    });
  }

  const systemLabel = system === 'grimoire' ? 'Grimório' : 'Preparação';
  const accessibleLevels = Array.from(new Set(availableSpells.map((s) => s.level))).sort((a, b) => a - b);

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.88)", fontSize: 13,
      "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(255,195,60,0.45)", borderWidth: 1.5 },
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
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <MenuBookRoundedIcon sx={{ fontSize: 18, color: "rgba(255,195,60,0.7)" }} />
            <Typography sx={{ fontWeight: 900, fontSize: 17, color: "rgba(255,255,255,0.92)" }}>
              {systemLabel} — {className}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", mb: 1.5 }}>
            {system === 'grimoire'
              ? 'Escolha quais magias do seu grimório preparar hoje.'
              : 'Selecione as magias a preparar (pode mudar após descanso longo).'}
          </Typography>

          {/* Counter */}
          <Box sx={{ display: "inline-flex", px: 1.75, py: 0.75, borderRadius: "10px", border: selectedLeveled > maxPrepared ? "1.5px solid rgba(255,80,80,0.5)" : "1.5px solid rgba(255,195,60,0.4)", bgcolor: "rgba(255,195,60,0.07)" }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: selectedLeveled > maxPrepared ? "rgba(255,120,120,0.9)" : "rgba(255,215,100,0.9)" }}>
              {selectedLeveled}/{maxPrepared} magias preparadas
              {selectedLeveled === maxPrepared ? " ✓" : ""}
            </Typography>
          </Box>
        </Box>

        {/* Cantrips notice */}
        {cantripSpells.length > 0 && (
          <Box sx={{ px: 2.5, py: 1, borderBottom: "1px solid rgba(255,255,255,0.04)", bgcolor: "rgba(80,160,120,0.04)" }}>
            <Typography sx={{ fontSize: 11, color: "rgba(100,220,160,0.6)" }}>
              Truques estão sempre disponíveis — não precisam ser preparados.
            </Typography>
          </Box>
        )}

        {/* Search + Level filter */}
        <Box sx={{ px: 2, pt: 1.25, pb: 1, flexShrink: 0 }}>
          <TextField
            placeholder="Buscar magia…" size="small" fullWidth
            value={search} onChange={(e) => setSearch(e.target.value)}
            sx={inputSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
          />
          <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap", mt: 1 }}>
            {[{ v: "todos" as const, l: "Todos" }, ...accessibleLevels.map((lv) => ({ v: lv as number, l: lv === 0 ? "Truques" : `${lv}°` }))].map(({ v, l }) => {
              const act = levelFilter === v;
              return (
                <Box key={String(v)} onClick={() => setLevelFilter(v)} sx={{ px: 1.1, py: 0.35, borderRadius: "8px", cursor: "pointer", border: act ? "1px solid rgba(255,195,60,0.5)" : "1px solid rgba(255,255,255,0.08)", bgcolor: act ? "rgba(255,195,60,0.1)" : "rgba(255,255,255,0.03)", transition: "all .13s" }}>
                  <Typography sx={{ fontSize: 11, fontWeight: act ? 800 : 600, color: act ? "rgba(255,215,100,0.95)" : "rgba(255,255,255,0.4)" }}>{l}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

        {/* Spell List */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
          <Stack spacing={0.75}>
            {filteredSpells.map((spell) => (
              <PrepRow
                key={spell.name}
                spell={spell}
                selected={selectedNames.has(spell.name)}
                canSelect={spell.level === 0 || canSelectMore}
                onToggle={() => toggle(spell)}
              />
            ))}
          </Stack>
          {filteredSpells.length === 0 && (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>Nenhuma magia encontrada.</Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 2, flexShrink: 0 }}>
          <Stack direction="row" spacing={1.5}>
            <Button onClick={onClose} variant="text" sx={{ textTransform: "none", fontWeight: 800, color: "rgba(255,255,255,0.3)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={() => onConfirm([...selectedNames])}
              disabled={selectedLeveled > maxPrepared || saving}
              variant="contained"
              sx={{
                px: 3.5, py: 1, borderRadius: "12px", textTransform: "none", fontWeight: 800, fontSize: 13.5,
                background: "linear-gradient(135deg, rgba(200,150,30,0.9), rgba(255,195,60,0.85))",
                color: "#000",
                boxShadow: "0 4px 20px rgba(200,150,30,0.35)",
                "&:hover": { background: "linear-gradient(135deg, rgba(220,170,40,1), rgba(255,210,80,1))" },
                "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" },
              }}
            >
              {saving ? <CircularProgress size={14} sx={{ color: "rgba(0,0,0,0.5)" }} /> : "Confirmar"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
