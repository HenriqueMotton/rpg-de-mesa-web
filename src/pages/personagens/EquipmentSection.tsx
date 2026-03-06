import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import AppDialog, { AppDialogConfirmButton } from "../../components/ui/AppDialog";
import {
  SectionDivider,
  SectionIconBox,
  SectionLabelText,
  SkillEmptyBox,
} from "./ViewCharacter.styles";
import {
  getEquipment,
  addEquipment,
  removeEquipment,
  type CharacterEquipment,
} from "../../modules/equipment/equipment.api";

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

interface Props {
  characterId: number | string;
}

export default function EquipmentSection({ characterId }: Props) {
  const [items, setItems] = useState<CharacterEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const [deleteItem, setDeleteItem] = useState<CharacterEquipment | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await getEquipment(characterId));
    } catch {
      setError("Não foi possível carregar os equipamentos.");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!addName.trim()) { setAddError("Informe o nome do item."); return; }
    setSaving(true);
    setAddError(null);
    try {
      const created = await addEquipment(characterId, { name: addName.trim() });
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setAddOpen(false);
      setAddName("");
    } catch {
      setAddError("Não foi possível adicionar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setSaving(true);
    try {
      await removeEquipment(deleteItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch {
      setError("Não foi possível remover.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <SectionIconBox>
          <ShieldRoundedIcon sx={{ fontSize: 14, color: "rgba(180,150,255,0.7)" }} />
        </SectionIconBox>
        <SectionLabelText>Equipamentos</SectionLabelText>
        <SectionDivider />
      </Stack>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 3 }}>
          <CircularProgress size={22} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "10px", fontSize: 13, bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)" }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.25}>
          {/* Equipment list */}
          {items.length === 0 ? (
            <SkillEmptyBox>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                Nenhum equipamento.
              </Typography>
            </SkillEmptyBox>
          ) : (
            <Stack spacing={0.6}>
              {items.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.25,
                    pl: 1.5, pr: 0.75, py: 0.9,
                    borderRadius: "13px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    bgcolor: "rgba(255,255,255,0.025)",
                  }}
                >
                  <Box sx={{ width: 30, height: 30, borderRadius: "9px", display: "grid", placeItems: "center", bgcolor: "rgba(120,85,255,0.1)", border: "1px solid rgba(120,85,255,0.18)", fontSize: 14, flexShrink: 0 }}>
                    🛡️
                  </Box>
                  <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 13.5, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name}
                  </Typography>
                  {item.fromClass && (
                    <Typography sx={{ fontSize: 10, fontWeight: 800, color: "rgba(180,150,255,0.55)", letterSpacing: "0.05em", flexShrink: 0 }}>
                      classe
                    </Typography>
                  )}
                  <Tooltip title="Remover" placement="top">
                    <IconButton size="small" onClick={() => setDeleteItem(item)}
                      sx={{ color: "rgba(220,80,80,0.4)", "&:hover": { color: "rgba(255,120,120,0.9)", bgcolor: "rgba(220,60,60,0.1)" } }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>
          )}

          {/* Add button */}
          <Button onClick={() => { setAddName(""); setAddError(null); setAddOpen(true); }} variant="outlined" startIcon={<AddRoundedIcon />} fullWidth
            sx={{ borderRadius: "13px", py: 1, textTransform: "none", fontWeight: 800, fontSize: 13, borderColor: "rgba(120,85,255,0.25)", color: "rgba(180,150,255,0.8)", bgcolor: "rgba(120,85,255,0.05)", "&:hover": { borderColor: "rgba(120,85,255,0.45)", bgcolor: "rgba(120,85,255,0.1)" } }}>
            Adicionar equipamento
          </Button>
        </Stack>
      )}

      {/* Add dialog */}
      <AppDialog open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar Equipamento" dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button onClick={() => setAddOpen(false)} variant="text" startIcon={<CloseRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}>
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <AppDialogConfirmButton onClick={handleAdd} disabled={saving} sx={{ px: 4, py: 1.2, borderRadius: "12px" }}>
              {saving ? <CircularProgress size={13} sx={{ color: "rgba(200,180,255,0.7)" }} /> : "Adicionar"}
            </AppDialogConfirmButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          {addError && (
            <Alert severity="error" sx={{ borderRadius: "10px", fontSize: 13, bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)" }}>
              {addError}
            </Alert>
          )}
          <TextField label="Nome do equipamento" value={addName} onChange={(e) => setAddName(e.target.value)} fullWidth autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} sx={inputSx} />
        </Stack>
      </AppDialog>

      {/* Delete confirm dialog */}
      <AppDialog open={deleteItem !== null} onClose={() => setDeleteItem(null)} title="Remover Equipamento" dividers
        actions={
          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            <Button onClick={() => setDeleteItem(null)} variant="text" startIcon={<CloseRoundedIcon />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: "12px", color: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" } }}>
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={handleDelete} disabled={saving} variant="outlined"
              sx={{ px: 4, py: 1.2, borderRadius: "12px", textTransform: "none", fontWeight: 900, borderColor: "rgba(220,60,60,0.35)", color: "rgba(255,140,140,0.9)", "&:hover": { borderColor: "rgba(220,60,60,0.6)", bgcolor: "rgba(220,60,60,0.1)" } }}>
              {saving ? <CircularProgress size={13} sx={{ color: "rgba(255,130,130,0.7)" }} /> : "Remover"}
            </Button>
          </Stack>
        }
      >
        <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)" }}>
          Remover <Typography component="span" sx={{ fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>{deleteItem?.name}</Typography> do equipamento?
        </Typography>
      </AppDialog>
    </Box>
  );
}
