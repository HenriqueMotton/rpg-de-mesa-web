import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CollectionsBookmarkRoundedIcon from "@mui/icons-material/CollectionsBookmarkRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import AppDialog, { AppDialogConfirmButton } from "../../components/ui/AppDialog";
import {
  SectionDivider,
  SectionIconBox,
  SectionLabelText,
  SkillEmptyBox,
} from "./ViewCharacter.styles";
import {
  getSpells,
  addSpell,
  updateSpell,
  deleteSpell,
  type CharacterSpell,
} from "../../modules/spells/spells.api";
import type { ClassSpellEntry } from "../../modules/classes/classes.api";

const SCHOOLS = [
  { value: "Abjuração", icon: "🛡️" },
  { value: "Adivinhação", icon: "🔮" },
  { value: "Conjuração", icon: "✨" },
  { value: "Encantamento", icon: "💫" },
  { value: "Evocação", icon: "🔥" },
  { value: "Ilusão", icon: "🌀" },
  { value: "Necromancia", icon: "💀" },
  { value: "Transmutação", icon: "⚗️" },
];

const LEVELS = [
  { value: 0, label: "Truque (0)" },
  { value: 1, label: "1º Círculo" },
  { value: 2, label: "2º Círculo" },
  { value: 3, label: "3º Círculo" },
  { value: 4, label: "4º Círculo" },
  { value: 5, label: "5º Círculo" },
  { value: 6, label: "6º Círculo" },
  { value: 7, label: "7º Círculo" },
  { value: 8, label: "8º Círculo" },
  { value: 9, label: "9º Círculo" },
];

function getSchoolIcon(school: string | null) {
  return SCHOOLS.find((s) => s.value === school)?.icon ?? "✨";
}

function levelLabel(level: number) {
  if (level === 0) return "Truque";
  return `${level}º`;
}

function levelColor(level: number) {
  if (level === 0) return { bg: "rgba(80,160,120,0.12)", border: "rgba(80,160,120,0.22)", text: "rgba(100,220,160,0.9)" };
  if (level <= 2) return { bg: "rgba(80,120,200,0.12)", border: "rgba(80,120,200,0.22)", text: "rgba(120,170,255,0.9)" };
  if (level <= 4) return { bg: "rgba(120,80,220,0.12)", border: "rgba(120,80,220,0.22)", text: "rgba(170,130,255,0.9)" };
  if (level <= 6) return { bg: "rgba(180,80,180,0.12)", border: "rgba(180,80,180,0.22)", text: "rgba(230,140,230,0.9)" };
  return { bg: "rgba(200,60,60,0.12)", border: "rgba(200,60,60,0.22)", text: "rgba(255,130,130,0.9)" };
}

const EMPTY_FORM = {
  name: "",
  level: "0",
  school: "Evocação",
  castingTime: "1 ação",
  range: "Pessoal",
  duration: "Instantâneo",
  componentV: false,
  componentS: false,
  componentM: false,
  materialComponent: "",
  description: "",
  prepared: false,
};

const inputSx = {
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13.5 },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(160,130,255,0.9)" },
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
  },
};

const selectSx = {
  borderRadius: "12px",
  backgroundColor: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.92)",
  fontSize: 14,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.09)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.4)" },
};

const menuPaperSx = {
  bgcolor: "rgba(14,11,26,0.97)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  "& .MuiMenuItem-root": {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13.5,
    "&:hover": { bgcolor: "rgba(120,85,255,0.12)" },
    "&.Mui-selected": { bgcolor: "rgba(120,85,255,0.18)" },
  },
};

const checkboxSx = {
  color: "rgba(255,255,255,0.25)",
  "&.Mui-checked": { color: "rgba(140,100,255,0.9)" },
};

interface Props {
  characterId: number | string;
  classSpells?: ClassSpellEntry[];
  characterNivel?: number;
}

type LevelFilter = "todos" | "truques" | "1-3" | "4-6" | "7-9";

const LEVEL_FILTERS: { value: LevelFilter; label: string }[] = [
  { value: "todos",   label: "Todos" },
  { value: "truques", label: "Truques" },
  { value: "1-3",     label: "1°–3°" },
  { value: "4-6",     label: "4°–6°" },
  { value: "7-9",     label: "7°–9°" },
];

function matchesFilter(spell: CharacterSpell, filter: LevelFilter) {
  if (filter === "todos")   return true;
  if (filter === "truques") return spell.level === 0;
  if (filter === "1-3")     return spell.level >= 1 && spell.level <= 3;
  if (filter === "4-6")     return spell.level >= 4 && spell.level <= 6;
  if (filter === "7-9")     return spell.level >= 7;
  return true;
}

// Group spells by level
function groupByLevel(spells: CharacterSpell[]) {
  const groups: Record<number, CharacterSpell[]> = {};
  for (const spell of spells) {
    if (!groups[spell.level]) groups[spell.level] = [];
    groups[spell.level].push(spell);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, list]) => ({ level: Number(level), list }));
}

type View = "grimorio" | "catalogo";

export default function GrimorioSection({ characterId, classSpells = [], characterNivel = 1 }: Props) {
  const [view, setView] = useState<View>("grimorio");
  const [spells, setSpells] = useState<CharacterSpell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("todos");
  const [addingCatalog, setAddingCatalog] = useState<string | null>(null);
  const [detailCatalogSpell, setDetailCatalogSpell] = useState<ClassSpellEntry | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editSpell, setEditSpell] = useState<CharacterSpell | null>(null);
  const [deleteSpellItem, setDeleteSpellItem] = useState<CharacterSpell | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSpells(characterId);
      setSpells(data);
    } catch {
      setError("Não foi possível carregar o grimório.");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setAddOpen(true);
  }

  function openEdit(spell: CharacterSpell) {
    setForm({
      name: spell.name,
      level: String(spell.level),
      school: spell.school ?? "Evocação",
      castingTime: spell.castingTime ?? "1 ação",
      range: spell.range ?? "Pessoal",
      duration: spell.duration ?? "Instantâneo",
      componentV: spell.componentV,
      componentS: spell.componentS,
      componentM: spell.componentM,
      materialComponent: spell.materialComponent ?? "",
      description: spell.description ?? "",
      prepared: spell.prepared,
    });
    setFormError(null);
    setEditSpell(spell);
  }

  function validateForm() {
    if (!form.name.trim()) { setFormError("O nome da magia é obrigatório."); return false; }
    return true;
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      level: Number(form.level),
      school: form.school || undefined,
      castingTime: form.castingTime.trim() || undefined,
      range: form.range.trim() || undefined,
      duration: form.duration.trim() || undefined,
      componentV: form.componentV,
      componentS: form.componentS,
      componentM: form.componentM,
      materialComponent: form.materialComponent.trim() || undefined,
      description: form.description.trim() || undefined,
      prepared: form.prepared,
    };
  }

  async function handleAdd() {
    if (!validateForm()) return;
    setSaving(true);
    setFormError(null);
    try {
      await addSpell(characterId, buildPayload());
      setAddOpen(false);
      await load();
    } catch {
      setFormError("Não foi possível adicionar a magia.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editSpell || !validateForm()) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateSpell(editSpell.id, buildPayload());
      setEditSpell(null);
      await load();
    } catch {
      setFormError("Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteSpellItem) return;
    setSaving(true);
    try {
      await deleteSpell(deleteSpellItem.id);
      setDeleteSpellItem(null);
      await load();
    } catch {
      setError("Não foi possível remover a magia.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePrepared(spell: CharacterSpell) {
    try {
      await updateSpell(spell.id, { prepared: !spell.prepared });
      await load();
    } catch {
      // silently fail
    }
  }

  const spellForm = (title: string, open: boolean, onClose: () => void, onConfirm: () => void) => (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      dividers
      actions={
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <Button
            onClick={onClose}
            variant="text"
            startIcon={<CloseRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: "12px",
              color: "rgba(255,255,255,0.3)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" },
            }}
          >
            Cancelar
          </Button>
          <Box sx={{ flex: 1 }} />
          <AppDialogConfirmButton
            onClick={onConfirm}
            disabled={saving}
            sx={{ px: 4, py: 1.2, borderRadius: "12px" }}
          >
            {saving ? <CircularProgress size={13} sx={{ color: "rgba(200,180,255,0.7)" }} /> : "Salvar"}
          </AppDialogConfirmButton>
        </Stack>
      }
    >
      <Stack spacing={2}>
        {formError && (
          <Alert
            severity="error"
            sx={{
              borderRadius: "10px", py: 0.5,
              bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)",
              color: "rgba(255,150,150,0.9)", fontSize: 13,
              "& .MuiAlert-icon": { color: "rgba(255,110,110,0.7)", fontSize: 18 },
            }}
          >
            {formError}
          </Alert>
        )}

        <TextField
          label="Nome da magia"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          fullWidth
          sx={inputSx}
        />

        <Stack direction="row" spacing={1.5}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", mb: 0.75, ml: 0.25 }}>
              Nível
            </Typography>
            <Select
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              fullWidth
              sx={selectSx}
              MenuProps={{ PaperProps: { sx: menuPaperSx } }}
            >
              {LEVELS.map((l) => (
                <MenuItem key={l.value} value={String(l.value)}>{l.label}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", mb: 0.75, ml: 0.25 }}>
              Escola
            </Typography>
            <Select
              value={form.school}
              onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              fullWidth
              sx={selectSx}
              MenuProps={{ PaperProps: { sx: menuPaperSx } }}
            >
              {SCHOOLS.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.icon} {s.value}</MenuItem>
              ))}
            </Select>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Tempo de conjuração"
            value={form.castingTime}
            onChange={(e) => setForm((f) => ({ ...f, castingTime: e.target.value }))}
            sx={{ ...inputSx, flex: 1 }}
          />
          <TextField
            label="Alcance"
            value={form.range}
            onChange={(e) => setForm((f) => ({ ...f, range: e.target.value }))}
            sx={{ ...inputSx, flex: 1 }}
          />
        </Stack>

        <TextField
          label="Duração"
          value={form.duration}
          onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          fullWidth
          sx={inputSx}
        />

        <Box>
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", mb: 0.5, ml: 0.25 }}>
            Componentes
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {(["V", "S", "M"] as const).map((comp) => {
              const key = `component${comp}` as "componentV" | "componentS" | "componentM";
              return (
                <FormControlLabel
                  key={comp}
                  control={
                    <Checkbox
                      checked={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                      size="small"
                      sx={checkboxSx}
                    />
                  }
                  label={<Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{comp}</Typography>}
                />
              );
            })}
          </Stack>
          {form.componentM && (
            <TextField
              label="Material (descrição)"
              value={form.materialComponent}
              onChange={(e) => setForm((f) => ({ ...f, materialComponent: e.target.value }))}
              fullWidth
              size="small"
              sx={{ ...inputSx, mt: 1 }}
            />
          )}
        </Box>

        {Number(form.level) > 0 && (
          <FormControlLabel
            control={
              <Checkbox
                checked={form.prepared}
                onChange={(e) => setForm((f) => ({ ...f, prepared: e.target.checked }))}
                size="small"
                sx={checkboxSx}
              />
            }
            label={<Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Preparada</Typography>}
          />
        )}

        <TextField
          label="Descrição (opcional)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          fullWidth
          multiline
          rows={3}
          sx={inputSx}
        />
      </Stack>
    </AppDialog>
  );

  async function handleAddFromCatalog(entry: ClassSpellEntry) {
    const key = entry.name;
    setAddingCatalog(key);
    try {
      await addSpell(characterId, {
        name: entry.name,
        level: entry.level,
        school: entry.school,
        castingTime: entry.castingTime,
        range: entry.range,
        duration: entry.duration,
        componentV: entry.componentV,
        componentS: entry.componentS,
        componentM: entry.componentM,
        materialComponent: entry.materialComponent,
        description: entry.description,
        prepared: false,
      });
      await load();
    } catch {
      // silently fail
    } finally {
      setAddingCatalog(null);
    }
  }

  const filteredSpells = spells.filter((s) => matchesFilter(s, levelFilter));
  const groups = groupByLevel(filteredSpells);

  const learnedNames = new Set(spells.map((s) => s.name));
  const availableCatalog = classSpells.filter((s) => s.unlockLevel <= characterNivel);
  const lockedCatalog    = classSpells.filter((s) => s.unlockLevel > characterNivel);
  const catalogByLevel   = [...availableCatalog].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const hasCatalog = classSpells.length > 0;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <SectionIconBox>
          <AutoStoriesRoundedIcon sx={{ fontSize: 14, color: "rgba(180,150,255,0.7)" }} />
        </SectionIconBox>
        <SectionLabelText>Grimório</SectionLabelText>
        <SectionDivider />
      </Stack>

      {/* Tab switcher — segmented control */}
      {hasCatalog && (
        <Box sx={{
          display: "flex", gap: 0.5,
          bgcolor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          p: 0.5,
          mb: 2,
        }}>
          {([
            { v: "grimorio",  label: "Meu Grimório", icon: <AutoStoriesRoundedIcon sx={{ fontSize: 15 }} /> },
            { v: "catalogo",  label: `Catálogo`,      icon: <CollectionsBookmarkRoundedIcon sx={{ fontSize: 15 }} />, badge: availableCatalog.length },
          ] as { v: View; label: string; icon: React.ReactNode; badge?: number }[]).map(({ v, label, icon, badge }) => {
            const active = view === v;
            return (
              <Box
                key={v}
                onClick={() => setView(v)}
                sx={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 0.75, py: 1, borderRadius: "12px", cursor: "pointer",
                  bgcolor: active ? "rgba(120,85,255,0.82)" : "transparent",
                  boxShadow: active ? "0 2px 14px rgba(100,70,220,0.38)" : "none",
                  transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
                  "&:hover": !active ? { bgcolor: "rgba(255,255,255,0.05)" } : {},
                }}
              >
                <Box sx={{ color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.35)", display: "flex", transition: "color 0.2s" }}>
                  {icon}
                </Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: active ? 800 : 600, color: active ? "#fff" : "rgba(255,255,255,0.38)", lineHeight: 1, transition: "color 0.2s" }}>
                  {label}
                </Typography>
                {badge !== undefined && badge > 0 && (
                  <Box sx={{
                    minWidth: 18, height: 18, borderRadius: "99px",
                    bgcolor: active ? "rgba(255,255,255,0.22)" : "rgba(120,85,255,0.55)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    px: 0.6,
                  }}>
                    <Typography sx={{ fontSize: 9.5, fontWeight: 900, color: active ? "#fff" : "rgba(220,200,255,0.95)", lineHeight: 1 }}>
                      {badge}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── CATÁLOGO ─────────────────────────────────────────────── */}
      {view === "catalogo" && (
        <Stack spacing={1.5}>
          {catalogByLevel.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                Nenhuma magia disponível para o nível atual.
              </Typography>
            </Box>
          ) : (
            (() => {
              const groups: Record<number, ClassSpellEntry[]> = {};
              for (const s of catalogByLevel) {
                if (!groups[s.level]) groups[s.level] = [];
                groups[s.level].push(s);
              }
              return Object.entries(groups)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([lvl, list]) => {
                  const lc = levelColor(Number(lvl));
                  return (
                    <Box key={lvl}>
                      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.75, px: 0.5 }}>
                        <Chip label={levelLabel(Number(lvl))} size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 800, bgcolor: lc.bg, border: `1px solid ${lc.border}`, color: lc.text, "& .MuiChip-label": { px: 1 } }} />
                        <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255,255,255,0.06)" }} />
                      </Stack>
                      <Stack spacing={0.75}>
                        {list.map((entry) => {
                          const learned = learnedNames.has(entry.name);
                          const adding  = addingCatalog === entry.name;
                          return (
                            <Box key={entry.name} sx={{ display: "flex", alignItems: "center", gap: 1.25, pl: 1.5, pr: 0.75, py: 1, borderRadius: "13px", border: `1px solid ${learned ? "rgba(120,85,255,0.2)" : "rgba(255,255,255,0.06)"}`, bgcolor: learned ? "rgba(120,85,255,0.06)" : "rgba(255,255,255,0.025)" }}>
                              <Box sx={{ width: 34, height: 34, borderRadius: "10px", display: "grid", placeItems: "center", bgcolor: lc.bg, border: `1px solid ${lc.border}`, fontSize: 16, flexShrink: 0 }}>
                                {getSchoolIcon(entry.school)}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: "rgba(255,255,255,0.88)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {entry.name}
                                </Typography>
                                <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>
                                  {entry.school}{entry.castingTime ? ` · ${entry.castingTime}` : ""}
                                </Typography>
                              </Box>
                              <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
                                <Tooltip title="Ver detalhes" placement="top">
                                  <IconButton size="small" onClick={() => setDetailCatalogSpell(entry)} sx={{ color: "rgba(255,255,255,0.22)", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.06)" } }}>
                                    <InfoOutlinedIcon sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                                {learned ? (
                                  <Chip label="No grimório" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: "rgba(120,85,255,0.15)", color: "rgba(180,150,255,0.8)", border: "1px solid rgba(120,85,255,0.22)", "& .MuiChip-label": { px: 0.75 } }} />
                                ) : (
                                  <Tooltip title="Adicionar ao grimório" placement="top">
                                    <IconButton size="small" onClick={() => handleAddFromCatalog(entry)} disabled={adding} sx={{ color: "rgba(120,85,255,0.6)", "&:hover": { color: "rgba(160,130,255,0.9)", bgcolor: "rgba(120,85,255,0.12)" } }}>
                                      {adding ? <CircularProgress size={13} sx={{ color: "rgba(160,130,255,0.6)" }} /> : <AddRoundedIcon sx={{ fontSize: 16 }} />}
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  );
                });
            })()
          )}

          {/* Magias bloqueadas */}
          {lockedCatalog.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1, px: 0.5 }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
                  Bloqueadas
                </Typography>
                <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255,255,255,0.05)" }} />
              </Stack>
              <Stack spacing={0.5}>
                {lockedCatalog.sort((a, b) => a.unlockLevel - b.unlockLevel || a.level - b.level).map((entry) => (
                  <Box key={entry.name} sx={{ display: "flex", alignItems: "center", gap: 1.25, pl: 1.5, pr: 1, py: 0.85, borderRadius: "13px", border: "1px solid rgba(255,255,255,0.04)", bgcolor: "rgba(255,255,255,0.01)", opacity: 0.5 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: "9px", display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 14, flexShrink: 0 }}>
                      🔒
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.name}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                        {entry.school} · {Number(entry.level) === 0 ? "Truque" : `${entry.level}º círculo`}
                      </Typography>
                    </Box>
                    <Box sx={{ px: 0.9, py: 0.25, borderRadius: "7px", bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>
                        Nv {entry.unlockLevel}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      {/* ── MEU GRIMÓRIO ─────────────────────────────────────────── */}
      {view === "grimorio" && (
        <>
      {/* Level filter chips */}
      {!loading && spells.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            flexWrap: "wrap",
            mb: 2,
          }}
        >
          {LEVEL_FILTERS.map((f) => {
            const active = levelFilter === f.value;
            const count = f.value === "todos"
              ? spells.length
              : spells.filter((s) => matchesFilter(s, f.value)).length;
            if (f.value !== "todos" && count === 0) return null;
            return (
              <Box
                key={f.value}
                onClick={() => setLevelFilter(f.value)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.25,
                  py: 0.4,
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: active
                    ? "1px solid rgba(120,85,255,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                  bgcolor: active
                    ? "rgba(120,85,255,0.15)"
                    : "rgba(255,255,255,0.03)",
                  transition: "all .15s",
                  "&:hover": {
                    bgcolor: active
                      ? "rgba(120,85,255,0.2)"
                      : "rgba(255,255,255,0.06)",
                    borderColor: active
                      ? "rgba(120,85,255,0.6)"
                      : "rgba(255,255,255,0.14)",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: active ? 800 : 600,
                    color: active ? "rgba(200,175,255,0.95)" : "rgba(255,255,255,0.4)",
                    lineHeight: 1,
                  }}
                >
                  {f.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: active ? "rgba(180,150,255,0.7)" : "rgba(255,255,255,0.22)",
                    lineHeight: 1,
                  }}
                >
                  {count}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
          <CircularProgress size={24} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            borderRadius: "10px", py: 0.5,
            bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)",
            color: "rgba(255,150,150,0.9)", fontSize: 13,
          }}
        >
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {spells.length === 0 ? (
            <SkillEmptyBox>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                Nenhuma magia no grimório.
              </Typography>
            </SkillEmptyBox>
          ) : filteredSpells.length === 0 ? (
            <SkillEmptyBox>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                Nenhuma magia nesse nível.
              </Typography>
            </SkillEmptyBox>
          ) : (
            groups.map(({ level, list }) => {
              const lc = levelColor(level);
              return (
                <Box key={level}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.75,
                      px: 0.5,
                    }}
                  >
                    <Chip
                      label={levelLabel(level)}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10.5,
                        fontWeight: 800,
                        bgcolor: lc.bg,
                        border: `1px solid ${lc.border}`,
                        color: lc.text,
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                    <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255,255,255,0.06)" }} />
                  </Box>

                  <Stack spacing={0.75}>
                    {list.map((spell) => (
                      <Box
                        key={spell.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                          pl: 1.5,
                          pr: 0.75,
                          py: 1,
                          borderRadius: "13px",
                          border: "1px solid rgba(255,255,255,0.06)",
                          bgcolor: spell.prepared
                            ? "rgba(120,85,255,0.06)"
                            : "rgba(255,255,255,0.025)",
                          transition: "all .15s",
                          "&:hover": {
                            bgcolor: spell.prepared
                              ? "rgba(120,85,255,0.1)"
                              : "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "10px",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: lc.bg,
                            border: `1px solid ${lc.border}`,
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        >
                          {getSchoolIcon(spell.school)}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 13.5,
                                color: "rgba(255,255,255,0.88)",
                                lineHeight: 1.2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {spell.name}
                            </Typography>
                            {spell.prepared && level > 0 && (
                              <Chip
                                label="Preparada"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  bgcolor: "rgba(120,85,255,0.18)",
                                  color: "rgba(180,150,255,0.9)",
                                  border: "1px solid rgba(120,85,255,0.25)",
                                  "& .MuiChip-label": { px: 0.75 },
                                }}
                              />
                            )}
                          </Stack>
                          <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>
                            {spell.school ?? "—"}
                            {spell.castingTime ? ` · ${spell.castingTime}` : ""}
                          </Typography>
                        </Box>

                        {level > 0 && (
                          <Tooltip title={spell.prepared ? "Desmarcar preparada" : "Marcar como preparada"} placement="top">
                            <IconButton
                              size="small"
                              onClick={() => handleTogglePrepared(spell)}
                              sx={{
                                color: spell.prepared
                                  ? "rgba(140,100,255,0.8)"
                                  : "rgba(255,255,255,0.2)",
                                "&:hover": { color: "rgba(160,130,255,0.9)", bgcolor: "rgba(120,85,255,0.12)" },
                              }}
                            >
                              <AutoStoriesRoundedIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Editar" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(spell)}
                            sx={{
                              color: "rgba(160,130,255,0.5)",
                              "&:hover": { color: "rgba(160,130,255,0.9)", bgcolor: "rgba(120,85,255,0.12)" },
                            }}
                          >
                            <EditRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Remover" placement="top">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteSpellItem(spell)}
                            sx={{
                              color: "rgba(220,80,80,0.4)",
                              "&:hover": { color: "rgba(255,120,120,0.9)", bgcolor: "rgba(220,60,60,0.1)" },
                            }}
                          >
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              );
            })
          )}

          <Button
            onClick={openAdd}
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            fullWidth
            sx={{
              borderRadius: "13px",
              py: 1.1,
              textTransform: "none",
              fontWeight: 800,
              fontSize: 13,
              borderColor: "rgba(120,85,255,0.25)",
              color: "rgba(180,150,255,0.8)",
              bgcolor: "rgba(120,85,255,0.05)",
              "&:hover": { borderColor: "rgba(120,85,255,0.45)", bgcolor: "rgba(120,85,255,0.1)" },
            }}
          >
            Adicionar magia
          </Button>
        </Stack>
      )}

        </>
      )}

      {/* Dialog de detalhes da magia do catálogo */}
      <AppDialog
        open={detailCatalogSpell !== null}
        onClose={() => setDetailCatalogSpell(null)}
        title={detailCatalogSpell?.name ?? ""}
        dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button
              onClick={() => setDetailCatalogSpell(null)}
              variant="text"
              startIcon={<CloseRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}
            >
              Fechar
            </Button>
            <Box sx={{ flex: 1 }} />
            {detailCatalogSpell && !learnedNames.has(detailCatalogSpell.name) && (
              <AppDialogConfirmButton
                onClick={() => { handleAddFromCatalog(detailCatalogSpell); setDetailCatalogSpell(null); }}
                disabled={addingCatalog === detailCatalogSpell?.name}
                sx={{ px: 3, py: 1.2, borderRadius: "12px" }}
              >
                <AddRoundedIcon sx={{ fontSize: 15, mr: 0.75 }} />
                Adicionar ao grimório
              </AppDialogConfirmButton>
            )}
          </Stack>
        }
      >
        {detailCatalogSpell && (() => {
          const lc = levelColor(detailCatalogSpell.level);
          const components = [
            detailCatalogSpell.componentV && "V",
            detailCatalogSpell.componentS && "S",
            detailCatalogSpell.componentM && "M",
          ].filter(Boolean).join(", ");
          return (
            <Stack spacing={2}>
              {/* nível + escola */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={detailCatalogSpell.level === 0 ? "Truque" : `${detailCatalogSpell.level}º círculo`}
                  size="small"
                  sx={{ height: 22, fontSize: 11, fontWeight: 800, bgcolor: lc.bg, border: `1px solid ${lc.border}`, color: lc.text, "& .MuiChip-label": { px: 1.1 } }}
                />
                <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
                  {getSchoolIcon(detailCatalogSpell.school)} {detailCatalogSpell.school}
                </Typography>
              </Stack>

              {/* stats grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {[
                  { label: "Tempo de conjuração", value: detailCatalogSpell.castingTime },
                  { label: "Alcance",              value: detailCatalogSpell.range },
                  { label: "Duração",               value: detailCatalogSpell.duration },
                  { label: "Componentes",            value: components || "—" },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ borderRadius: "10px", px: 1.25, py: 1, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", mb: 0.3 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* material */}
              {detailCatalogSpell.componentM && detailCatalogSpell.materialComponent && (
                <Box sx={{ borderRadius: "10px", px: 1.25, py: 1, bgcolor: "rgba(255,195,80,0.04)", border: "1px solid rgba(255,195,80,0.12)" }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,195,80,0.4)", mb: 0.3 }}>
                    Material
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "rgba(255,215,120,0.7)", lineHeight: 1.5 }}>
                    {detailCatalogSpell.materialComponent}
                  </Typography>
                </Box>
              )}

              {/* descrição */}
              <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                {detailCatalogSpell.description}
              </Typography>
            </Stack>
          );
        })()}
      </AppDialog>

      {spellForm("Adicionar Magia", addOpen, () => setAddOpen(false), handleAdd)}
      {spellForm("Editar Magia", editSpell !== null, () => setEditSpell(null), handleEdit)}

      <AppDialog
        open={deleteSpellItem !== null}
        onClose={() => setDeleteSpellItem(null)}
        title="Remover Magia"
        dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button
              onClick={() => setDeleteSpellItem(null)}
              variant="text"
              startIcon={<CloseRoundedIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: "12px",
                color: "rgba(255,255,255,0.3)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" },
              }}
            >
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleDelete}
              disabled={saving}
              variant="outlined"
              sx={{
                px: 4, py: 1.2,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                borderColor: "rgba(220,60,60,0.35)",
                color: "rgba(255,140,140,0.9)",
                "&:hover": { borderColor: "rgba(220,60,60,0.6)", bgcolor: "rgba(220,60,60,0.1)" },
              }}
            >
              {saving ? <CircularProgress size={13} sx={{ color: "rgba(255,130,130,0.7)" }} /> : "Remover"}
            </Button>
          </Stack>
        }
      >
        <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)" }}>
          Tem certeza que deseja remover{" "}
          <Typography component="span" sx={{ fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
            {deleteSpellItem?.name}
          </Typography>{" "}
          do grimório?
        </Typography>
      </AppDialog>
    </Box>
  );
}
