import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";

import AppDialog, {
  AppDialogConfirmButton,
} from "../../components/ui/AppDialog";
import {
  SectionDivider,
  SectionIconBox,
  SectionLabelText,
  SkillEmptyBox,
} from "./ViewCharacter.styles";
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
} from "../../modules/inventory/inventory.api";

const CATEGORIES = [
  { value: "Arma", icon: "⚔️" },
  { value: "Armadura", icon: "🛡️" },
  { value: "Poção", icon: "🧪" },
  { value: "Ferramenta", icon: "🔧" },
  { value: "Equipamento", icon: "🎒" },
  { value: "Tesouro", icon: "💎" },
  { value: "Outros", icon: "📦" },
];

function getCategoryIcon(category: string | null) {
  return CATEGORIES.find((c) => c.value === category)?.icon ?? "📦";
}

function weightBarConfig(pct: number) {
  if (pct > 1)
    return {
      fill: "linear-gradient(90deg,#aa2020,#e03535)",
      glow: "rgba(220,50,50,0.4)",
      border: "rgba(220,50,50,0.25)",
      track: "rgba(220,50,50,0.08)",
      label: "Sobrecarregado",
      color: "rgba(255,130,130,0.9)",
    };
  if (pct > 0.75)
    return {
      fill: "linear-gradient(90deg,#c05800,#e87820)",
      glow: "rgba(230,120,30,0.4)",
      border: "rgba(230,120,30,0.25)",
      track: "rgba(230,120,30,0.08)",
      label: "Pesado",
      color: "rgba(255,185,110,0.9)",
    };
  if (pct > 0.5)
    return {
      fill: "linear-gradient(90deg,#c88000,#f0aa20)",
      glow: "rgba(240,170,30,0.4)",
      border: "rgba(240,170,30,0.22)",
      track: "rgba(240,170,30,0.08)",
      label: "Moderado",
      color: "rgba(255,215,100,0.95)",
    };
  return {
    fill: "linear-gradient(90deg,#1fa863,#2ecc8a)",
    glow: "rgba(46,204,130,0.4)",
    border: "rgba(46,204,130,0.22)",
    track: "rgba(46,204,130,0.08)",
    label: "Tranquilo",
    color: "rgba(100,240,170,0.95)",
  };
}

const EMPTY_FORM = {
  name: "",
  quantity: "1",
  weight: "0",
  category: "Outros",
  description: "",
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
    "&.Mui-focused fieldset": {
      borderColor: "rgba(120,85,255,0.55)",
      borderWidth: 1.5,
    },
  },
  "& .MuiInputAdornment-root svg": {
    color: "rgba(255,255,255,0.25)",
    fontSize: 18,
  },
};

const selectSx = {
  borderRadius: "12px",
  backgroundColor: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.92)",
  fontSize: 14,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.09)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(120,85,255,0.55)",
    borderWidth: 1.5,
  },
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

interface Props {
  characterId: number | string;
}

export default function InventorySection({ characterId }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [carryingCapacity, setCarryingCapacity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInventory(characterId);
      setItems(data.items);
      setTotalWeight(data.totalWeight);
      setCarryingCapacity(data.carryingCapacity);
    } catch {
      setError("Não foi possível carregar o inventário.");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setAddOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setForm({
      name: item.name,
      quantity: String(item.quantity),
      weight: String(item.weight),
      category: item.category ?? "Outros",
      description: item.description ?? "",
    });
    setFormError(null);
    setEditItem(item);
  }

  function validateForm() {
    if (!form.name.trim()) { setFormError("O nome do item é obrigatório."); return false; }
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 1) {
      setFormError("A quantidade deve ser um número inteiro maior que 0.");
      return false;
    }
    if (Number(form.weight) < 0 || isNaN(Number(form.weight))) {
      setFormError("O peso deve ser um número maior ou igual a 0.");
      return false;
    }
    return true;
  }

  async function handleAdd() {
    if (!validateForm()) return;
    setSaving(true);
    setFormError(null);
    try {
      await addInventoryItem(characterId, {
        name: form.name.trim(),
        quantity: Number(form.quantity),
        weight: Number(form.weight),
        category: form.category,
        description: form.description.trim() || undefined,
      });
      setAddOpen(false);
      await load();
    } catch {
      setFormError("Não foi possível adicionar o item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editItem || !validateForm()) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateInventoryItem(editItem.id, {
        name: form.name.trim(),
        quantity: Number(form.quantity),
        weight: Number(form.weight),
        category: form.category,
        description: form.description.trim() || undefined,
      });
      setEditItem(null);
      await load();
    } catch {
      setFormError("Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setSaving(true);
    try {
      await deleteInventoryItem(deleteItem.id);
      setDeleteItem(null);
      await load();
    } catch {
      setError("Não foi possível remover o item.");
    } finally {
      setSaving(false);
    }
  }

  const weightPct = carryingCapacity > 0 ? totalWeight / carryingCapacity : 0;
  const wui = weightBarConfig(weightPct);

  const formDialog = (
    title: string,
    open: boolean,
    onClose: () => void,
    onConfirm: () => void,
  ) => (
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
              borderRadius: "10px",
              py: 0.5,
              bgcolor: "rgba(220,60,60,0.08)",
              border: "1px solid rgba(220,60,60,0.18)",
              color: "rgba(255,150,150,0.9)",
              fontSize: 13,
              "& .MuiAlert-icon": { color: "rgba(255,110,110,0.7)", fontSize: 18 },
            }}
          >
            {formError}
          </Alert>
        )}

        <TextField
          label="Nome do item"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          fullWidth
          sx={inputSx}
        />

        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Quantidade"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            type="number"
            inputProps={{ min: 1, step: 1 }}
            sx={{ ...inputSx, flex: 1 }}
          />
          <TextField
            label="Peso (kg)"
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            type="number"
            inputProps={{ min: 0, step: 0.5 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>kg</Typography>
                </InputAdornment>
              ),
            }}
            sx={{ ...inputSx, flex: 1 }}
          />
        </Stack>

        <Box>
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", mb: 0.75, ml: 0.25 }}>
            Categoria
          </Typography>
          <Select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            fullWidth
            sx={selectSx}
            MenuProps={{ PaperProps: { sx: menuPaperSx } }}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.icon} {c.value}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <TextField
          label="Descrição (opcional)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          fullWidth
          multiline
          rows={2}
          sx={inputSx}
        />
      </Stack>
    </AppDialog>
  );

  return (
    <Box>
      {/* Section header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <SectionIconBox>
          <Inventory2RoundedIcon sx={{ fontSize: 14, color: "rgba(180,150,255,0.7)" }} />
        </SectionIconBox>
        <SectionLabelText>Inventário</SectionLabelText>
        <SectionDivider />
      </Stack>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
          <CircularProgress size={24} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            borderRadius: "10px",
            py: 0.5,
            bgcolor: "rgba(220,60,60,0.08)",
            border: "1px solid rgba(220,60,60,0.18)",
            color: "rgba(255,150,150,0.9)",
            fontSize: 13,
          }}
        >
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {/* Weight bar */}
          <Box
            sx={{
              position: "relative",
              borderRadius: "14px",
              overflow: "hidden",
              border: `1px solid ${wui.border}`,
              bgcolor: wui.track,
            }}
          >
            <Box
              sx={{
                height: 40,
                width: `${Math.min(weightPct, 1) * 100}%`,
                background: wui.fill,
                transition: "width .5s cubic-bezier(.4,0,.2,1)",
                boxShadow: `4px 0 18px ${wui.glow}`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.75,
                pointerEvents: "none",
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.9)" }}>
                {totalWeight} kg
                <Typography
                  component="span"
                  sx={{ fontSize: 11.5, fontWeight: 600, opacity: 0.5, ml: 0.5 }}
                >
                  / {carryingCapacity} kg
                </Typography>
              </Typography>
              <Box
                sx={{
                  px: 1.2,
                  py: 0.35,
                  borderRadius: "8px",
                  bgcolor: "rgba(0,0,0,0.28)",
                  border: `1px solid ${wui.border}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: wui.color,
                    letterSpacing: "0.04em",
                  }}
                >
                  {wui.label} · {Math.min(Math.round(weightPct * 100), 999)}%
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Item list */}
          {items.length === 0 ? (
            <SkillEmptyBox>
              <Typography
                sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}
              >
                Inventário vazio.
              </Typography>
            </SkillEmptyBox>
          ) : (
            <Stack spacing={0.75}>
              {items.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    pl: 1.5,
                    pr: 0.75,
                    py: 1,
                    borderRadius: "13px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    bgcolor: "rgba(255,255,255,0.025)",
                    transition: "all .15s",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.04)",
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
                      bgcolor: "rgba(120,85,255,0.1)",
                      border: "1px solid rgba(120,85,255,0.18)",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryIcon(item.category)}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
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
                      {item.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>
                      {item.category ?? "Outros"}
                    </Typography>
                  </Box>

                  <Stack alignItems="flex-end" sx={{ flexShrink: 0, mr: 0.5 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>
                      x{item.quantity}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {item.weight > 0 ? `${item.weight} kg` : "—"}
                    </Typography>
                  </Stack>

                  <Tooltip title="Editar" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => openEdit(item)}
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
                      onClick={() => setDeleteItem(item)}
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
          )}

          {/* Add button */}
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
              "&:hover": {
                borderColor: "rgba(120,85,255,0.45)",
                bgcolor: "rgba(120,85,255,0.1)",
              },
            }}
          >
            Adicionar item
          </Button>
        </Stack>
      )}

      {/* Add dialog */}
      {formDialog("Adicionar Item", addOpen, () => setAddOpen(false), handleAdd)}

      {/* Edit dialog */}
      {formDialog(
        "Editar Item",
        editItem !== null,
        () => setEditItem(null),
        handleEdit,
      )}

      {/* Delete confirm dialog */}
      <AppDialog
        open={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        title="Remover Item"
        dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button
              onClick={() => setDeleteItem(null)}
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
                px: 4,
                py: 1.2,
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
            {deleteItem?.name}
          </Typography>{" "}
          do inventário?
        </Typography>
      </AppDialog>
    </Box>
  );
}
