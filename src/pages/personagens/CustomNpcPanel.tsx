import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import {
  listCustomNpcs,
  createCustomNpc,
  updateCustomNpc,
  deleteCustomNpc,
  type CustomNpc,
  type CustomNpcPayload,
  type NpcStatus,
} from "../../modules/custom-npcs/custom-npcs.api";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  NpcStatus,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  alive: {
    label: "Vivo",
    color: "rgba(60,200,130,0.9)",
    bg: "rgba(60,200,130,0.1)",
    border: "rgba(60,200,130,0.22)",
    icon: "🟢",
  },
  dead: {
    label: "Morto",
    color: "rgba(239,68,68,0.9)",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.22)",
    icon: "💀",
  },
  missing: {
    label: "Desaparecido",
    color: "rgba(245,158,11,0.9)",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.22)",
    icon: "❓",
  },
};

// ─── Input sx ─────────────────────────────────────────────────────────────────

const inputSx = {
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13 },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(160,130,255,0.85)" },
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    color: "rgba(255,255,255,0.85)",
    fontSize: 13.5,
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(120,85,255,0.5)",
      borderWidth: 1.5,
    },
  },
};

// ─── NpcFormDialog ────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  race: string;
  role: string;
  location: string;
  faction: string;
  status: NpcStatus;
  appearance: string;
  personality: string;
  motivation: string;
  secret: string;
  notes: string;
  maxHp: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  race: "",
  role: "",
  location: "",
  faction: "",
  status: "alive",
  appearance: "",
  personality: "",
  motivation: "",
  secret: "",
  notes: "",
  maxHp: "",
};

function toForm(npc: CustomNpc): FormState {
  return {
    name: npc.name,
    race: npc.race ?? "",
    role: npc.role ?? "",
    location: npc.location ?? "",
    faction: npc.faction ?? "",
    status: npc.status,
    appearance: npc.appearance ?? "",
    personality: npc.personality ?? "",
    motivation: npc.motivation ?? "",
    secret: npc.secret ?? "",
    notes: npc.notes ?? "",
    maxHp: npc.maxHp != null ? String(npc.maxHp) : "",
  };
}

function toPayload(form: FormState, isEdit: boolean, prevCurrentHp?: number | null): CustomNpcPayload {
  const maxHpVal = form.maxHp !== "" ? parseInt(form.maxHp, 10) : undefined;
  // On create: currentHp = maxHp (start full). On edit: keep existing currentHp.
  const currentHpVal = isEdit ? (prevCurrentHp ?? maxHpVal) : maxHpVal;
  return {
    name: form.name,
    race: form.race || undefined,
    role: form.role || undefined,
    location: form.location || undefined,
    faction: form.faction || undefined,
    status: form.status,
    appearance: form.appearance || undefined,
    personality: form.personality || undefined,
    motivation: form.motivation || undefined,
    secret: form.secret || undefined,
    notes: form.notes || undefined,
    maxHp: maxHpVal,
    currentHp: currentHpVal,
  };
}

function NpcFormDialog({
  open,
  editTarget,
  onClose,
  onSaved,
}: {
  open: boolean;
  editTarget: CustomNpc | null;
  onClose: () => void;
  onSaved: (npc: CustomNpc) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editTarget ? toForm(editTarget) : EMPTY_FORM);
    }
  }, [open, editTarget]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const isEdit = !!editTarget;
      const payload = toPayload(form, isEdit, editTarget?.currentHp);
      const saved = editTarget
        ? await updateCustomNpc(editTarget.id, payload)
        : await createCustomNpc(payload);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!editTarget;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: "rgba(10,8,22,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          backdropFilter: "blur(24px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          pt: 2.5,
          px: 2.5,
          fontSize: 15,
          fontWeight: 800,
          color: "rgba(255,255,255,0.88)",
        }}
      >
        {isEdit ? "Editar NPC" : "Novo NPC"}
      </DialogTitle>
      <DialogContent sx={{ px: 2.5, pt: 1, pb: 2.5 }}>
        <Stack spacing={1.5}>
          {/* Row 1: name */}
          <TextField
            label="Nome *"
            fullWidth
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            sx={inputSx}
          />

          {/* Row 2: race + role */}
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Raça"
              fullWidth
              value={form.race}
              onChange={(e) => set("race", e.target.value)}
              sx={inputSx}
            />
            <TextField
              label="Profissão / Papel"
              fullWidth
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              sx={inputSx}
            />
          </Stack>

          {/* Row 3: location + faction */}
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Localização"
              fullWidth
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              sx={inputSx}
            />
            <TextField
              label="Facção / Guilda"
              fullWidth
              value={form.faction}
              onChange={(e) => set("faction", e.target.value)}
              sx={inputSx}
            />
          </Stack>

          {/* Row 4: maxHp */}
          <TextField
            label="Pontos de Vida máximos (PV)"
            type="number"
            inputProps={{ min: 0 }}
            value={form.maxHp}
            onChange={(e) => set("maxHp", e.target.value)}
            sx={{ ...inputSx, width: "50%" }}
          />

          {/* Row 5: status */}
          <Box>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                mb: 0.75,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Status
            </Typography>
            <Select
              value={form.status}
              onChange={(e) => set("status", e.target.value as NpcStatus)}
              fullWidth
              sx={{
                bgcolor: "rgba(255,255,255,0.03)",
                borderRadius: "10px",
                color: "rgba(255,255,255,0.85)",
                fontSize: 13.5,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.09)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.18)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(120,85,255,0.5)",
                  borderWidth: 1.5,
                },
                "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.35)" },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: "rgba(12,10,28,0.98)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              {(["alive", "dead", "missing"] as NpcStatus[]).map((s) => (
                <MenuItem
                  key={s}
                  value={s}
                  sx={{ color: STATUS_CONFIG[s].color, fontSize: 13.5 }}
                >
                  {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

          {/* Row 5: appearance */}
          <TextField
            label="Aparência física"
            fullWidth
            multiline
            minRows={2}
            value={form.appearance}
            onChange={(e) => set("appearance", e.target.value)}
            sx={inputSx}
          />

          {/* Row 6: personality */}
          <TextField
            label="Personalidade e maneirismos"
            fullWidth
            multiline
            minRows={2}
            value={form.personality}
            onChange={(e) => set("personality", e.target.value)}
            sx={inputSx}
          />

          {/* Row 7: motivation */}
          <TextField
            label="Motivação / O que busca"
            fullWidth
            multiline
            minRows={2}
            value={form.motivation}
            onChange={(e) => set("motivation", e.target.value)}
            sx={inputSx}
          />

          {/* Row 8: secret */}
          <TextField
            label="🔒 Segredo (visível só para o mestre)"
            fullWidth
            multiline
            minRows={2}
            value={form.secret}
            onChange={(e) => set("secret", e.target.value)}
            sx={{
              ...inputSx,
              "& .MuiOutlinedInput-root": {
                ...inputSx["& .MuiOutlinedInput-root"],
                bgcolor: "rgba(245,158,11,0.04)",
                "& fieldset": { borderColor: "rgba(245,158,11,0.15)" },
                "&:hover fieldset": { borderColor: "rgba(245,158,11,0.28)" },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(245,158,11,0.45)",
                  borderWidth: 1.5,
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(245,158,11,0.55)",
                fontSize: 13,
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "rgba(245,158,11,0.8)",
              },
            }}
          />

          {/* Row 9: notes */}
          <TextField
            label="Notas livres"
            fullWidth
            multiline
            minRows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            sx={inputSx}
          />

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
            <Box
              component="button"
              onClick={onClose}
              sx={{
                px: 2, py: 0.75,
                borderRadius: "9px",
                border: "1px solid rgba(255,255,255,0.1)",
                bgcolor: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.55)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .12s",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
              }}
            >
              Cancelar
            </Box>
            <Box
              component="button"
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              sx={{
                px: 2.5, py: 0.75,
                borderRadius: "9px",
                border: "1px solid rgba(120,85,255,0.4)",
                bgcolor: saving || !form.name.trim()
                  ? "rgba(120,85,255,0.08)"
                  : "rgba(120,85,255,0.2)",
                color: saving || !form.name.trim()
                  ? "rgba(160,130,255,0.4)"
                  : "rgba(190,165,255,0.95)",
                fontSize: 13,
                fontWeight: 800,
                cursor: saving || !form.name.trim() ? "not-allowed" : "pointer",
                transition: "all .12s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                "&:hover:not(:disabled)": { bgcolor: "rgba(120,85,255,0.3)" },
              }}
            >
              {saving && <CircularProgress size={11} sx={{ color: "inherit" }} />}
              {isEdit ? "Salvar" : "Criar NPC"}
            </Box>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// ─── NpcCard ──────────────────────────────────────────────────────────────────

function FieldBlock({ icon, label, value, dim }: { icon: string; label: string; value: string; dim?: boolean }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: dim ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.28)",
          mb: 0.3,
        }}
      >
        {icon} {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          color: dim ? "rgba(245,158,11,0.75)" : "rgba(255,255,255,0.75)",
          lineHeight: 1.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function HpTracker({ npc, onUpdate }: { npc: CustomNpc; onUpdate: (updated: CustomNpc) => void }) {
  const [hp, setHp] = useState(npc.currentHp ?? npc.maxHp ?? 0);
  const max = npc.maxHp ?? 0;

  useEffect(() => {
    setHp(npc.currentHp ?? npc.maxHp ?? 0);
  }, [npc.currentHp, npc.maxHp]);

  async function change(delta: number) {
    const next = Math.max(0, Math.min(max, hp + delta));
    if (next === hp) return;
    setHp(next);
    const updated = await updateCustomNpc(npc.id, { currentHp: next });
    onUpdate(updated);
  }

  const pct = max > 0 ? (hp / max) * 100 : 0;
  const barColor =
    pct > 50 ? "rgba(60,200,130,0.75)" : pct > 25 ? "rgba(245,158,11,0.8)" : "rgba(239,68,68,0.8)";

  return (
    <Box sx={{ mt: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.09em", mr: 0.5 }}>
          ❤️ PV
        </Typography>
        <Box
          component="button"
          onClick={() => change(-1)}
          sx={{
            width: 26, height: 26, borderRadius: "7px",
            border: "1px solid rgba(239,68,68,0.3)", bgcolor: "rgba(239,68,68,0.1)",
            color: "rgba(239,68,68,0.8)", fontSize: 16, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, transition: "all .1s",
            "&:hover": { bgcolor: "rgba(239,68,68,0.2)" },
          }}
        >
          −
        </Box>
        <Box sx={{ flex: 1, position: "relative" }}>
          <Box sx={{ height: 8, borderRadius: "4px", bgcolor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: barColor, borderRadius: "4px", transition: "width .2s, background-color .3s" }} />
          </Box>
          <Typography sx={{ position: "absolute", top: -1, left: 0, right: 0, textAlign: "center", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}>
            {hp} / {max}
          </Typography>
        </Box>
        <Box
          component="button"
          onClick={() => change(1)}
          sx={{
            width: 26, height: 26, borderRadius: "7px",
            border: "1px solid rgba(60,200,130,0.3)", bgcolor: "rgba(60,200,130,0.1)",
            color: "rgba(60,200,130,0.85)", fontSize: 16, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, transition: "all .1s",
            "&:hover": { bgcolor: "rgba(60,200,130,0.2)" },
          }}
        >
          +
        </Box>
        <Box
          component="button"
          onClick={async () => {
            const updated = await updateCustomNpc(npc.id, { currentHp: max });
            setHp(max);
            onUpdate(updated);
          }}
          title="Restaurar HP máximo"
          sx={{
            px: 1, height: 26, borderRadius: "7px",
            border: "1px solid rgba(255,255,255,0.1)", bgcolor: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap", transition: "all .1s",
            "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" },
          }}
        >
          Reset
        </Box>
      </Stack>
    </Box>
  );
}

function NpcCard({
  npc: initialNpc,
  onEdit,
  onDelete,
  onUpdate,
}: {
  npc: CustomNpc;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updated: CustomNpc) => void;
}) {
  const [npc, setNpc] = useState(initialNpc);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const status = STATUS_CONFIG[npc.status as NpcStatus] ?? STATUS_CONFIG.alive;

  useEffect(() => { setNpc(initialNpc); }, [initialNpc]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCustomNpc(npc.id);
      onDelete();
    } catch {
      setDeleting(false);
    }
  }

  const hasDetails =
    npc.location ||
    npc.faction ||
    npc.appearance ||
    npc.personality ||
    npc.motivation ||
    npc.secret ||
    npc.notes ||
    npc.maxHp != null;

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.07)",
        bgcolor: "rgba(255,255,255,0.025)",
        overflow: "hidden",
        transition: "border-color .15s",
        "&:hover": { borderColor: "rgba(255,255,255,0.12)" },
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          px: 1.75,
          py: 1.25,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {/* Name + chips */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 14,
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {npc.name}
          </Typography>
          <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mt: 0.4, gap: "4px 6px" }}>
            {npc.race && (
              <Box
                sx={{
                  px: 0.75,
                  py: 0.2,
                  borderRadius: "6px",
                  bgcolor: "rgba(80,160,255,0.08)",
                  border: "1px solid rgba(80,160,255,0.18)",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "rgba(140,200,255,0.8)",
                }}
              >
                {npc.race}
              </Box>
            )}
            {npc.role && (
              <Box
                sx={{
                  px: 0.75,
                  py: 0.2,
                  borderRadius: "6px",
                  bgcolor: "rgba(80,200,80,0.07)",
                  border: "1px solid rgba(80,200,80,0.16)",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "rgba(160,240,160,0.8)",
                }}
              >
                {npc.role}
              </Box>
            )}
            {npc.faction && (
              <Box
                sx={{
                  px: 0.75,
                  py: 0.2,
                  borderRadius: "6px",
                  bgcolor: "rgba(255,195,60,0.07)",
                  border: "1px solid rgba(255,195,60,0.18)",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "rgba(255,215,100,0.8)",
                }}
              >
                {npc.faction}
              </Box>
            )}
          </Stack>
        </Box>

        {/* HP badge (collapsed preview) */}
        {npc.maxHp != null && (
          <Box
            sx={{
              px: 0.9, py: 0.3, borderRadius: "7px", flexShrink: 0,
              bgcolor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              fontSize: 11, fontWeight: 700, color: "rgba(239,68,68,0.75)", whiteSpace: "nowrap",
            }}
          >
            ❤️ {npc.currentHp ?? npc.maxHp}/{npc.maxHp}
          </Box>
        )}

        {/* Status badge */}
        <Box
          sx={{
            px: 0.9,
            py: 0.3,
            borderRadius: "7px",
            bgcolor: status.bg,
            border: `1px solid ${status.border}`,
            fontSize: 11,
            fontWeight: 700,
            color: status.color,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {status.icon} {status.label}
        </Box>

        {/* Expand icon */}
        <Box sx={{ color: "rgba(255,255,255,0.25)", flexShrink: 0, display: "flex" }}>
          {expanded ? (
            <KeyboardArrowUpRoundedIcon sx={{ fontSize: 18 }} />
          ) : (
            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
          )}
        </Box>
      </Box>

      {/* Expanded content */}
      {expanded && (
        <Box
          sx={{
            px: 1.75,
            pb: 1.5,
            pt: 0.25,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {npc.maxHp != null && (
            <HpTracker npc={npc} onUpdate={(u) => { setNpc(u); onUpdate(u); }} />
          )}

          {hasDetails ? (
            <Stack spacing={1.25} sx={{ mt: 1.25 }}>
              {npc.location && (
                <FieldBlock icon="📍" label="Localização" value={npc.location} />
              )}
              {npc.appearance && (
                <FieldBlock icon="👁" label="Aparência" value={npc.appearance} />
              )}
              {npc.personality && (
                <FieldBlock icon="🎭" label="Personalidade" value={npc.personality} />
              )}
              {npc.motivation && (
                <FieldBlock icon="🎯" label="Motivação" value={npc.motivation} />
              )}
              {npc.secret && (
                <Box
                  sx={{
                    px: 1.25,
                    py: 1,
                    borderRadius: "10px",
                    bgcolor: "rgba(245,158,11,0.05)",
                    border: "1px solid rgba(245,158,11,0.15)",
                  }}
                >
                  <FieldBlock icon="🔒" label="Segredo" value={npc.secret} dim />
                </Box>
              )}
              {npc.notes && (
                <FieldBlock icon="📝" label="Notas" value={npc.notes} />
              )}
            </Stack>
          ) : (
            <Typography
              sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.25)", mt: 1, fontStyle: "italic" }}
            >
              Nenhum detalhe cadastrado.
            </Typography>
          )}

          {/* Action buttons */}
          <Stack direction="row" spacing={1} sx={{ mt: 1.75 }}>
            <Box
              component="button"
              onClick={onEdit}
              sx={{
                px: 1.75,
                py: 0.55,
                borderRadius: "9px",
                border: "1px solid rgba(120,85,255,0.35)",
                bgcolor: "rgba(120,85,255,0.1)",
                color: "rgba(190,165,255,0.85)",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all .12s",
                "&:hover": { bgcolor: "rgba(120,85,255,0.2)" },
              }}
            >
              Editar
            </Box>
            <Box
              component="button"
              onClick={handleDelete}
              disabled={deleting}
              sx={{
                px: 1.75,
                py: 0.55,
                borderRadius: "9px",
                border: "1px solid rgba(239,68,68,0.22)",
                bgcolor: "rgba(239,68,68,0.07)",
                color: "rgba(239,68,68,0.7)",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: deleting ? "not-allowed" : "pointer",
                transition: "all .12s",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                "&:hover:not(:disabled)": { bgcolor: "rgba(239,68,68,0.14)", color: "rgba(239,68,68,0.9)" },
              }}
            >
              {deleting && <CircularProgress size={10} sx={{ color: "inherit" }} />}
              Excluir
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type StatusFilter = "all" | NpcStatus;

export default function CustomNpcPanel() {
  const [npcs, setNpcs] = useState<CustomNpc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomNpc | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await listCustomNpcs();
      setNpcs(data);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(npc: CustomNpc) {
    setEditTarget(npc);
    setFormOpen(true);
  }

  function handleSaved(saved: CustomNpc) {
    setNpcs((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setFormOpen(false);
  }

  function handleDeleted(id: number) {
    setNpcs((prev) => prev.filter((n) => n.id !== id));
  }

  const q = search.toLowerCase();
  const filtered = npcs.filter((n) => {
    const matchStatus = statusFilter === "all" || n.status === statusFilter;
    const matchSearch =
      !q ||
      n.name.toLowerCase().includes(q) ||
      (n.race ?? "").toLowerCase().includes(q) ||
      (n.role ?? "").toLowerCase().includes(q) ||
      (n.faction ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const FILTER_TABS: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "alive", label: "🟢 Vivos" },
    { id: "dead", label: "💀 Mortos" },
    { id: "missing", label: "❓ Desaparecidos" },
  ];

  return (
    <Box>
      {/* Top bar */}
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1, position: "relative" }}>
          <Box
            component="input"
            placeholder="Buscar por nome, raça, profissão ou facção..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            sx={{
              width: "100%",
              px: 1.5,
              py: 0.85,
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.09)",
              bgcolor: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
              outline: "none",
              "&:focus": { borderColor: "rgba(120,85,255,0.5)" },
              "&::placeholder": { color: "rgba(255,255,255,0.22)" },
              boxSizing: "border-box",
            }}
          />
        </Box>
        <Box
          component="button"
          onClick={openCreate}
          sx={{
            px: 1.75,
            py: 0.75,
            borderRadius: "10px",
            border: "1px solid rgba(120,85,255,0.4)",
            bgcolor: "rgba(120,85,255,0.15)",
            color: "rgba(190,165,255,0.95)",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all .12s",
            "&:hover": { bgcolor: "rgba(120,85,255,0.25)" },
          }}
        >
          + Novo NPC
        </Box>
      </Stack>

      {/* Filter chips */}
      <Stack direction="row" spacing={0.6} sx={{ mb: 2, flexWrap: "wrap", gap: "6px" }}>
        {FILTER_TABS.map(({ id, label }) => {
          const active = statusFilter === id;
          return (
            <Box
              key={id}
              component="button"
              onClick={() => setStatusFilter(id)}
              sx={{
                px: 1.5,
                py: 0.45,
                border: "1px solid",
                borderRadius: "8px",
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                cursor: "pointer",
                bgcolor: active ? "rgba(120,85,255,0.15)" : "rgba(255,255,255,0.04)",
                color: active ? "rgba(190,165,255,0.95)" : "rgba(255,255,255,0.45)",
                borderColor: active
                  ? "rgba(120,85,255,0.4)"
                  : "rgba(255,255,255,0.09)",
                transition: "all .12s",
                "&:hover": {
                  bgcolor: active
                    ? "rgba(120,85,255,0.22)"
                    : "rgba(255,255,255,0.08)",
                },
              }}
            >
              {label}
            </Box>
          );
        })}
      </Stack>

      {/* Loading */}
      {loading && (
        <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={28} sx={{ color: "rgba(120,85,255,0.6)" }} />
        </Box>
      )}

      {/* Empty state */}
      {!loading && npcs.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography sx={{ fontSize: 36, mb: 1 }}>🧑‍🤝‍🧑</Typography>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              mb: 0.5,
            }}
          >
            Nenhum NPC cadastrado ainda
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.28)", mb: 2 }}>
            Crie seu primeiro NPC para organizar os personagens da sua campanha.
          </Typography>
          <Box
            component="button"
            onClick={openCreate}
            sx={{
              px: 2.5,
              py: 0.85,
              borderRadius: "10px",
              border: "1px solid rgba(120,85,255,0.4)",
              bgcolor: "rgba(120,85,255,0.15)",
              color: "rgba(190,165,255,0.95)",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all .12s",
              "&:hover": { bgcolor: "rgba(120,85,255,0.25)" },
            }}
          >
            + Criar primeiro NPC
          </Box>
        </Box>
      )}

      {/* No results from search/filter */}
      {!loading && npcs.length > 0 && filtered.length === 0 && (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            Nenhum NPC encontrado para este filtro.
          </Typography>
        </Box>
      )}

      {/* NPC list */}
      {!loading && filtered.length > 0 && (
        <Stack spacing={1}>
          {filtered.map((npc) => (
            <NpcCard
              key={npc.id}
              npc={npc}
              onEdit={() => openEdit(npc)}
              onDelete={() => handleDeleted(npc.id)}
              onUpdate={handleSaved}
            />
          ))}
        </Stack>
      )}

      {/* Form dialog */}
      <NpcFormDialog
        open={formOpen}
        editTarget={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </Box>
  );
}
