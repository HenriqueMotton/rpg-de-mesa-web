import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import {
  createMonster,
  updateMonster,
  type DndMonster,
  type CreateMonsterPayload,
  type MonsterAttack,
  type MonsterTrait,
} from "../../modules/monsters/monsters.api";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONSTER_TYPES = ["Humanoide", "Morto-vivo", "Fera", "Dragão", "Gigante", "Monstruosidade", "Elemental", "Construto", "Infernal", "Celestial", "Aberração", "Planta", "Lodo", "Outro"];
const SIZES = ["Minúsculo", "Pequeno", "Médio", "Grande", "Enorme", "Colossal"];
const CR_OPTIONS = ["0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];
const DAMAGE_TYPES = ["Cortante", "Perfurante", "Contundente", "Fogo", "Frio", "Elétrico", "Ácido", "Veneno", "Necrótico", "Radiante", "Trovão", "Psíquico", "Força", "—"];

const CR_XP: Record<string, number> = {
  "0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200, "2": 450, "3": 700,
  "4": 1100, "5": 1800, "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
  "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000, "16": 15000,
  "17": 18000, "18": 20000, "19": 22000, "20": 25000, "21": 33000, "22": 41000,
  "23": 50000, "24": 62000, "25": 75000, "26": 90000, "27": 105000,
  "28": 120000, "29": 135000, "30": 155000,
};

// ─── Empty states ─────────────────────────────────────────────────────────────

const EMPTY_ATTACK: MonsterAttack = { name: "", bonus: 0, reach: "1,5 m", damage: "1d6", damageType: "Cortante", notes: "" };
const EMPTY_TRAIT: MonsterTrait = { name: "", description: "" };

function emptyForm(): FormState {
  return {
    name: "", type: "Humanoide", size: "Médio", cr: "1", xp: 200,
    xpOverride: false, ac: 12, acType: "", hp: 15, speed: "9 m",
    attacks: [{ ...EMPTY_ATTACK }],
    traits: [],
  };
}

type FormState = {
  name: string;
  type: string;
  size: string;
  cr: string;
  xp: number;
  xpOverride: boolean;
  ac: number;
  acType: string;
  hp: number;
  speed: string;
  attacks: MonsterAttack[];
  traits: MonsterTrait[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "11px", bgcolor: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.9)", fontSize: 13,
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(220,80,80,0.5)", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13 },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(220,130,130,0.9)" },
};

const selectSx = {
  borderRadius: "11px", bgcolor: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.9)", fontSize: 13,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.09)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.18)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(220,80,80,0.5)", borderWidth: 1.5 },
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.4)" },
};

const menuPaperSx = {
  bgcolor: "rgba(14,11,26,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px",
  "& .MuiMenuItem-root": { color: "rgba(255,255,255,0.8)", fontSize: 13, "&:hover": { bgcolor: "rgba(220,80,80,0.1)" }, "&.Mui-selected": { bgcolor: "rgba(220,80,80,0.15)" } },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(220,80,80,0.7)", mb: 0.75 }}>
      {children}
    </Typography>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  editing: DndMonster | null; // null = creating
  onClose: () => void;
  onSaved: (monster: DndMonster) => void;
}

export default function MonsterFormModal({ open, editing, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        size: editing.size,
        cr: editing.cr,
        xp: editing.xp,
        xpOverride: editing.xp !== (CR_XP[editing.cr] ?? 0),
        ac: editing.ac,
        acType: editing.acType ?? "",
        hp: editing.hp,
        speed: editing.speed,
        attacks: editing.attacks.length > 0 ? editing.attacks.map((a) => ({ ...a, notes: a.notes ?? "" })) : [{ ...EMPTY_ATTACK }],
        traits: (editing.traits ?? []).map((t) => ({ ...t })),
      });
    } else {
      setForm(emptyForm());
    }
    setError(null);
  }, [open, editing]);

  // Auto-fill XP from CR (when not overridden)
  function setCr(cr: string) {
    setForm((p) => ({ ...p, cr, xp: p.xpOverride ? p.xp : (CR_XP[cr] ?? 0) }));
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // ── Attacks ────────────────────────────────────────────────────────────
  function setAtk(i: number, key: keyof MonsterAttack, value: string | number) {
    setForm((p) => {
      const atks = p.attacks.map((a, idx) => idx === i ? { ...a, [key]: value } : a);
      return { ...p, attacks: atks };
    });
  }
  function addAtk() { setForm((p) => ({ ...p, attacks: [...p.attacks, { ...EMPTY_ATTACK }] })); }
  function removeAtk(i: number) { setForm((p) => ({ ...p, attacks: p.attacks.filter((_, idx) => idx !== i) })); }

  // ── Traits ─────────────────────────────────────────────────────────────
  function setTrait(i: number, key: keyof MonsterTrait, value: string) {
    setForm((p) => {
      const traits = p.traits.map((t, idx) => idx === i ? { ...t, [key]: value } : t);
      return { ...p, traits };
    });
  }
  function addTrait() { setForm((p) => ({ ...p, traits: [...p.traits, { ...EMPTY_TRAIT }] })); }
  function removeTrait(i: number) { setForm((p) => ({ ...p, traits: p.traits.filter((_, idx) => idx !== i) })); }

  // ── Save ───────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) { setError("O nome é obrigatório."); return; }
    if (form.attacks.some((a) => !a.name.trim())) { setError("Todos os ataques precisam de nome."); return; }
    if (form.traits.some((t) => !t.name.trim())) { setError("Todas as habilidades precisam de nome."); return; }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateMonsterPayload = {
        name: form.name.trim(),
        type: form.type,
        size: form.size,
        cr: form.cr,
        xp: form.xp,
        ac: form.ac,
        acType: form.acType.trim() || undefined,
        hp: form.hp,
        speed: form.speed.trim(),
        attacks: form.attacks.map((a) => ({ ...a, notes: a.notes?.trim() || undefined })),
        traits: form.traits.length > 0 ? form.traits : undefined,
      };
      const result = editing
        ? await updateMonster(editing.id, payload)
        : await createMonster(payload);
      onSaved(result);
    } catch {
      setError("Não foi possível salvar o monstro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: "rgba(9,7,20,0.99)", backgroundImage: "none" } }}
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Header */}
        <Box sx={{ px: 2.5, pt: 3, pb: 1.75, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BugReportRoundedIcon sx={{ fontSize: 18, color: "rgba(220,80,80,0.8)" }} />
            <Typography sx={{ fontWeight: 900, fontSize: 17, color: "rgba(255,255,255,0.92)", flex: 1 }}>
              {editing ? "Editar Monstro" : "Novo Monstro"}
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "rgba(255,255,255,0.7)" } }}>
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Scrollable form body */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
          <Stack spacing={2.5}>

            {error && (
              <Alert severity="error" sx={{ borderRadius: "10px", fontSize: 13, bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)" }}>
                {error}
              </Alert>
            )}

            {/* ── Identidade ──────────────────────────────────────────── */}
            <Box>
              <SectionTitle>Identidade</SectionTitle>
              <Stack spacing={1.25}>
                <TextField
                  label="Nome" fullWidth size="small"
                  value={form.name} onChange={(e) => set("name", e.target.value)}
                  sx={inputSx}
                />
                <Stack direction="row" spacing={1.25}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mb: 0.4 }}>Tipo</Typography>
                    <Select fullWidth size="small" value={form.type} onChange={(e) => set("type", e.target.value)} sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }}>
                      {MONSTER_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mb: 0.4 }}>Tamanho</Typography>
                    <Select fullWidth size="small" value={form.size} onChange={(e) => set("size", e.target.value)} sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }}>
                      {SIZES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            {/* ── Stats ───────────────────────────────────────────────── */}
            <Box>
              <SectionTitle>Estatísticas</SectionTitle>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1.25}>
                  {/* CR */}
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mb: 0.4 }}>CR</Typography>
                    <Select fullWidth size="small" value={form.cr} onChange={(e) => setCr(e.target.value)} sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }}>
                      {CR_OPTIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </Box>
                  {/* XP */}
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.4 }}>
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>XP</Typography>
                      <Typography
                        onClick={() => setForm((p) => ({ ...p, xpOverride: !p.xpOverride, xp: !p.xpOverride ? p.xp : (CR_XP[p.cr] ?? 0) }))}
                        sx={{ fontSize: 10, color: form.xpOverride ? "rgba(255,180,60,0.8)" : "rgba(255,255,255,0.25)", cursor: "pointer", fontWeight: 700 }}
                      >
                        {form.xpOverride ? "manual" : "automático"}
                      </Typography>
                    </Stack>
                    <TextField
                      fullWidth size="small" type="number"
                      value={form.xp}
                      onChange={(e) => { set("xp", Number(e.target.value)); set("xpOverride", true); }}
                      disabled={!form.xpOverride}
                      sx={{ ...inputSx, "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], opacity: form.xpOverride ? 1 : 0.5 } }}
                    />
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.25}>
                  <TextField label="CA" size="small" type="number" value={form.ac} onChange={(e) => set("ac", Number(e.target.value))} sx={{ ...inputSx, flex: 1 }} />
                  <TextField label="Tipo de CA" size="small" value={form.acType} onChange={(e) => set("acType", e.target.value)} placeholder="ex: Armadura Natural" sx={{ ...inputSx, flex: 2 }} />
                </Stack>

                <Stack direction="row" spacing={1.25}>
                  <TextField label="HP médio" size="small" type="number" value={form.hp} onChange={(e) => set("hp", Number(e.target.value))} sx={{ ...inputSx, flex: 1 }} />
                  <TextField label="Deslocamento" size="small" value={form.speed} onChange={(e) => set("speed", e.target.value)} placeholder="ex: 9 m / Voo 18 m" sx={{ ...inputSx, flex: 2 }} />
                </Stack>
              </Stack>
            </Box>

            {/* ── Ataques ─────────────────────────────────────────────── */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <SectionTitle>Ataques</SectionTitle>
                <Button size="small" onClick={addAtk} startIcon={<AddRoundedIcon sx={{ fontSize: "12px !important" }} />} sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, color: "rgba(220,80,80,0.75)", "&:hover": { bgcolor: "rgba(220,80,80,0.08)" }, borderRadius: "8px", py: 0.3 }}>
                  Adicionar
                </Button>
              </Stack>

              <Stack spacing={1.25}>
                {form.attacks.map((atk, i) => (
                  <Box key={i} sx={{ p: 1.25, borderRadius: "11px", border: "1px solid rgba(255,120,60,0.15)", bgcolor: "rgba(255,120,60,0.04)" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "rgba(255,160,80,0.8)" }}>Ataque {i + 1}</Typography>
                      {form.attacks.length > 1 && (
                        <IconButton size="small" onClick={() => removeAtk(i)} sx={{ color: "rgba(255,100,100,0.4)", width: 20, height: 20, "&:hover": { color: "rgba(255,100,100,0.8)" } }}>
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      )}
                    </Stack>

                    <Stack spacing={1}>
                      <TextField label="Nome do ataque" size="small" fullWidth value={atk.name} onChange={(e) => setAtk(i, "name", e.target.value)} sx={inputSx} />
                      <Stack direction="row" spacing={1}>
                        <TextField label="Bônus de ataque" size="small" type="number" value={atk.bonus} onChange={(e) => setAtk(i, "bonus", Number(e.target.value))} sx={{ ...inputSx, flex: 1 }} />
                        <TextField label="Alcance" size="small" value={atk.reach} onChange={(e) => setAtk(i, "reach", e.target.value)} placeholder="1,5 m" sx={{ ...inputSx, flex: 2 }} />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField label="Dano" size="small" value={atk.damage} onChange={(e) => setAtk(i, "damage", e.target.value)} placeholder="2d6+4" sx={{ ...inputSx, flex: 1 }} />
                        <Box sx={{ flex: 1.5 }}>
                          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", mb: 0.4 }}>Tipo de dano</Typography>
                          <Select fullWidth size="small" value={atk.damageType} onChange={(e) => setAtk(i, "damageType", e.target.value)} sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }}>
                            {DAMAGE_TYPES.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                          </Select>
                        </Box>
                      </Stack>
                      <TextField label="Notas (opcional)" size="small" fullWidth value={atk.notes ?? ""} onChange={(e) => setAtk(i, "notes", e.target.value)} placeholder="ex: CD 13 Con ou envenenado" sx={inputSx} />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* ── Habilidades ─────────────────────────────────────────── */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <SectionTitle>Habilidades e Traços</SectionTitle>
                <Button size="small" onClick={addTrait} startIcon={<AddRoundedIcon sx={{ fontSize: "12px !important" }} />} sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, color: "rgba(160,130,255,0.75)", "&:hover": { bgcolor: "rgba(160,130,255,0.08)" }, borderRadius: "8px", py: 0.3 }}>
                  Adicionar
                </Button>
              </Stack>

              {form.traits.length === 0 && (
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic", textAlign: "center", py: 0.75 }}>
                  Nenhuma habilidade. Clique em "Adicionar" para incluir traços especiais.
                </Typography>
              )}

              <Stack spacing={1}>
                {form.traits.map((trait, i) => (
                  <Box key={i} sx={{ p: 1.25, borderRadius: "11px", border: "1px solid rgba(160,130,255,0.12)", bgcolor: "rgba(160,130,255,0.03)" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.8)" }}>Habilidade {i + 1}</Typography>
                      <IconButton size="small" onClick={() => removeTrait(i)} sx={{ color: "rgba(255,100,100,0.4)", width: 20, height: 20, "&:hover": { color: "rgba(255,100,100,0.8)" } }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Stack>
                    <Stack spacing={0.75}>
                      <TextField label="Nome" size="small" fullWidth value={trait.name} onChange={(e) => setTrait(i, "name", e.target.value)} sx={inputSx} />
                      <TextField label="Descrição" size="small" fullWidth multiline rows={2} value={trait.description} onChange={(e) => setTrait(i, "description", e.target.value)} sx={inputSx} />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>

          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 2, flexShrink: 0 }}>
          <Stack direction="row" spacing={1.5}>
            <Button onClick={onClose} variant="text" sx={{ textTransform: "none", fontWeight: 700, borderRadius: "12px", color: "rgba(255,255,255,0.35)", "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
              Cancelar
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleSave} disabled={saving}
              variant="contained"
              sx={{ borderRadius: "12px", px: 3, py: 1.1, textTransform: "none", fontWeight: 800, fontSize: 13, bgcolor: "rgba(200,50,50,0.85)", "&:hover": { bgcolor: "rgba(220,70,70,0.95)" }, "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}
            >
              {saving ? <CircularProgress size={14} sx={{ color: "rgba(255,200,200,0.8)" }} /> : (editing ? "Salvar alterações" : "Criar monstro")}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
