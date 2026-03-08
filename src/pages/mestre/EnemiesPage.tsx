import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";

import {
  Page,
  OrbTop,
  OrbSide,
  Noise,
  Glass,
  PageLabel,
  PageTitle,
} from "../personagens/ViewCharacter.styles";

// ─── Types ─────────────────────────────────────────────────────────────────

type EnemyTemplate = {
  id: string;
  name: string;
  maxHp: number;
  ac: number;
  initiativeMod: number;
  attack: string;
  damage: string;
  speed: number;
  notes: string;
};

type CombatEnemy = {
  instanceId: string;
  name: string;
  maxHp: number;
  currentHp: number;
  ac: number;
  initiative: number | null;
  initiativeMod: number;
  attack: string;
  damage: string;
  notes: string;
};

// ─── Storage ───────────────────────────────────────────────────────────────

const TEMPLATES_KEY = "rpg_enemy_templates";
const COMBAT_KEY    = "rpg_combat_enemies";

function loadTemplates(): EnemyTemplate[] {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? "[]"); } catch { return []; }
}
function saveTemplates(t: EnemyTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(t));
}
function loadCombat(): CombatEnemy[] {
  try { return JSON.parse(localStorage.getItem(COMBAT_KEY) ?? "[]"); } catch { return []; }
}
function saveCombat(c: CombatEnemy[]) {
  localStorage.setItem(COMBAT_KEY, JSON.stringify(c));
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── Helpers ───────────────────────────────────────────────────────────────

function hpColor(current: number, max: number) {
  const pct = max > 0 ? current / max : 0;
  if (pct <= 0)   return { bar: "#6b1010", text: "rgba(255,100,100,0.9)" };
  if (pct <= 0.25) return { bar: "#c0392b", text: "rgba(255,120,100,0.9)" };
  if (pct <= 0.5)  return { bar: "#c0791f", text: "rgba(255,180,80,0.9)" };
  return              { bar: "#1e7a3c", text: "rgba(80,220,130,0.9)" };
}

// Form state usa strings nos campos numéricos para permitir apagar livremente
type EnemyFormState = {
  name: string;
  maxHp: string;
  ac: string;
  initiativeMod: string;
  speed: string;
  attack: string;
  damage: string;
  notes: string;
};

const EMPTY_FORM: EnemyFormState = {
  name: "", maxHp: "10", ac: "12", initiativeMod: "0", speed: "9", attack: "", damage: "", notes: "",
};

const inputSx = {
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13 },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(255,100,80,0.9)" },
  "& .MuiOutlinedInput-root": {
    borderRadius: "11px", bgcolor: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.9)", fontSize: 13.5,
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(220,80,60,0.5)", borderWidth: 1.5 },
  },
};

// ─── Enemy form dialog ─────────────────────────────────────────────────────

function EnemyFormDialog({
  open, onClose, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (t: EnemyTemplate, qty: number) => void;
}) {
  const [form, setForm] = useState<EnemyFormState>(EMPTY_FORM);
  const [qty, setQty]   = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setQty(1); setError(""); }
  }, [open]);

  function f(key: keyof EnemyFormState, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function submit() {
    const maxHp = parseInt(form.maxHp, 10) || 0;
    const ac    = parseInt(form.ac, 10)    || 0;
    const speed = parseInt(form.speed, 10) || 0;
    const initiativeMod = parseInt(form.initiativeMod, 10) || 0;
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    if (maxHp <= 0)        { setError("HP máx deve ser maior que 0."); return; }
    const tpl: EnemyTemplate = {
      id: uid(), name: form.name.trim(),
      maxHp, ac, initiativeMod, speed,
      attack: form.attack, damage: form.damage, notes: form.notes,
    };
    onAdd(tpl, Math.max(1, qty));
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: "rgba(9,7,20,0.99)", backgroundImage: "none" } }}
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 3, pb: 2, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocalFireDepartmentRoundedIcon sx={{ fontSize: 18, color: "rgba(220,80,60,0.8)" }} />
            <Typography sx={{ fontWeight: 900, fontSize: 17, color: "rgba(255,255,255,0.92)", flex: 1 }}>
              Novo Inimigo
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.3)" }}>
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Form */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
          <Stack spacing={1.75}>
            {error && (
              <Box sx={{ px: 1.5, py: 1, borderRadius: "10px", bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.2)" }}>
                <Typography sx={{ fontSize: 12.5, color: "rgba(255,120,100,0.9)" }}>{error}</Typography>
              </Box>
            )}

            <TextField label="Nome do inimigo" value={form.name}
              onChange={(e) => f("name", e.target.value)} sx={inputSx} />

            <Stack direction="row" spacing={1}>
              <TextField label="HP máx" type="number" value={form.maxHp}
                onChange={(e) => f("maxHp", e.target.value)} sx={inputSx} fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><FavoriteRoundedIcon sx={{ fontSize: 14, color: "rgba(200,60,60,0.6)" }} /></InputAdornment> }} />
              <TextField label="CA" type="number" value={form.ac}
                onChange={(e) => f("ac", e.target.value)} sx={inputSx} fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><ShieldRoundedIcon sx={{ fontSize: 14, color: "rgba(100,150,255,0.6)" }} /></InputAdornment> }} />
            </Stack>

            <Stack direction="row" spacing={1}>
              <TextField label="Mod. Iniciativa" type="number" value={form.initiativeMod}
                onChange={(e) => f("initiativeMod", e.target.value)} sx={inputSx} fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><FlashOnRoundedIcon sx={{ fontSize: 14, color: "rgba(255,200,60,0.6)" }} /></InputAdornment> }} />
              <TextField label="Velocidade (m)" type="number" value={form.speed}
                onChange={(e) => f("speed", e.target.value)} sx={inputSx} fullWidth />
            </Stack>

            <Stack direction="row" spacing={1}>
              <TextField label="Ataque" placeholder="+5" value={form.attack}
                onChange={(e) => f("attack", e.target.value)} sx={inputSx} fullWidth />
              <TextField label="Dano" placeholder="1d8+3" value={form.damage}
                onChange={(e) => f("damage", e.target.value)} sx={inputSx} fullWidth />
            </Stack>

            <TextField label="Notas / Habilidades" value={form.notes}
              onChange={(e) => f("notes", e.target.value)}
              sx={inputSx} multiline minRows={2} />

            <Box sx={{ pt: 0.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.35)", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Quantidade no encontro
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={() => setQty((q) => Math.max(1, q - 1))}
                  sx={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.5)" }}>
                  <Typography sx={{ fontSize: 16, lineHeight: 1, px: 0.25 }}>−</Typography>
                </IconButton>
                <Typography sx={{ fontWeight: 900, fontSize: 22, color: "rgba(255,255,255,0.92)", minWidth: 32, textAlign: "center" }}>
                  {qty}
                </Typography>
                <IconButton size="small" onClick={() => setQty((q) => q + 1)}
                  sx={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.5)" }}>
                  <Typography sx={{ fontSize: 16, lineHeight: 1, px: 0.25 }}>+</Typography>
                </IconButton>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
        <Box sx={{ px: 2.5, py: 2 }}>
          <Button
            fullWidth variant="contained" onClick={submit}
            sx={{
              borderRadius: "13px", py: 1.4, textTransform: "none", fontWeight: 900, fontSize: 14,
              background: "linear-gradient(135deg, rgba(180,40,30,0.9), rgba(220,80,60,0.9))",
              boxShadow: "0 4px 20px rgba(180,40,30,0.4)",
              "&:hover": { background: "linear-gradient(135deg, rgba(200,50,40,1), rgba(240,90,70,1))" },
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 17, mr: 0.75 }} />
            Adicionar {qty > 1 ? `${qty} inimigos` : "ao encontro"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── Combat Enemy Card ─────────────────────────────────────────────────────

function CombatCard({
  enemy,
  onDamage,
  onHeal,
  onInitiativeChange,
  onDuplicate,
  onRemove,
}: {
  enemy: CombatEnemy;
  onDamage: (id: string, amount: number) => void;
  onHeal: (id: string, amount: number) => void;
  onInitiativeChange: (id: string, value: number | null) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [damageInput, setDamageInput] = useState("");
  const [healInput, setHealInput]   = useState("");

  const pct = enemy.maxHp > 0 ? Math.max(0, enemy.currentHp) / enemy.maxHp : 0;
  const colors = hpColor(enemy.currentHp, enemy.maxHp);
  const isDead = enemy.currentHp <= 0;

  function applyDamage() {
    const n = parseInt(damageInput, 10);
    if (!isNaN(n) && n > 0) { onDamage(enemy.instanceId, n); setDamageInput(""); }
  }
  function applyHeal() {
    const n = parseInt(healInput, 10);
    if (!isNaN(n) && n > 0) { onHeal(enemy.instanceId, n); setHealInput(""); }
  }

  return (
    <Box sx={{
      borderRadius: "14px",
      border: isDead
        ? "1px solid rgba(200,60,60,0.2)"
        : expanded
        ? "1px solid rgba(220,80,60,0.3)"
        : "1px solid rgba(255,255,255,0.07)",
      bgcolor: isDead ? "rgba(180,30,30,0.06)" : "rgba(255,255,255,0.02)",
      overflow: "hidden",
      opacity: isDead ? 0.65 : 1,
      transition: "all .15s",
    }}>
      {/* ── Header row ── */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1.25, py: 1, cursor: "pointer" }}
      >
        {/* Initiative badge */}
        <Box sx={{
          minWidth: 36, height: 36, borderRadius: "9px", display: "grid", placeItems: "center",
          bgcolor: "rgba(255,200,60,0.08)", border: "1px solid rgba(255,200,60,0.18)", flexShrink: 0,
        }}>
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: enemy.initiative !== null ? "rgba(255,215,100,0.95)" : "rgba(255,255,255,0.2)" }}>
            {enemy.initiative ?? "—"}
          </Typography>
        </Box>

        {/* Name + HP bar */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: isDead ? "rgba(255,100,100,0.7)" : "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isDead && "☠ "}{enemy.name}
            </Typography>
            <Chip label={`CA ${enemy.ac}`} size="small" sx={{ height: 15, fontSize: 9, fontWeight: 800, bgcolor: "rgba(100,150,255,0.1)", color: "rgba(140,180,255,0.85)", border: "1px solid rgba(100,150,255,0.2)", "& .MuiChip-label": { px: 0.6 } }} />
          </Stack>
          {/* HP bar */}
          <Box sx={{ mt: 0.4 }}>
            <LinearProgress
              variant="determinate"
              value={pct * 100}
              sx={{
                height: 4, borderRadius: 2, bgcolor: "rgba(255,255,255,0.06)",
                "& .MuiLinearProgress-bar": { bgcolor: colors.bar, borderRadius: 2, transition: "transform .3s" },
              }}
            />
            <Typography sx={{ fontSize: 10, color: colors.text, fontWeight: 700, mt: 0.2 }}>
              {Math.max(0, enemy.currentHp)}/{enemy.maxHp} PV
            </Typography>
          </Box>
        </Box>

        {/* Expand chevron */}
        <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.2)", flexShrink: 0, transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "none" }} />
      </Box>

      {/* ── Detail panel ── */}
      <Collapse in={expanded} timeout={180}>
        <Box sx={{ px: 1.5, pb: 1.5, borderTop: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Initiative input */}
          <Box sx={{ mt: 1.25 }}>
            <Typography sx={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,200,60,0.5)", mb: 0.5 }}>
              Iniciativa
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <TextField
                type="number"
                size="small"
                placeholder="—"
                value={enemy.initiative ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onInitiativeChange(enemy.instanceId, v === "" ? null : Number(v));
                }}
                sx={{
                  width: 80,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9px", bgcolor: "rgba(255,200,60,0.06)", fontSize: 13, fontWeight: 700, color: "rgba(255,215,100,0.95)",
                    "& fieldset": { borderColor: "rgba(255,200,60,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "rgba(255,200,60,0.5)" },
                  },
                  "& input": { textAlign: "center", py: 0.6, px: 1 },
                }}
              />
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                mod {enemy.initiativeMod >= 0 ? "+" : ""}{enemy.initiativeMod}
              </Typography>
            </Stack>
          </Box>

          {/* Stats */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75, mt: 1.25 }}>
            {[
              { label: "Ataque", value: enemy.attack || "—" },
              { label: "Dano",   value: enemy.damage || "—" },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ borderRadius: "8px", px: 1, py: 0.75, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography sx={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.22)", mb: 0.2 }}>{label}</Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.75)", fontFamily: value.match(/d\d/i) ? "monospace" : "inherit" }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          {/* Notes */}
          {enemy.notes && (
            <Box sx={{ mt: 0.75, borderRadius: "8px", px: 1, py: 0.75, bgcolor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <Typography sx={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.2)", mb: 0.2 }}>Notas</Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{enemy.notes}</Typography>
            </Box>
          )}

          {/* Damage controls */}
          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(220,80,60,0.7)", mb: 0.75 }}>
              Aplicar Dano
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <TextField
                type="number" size="small" placeholder="Dano..."
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyDamage(); }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9px", bgcolor: "rgba(220,60,60,0.06)", fontSize: 13, color: "rgba(255,150,130,0.9)",
                    "& fieldset": { borderColor: "rgba(220,60,60,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "rgba(220,60,60,0.5)" },
                  },
                  "& input": { py: 0.75, px: 1.25 },
                }}
              />
              <Button
                onClick={applyDamage}
                variant="contained"
                sx={{
                  borderRadius: "9px", textTransform: "none", fontWeight: 800, fontSize: 12.5, px: 2,
                  background: "linear-gradient(135deg, rgba(180,40,30,0.9), rgba(220,80,60,0.9))",
                  "&:hover": { background: "linear-gradient(135deg, rgba(200,50,40,1), rgba(240,90,70,1))" },
                }}
              >
                Dano
              </Button>
            </Stack>
          </Box>

          {/* Heal controls */}
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(60,200,120,0.7)", mb: 0.75 }}>
              Curar
            </Typography>
            <Stack direction="row" spacing={0.75}>
              <TextField
                type="number" size="small" placeholder="Cura..."
                value={healInput}
                onChange={(e) => setHealInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyHeal(); }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9px", bgcolor: "rgba(40,160,90,0.06)", fontSize: 13, color: "rgba(80,220,140,0.9)",
                    "& fieldset": { borderColor: "rgba(40,160,90,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "rgba(40,160,90,0.5)" },
                  },
                  "& input": { py: 0.75, px: 1.25 },
                }}
              />
              <Button
                onClick={applyHeal}
                variant="contained"
                sx={{
                  borderRadius: "9px", textTransform: "none", fontWeight: 800, fontSize: 12.5, px: 2,
                  background: "linear-gradient(135deg, rgba(30,120,70,0.9), rgba(50,180,100,0.9))",
                  "&:hover": { background: "linear-gradient(135deg, rgba(40,140,80,1), rgba(60,200,110,1))" },
                }}
              >
                Curar
              </Button>
            </Stack>
          </Box>

          {/* Action buttons */}
          <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}>
            <Tooltip title="Duplicar">
              <IconButton size="small" onClick={() => onDuplicate(enemy.instanceId)}
                sx={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "rgba(255,255,255,0.35)", "&:hover": { color: "rgba(255,255,255,0.7)", bgcolor: "rgba(255,255,255,0.05)" } }}>
                <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              onClick={() => onRemove(enemy.instanceId)}
              startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, borderRadius: "8px", color: "rgba(220,80,80,0.7)", border: "1px solid rgba(220,60,60,0.18)", px: 1.5, "&:hover": { color: "rgba(255,120,100,0.9)", bgcolor: "rgba(220,60,60,0.08)", borderColor: "rgba(220,60,60,0.35)" } }}
            >
              Remover
            </Button>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function EnemiesPage() {
  const [combat, setCombatRaw]   = useState<CombatEnemy[]>(loadCombat);
  const [formOpen, setFormOpen]  = useState(false);
  const [sortedByInit, setSortedByInit] = useState(false);

  const setCombat = useCallback((fn: (prev: CombatEnemy[]) => CombatEnemy[]) => {
    setCombatRaw((prev) => {
      const next = fn(prev);
      saveCombat(next);
      return next;
    });
  }, []);

  // Persist on mount is handled by lazy init in useState
  useEffect(() => { saveCombat(combat); }, []); // eslint-disable-line

  function addToCombat(tpl: EnemyTemplate, qty: number) {
    const instances: CombatEnemy[] = Array.from({ length: qty }, (_, i) => ({
      instanceId: uid(),
      name: qty > 1 ? `${tpl.name} ${i + 1}` : tpl.name,
      maxHp: tpl.maxHp,
      currentHp: tpl.maxHp,
      ac: tpl.ac,
      initiative: null,
      initiativeMod: tpl.initiativeMod,
      attack: tpl.attack,
      damage: tpl.damage,
      notes: tpl.notes,
    }));
    setCombat((prev) => [...prev, ...instances]);
  }

  function handleDamage(id: string, amount: number) {
    setCombat((prev) => prev.map((e) =>
      e.instanceId === id ? { ...e, currentHp: Math.max(0, e.currentHp - amount) } : e
    ));
  }

  function handleHeal(id: string, amount: number) {
    setCombat((prev) => prev.map((e) =>
      e.instanceId === id ? { ...e, currentHp: Math.min(e.maxHp, e.currentHp + amount) } : e
    ));
  }

  function handleInitiativeChange(id: string, value: number | null) {
    setCombat((prev) => prev.map((e) =>
      e.instanceId === id ? { ...e, initiative: value } : e
    ));
  }

  function handleDuplicate(id: string) {
    setCombat((prev) => {
      const src = prev.find((e) => e.instanceId === id);
      if (!src) return prev;
      const copy: CombatEnemy = { ...src, instanceId: uid(), name: `${src.name} (cópia)`, currentHp: src.maxHp };
      const idx = prev.findIndex((e) => e.instanceId === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function handleRemove(id: string) {
    setCombat((prev) => prev.filter((e) => e.instanceId !== id));
  }

  function clearDead() {
    setCombat((prev) => prev.filter((e) => e.currentHp > 0));
  }

  function clearAll() {
    setCombat(() => []);
  }

  function rollAllInitiative() {
    setCombat((prev) => prev.map((e) => ({
      ...e,
      initiative: Math.floor(Math.random() * 20) + 1 + e.initiativeMod,
    })));
    setSortedByInit(true);
  }

  const displayList = sortedByInit
    ? [...combat].sort((a, b) => {
        const ai = a.initiative ?? -999;
        const bi = b.initiative ?? -999;
        return bi - ai;
      })
    : combat;

  const deadCount   = combat.filter((e) => e.currentHp <= 0).length;
  const aliveCount  = combat.filter((e) => e.currentHp > 0).length;

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

      <Container maxWidth="sm" sx={{ pt: 2.5, px: 2, pb: 10 }}>
        {/* Page header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <PageLabel>Mestre</PageLabel>
            <PageTitle>Inimigos</PageTitle>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
            onClick={() => setFormOpen(true)}
            sx={{
              textTransform: "none", fontWeight: 800, fontSize: 13, borderRadius: "11px", px: 2, py: 0.9,
              background: "linear-gradient(135deg, rgba(180,40,30,0.9), rgba(220,80,60,0.9))",
              boxShadow: "0 3px 14px rgba(180,40,30,0.4)",
              "&:hover": { background: "linear-gradient(135deg, rgba(200,50,40,1), rgba(240,90,70,1))" },
            }}
          >
            Adicionar
          </Button>
        </Stack>

        {/* Encounter controls */}
        {combat.length > 0 && (
          <Glass elevation={0} sx={{ mb: 2 }}>
            <Box sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                  <Box sx={{ px: 1.25, py: 0.6, borderRadius: "8px", bgcolor: "rgba(60,200,120,0.08)", border: "1px solid rgba(60,200,120,0.18)" }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "rgba(80,220,140,0.9)" }}>
                      {aliveCount} vivo{aliveCount !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                  {deadCount > 0 && (
                    <Box sx={{ px: 1.25, py: 0.6, borderRadius: "8px", bgcolor: "rgba(200,60,60,0.08)", border: "1px solid rgba(200,60,60,0.18)" }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "rgba(255,100,100,0.9)" }}>
                        {deadCount} morto{deadCount !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Tooltip title={sortedByInit ? "Ordem de adição" : "Ordenar por iniciativa"}>
                  <IconButton size="small"
                    onClick={() => setSortedByInit((v) => !v)}
                    sx={{
                      borderRadius: "8px", border: sortedByInit ? "1px solid rgba(255,200,60,0.4)" : "1px solid rgba(255,255,255,0.1)",
                      bgcolor: sortedByInit ? "rgba(255,200,60,0.08)" : "transparent",
                      color: sortedByInit ? "rgba(255,215,100,0.9)" : "rgba(255,255,255,0.35)",
                    }}>
                    <SortRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Button size="small" onClick={rollAllInitiative}
                  sx={{ textTransform: "none", fontWeight: 700, fontSize: 11.5, borderRadius: "8px", px: 1.25, py: 0.4, color: "rgba(255,215,100,0.8)", border: "1px solid rgba(255,200,60,0.2)", "&:hover": { bgcolor: "rgba(255,200,60,0.08)", borderColor: "rgba(255,200,60,0.4)" } }}>
                  Rolar Iniciativa
                </Button>

                {deadCount > 0 && (
                  <Button size="small" onClick={clearDead}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 11.5, borderRadius: "8px", px: 1.25, py: 0.4, color: "rgba(200,80,80,0.8)", border: "1px solid rgba(200,60,60,0.2)", "&:hover": { bgcolor: "rgba(200,60,60,0.08)", borderColor: "rgba(200,60,60,0.4)" } }}>
                    Limpar Mortos
                  </Button>
                )}

                <Button size="small" onClick={clearAll}
                  sx={{ textTransform: "none", fontWeight: 700, fontSize: 11.5, borderRadius: "8px", px: 1.25, py: 0.4, color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.07)", "&:hover": { color: "rgba(255,100,100,0.7)", bgcolor: "rgba(200,60,60,0.06)", borderColor: "rgba(200,60,60,0.2)" } }}>
                  Limpar Tudo
                </Button>
              </Stack>
            </Box>
          </Glass>
        )}

        {/* Combat list */}
        {combat.length === 0 ? (
          <Glass elevation={0}>
            <Box sx={{ py: 6, textAlign: "center" }}>
              <LocalFireDepartmentRoundedIcon sx={{ fontSize: 32, color: "rgba(220,80,60,0.2)", mb: 1 }} />
              <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                Nenhum inimigo no encontro.
              </Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.15)", mt: 0.5 }}>
                Clique em "Adicionar" para criar.
              </Typography>
            </Box>
          </Glass>
        ) : (
          <Stack spacing={1}>
            {displayList.map((enemy) => (
              <CombatCard
                key={enemy.instanceId}
                enemy={enemy}
                onDamage={handleDamage}
                onHeal={handleHeal}
                onInitiativeChange={handleInitiativeChange}
                onDuplicate={handleDuplicate}
                onRemove={handleRemove}
              />
            ))}
          </Stack>
        )}
      </Container>

      <EnemyFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onAdd={addToCombat}
      />
    </Page>
  );
}
