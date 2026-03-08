import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import SportsMartialArtsRoundedIcon from "@mui/icons-material/SportsMartialArtsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import type { PriceCategory, PriceItem } from "../../modules/price-items/price-items.api";
import {
  createPriceItem,
  deletePriceItem,
  getPriceItems,
  updatePriceItem,
} from "../../modules/price-items/price-items.api";

// ─── category config ────────────────────────────────────────────────────────

type CatConfig = {
  id: PriceCategory | "all";
  label: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
};

const CATEGORIES: CatConfig[] = [
  { id: "all",       label: "Todos",     emoji: "📋", icon: null,                                               color: "rgba(255,255,255,0.5)" },
  { id: "food",      label: "Comida",    emoji: "🍺", icon: <RestaurantRoundedIcon sx={{ fontSize: 14 }} />,    color: "#f59e0b" },
  { id: "weapon",    label: "Armas",     emoji: "⚔️", icon: <SportsMartialArtsRoundedIcon sx={{ fontSize: 14 }} />, color: "#ef4444" },
  { id: "armor",     label: "Armaduras", emoji: "🛡️", icon: <ShieldRoundedIcon sx={{ fontSize: 14 }} />,        color: "#3b82f6" },
  { id: "potion",    label: "Poções",    emoji: "🧪", icon: <ScienceRoundedIcon sx={{ fontSize: 14 }} />,       color: "#8b5cf6" },
  { id: "transport", label: "Transporte",emoji: "🐎", icon: <DirectionsRunRoundedIcon sx={{ fontSize: 14 }} />, color: "#10b981" },
];

function catColor(cat: string): string {
  return CATEGORIES.find((c) => c.id === cat)?.color ?? "rgba(255,255,255,0.4)";
}

// ─── form dialog ─────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  category: string;
  priceGp: string;
  priceLabel: string;
  notes: string;
};

const EMPTY_FORM: FormState = { name: "", category: "food", priceGp: "", priceLabel: "", notes: "" };

function PriceItemForm({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: PriceItem | null;
  onClose: () => void;
  onSaved: (item: PriceItem) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              name: editing.name,
              category: editing.category,
              priceGp: String(editing.priceGp),
              priceLabel: editing.priceLabel,
              notes: editing.notes ?? "",
            }
          : EMPTY_FORM,
      );
    }
  }, [open, editing]);

  function set(k: keyof FormState, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.priceLabel.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        priceGp: parseFloat(form.priceGp) || 0,
        priceLabel: form.priceLabel.trim(),
        notes: form.notes.trim() || undefined,
      };
      const saved = editing
        ? await updatePriceItem(editing.id, payload)
        : await createPriceItem(payload);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  }

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "rgba(255,255,255,0.04)",
      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(255,195,60,0.5)" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.45)" },
    "& .MuiInputBase-input": { color: "rgba(255,255,255,0.88)", fontSize: 13 },
  };

  const catSelectSx = (selected: boolean) => ({
    cursor: "pointer",
    px: 1.5, py: 0.6,
    borderRadius: "8px",
    fontSize: 12, fontWeight: selected ? 700 : 500,
    border: "1px solid",
    borderColor: selected ? catColor(form.category) : "rgba(255,255,255,0.1)",
    color: selected ? catColor(form.category) : "rgba(255,255,255,0.45)",
    bgcolor: selected ? `${catColor(form.category)}18` : "transparent",
    transition: "all 0.15s",
    "&:hover": { borderColor: catColor(form.category), color: catColor(form.category) },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "rgba(14,11,28,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: "rgba(255,255,255,0.9)" }}>
            {editing ? "Editar item" : "Novo item"}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.4)" }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "8px !important" }}>
        {/* Category chips */}
        <Box>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mb: 0.8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Categoria
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.6}>
            {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
              <Box key={c.id} sx={catSelectSx(form.category === c.id)} onClick={() => set("category", c.id)}>
                {c.emoji} {c.label}
              </Box>
            ))}
          </Stack>
        </Box>

        <TextField label="Nome do item" value={form.name} onChange={(e) => set("name", e.target.value)} size="small" fullWidth sx={fieldSx} />

        <Stack direction="row" spacing={1}>
          <TextField
            label="Preço (po decimal)"
            value={form.priceGp}
            onChange={(e) => set("priceGp", e.target.value)}
            size="small"
            sx={{ ...fieldSx, flex: 1 }}
            placeholder="ex: 0.04"
          />
          <TextField
            label="Exibição"
            value={form.priceLabel}
            onChange={(e) => set("priceLabel", e.target.value)}
            size="small"
            sx={{ ...fieldSx, flex: 1 }}
            placeholder="ex: 4 pc"
          />
        </Stack>

        <TextField
          label="Observação (opcional)"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          size="small"
          fullWidth
          sx={fieldSx}
          placeholder="ex: por dia, por garrafa"
        />

        <Box
          component="button"
          onClick={handleSave}
          disabled={saving || !form.name.trim() || !form.priceLabel.trim()}
          sx={{
            mt: 0.5,
            width: "100%", py: 1,
            border: "none", borderRadius: "10px",
            bgcolor: "rgba(255,195,60,0.18)",
            color: "rgba(255,220,100,0.9)",
            fontWeight: 800, fontSize: 13,
            cursor: "pointer",
            "&:hover:not(:disabled)": { bgcolor: "rgba(255,195,60,0.26)" },
            "&:disabled": { opacity: 0.4, cursor: "not-allowed" },
          }}
        >
          {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar item"}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

type Props = { isMaster?: boolean };

export default function PriceTable({ isMaster }: Props) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PriceItem | null>(null);
  const [deleting, setDeleting] = useState<PriceItem | null>(null);

  useEffect(() => {
    getPriceItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (activeCategory !== "all") list = list.filter((i) => i.category === activeCategory);
    if (q.trim()) {
      const lq = q.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(lq) ||
          (i.notes ?? "").toLowerCase().includes(lq) ||
          i.priceLabel.toLowerCase().includes(lq),
      );
    }
    return list;
  }, [items, activeCategory, q]);

  function handleSaved(item: PriceItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });
    setFormOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await deletePriceItem(deleting.id);
    setItems((prev) => prev.filter((i) => i.id !== deleting.id));
    setDeleting(null);
  }

  const cellSx = {
    borderColor: "rgba(255,255,255,0.05)",
    py: 0.9, px: 1.5,
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
  };
  const headSx = {
    ...cellSx,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.3)",
  };

  return (
    <Box>
      {/* Category filter chips */}
      <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mb: 1.5 }}>
        {CATEGORIES.map((c) => {
          const active = activeCategory === c.id;
          return (
            <Chip
              key={c.id}
              label={`${c.emoji} ${c.label}`}
              size="small"
              onClick={() => setActiveCategory(c.id)}
              sx={{
                fontSize: 12, fontWeight: active ? 800 : 600,
                bgcolor: active ? `${catColor(c.id === "all" ? "rgba(255,255,255,0.5)" : c.id)}22` : "rgba(255,255,255,0.05)",
                color: active ? (c.id === "all" ? "rgba(255,255,255,0.85)" : catColor(c.id)) : "rgba(255,255,255,0.45)",
                border: "1px solid",
                borderColor: active ? (c.id === "all" ? "rgba(255,255,255,0.2)" : `${catColor(c.id)}55`) : "rgba(255,255,255,0.07)",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          );
        })}
      </Stack>

      {/* Search + add */}
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar item…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255,255,255,0.04)",
              "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.15)" },
              "&.Mui-focused fieldset": { borderColor: "rgba(255,195,60,0.4)" },
            },
            "& .MuiInputBase-input": { fontSize: 13, color: "rgba(255,255,255,0.78)" },
          }}
        />
        {isMaster && (
          <Tooltip title="Adicionar item personalizado">
            <IconButton
              onClick={() => { setEditing(null); setFormOpen(true); }}
              sx={{
                border: "1px solid rgba(255,195,60,0.25)",
                color: "rgba(255,215,100,0.8)",
                bgcolor: "rgba(255,195,60,0.08)",
                borderRadius: "10px",
                width: 38, height: 38,
                flexShrink: 0,
                "&:hover": { bgcolor: "rgba(255,195,60,0.14)" },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} sx={{ color: "rgba(255,195,60,0.6)" }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography sx={{ textAlign: "center", py: 4, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
          Nenhum item encontrado
        </Typography>
      ) : (
        <TableContainer
          sx={{
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
            bgcolor: "rgba(255,255,255,0.02)",
            maxHeight: 480,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 },
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ "& th": { bgcolor: "rgba(10,8,20,0.95)" } }}>
                <TableCell sx={headSx}>Item</TableCell>
                <TableCell sx={{ ...headSx, textAlign: "right" }}>Preço</TableCell>
                {isMaster && <TableCell sx={{ ...headSx, width: 56 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    "&:hover": { bgcolor: "rgba(255,255,255,0.025)" },
                    "&:last-child td": { border: 0 },
                  }}
                >
                  <TableCell sx={cellSx}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {/* category dot */}
                      <Box
                        sx={{
                          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                          bgcolor: catColor(item.category),
                          boxShadow: `0 0 6px ${catColor(item.category)}88`,
                        }}
                      />
                      <Box>
                        <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.88)", fontWeight: item.isCustom ? 700 : 500 }}>
                          {item.name}
                          {item.isCustom && (
                            <Box component="span" sx={{
                              ml: 0.8, fontSize: 10, fontWeight: 700, px: 0.6, py: 0.1,
                              borderRadius: "4px", bgcolor: "rgba(255,195,60,0.15)",
                              color: "rgba(255,215,100,0.7)", border: "1px solid rgba(255,195,60,0.2)",
                              verticalAlign: "middle",
                            }}>custom</Box>
                          )}
                        </Typography>
                        {item.notes && (
                          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)", mt: 0.1 }}>
                            {item.notes}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,220,100,0.85)" }}>
                      {item.priceLabel}
                    </Typography>
                  </TableCell>

                  {isMaster && (
                    <TableCell sx={{ ...cellSx, px: 0.5 }}>
                      {item.isCustom && (
                        <Stack direction="row" spacing={0.25}>
                          <IconButton
                            size="small"
                            onClick={() => { setEditing(item); setFormOpen(true); }}
                            sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "rgba(255,215,100,0.7)" } }}
                          >
                            <EditRoundedIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleting(item)}
                            sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#ef4444" } }}
                          >
                            <DeleteRoundedIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography sx={{ mt: 1, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "right" }}>
        {filtered.length} {filtered.length === 1 ? "item" : "itens"} · preços PHB D&D 5e
      </Typography>

      {/* Form modal */}
      <PriceItemForm
        open={formOpen}
        editing={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />

      {/* Delete confirm */}
      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(14,11,28,0.98)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 15, color: "rgba(255,255,255,0.9)" }}>
          Remover item?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", mb: 2 }}>
            "{deleting?.name}" será removido permanentemente.
          </Typography>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", mb: 1.5 }} />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Box
              component="button"
              onClick={() => setDeleting(null)}
              sx={{
                px: 2, py: 0.7, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                bgcolor: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer",
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              Cancelar
            </Box>
            <Box
              component="button"
              onClick={handleDelete}
              sx={{
                px: 2, py: 0.7, border: "none", borderRadius: "8px",
                bgcolor: "rgba(239,68,68,0.2)", color: "#ef4444",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                "&:hover": { bgcolor: "rgba(239,68,68,0.3)" },
              }}
            >
              Remover
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
