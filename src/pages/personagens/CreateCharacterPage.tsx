import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import FavoriteRoundedIcon       from "@mui/icons-material/FavoriteRounded";
import AutoAwesomeRoundedIcon    from "@mui/icons-material/AutoAwesomeRounded";
import PersonRoundedIcon         from "@mui/icons-material/PersonRounded";
import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon         from "@mui/icons-material/RemoveRounded";
import PsychologyRoundedIcon     from "@mui/icons-material/PsychologyRounded";
import ArrowBackRoundedIcon      from "@mui/icons-material/ArrowBackRounded";

import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { createCharacter } from "../../modules/characters/characters.api";
import { useCharactersStore } from "../../modules/characters/characters.store";
import { Glass, Page, OrbTop, OrbSide, Noise } from "./CreateCharacter.styles";
import AppDialog, { AppDialogConfirmButton } from "../../components/ui/AppDialog";
import RollDialog from "../../components/ui/RollDialog";
import SkillsDialog from "../../components/ui/SkillsDialog";

type AttrKey = "forca" | "destreza" | "constituicao" | "inteligencia" | "sabedoria" | "carisma";

const ATTR_BADGE: Record<AttrKey, string> = {
  forca: "FOR", destreza: "DES", constituicao: "CON",
  inteligencia: "INT", sabedoria: "SAB", carisma: "CAR",
};

const ATTRS: { key: AttrKey; label: string }[] = [
  { key: "forca",        label: "Força" },
  { key: "destreza",     label: "Destreza" },
  { key: "constituicao", label: "Constituição" },
  { key: "inteligencia", label: "Inteligência" },
  { key: "sabedoria",    label: "Sabedoria" },
  { key: "carisma",      label: "Carisma" },
];

function getAttributeCost(value: number) {
  const t: Record<number, number> = { 8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9 };
  return t[value] ?? 0;
}
function getModifier(value: number) { return Math.floor((value - 10) / 2); }
function fmtMod(m: number) { return m >= 0 ? `+${m}` : `${m}`; }

export default function CreateCharacterPage() {
  const navigate = useNavigate();

  const draft                   = useCharactersStore((s) => s.draft);
  const resetDraft              = useCharactersStore((s) => s.resetDraft);
  const setDraftName            = useCharactersStore((s) => s.setDraftName);
  const setDraftAttribute       = useCharactersStore((s) => s.setDraftAttribute);
  const setDraftPointsRemaining = useCharactersStore((s) => s.setDraftPointsRemaining);
  const setDraftMoney           = useCharactersStore((s) => s.setDraftMoney);
  const setDraftHealth          = useCharactersStore((s) => s.setDraftHealth);
  const setDraftMaxHealth       = useCharactersStore((s) => s.setDraftMaxHealth);
  const toggleDraftSkill        = useCharactersStore((s) => s.toggleDraftSkill);

  const { name, attributes, pointsRemaining, money, health, maxHealth, selectedSkills } = draft;

  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [moneyOpen,  setMoneyOpen]  = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [tempRoll,   setTempRoll]   = useState("");

  const canSave = useMemo(
    () => name.trim().length > 0 && pointsRemaining === 0 && selectedSkills.length >= 5 && !saving,
    [name, pointsRemaining, selectedSkills.length, saving]
  );

  function increaseAttribute(key: AttrKey) {
    const current = attributes[key];
    if (current >= 15) return;
    const cost = getAttributeCost(current + 1) - getAttributeCost(current);
    if (pointsRemaining >= cost) {
      setDraftAttribute(key, current + 1);
      setDraftPointsRemaining(pointsRemaining - cost);
    } else {
      setError("Você não tem pontos suficientes para aumentar este atributo.");
    }
  }

  function decreaseAttribute(key: AttrKey) {
    const current = attributes[key];
    if (current <= 8) return;
    const refund = getAttributeCost(current) - getAttributeCost(current - 1);
    setDraftAttribute(key, current - 1);
    setDraftPointsRemaining(pointsRemaining + refund);
  }

  function confirmMoneyRoll() {
    const v = Number(tempRoll);
    if (!Number.isFinite(v) || v < 0 || v > 60) { setError("Valor inválido. Informe um número entre 0 e 60."); return; }
    setDraftMoney(v * 50 + 1000);
    setMoneyOpen(false);
  }

  function confirmHealthRoll() {
    const v = Number(tempRoll);
    if (!Number.isFinite(v) || v < 0 || v > 16) { setError("Valor inválido. Informe um número entre 0 e 16."); return; }
    setDraftMaxHealth(v + 8);
    setDraftHealth(v + 8);
    setHealthOpen(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim())              return setError("O nome do personagem é obrigatório.");
    if (pointsRemaining > 0)       return setError("Você ainda tem pontos para distribuir.");
    if (selectedSkills.length < 5) return setError("Selecione pelo menos 5 perícias.");
    setSaving(true);
    try {
      await createCharacter({ name, attributes, selectedSkills: selectedSkills.slice(0, 5), money, health });
      resetDraft();
      navigate(ROUTES.personagens, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Não foi possível salvar o personagem.");
    } finally { setSaving(false); }
  }

  const inputSx = {
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.35)", fontSize: 13.5 },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgba(160,130,255,0.9)" },
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      backgroundColor: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.92)", fontSize: 14,
      "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
    },
    "& .MuiInputAdornment-root svg": { color: "rgba(255,255,255,0.25)", fontSize: 18 },
  };

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

      {/* Container sem position/zIndex — fica no fluxo normal abaixo do menu */}
      <Container maxWidth="sm" sx={{ pt: 2.5, px: 2 }}>

        {/* ── Header ── */}
        <Stack spacing={0.6} sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "rgba(160,130,255,0.55)" }}>
            Personagens
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, color: "rgba(255,255,255,0.93)" }}>
              Novo Personagem
            </Typography>

            {/* Badge de pontos — muda cor quando zerado */}
            <Box sx={{
              px: 1.2, py: 0.5, borderRadius: "9px", display: "flex", alignItems: "center", gap: 0.5,
              bgcolor: pointsRemaining > 0 ? "rgba(120,85,255,0.15)" : "rgba(75,175,130,0.12)",
              border: `1px solid ${pointsRemaining > 0 ? "rgba(120,85,255,0.28)" : "rgba(75,175,130,0.28)"}`,
              transition: "all 0.3s",
            }}>
              <PsychologyRoundedIcon sx={{ fontSize: 14, color: pointsRemaining > 0 ? "rgba(180,150,255,0.85)" : "rgba(75,200,130,0.85)" }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1, color: pointsRemaining > 0 ? "rgba(180,150,255,0.9)" : "rgba(100,220,160,0.9)" }}>
                {pointsRemaining} pts
              </Typography>
            </Box>
          </Stack>

          {saving && (
            <LinearProgress sx={{ mt: 0.5, borderRadius: 2, height: 2, bgcolor: "rgba(255,255,255,0.06)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #7B54FF, #5B8FFF)" } }} />
          )}
        </Stack>

        <Glass elevation={0}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", py: 0.5, bgcolor: "rgba(220,60,60,0.09)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)", fontSize: 13, "& .MuiAlert-icon": { color: "rgba(255,110,110,0.7)", fontSize: 18 } }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSave}>
              <Stack spacing={2}>

                {/* Nome */}
                <TextField
                  label="Nome do personagem"
                  value={name}
                  onChange={(e) => setDraftName(e.target.value)}
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon /></InputAdornment> }}
                  sx={inputSx}
                />

                {/* Stats pills */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Box onClick={() => { setTempRoll(""); setMoneyOpen(true); }} sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.6, borderRadius: "9px", cursor: "pointer", bgcolor: "rgba(255,195,80,0.08)", border: "1px solid rgba(255,195,80,0.18)", transition: "all 0.18s", "&:hover": { bgcolor: "rgba(255,195,80,0.14)", borderColor: "rgba(255,195,80,0.3)" } }}>
                    <MonetizationOnRoundedIcon sx={{ fontSize: 14, color: "rgba(255,195,80,0.8)" }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,210,100,0.9)" }}>{money} ouro</Typography>
                  </Box>

                  <Box onClick={() => { setTempRoll(""); setHealthOpen(true); }} sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.6, borderRadius: "9px", cursor: "pointer", bgcolor: "rgba(75,175,130,0.08)", border: "1px solid rgba(75,175,130,0.2)", transition: "all 0.18s", "&:hover": { bgcolor: "rgba(75,175,130,0.14)", borderColor: "rgba(75,175,130,0.35)" } }}>
                    <FavoriteRoundedIcon sx={{ fontSize: 14, color: "rgba(75,200,130,0.85)" }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "rgba(100,220,160,0.9)" }}>{health} / {maxHealth} HP</Typography>
                  </Box>

                  <Box onClick={() => setSkillsOpen(true)} sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.6, borderRadius: "9px", cursor: "pointer", bgcolor: selectedSkills.length >= 5 ? "rgba(120,85,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedSkills.length >= 5 ? "rgba(120,85,255,0.3)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.18s", "&:hover": { bgcolor: "rgba(120,85,255,0.18)", borderColor: "rgba(120,85,255,0.4)" } }}>
                    <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: selectedSkills.length >= 5 ? "rgba(180,150,255,0.85)" : "rgba(255,255,255,0.4)" }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: selectedSkills.length >= 5 ? "rgba(180,150,255,0.95)" : "rgba(255,255,255,0.5)" }}>{selectedSkills.length}/5 perícias</Typography>
                  </Box>
                </Stack>

                <Divider sx={{ opacity: 0.1 }} />

                {/* ── Atributos ── */}
                <Stack spacing={0.9}>
                  {ATTRS.map((a) => {
                    const v       = attributes[a.key];
                    const mod     = getModifier(v);
                    const canUp   = v < 15 && pointsRemaining >= getAttributeCost(v + 1) - getAttributeCost(v);
                    const canDown = v > 8;

                    return (
                      <Box
                        key={a.key}
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          px: 1.2, py: 0.9,
                          borderRadius: "12px",
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.025)",
                          transition: "border-color 0.18s",
                          "&:hover": { borderColor: "rgba(255,255,255,0.1)" },
                        }}
                      >
                        {/* Esquerda */}
                        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ width: 38, height: 38, borderRadius: "10px", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: "rgba(200,180,255,0.9)", bgcolor: "rgba(120,85,255,0.12)", border: "1px solid rgba(120,85,255,0.2)" }}>
                            {ATTR_BADGE[a.key]}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2, color: "rgba(255,255,255,0.9)" }}>
                              {a.label}
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, opacity: 0.5, lineHeight: 1.2,  color: "white" }}>
                              mod <b style={{ opacity: 0.5, color: "white" }}>{fmtMod(mod)}</b>
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Direita: − valor + */}
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                          <IconButton size="small" onClick={() => decreaseAttribute(a.key)} disabled={!canDown}
                            sx={{ width: 32, height: 32, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)", flexShrink: 0, "&.Mui-disabled": { opacity: 0.18 } }}>
                            <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>

                          <Typography sx={{ width: 28, textAlign: "center", fontWeight: 800, fontSize: 16, flexShrink: 0, color: v > 10 ? "rgba(190,165,255,0.95)" : "rgba(255,255,255,0.85)" }}>
                            {v}
                          </Typography>

                          <IconButton size="small" onClick={() => increaseAttribute(a.key)} disabled={!canUp}
                            sx={{ width: 32, height: 32, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)", flexShrink: 0, "&:hover": { bgcolor: "rgba(120,85,255,0.15)", borderColor: "rgba(120,85,255,0.3)", color: "rgba(180,150,255,0.9)" }, "&.Mui-disabled": { opacity: 0.18 } }}>
                            <AddRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>

                {/* Criar */}
                <Button type="submit" variant="contained" disabled={!canSave}
                  sx={{ mt: 0.5, py: 1.35, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14.5, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)", transition: "all 0.2s", "&:hover": { boxShadow: "0 10px 32px rgba(100,70,230,0.5)", transform: "translateY(-1px)" }, "&:active": { transform: "translateY(0)" }, "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}>
                  {saving ? "Salvando..." : "Criar personagem"}
                </Button>

                {/* Voltar */}
                <Button type="button" onClick={() => navigate(ROUTES.personagens)}
                  startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: 13.5, color: "rgba(255,255,255,0.32)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Voltar
                </Button>

              </Stack>
            </Box>
          </CardContent>
        </Glass>

        {/* ── Skills dialog ── */}
        <SkillsDialog
          open={skillsOpen}
          onClose={() => setSkillsOpen(false)}
          selected={selectedSkills}
          toggle={toggleDraftSkill}
          max={5}
        />

        {/* ── Money dialog ── */}
        <RollDialog
          open={moneyOpen}
          onClose={() => setMoneyOpen(false)}
          title="Rolar Dinheiro"
          helperText="Role 1D20 × 1D3 e insira o resultado (0–60)."
          value={tempRoll}
          onChange={setTempRoll}
          onConfirm={confirmMoneyRoll}
          inputSx={{ mt: 0.5, ...inputSx }}
        />

        {/* ── Health dialog ── */}
        <RollDialog
          open={healthOpen}
          onClose={() => setHealthOpen(false)}
          title="Rolar Vida"
          helperText="Role 1D20 ÷ 2 + 1D6 e insira o resultado (0–16)."
          value={tempRoll}
          onChange={setTempRoll}
          onConfirm={confirmHealthRoll}
          inputSx={{ mt: 0.5, ...inputSx }}
        />

      </Container>
    </Page>
  );
}