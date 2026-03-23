import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

import { listAllCharacters } from "../../modules/characters/characters.api";
import {
  getAllTraumas,
  addTrauma,
  updateTrauma,
  deleteTrauma,
  type Trauma,
  type TraumaSeverity,
} from "../../modules/psychology/psychology.api";

// ─── Severity config ─────────────────────────────────────────────────────────

const SEV = {
  mild:     { label: "Leve",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.28)", icon: "😟" },
  moderate: { label: "Moderado", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.28)", icon: "😰" },
  severe:   { label: "Grave",    color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.28)",  icon: "😨" },
} as const;

const RACE_ICON: Record<string, string> = {
  "Anão": "⛏️", "Elfo": "🌿", "Meio-Elfo": "🌟", "Humano": "🏛️",
  "Draconato": "🐉", "Gnomo": "⚙️", "Meio-Orc": "💪", "Hobbit": "🌻",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255,255,255,0.03)", borderRadius: "10px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(239,68,68,0.45)", borderWidth: 1.5 },
  },
  "& .MuiInputBase-input": { color: "rgba(255,255,255,0.82)", fontSize: 13 },
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.3)" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

// ─── Trauma Card ─────────────────────────────────────────────────────────────

function TraumaCard({
  trauma,
  onUpdate,
  onDelete,
}: {
  trauma: Trauma;
  onUpdate: (t: Trauma) => void;
  onDelete: (id: number) => void;
}) {
  const sev = SEV[trauma.severity as TraumaSeverity] ?? SEV.mild;
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    try {
      const updated = await updateTrauma(trauma.id, { isActive: !trauma.isActive });
      onUpdate(updated);
    } finally { setBusy(false); }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteTrauma(trauma.id);
      onDelete(trauma.id);
    } finally { setBusy(false); }
  }

  return (
    <Box sx={{
      px: 1.4, py: 1.1, borderRadius: "12px",
      border: `1px solid ${trauma.isActive ? sev.border : "rgba(255,255,255,0.07)"}`,
      bgcolor: trauma.isActive ? sev.bg : "rgba(255,255,255,0.02)",
      opacity: trauma.isActive ? 1 : 0.55,
      transition: "all .15s",
    }}>
      <Stack direction="row" alignItems="flex-start" gap={1}>
        <Typography sx={{ fontSize: 18, lineHeight: 1, mt: 0.15, flexShrink: 0 }}>
          {trauma.isActive ? sev.icon : "✅"}
        </Typography>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
            <Typography sx={{
              fontSize: 13, fontWeight: 800,
              color: trauma.isActive ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.45)",
              textDecoration: trauma.isActive ? "none" : "line-through",
            }}>
              {trauma.title}
            </Typography>
            <Box sx={{
              px: 0.7, py: 0.1, borderRadius: "5px",
              bgcolor: trauma.isActive ? sev.bg : "rgba(255,255,255,0.05)",
              border: `1px solid ${trauma.isActive ? sev.border : "rgba(255,255,255,0.1)"}`,
            }}>
              <Typography sx={{
                fontSize: 9.5, fontWeight: 800, letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: trauma.isActive ? sev.color : "rgba(255,255,255,0.3)",
              }}>
                {sev.label}
              </Typography>
            </Box>
            {!trauma.isActive && (
              <Box sx={{ px: 0.7, py: 0.1, borderRadius: "5px", bgcolor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.22)" }}>
                <Typography sx={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(100,220,140,0.85)" }}>
                  Resolvido
                </Typography>
              </Box>
            )}
          </Stack>
          {trauma.description && (
            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.42)", mt: 0.35, lineHeight: 1.55 }}>
              {trauma.description}
            </Typography>
          )}
          <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.2)", mt: 0.4 }}>
            {formatDate(trauma.createdAt)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
          <Tooltip title={trauma.isActive ? "Marcar como resolvido" : "Reativar"}>
            <IconButton
              size="small" disabled={busy} onClick={toggleActive}
              sx={{
                color: trauma.isActive ? "rgba(100,220,140,0.7)" : "rgba(255,255,255,0.25)",
                "&:hover": { bgcolor: trauma.isActive ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)" },
              }}
            >
              {trauma.isActive
                ? <CheckRoundedIcon sx={{ fontSize: 15 }} />
                : <UndoRoundedIcon sx={{ fontSize: 15 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Remover trauma">
            <IconButton
              size="small" disabled={busy} onClick={handleDelete}
              sx={{ color: "rgba(255,255,255,0.18)", "&:hover": { color: "#ef4444", bgcolor: "rgba(239,68,68,0.08)" } }}
            >
              <DeleteRoundedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── Add Trauma Form ──────────────────────────────────────────────────────────

function AddTraumaForm({
  characterId,
  onAdded,
}: {
  characterId: number;
  onAdded: (t: Trauma) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<TraumaSeverity>("mild");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const t = await addTrauma(characterId, {
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
      });
      onAdded(t);
      setTitle(""); setDescription(""); setSeverity("mild"); setOpen(false);
    } finally { setSaving(false); }
  }

  if (!open) {
    return (
      <Box
        onClick={() => setOpen(true)}
        sx={{
          display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.8,
          borderRadius: "10px", cursor: "pointer",
          border: "1px dashed rgba(239,68,68,0.25)",
          bgcolor: "rgba(239,68,68,0.04)",
          transition: "all .13s",
          "&:hover": { bgcolor: "rgba(239,68,68,0.09)", borderColor: "rgba(239,68,68,0.4)" },
        }}
      >
        <AddRoundedIcon sx={{ fontSize: 15, color: "rgba(255,120,120,0.6)" }} />
        <Typography sx={{ fontSize: 12.5, color: "rgba(255,120,120,0.6)", fontWeight: 700 }}>
          Adicionar trauma…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1.5, borderRadius: "12px", border: "1px solid rgba(239,68,68,0.22)", bgcolor: "rgba(239,68,68,0.05)" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,120,120,0.7)", mb: 1.25 }}>
        Novo Trauma
      </Typography>
      <Stack spacing={1}>
        <TextField
          autoFocus size="small"
          placeholder="Ex: Medo de dragões, Pesadelos recorrentes…"
          value={title} onChange={(e) => setTitle(e.target.value)}
          fullWidth sx={inputSx}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit(); if (e.key === "Escape") setOpen(false); }}
        />
        <TextField
          size="small" placeholder="Descrição (opcional)…"
          value={description} onChange={(e) => setDescription(e.target.value)}
          multiline minRows={2} fullWidth sx={inputSx}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <Select
            size="small" value={severity}
            onChange={(e) => setSeverity(e.target.value as TraumaSeverity)}
            sx={{ ...inputSx, flex: 1, "& .MuiSelect-select": { py: 0.85, fontSize: 13, color: SEV[severity].color } }}
          >
            {(["mild", "moderate", "severe"] as TraumaSeverity[]).map((s) => (
              <MenuItem key={s} value={s}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Typography sx={{ fontSize: 14 }}>{SEV[s].icon}</Typography>
                  <Typography sx={{ fontSize: 13, color: SEV[s].color, fontWeight: 700 }}>{SEV[s].label}</Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
          <Box component="button" onClick={() => { setOpen(false); setTitle(""); setDescription(""); setSeverity("mild"); }}
            sx={{ px: 1.25, py: 0.65, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px", bgcolor: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 700, cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}
          >
            Cancelar
          </Box>
          <Box component="button" disabled={saving || !title.trim()} onClick={handleSubmit}
            sx={{ px: 1.5, py: 0.65, border: "none", borderRadius: "9px", bgcolor: "rgba(239,68,68,0.18)", color: "rgba(255,130,130,0.95)", fontSize: 12, fontWeight: 800, cursor: "pointer", transition: "all .12s", "&:hover:not(:disabled)": { bgcolor: "rgba(239,68,68,0.3)" }, "&:disabled": { opacity: 0.4, cursor: "not-allowed" } }}
          >
            {saving ? "Salvando…" : "Adicionar"}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── Character Block ──────────────────────────────────────────────────────────
// Receives traumas as prop (controlled by parent) so parent filter stays in sync

type CharEntry = {
  id: number;
  name: string;
  dndClass?: { name: string; icon: string } | null;
  race?: { name: string } | null;
  idUser?: { name: string } | null;
};

function CharacterBlock({
  char,
  traumas,
  onAdd,
  onUpdate,
  onDelete,
}: {
  char: CharEntry;
  traumas: Trauma[];
  onAdd: (t: Trauma) => void;
  onUpdate: (t: Trauma) => void;
  onDelete: (id: number) => void;
}) {
  const activeCount = traumas.filter((t) => t.isActive).length;
  const [expanded, setExpanded] = useState(activeCount > 0);
  const raceName = (char as any).race?.name ?? "";

  // Auto-expand when a new active trauma is added
  useEffect(() => {
    if (activeCount > 0) setExpanded(true);
  }, [activeCount]);

  return (
    <Box sx={{
      borderRadius: "14px",
      border: `1px solid ${activeCount > 0 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
      bgcolor: activeCount > 0 ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)",
      overflow: "hidden",
      transition: "border-color .15s",
    }}>
      {/* Header */}
      <Box
        onClick={() => setExpanded((p) => !p)}
        sx={{ px: 1.5, py: 1.25, cursor: "pointer", display: "flex", alignItems: "center", gap: 1.25 }}
      >
        <Typography sx={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
          {char.dndClass?.icon ?? "🎲"}
        </Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
            <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: "rgba(255,255,255,0.88)", lineHeight: 1.2 }}>
              {char.name}
            </Typography>
            {activeCount > 0 && (
              <Box sx={{ px: 0.7, py: 0.15, borderRadius: "6px", bgcolor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#ef4444" }}>
                  {activeCount} ativo{activeCount !== 1 ? "s" : ""}
                </Typography>
              </Box>
            )}
          </Stack>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)", mt: 0.15 }}>
            {[
              char.dndClass?.name,
              raceName ? `${RACE_ICON[raceName] ?? "🎲"} ${raceName}` : null,
              (char as any).idUser?.name ? `👤 ${(char as any).idUser.name}` : null,
            ].filter(Boolean).join(" · ")}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
          {expanded ? <ExpandLessRoundedIcon sx={{ fontSize: 16 }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>

      {/* Body */}
      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Box sx={{ height: "1px", bgcolor: "rgba(255,255,255,0.06)", mb: 1.25 }} />
          <Stack spacing={0.75}>
            {traumas.length === 0 && (
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic", px: 0.5 }}>
                Nenhum trauma registrado.
              </Typography>
            )}
            {traumas.map((t) => (
              <TraumaCard key={t.id} trauma={t} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
            <AddTraumaForm characterId={char.id} onAdded={onAdd} />
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

const FILTERS = [
  { id: "active", label: "Com trauma ativo" },
  { id: "all",    label: "Todos" },
] as const;

export default function PsychologyMasterPanel() {
  const [characters, setCharacters] = useState<CharEntry[]>([]);
  // Single source of truth for all traumas — both filter and blocks read from here
  const [traumas, setTraumas] = useState<Trauma[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "all">("active");

  useEffect(() => {
    Promise.all([
      listAllCharacters(),
      getAllTraumas().catch(() => []),
    ]).then(([chars, t]) => {
      setCharacters(chars as CharEntry[]);
      setTraumas(t);
    }).finally(() => setLoading(false));
  }, []);

  // Callbacks passed down — all mutate the top-level `traumas` array
  function handleAdd(t: Trauma) {
    setTraumas((prev) => [t, ...prev]);
  }
  function handleUpdate(updated: Trauma) {
    setTraumas((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }
  function handleDelete(id: number) {
    setTraumas((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={22} sx={{ color: "rgba(239,68,68,0.6)" }} />
      </Box>
    );
  }

  // Build traumaMap from the single source of truth
  const traumaMap = new Map<number, Trauma[]>();
  for (const t of traumas) {
    // `t.character` is populated when fetched via getAllTraumas()
    // When added via addTrauma(), the backend returns the trauma without the full char relation,
    // but we tag it with characterId in handleAdd below — see note.
    const cid: number | undefined = (t as any).character?.id ?? (t as any).characterId;
    if (cid == null) continue;
    if (!traumaMap.has(cid)) traumaMap.set(cid, []);
    traumaMap.get(cid)!.push(t);
  }

  // filter: "active" shows only characters that have at least 1 active trauma
  const filtered = filter === "active"
    ? characters.filter((c) => (traumaMap.get(c.id) ?? []).some((t) => t.isActive))
    : characters;

  const totalActive = traumas.filter((t) => t.isActive).length;

  return (
    <Box>
      {/* Summary banner */}
      {totalActive > 0 && (
        <Box sx={{
          mb: 1.75, px: 1.5, py: 1.1, borderRadius: "12px",
          bgcolor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", gap: 1.25,
        }}>
          <Typography sx={{ fontSize: 20, lineHeight: 1 }}>🧠</Typography>
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "rgba(255,150,150,0.9)" }}>
              {totalActive} trauma{totalActive !== 1 ? "s" : ""} ativo{totalActive !== 1 ? "s" : ""} na campanha
            </Typography>
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              Gerencie os efeitos psicológicos dos personagens
            </Typography>
          </Box>
        </Box>
      )}

      {/* Filter chips */}
      <Stack direction="row" gap={0.75} sx={{ mb: 1.5 }}>
        {FILTERS.map(({ id, label }) => {
          const active = filter === id;
          return (
            <Chip
              key={id} label={label} size="small"
              onClick={() => setFilter(id)}
              sx={{
                fontSize: 12, fontWeight: active ? 800 : 600,
                bgcolor: active ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                color: active ? "rgba(255,130,130,0.9)" : "rgba(255,255,255,0.4)",
                border: "1px solid",
                borderColor: active ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          );
        })}
      </Stack>

      {/* Character blocks */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 5 }}>
          <Typography sx={{ fontSize: 28, mb: 1 }}>🧘</Typography>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            {filter === "active"
              ? "Nenhum personagem com trauma ativo."
              : "Nenhum personagem encontrado."}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.75}>
          {filtered.map((c) => (
            <CharacterBlock
              key={c.id}
              char={c}
              traumas={traumaMap.get(c.id) ?? []}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}

      {filter === "active" && characters.length > filtered.length && (
        <Box sx={{ mt: 1.5, textAlign: "center" }}>
          <Box component="button" onClick={() => setFilter("all")}
            sx={{ px: 2, py: 0.6, border: "1px solid rgba(255,255,255,0.09)", borderRadius: "9px", bgcolor: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 700, cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" } }}
          >
            Ver todos os {characters.length} personagens
          </Box>
        </Box>
      )}
    </Box>
  );
}
