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
  Tooltip,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import {
  getDndMonsters,
  deleteMonster,
  type DndMonster,
} from "../../modules/monsters/monsters.api";
import MonsterFormModal from "./MonsterFormModal";
import AppDialog, { AppDialogConfirmButton } from "../../components/ui/AppDialog";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonsterSelection = {
  monster: DndMonster;
  count: number;
};

interface Props {
  open: boolean;
  isMaster?: boolean;
  onClose: () => void;
  onConfirm: (selections: MonsterSelection[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  Humanoide: "🧑", "Morto-vivo": "🧟", Fera: "🐺", Dragão: "🐉",
  Gigante: "👹", Monstruosidade: "👾", Elemental: "🌊", Construto: "⚙️",
  Infernal: "😈", Celestial: "👼", Aberração: "🦑", Planta: "🌿",
  Lodo: "🫧", Outro: "❓",
};
function typeIcon(t: string) { return TYPE_ICONS[t] ?? "❓"; }

function crColor(cr: string) {
  const n = cr === "0" ? 0 : cr === "1/8" ? 0.125 : cr === "1/4" ? 0.25 : cr === "1/2" ? 0.5 : Number(cr);
  if (n === 0)   return { bg: "rgba(160,160,160,0.1)", border: "rgba(160,160,160,0.2)", text: "rgba(200,200,200,0.7)" };
  if (n <= 0.5)  return { bg: "rgba(80,160,120,0.12)", border: "rgba(80,160,120,0.25)", text: "rgba(100,220,160,0.9)" };
  if (n <= 2)    return { bg: "rgba(80,120,200,0.12)", border: "rgba(80,120,200,0.25)", text: "rgba(120,170,255,0.9)" };
  if (n <= 5)    return { bg: "rgba(120,80,220,0.12)", border: "rgba(120,80,220,0.25)", text: "rgba(170,130,255,0.9)" };
  if (n <= 10)   return { bg: "rgba(200,120,40,0.12)", border: "rgba(200,120,40,0.25)", text: "rgba(255,175,80,0.9)" };
  if (n <= 17)   return { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.25)",  text: "rgba(255,120,120,0.9)" };
  return               { bg: "rgba(140,0,180,0.14)",  border: "rgba(160,0,200,0.3)",   text: "rgba(220,120,255,0.95)" };
}

function crNum(cr: string) {
  return cr === "1/8" ? 0.125 : cr === "1/4" ? 0.25 : cr === "1/2" ? 0.5 : Number(cr);
}

const MONSTER_TYPES = ["Todos", "Humanoide", "Morto-vivo", "Fera", "Dragão", "Gigante", "Monstruosidade", "Elemental", "Outro"];

// ─── MonsterRow ───────────────────────────────────────────────────────────────

function MonsterRow({
  monster, count, isMaster, onAdd, onRemove, onEdit, onDelete,
}: {
  monster: DndMonster;
  count: number;
  isMaster: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lc = crColor(monster.cr);
  const selected = count > 0;

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: selected ? "1.5px solid rgba(220,80,80,0.4)" : "1px solid rgba(255,255,255,0.07)",
        bgcolor: selected ? "rgba(220,80,80,0.07)" : "rgba(255,255,255,0.025)",
        overflow: "hidden",
        transition: "all .13s",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, pl: 1.25, pr: 0.75, py: 1 }}>
        {/* Type icon */}
        <Box sx={{ width: 30, height: 30, borderRadius: "8px", display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 14, flexShrink: 0 }}>
          {typeIcon(monster.type)}
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
          <Stack direction="row" alignItems="center" spacing={0.6}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {monster.name}
            </Typography>
            {monster.isCustom && (
              <Chip label="custom" size="small" sx={{ height: 14, fontSize: 8.5, fontWeight: 800, bgcolor: "rgba(255,195,60,0.1)", border: "1px solid rgba(255,195,60,0.25)", color: "rgba(255,215,80,0.85)", "& .MuiChip-label": { px: 0.5 }, flexShrink: 0 }} />
            )}
          </Stack>
          <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            {monster.type} · {monster.size} · CA {monster.ac} · {monster.hp} HP · {monster.xp.toLocaleString()} XP
          </Typography>
        </Box>

        {/* CR */}
        <Chip label={`CR ${monster.cr}`} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 900, bgcolor: lc.bg, border: `1px solid ${lc.border}`, color: lc.text, "& .MuiChip-label": { px: 0.9 }, flexShrink: 0 }} />

        {/* Master actions for custom monsters */}
        {isMaster && monster.isCustom && (
          <>
            <Tooltip title="Editar">
              <Box onClick={onEdit} sx={{ width: 22, height: 22, borderRadius: "6px", display: "grid", placeItems: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)", "&:hover": { color: "rgba(255,255,255,0.7)", bgcolor: "rgba(255,255,255,0.06)" } }}>
                <EditRoundedIcon sx={{ fontSize: 13 }} />
              </Box>
            </Tooltip>
            <Tooltip title="Excluir">
              <Box onClick={onDelete} sx={{ width: 22, height: 22, borderRadius: "6px", display: "grid", placeItems: "center", cursor: "pointer", color: "rgba(255,100,100,0.35)", "&:hover": { color: "rgba(255,100,100,0.8)", bgcolor: "rgba(220,60,60,0.1)" } }}>
                <DeleteOutlineRoundedIcon sx={{ fontSize: 13 }} />
              </Box>
            </Tooltip>
          </>
        )}

        {/* Count control */}
        <Stack direction="row" alignItems="center" spacing={0.4} sx={{ flexShrink: 0 }}>
          {count > 0 && (
            <Box onClick={onRemove} sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: "rgba(220,80,80,0.18)", border: "1px solid rgba(220,80,80,0.35)", display: "grid", placeItems: "center", cursor: "pointer", "&:hover": { bgcolor: "rgba(220,80,80,0.28)" } }}>
              <RemoveRoundedIcon sx={{ fontSize: 12, color: "rgba(255,130,130,0.9)" }} />
            </Box>
          )}
          {count > 0 && (
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: "rgba(255,140,140,0.95)", minWidth: 16, textAlign: "center" }}>{count}</Typography>
          )}
          <Box onClick={onAdd} sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: "rgba(220,80,80,0.12)", border: "1px solid rgba(220,80,80,0.28)", display: "grid", placeItems: "center", cursor: "pointer", "&:hover": { bgcolor: "rgba(220,80,80,0.22)" } }}>
            <AddRoundedIcon sx={{ fontSize: 12, color: "rgba(255,130,130,0.8)" }} />
          </Box>
        </Stack>

        <Box onClick={() => setExpanded((v) => !v)} sx={{ cursor: "pointer", display: "grid", placeItems: "center" }}>
          <ExpandMoreRoundedIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.2)", transition: "transform .15s", transform: expanded ? "rotate(180deg)" : "none" }} />
        </Box>
      </Box>

      <Collapse in={expanded} timeout={150}>
        <Box sx={{ px: 1.5, pb: 1.5, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.6, mt: 1 }}>
            {[
              { label: "CA", value: monster.acType ? `${monster.ac} (${monster.acType})` : String(monster.ac) },
              { label: "HP", value: String(monster.hp) },
              { label: "Vel.", value: monster.speed },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ borderRadius: "8px", px: 1, py: 0.65, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography sx={{ fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.2)", mb: 0.2 }}>{label}</Typography>
                <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          {monster.attacks.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)", mb: 0.5 }}>Ataques</Typography>
              <Stack spacing={0.4}>
                {monster.attacks.map((atk, i) => (
                  <Box key={i} sx={{ borderRadius: "7px", px: 1, py: 0.5, bgcolor: "rgba(255,120,60,0.05)", border: "1px solid rgba(255,120,60,0.1)" }}>
                    <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "rgba(255,180,100,0.9)" }}>{atk.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                        +{atk.bonus} · <Typography component="span" sx={{ color: "rgba(255,200,120,0.8)", fontWeight: 700 }}>{atk.damage}</Typography>{" "}{atk.damageType !== "—" ? atk.damageType : ""}
                      </Typography>
                    </Stack>
                    {atk.notes && <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.3)", mt: 0.15 }}>{atk.notes}</Typography>}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {monster.traits && monster.traits.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)", mb: 0.5 }}>Habilidades</Typography>
              <Stack spacing={0.4}>
                {monster.traits.map((t, i) => (
                  <Box key={i} sx={{ borderRadius: "7px", px: 1, py: 0.5, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: "rgba(200,180,255,0.85)" }}>{t.name}. </Typography>
                    <Typography component="span" sx={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{t.description}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MonsterLibraryModal({ open, isMaster = false, onClose, onConfirm }: Props) {
  const [monsters, setMonsters] = useState<DndMonster[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DndMonster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DndMonster | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMonsters = () => {
    setLoading(true);
    getDndMonsters()
      .then(setMonsters)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (open) loadMonsters(); }, [open]);
  useEffect(() => { if (!open) { setCounts({}); setSearch(""); setTypeFilter("Todos"); } }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return monsters
      .filter((m) => typeFilter === "Todos" || m.type === typeFilter)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q))
      .sort((a, b) => {
        // Custom monsters first, then sort by CR
        if (a.isCustom && !b.isCustom) return -1;
        if (!a.isCustom && b.isCustom) return 1;
        return crNum(a.cr) - crNum(b.cr) || a.name.localeCompare(b.name);
      });
  }, [monsters, search, typeFilter]);

  function add(id: number) { setCounts((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 })); }
  function remove(id: number) {
    setCounts((p) => {
      const n = (p[id] ?? 0) - 1;
      if (n <= 0) { const { [id]: _, ...rest } = p; return rest; }
      return { ...p, [id]: n };
    });
  }

  function handleSaved(monster: DndMonster) {
    setFormOpen(false);
    setEditing(null);
    loadMonsters();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMonster(deleteTarget.id);
      setCounts((p) => { const { [deleteTarget.id]: _, ...rest } = p; return rest; });
      setMonsters((p) => p.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* silently */ } finally {
      setDeleting(false);
    }
  }

  const totalSelected = Object.values(counts).reduce((s, c) => s + c, 0);

  function handleConfirm() {
    const selections = Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([id, count]) => ({ monster: monsters.find((m) => m.id === Number(id))!, count }))
      .filter((s) => s.monster);
    onConfirm(selections);
  }

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.88)", fontSize: 13,
      "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(220,80,80,0.45)", borderWidth: 1.5 },
    },
    "& .MuiInputAdornment-root": { color: "rgba(255,255,255,0.3)" },
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { bgcolor: "rgba(9,7,20,0.99)", backgroundImage: "none" } }}>
        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Header */}
          <Box sx={{ px: 2.5, pt: 3, pb: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <BugReportRoundedIcon sx={{ fontSize: 18, color: "rgba(220,80,80,0.8)" }} />
              <Typography sx={{ fontWeight: 900, fontSize: 17, color: "rgba(255,255,255,0.92)", flex: 1 }}>
                Biblioteca de Monstros
              </Typography>
              {isMaster && (
                <Button
                  size="small"
                  onClick={() => { setEditing(null); setFormOpen(true); }}
                  startIcon={<AutoFixHighRoundedIcon sx={{ fontSize: "13px !important" }} />}
                  sx={{ textTransform: "none", fontWeight: 800, fontSize: 11.5, borderRadius: "10px", color: "rgba(255,160,160,0.85)", border: "1px solid rgba(220,80,80,0.3)", bgcolor: "rgba(220,80,80,0.08)", "&:hover": { bgcolor: "rgba(220,80,80,0.15)", borderColor: "rgba(220,80,80,0.55)" }, px: 1.5 }}
                >
                  Criar monstro
                </Button>
              )}
            </Stack>

            <TextField
              fullWidth value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar monstro..." size="small"
              sx={{ ...inputSx, mb: 1.25 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
            />

            <Stack direction="row" spacing={0.6} sx={{ overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { display: "none" } }}>
              {MONSTER_TYPES.map((t) => (
                <Chip
                  key={t} onClick={() => setTypeFilter(t)}
                  label={t === "Todos" ? t : `${typeIcon(t)} ${t}`}
                  size="small"
                  sx={{
                    flexShrink: 0, height: 26, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    bgcolor: typeFilter === t ? "rgba(220,80,80,0.2)" : "rgba(255,255,255,0.05)",
                    border: typeFilter === t ? "1px solid rgba(220,80,80,0.45)" : "1px solid rgba(255,255,255,0.08)",
                    color: typeFilter === t ? "rgba(255,150,150,0.95)" : "rgba(255,255,255,0.5)",
                    "&:hover": { bgcolor: "rgba(220,80,80,0.12)" },
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* List */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                <CircularProgress size={24} thickness={2.5} sx={{ color: "rgba(220,80,80,0.6)" }} />
              </Box>
            ) : filtered.length === 0 ? (
              <Typography sx={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)", py: 6 }}>
                Nenhum monstro encontrado.
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {filtered.map((m) => (
                  <MonsterRow
                    key={m.id}
                    monster={m}
                    count={counts[m.id] ?? 0}
                    isMaster={isMaster}
                    onAdd={() => add(m.id)}
                    onRemove={() => remove(m.id)}
                    onEdit={() => { setEditing(m); setFormOpen(true); }}
                    onDelete={() => setDeleteTarget(m)}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

          {/* Footer */}
          <Box sx={{ px: 2.5, py: 2, flexShrink: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button onClick={onClose} variant="text" sx={{ textTransform: "none", fontWeight: 700, borderRadius: "12px", color: "rgba(255,255,255,0.35)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
                Cancelar
              </Button>
              <Box sx={{ flex: 1 }} />
              {totalSelected > 0 && (
                <Typography sx={{ fontSize: 12, color: "rgba(255,150,150,0.7)", fontWeight: 700 }}>
                  {totalSelected} monstro{totalSelected !== 1 ? "s" : ""} selecionado{totalSelected !== 1 ? "s" : ""}
                </Typography>
              )}
              <Button
                onClick={handleConfirm} disabled={totalSelected === 0}
                variant="contained"
                sx={{ borderRadius: "12px", px: 3, py: 1.1, textTransform: "none", fontWeight: 800, fontSize: 13, bgcolor: "rgba(200,50,50,0.85)", "&:hover": { bgcolor: "rgba(220,70,70,0.95)" }, "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}
              >
                Adicionar ao Encontro
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Monster form modal (create / edit) */}
      <MonsterFormModal
        open={formOpen}
        editing={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />

      {/* Delete confirmation */}
      <AppDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Excluir Monstro"
        dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button onClick={() => setDeleteTarget(null)} variant="text" startIcon={<CloseRoundedIcon />} sx={{ textTransform: "none", fontWeight: 800, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleDelete} disabled={deleting}
              variant="outlined"
              sx={{ px: 4, py: 1.2, borderRadius: "12px", textTransform: "none", fontWeight: 900, borderColor: "rgba(220,60,60,0.35)", color: "rgba(255,140,140,0.9)", "&:hover": { borderColor: "rgba(220,60,60,0.6)", bgcolor: "rgba(220,60,60,0.1)" } }}
            >
              {deleting ? <CircularProgress size={13} sx={{ color: "rgba(255,130,130,0.7)" }} /> : "Excluir"}
            </Button>
          </Stack>
        }
      >
        <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)" }}>
          Tem certeza que deseja excluir{" "}
          <Typography component="span" sx={{ fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>{deleteTarget?.name}</Typography>?
          <br />
          Esta ação não pode ser desfeita.
        </Typography>
      </AppDialog>
    </>
  );
}
