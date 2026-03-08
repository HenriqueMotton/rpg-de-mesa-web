import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import { getDndSpells, type DndSpellData } from "../../modules/spells/spells.api";

// ─── Constants ────────────────────────────────────────────────────────────────

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

function levelLabel(level: number) {
  return level === 0 ? "Truque" : `${level}°`;
}

function levelColor(level: number) {
  if (level === 0) return { bg: "rgba(80,160,120,0.12)", border: "rgba(80,160,120,0.22)", text: "rgba(100,220,160,0.9)" };
  if (level <= 2)  return { bg: "rgba(80,120,200,0.12)", border: "rgba(80,120,200,0.22)", text: "rgba(120,170,255,0.9)" };
  if (level <= 4)  return { bg: "rgba(120,80,220,0.12)", border: "rgba(120,80,220,0.22)", text: "rgba(170,130,255,0.9)" };
  if (level <= 6)  return { bg: "rgba(180,80,180,0.12)", border: "rgba(180,80,180,0.22)", text: "rgba(230,140,230,0.9)" };
  return               { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.22)",  text: "rgba(255,130,130,0.9)" };
}

type LevelFilter = "todos" | "truques" | "1-3" | "4-6" | "7-9";
const LEVEL_FILTERS: { value: LevelFilter; label: string }[] = [
  { value: "todos",   label: "Todos" },
  { value: "truques", label: "Truques" },
  { value: "1-3",     label: "1°–3°" },
  { value: "4-6",     label: "4°–6°" },
  { value: "7-9",     label: "7°–9°" },
];

function matchesLevel(spell: DndSpellData, f: LevelFilter) {
  if (f === "todos")   return true;
  if (f === "truques") return spell.level === 0;
  if (f === "1-3")     return spell.level >= 1 && spell.level <= 3;
  if (f === "4-6")     return spell.level >= 4 && spell.level <= 6;
  if (f === "7-9")     return spell.level >= 7;
  return true;
}

// ─── Spell row (expandable) ───────────────────────────────────────────────────

function SpellRow({ spell }: { spell: DndSpellData }) {
  const [expanded, setExpanded] = useState(false);
  const lc = levelColor(spell.level);

  const components = [
    spell.componentV && "V",
    spell.componentS && "S",
    spell.componentM && "M",
  ].filter(Boolean).join(", ");

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.06)",
        bgcolor: "rgba(255,255,255,0.02)",
        overflow: "hidden",
        transition: "border-color .15s",
        "&:hover": { borderColor: "rgba(255,255,255,0.1)" },
      }}
    >
      {/* Header row */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: "flex", alignItems: "center", gap: 1.25,
          pl: 1.25, pr: 0.75, py: 1,
          cursor: "pointer",
        }}
      >
        {/* School icon */}
        <Box sx={{
          width: 32, height: 32, borderRadius: "9px",
          display: "grid", placeItems: "center",
          bgcolor: lc.bg, border: `1px solid ${lc.border}`,
          fontSize: 15, flexShrink: 0,
        }}>
          {schoolIcon(spell.school)}
        </Box>

        {/* Name + badges */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {spell.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.15 }}>
            <Chip label={levelLabel(spell.level)} size="small" sx={{ height: 15, fontSize: 8.5, fontWeight: 800, bgcolor: lc.bg, border: `1px solid ${lc.border}`, color: lc.text, "& .MuiChip-label": { px: 0.6 } }} />
            <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>
              {spell.school ?? "—"}
              {spell.castingTime ? ` · ${spell.castingTime}` : ""}
            </Typography>
          </Stack>
        </Box>

        {/* Expand button */}
        <IconButton size="small" sx={{ color: "rgba(255,255,255,0.25)", flexShrink: 0, transition: "transform .18s", transform: expanded ? "rotate(180deg)" : "none" }}>
          <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Expanded detail */}
      <Collapse in={expanded} timeout={180}>
        <Box sx={{ px: 1.75, pb: 1.5, borderTop: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Stats grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75, mt: 1.25 }}>
            {[
              { label: "Tempo de conjuração", value: spell.castingTime ?? "—" },
              { label: "Alcance",              value: spell.range ?? "—" },
              { label: "Duração",              value: spell.duration ?? "—" },
              { label: "Componentes",          value: components || "Nenhum" },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ borderRadius: "9px", px: 1.1, py: 0.8, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", mb: 0.25 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.72)", lineHeight: 1.4 }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Material component */}
          {spell.componentM && spell.materialComponent && (
            <Box sx={{ mt: 0.75, borderRadius: "9px", px: 1.1, py: 0.8, bgcolor: "rgba(255,195,80,0.04)", border: "1px solid rgba(255,195,80,0.1)" }}>
              <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,195,80,0.4)", mb: 0.25 }}>
                Material
              </Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,215,120,0.7)", lineHeight: 1.5 }}>
                {spell.materialComponent}
              </Typography>
            </Box>
          )}

          {/* Description */}
          {spell.description && (
            <Typography sx={{ mt: 1, fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              {spell.description}
            </Typography>
          )}

          {/* Classes */}
          {spell.classes.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
              {spell.classes.map((cls) => (
                <Chip
                  key={cls}
                  label={cls}
                  size="small"
                  sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: "rgba(160,130,255,0.08)", color: "rgba(180,150,255,0.8)", border: "1px solid rgba(160,130,255,0.18)", "& .MuiChip-label": { px: 0.7 } }}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── School group (collapsible) ───────────────────────────────────────────────

function SchoolGroup({ school, spells }: { school: string; spells: DndSpellData[] }) {
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ borderRadius: "14px", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex", alignItems: "center", gap: 1.25,
          px: 1.5, py: 1.1, cursor: "pointer",
          bgcolor: "rgba(255,255,255,0.03)",
          borderBottom: open ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition: "background-color .15s",
          "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
        }}
      >
        <Typography sx={{ fontSize: 17, lineHeight: 1 }}>{schoolIcon(school)}</Typography>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>
            {school}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            {spells.length} magia{spells.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: "rgba(255,255,255,0.25)", transition: "transform .18s", transform: open ? "rotate(180deg)" : "none" }}>
          <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Collapse in={open} timeout={200}>
        <Stack spacing={0.75} sx={{ p: 1.25 }}>
          {spells.map((spell) => (
            <SpellRow key={spell.name} spell={spell} />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────


const inputSx = {
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13 },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(255,195,60,0.9)" },
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.88)", fontSize: 13.5,
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(255,195,60,0.45)", borderWidth: 1.5 },
  },
  "& .MuiInputAdornment-root": { color: "rgba(255,255,255,0.3)" },
};

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.2, py: 0.4, borderRadius: "8px", cursor: "pointer",
        border: active ? "1px solid rgba(255,195,60,0.5)" : "1px solid rgba(255,255,255,0.08)",
        bgcolor: active ? "rgba(255,195,60,0.12)" : "rgba(255,255,255,0.03)",
        transition: "all .14s",
        "&:hover": { borderColor: active ? "rgba(255,195,60,0.6)" : "rgba(255,255,255,0.14)", bgcolor: active ? "rgba(255,195,60,0.16)" : "rgba(255,255,255,0.06)" },
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: active ? 800 : 600, color: active ? "rgba(255,215,100,0.95)" : "rgba(255,255,255,0.45)", lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function MasterGrimoire() {
  const [search, setSearch]           = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("todos");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [allSpells, setAllSpells]     = useState<DndSpellData[]>([]);

  useEffect(() => {
    getDndSpells().then(setAllSpells).catch(() => {});
  }, []);

  const allClasses = useMemo(() => Array.from(new Set(allSpells.flatMap((s) => s.classes))).sort(), [allSpells]);

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => allSpells.filter((s) => {
    if (!matchesLevel(s, levelFilter)) return false;
    if (classFilter && !s.classes.includes(classFilter)) return false;
    if (q && !s.name.toLowerCase().includes(q) && !s.school?.toLowerCase().includes(q) && !s.classes.some((c) => c.toLowerCase().includes(q))) return false;
    return true;
  }), [q, levelFilter, classFilter]);

  // Group by school
  const groups = useMemo(() => {
    const map = new Map<string, DndSpellData[]>();
    for (const spell of filtered) {
      const key = spell.school ?? "Outro";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(spell);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Stack spacing={2}>
      {/* Search */}
      <TextField
        placeholder="Buscar por nome, escola ou classe…"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={inputSx}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ fontSize: 17 }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Level filter */}
      <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap" }}>
        {LEVEL_FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={levelFilter === f.value}
            onClick={() => setLevelFilter(f.value)}
          />
        ))}
      </Box>

      {/* Class filter */}
      <Box sx={{ display: "flex", gap: 0.6, flexWrap: "wrap" }}>
        <FilterChip
          label="Todas as classes"
          active={classFilter === null}
          onClick={() => setClassFilter(null)}
        />
        {allClasses.map((cls) => (
          <FilterChip
            key={cls}
            label={cls}
            active={classFilter === cls}
            onClick={() => setClassFilter(classFilter === cls ? null : cls)}
          />
        ))}
      </Box>

      {/* Content */}
      {groups.length === 0 ? (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            Nenhuma magia encontrada.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {groups.map(([school, spells]) => (
            <SchoolGroup key={school} school={school} spells={spells} />
          ))}
        </Stack>
      )}

      {/* Summary */}
      {filtered.length > 0 && (
        <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
          {filtered.length} magia{filtered.length !== 1 ? "s" : ""} · {groups.length} escola{groups.length !== 1 ? "s" : ""}
        </Typography>
      )}
    </Stack>
  );
}
