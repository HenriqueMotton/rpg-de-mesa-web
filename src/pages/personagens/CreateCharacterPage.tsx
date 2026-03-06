import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Radio,
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
import CheckRoundedIcon          from "@mui/icons-material/CheckRounded";

import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { createCharacter } from "../../modules/characters/characters.api";
import { useCharactersStore } from "../../modules/characters/characters.store";
import { listRaces, type Race } from "../../modules/races/races.api";
import { Glass, Page, OrbTop, OrbSide, Noise } from "./CreateCharacter.styles";
import AppDialog, { AppDialogConfirmButton } from "../../components/ui/AppDialog";
import RollDialog from "../../components/ui/RollDialog";
import SkillsDialog from "../../components/ui/SkillsDialog";

type AttrKey = "forca" | "destreza" | "constituicao" | "inteligencia" | "sabedoria" | "carisma";

const ATTR_BADGE: Record<AttrKey, string> = {
  forca: "FOR", destreza: "DES", constituicao: "CON",
  inteligencia: "INT", sabedoria: "SAB", carisma: "CAR",
};
const ATTR_LABEL: Record<AttrKey, string> = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  inteligencia: "Inteligência", sabedoria: "Sabedoria", carisma: "Carisma",
};

const ATTRS: { key: AttrKey; label: string }[] = [
  { key: "forca",        label: "Força" },
  { key: "destreza",     label: "Destreza" },
  { key: "constituicao", label: "Constituição" },
  { key: "inteligencia", label: "Inteligência" },
  { key: "sabedoria",    label: "Sabedoria" },
  { key: "carisma",      label: "Carisma" },
];

const RACE_ICON: Record<string, string> = {
  "Anão":      "⛏️",
  "Elfo":      "🌿",
  "Meio-Elfo": "🌟",
  "Humano":    "🏛️",
  "Draconato": "🐉",
  "Gnomo":     "⚙️",
  "Meio-Orc":  "💪",
  "Hobbit":    "🌻",
};

function getAttributeCost(value: number) {
  const t: Record<number, number> = { 8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9 };
  return t[value] ?? 0;
}
function getModifier(value: number) { return Math.floor((value - 10) / 2); }
function fmtMod(m: number) { return m >= 0 ? `+${m}` : `${m}`; }

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

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((s, idx) => (
        <Fragment key={s}>
          <Box sx={{
            width: 30, height: 30, borderRadius: "50%",
            display: "grid", placeItems: "center", flexShrink: 0,
            bgcolor: s <= current ? "rgba(120,85,255,0.85)" : "rgba(255,255,255,0.07)",
            border: `1.5px solid ${s <= current ? "rgba(160,130,255,0.45)" : "rgba(255,255,255,0.1)"}`,
            color: s <= current ? "#fff" : "rgba(255,255,255,0.25)",
            fontSize: 12.5, fontWeight: 800,
            transition: "all 0.35s",
            boxShadow: s === current ? "0 0 12px rgba(120,85,255,0.45)" : "none",
          }}>
            {s < current ? <CheckRoundedIcon sx={{ fontSize: 14 }} /> : s}
          </Box>
          {idx < total - 1 && (
            <Box sx={{
              flex: 1, height: 1.5, mx: 0.75,
              bgcolor: s < current ? "rgba(120,85,255,0.55)" : "rgba(255,255,255,0.07)",
              borderRadius: 99,
              transition: "background-color 0.35s",
            }} />
          )}
        </Fragment>
      ))}
    </Stack>
  );
}

function RaceCard({ race, selected, onSelect }: { race: Race; selected: boolean; onSelect: () => void }) {
  const bonusEntries = (Object.entries(race.bonuses) as [AttrKey, number][]).filter(([, v]) => v > 0);
  const icon = RACE_ICON[race.name] ?? "🎲";

  return (
    <Box
      onClick={onSelect}
      sx={{
        borderRadius: "16px",
        border: `1.5px solid ${selected ? "rgba(160,130,255,0.55)" : "rgba(255,255,255,0.07)"}`,
        bgcolor: selected ? "rgba(120,85,255,0.1)" : "rgba(255,255,255,0.025)",
        p: 1.5,
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        boxShadow: selected ? "0 0 20px rgba(120,85,255,0.2)" : "none",
        "&:hover": {
          border: "1.5px solid rgba(160,130,255,0.35)",
          bgcolor: "rgba(120,85,255,0.07)",
        },
      }}
    >
      {selected && (
        <Box sx={{
          position: "absolute", top: 8, right: 8,
          width: 18, height: 18, borderRadius: "50%",
          bgcolor: "rgba(120,85,255,0.9)",
          display: "grid", placeItems: "center",
        }}>
          <CheckRoundedIcon sx={{ fontSize: 11, color: "#fff" }} />
        </Box>
      )}

      <Typography sx={{ fontSize: 22, lineHeight: 1, mb: 0.75 }}>{icon}</Typography>

      <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: "rgba(255,255,255,0.92)", mb: 0.5, lineHeight: 1.2 }}>
        {race.name}
      </Typography>

      <Typography sx={{
        fontSize: 11.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.45, mb: 1,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {race.description}
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {bonusEntries.map(([key, val]) => (
          <Box key={key} sx={{
            px: 0.8, py: 0.3,
            borderRadius: "6px",
            bgcolor: "rgba(120,85,255,0.15)",
            border: "1px solid rgba(120,85,255,0.25)",
            fontSize: 10.5, fontWeight: 800,
            color: "rgba(200,180,255,0.9)",
            letterSpacing: "0.03em",
          }}>
            +{val} {ATTR_BADGE[key]}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

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
  const setDraftRaceId          = useCharactersStore((s) => s.setDraftRaceId);
  const setDraftSubRaceId       = useCharactersStore((s) => s.setDraftSubRaceId);

  const { name, attributes, pointsRemaining, money, health, maxHealth, selectedSkills, selectedRaceId, selectedSubRaceId } = draft;

  const [step,       setStep]       = useState<1 | 2>(1);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [moneyOpen,  setMoneyOpen]  = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [tempRoll,   setTempRoll]   = useState("");

  const [races,        setRaces]        = useState<Race[]>([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [detailRace,   setDetailRace]   = useState<Race | null>(null);
  const [tempSubRaceId, setTempSubRaceId] = useState<number | null>(null);

  useEffect(() => {
    setRacesLoading(true);
    listRaces().then(setRaces).catch(() => {}).finally(() => setRacesLoading(false));
  }, []);

  const conMod        = Math.floor((attributes.constituicao - 10) / 2);
  const effectiveHp   = health + conMod;

  const canNext = useMemo(
    () => name.trim().length > 0 && pointsRemaining === 0 && selectedSkills.length >= 5,
    [name, pointsRemaining, selectedSkills.length]
  );
  const selectedRace    = races.find((r) => r.id === selectedRaceId) ?? null;
  const selectedSubRace = selectedRace?.subRaces?.find((sr) => sr.id === selectedSubRaceId) ?? null;
  const raceHasSubRaces = (selectedRace?.subRaces?.length ?? 0) > 0;
  const canSave = selectedRaceId !== null && (!raceHasSubRaces || selectedSubRaceId !== null) && !saving;

  function openRaceDetail(race: Race) {
    setTempSubRaceId(selectedRaceId === race.id ? selectedSubRaceId : null);
    setDetailRace(race);
  }

  function confirmRaceDetail() {
    if (!detailRace) return;
    const hasSubRaces = (detailRace.subRaces?.length ?? 0) > 0;
    if (hasSubRaces && tempSubRaceId === null) return;
    setDraftRaceId(detailRace.id);
    setDraftSubRaceId(hasSubRaces ? tempSubRaceId : null);
    setDetailRace(null);
    setError(null);
  }

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

  function handleNext() {
    setError(null);
    if (!name.trim())              return setError("O nome do personagem é obrigatório.");
    if (pointsRemaining > 0)       return setError("Você ainda tem pontos para distribuir.");
    if (selectedSkills.length < 5) return setError("Selecione pelo menos 5 perícias.");
    setStep(2);
  }

  async function handleSave() {
    if (!selectedRaceId) return setError("Selecione uma raça para continuar.");
    setError(null);
    setSaving(true);
    try {
      await createCharacter({
        name,
        attributes,
        selectedSkills: selectedSkills.slice(0, 5),
        money,
        health,
        raceId: selectedRaceId ?? undefined,
        subRaceId: selectedSubRaceId ?? undefined,
      });
      resetDraft();
      navigate(ROUTES.personagens, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Não foi possível salvar o personagem.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

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
            {step === 1 && (
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
            )}
          </Stack>
          {saving && (
            <LinearProgress sx={{ mt: 0.5, borderRadius: 2, height: 2, bgcolor: "rgba(255,255,255,0.06)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #7B54FF, #5B8FFF)" } }} />
          )}
        </Stack>

        <Glass elevation={0}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>

            <StepIndicator current={step} total={2} />

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", py: 0.5, bgcolor: "rgba(220,60,60,0.09)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)", fontSize: 13, "& .MuiAlert-icon": { color: "rgba(255,110,110,0.7)", fontSize: 18 } }}>
                {error}
              </Alert>
            )}

            {/* ══ STEP 1 ══ */}
            {step === 1 && (
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
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "rgba(100,220,160,0.9)" }}>
                      {effectiveHp} HP
                      {conMod !== 0 && (
                        <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, ml: 0.4, opacity: 0.7 }}>
                          ({conMod > 0 ? "+" : ""}{conMod} CON)
                        </Typography>
                      )}
                    </Typography>
                  </Box>

                  <Box onClick={() => setSkillsOpen(true)} sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.6, borderRadius: "9px", cursor: "pointer", bgcolor: selectedSkills.length >= 5 ? "rgba(120,85,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedSkills.length >= 5 ? "rgba(120,85,255,0.3)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.18s", "&:hover": { bgcolor: "rgba(120,85,255,0.18)", borderColor: "rgba(120,85,255,0.4)" } }}>
                    <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: selectedSkills.length >= 5 ? "rgba(180,150,255,0.85)" : "rgba(255,255,255,0.4)" }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: selectedSkills.length >= 5 ? "rgba(180,150,255,0.95)" : "rgba(255,255,255,0.5)" }}>{selectedSkills.length}/5 perícias</Typography>
                  </Box>
                </Stack>

                <Divider sx={{ opacity: 0.1 }} />

                {/* Atributos */}
                <Stack spacing={0.9}>
                  {ATTRS.map((a) => {
                    const v       = attributes[a.key];
                    const mod     = getModifier(v);
                    const canUp   = v < 15 && pointsRemaining >= getAttributeCost(v + 1) - getAttributeCost(v);
                    const canDown = v > 8;
                    return (
                      <Box key={a.key} sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 1, px: 1.2, py: 0.9, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)", transition: "border-color 0.18s", "&:hover": { borderColor: "rgba(255,255,255,0.1)" } }}>
                        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ width: 38, height: 38, borderRadius: "10px", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: "rgba(200,180,255,0.9)", bgcolor: "rgba(120,85,255,0.12)", border: "1px solid rgba(120,85,255,0.2)" }}>
                            {ATTR_BADGE[a.key]}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2, color: "rgba(255,255,255,0.9)" }}>{a.label}</Typography>
                            <Typography sx={{ fontSize: 11.5, opacity: 0.5, lineHeight: 1.2, color: "white" }}>
                              mod <b style={{ opacity: 0.5, color: "white" }}>{fmtMod(mod)}</b>
                            </Typography>
                          </Box>
                        </Stack>
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

                {/* Próximo */}
                <Button onClick={handleNext} variant="contained" disabled={!canNext}
                  sx={{ mt: 0.5, py: 1.35, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14.5, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)", "&:hover": { boxShadow: "0 10px 32px rgba(100,70,230,0.5)", transform: "translateY(-1px)" }, "&:active": { transform: "translateY(0)" }, "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}>
                  Próximo
                </Button>

                <Button type="button" onClick={() => navigate(ROUTES.personagens)}
                  startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: 13.5, color: "rgba(255,255,255,0.32)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Cancelar
                </Button>
              </Stack>
            )}

            {/* ══ STEP 2 — Escolha de raça ══ */}
            {step === 2 && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: "rgba(255,255,255,0.92)", mb: 0.5 }}>
                    Escolha sua raça
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
                    Cada raça concede bônus únicos aos seus atributos base.
                  </Typography>
                </Box>

                {racesLoading ? (
                  <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                    <CircularProgress size={28} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                    {races.map((race) => (
                      <RaceCard
                        key={race.id}
                        race={race}
                        selected={selectedRaceId === race.id}
                        onSelect={() => openRaceDetail(race)}
                      />
                    ))}
                  </Box>
                )}

                {/* Preview de atributos com bônus */}
                {selectedRace && (
                  <Box sx={{ borderRadius: "14px", border: "1px solid rgba(120,85,255,0.2)", bgcolor: "rgba(120,85,255,0.06)", p: 1.75 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,150,255,0.6)", mb: 0.5 }}>
                      Atributos finais
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", mb: 1.25 }}>
                      {selectedRace.name}{selectedSubRace ? ` · ${selectedSubRace.name}` : ""}
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.75 }}>
                      {ATTRS.map((a) => {
                        const base     = attributes[a.key];
                        const rBonus   = selectedRace.bonuses[a.key] ?? 0;
                        const srBonus  = selectedSubRace?.bonuses[a.key] ?? 0;
                        const bonus    = rBonus + srBonus;
                        const final    = base + bonus;
                        return (
                          <Box key={a.key} sx={{
                            borderRadius: "10px", p: 1,
                            border: `1px solid ${bonus > 0 ? "rgba(160,130,255,0.3)" : "rgba(255,255,255,0.07)"}`,
                            bgcolor: bonus > 0 ? "rgba(120,85,255,0.1)" : "rgba(255,255,255,0.02)",
                            textAlign: "center",
                          }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
                              {ATTR_BADGE[a.key]}
                            </Typography>
                            <Typography sx={{ fontSize: 18, fontWeight: 900, color: bonus > 0 ? "rgba(200,180,255,0.95)" : "rgba(255,255,255,0.8)", lineHeight: 1.1 }}>
                              {final}
                            </Typography>
                            {bonus > 0 && (
                              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "rgba(160,130,255,0.8)" }}>
                                +{bonus}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Criar */}
                <Button onClick={handleSave} variant="contained" disabled={!canSave}
                  sx={{ py: 1.35, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14.5, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)", "&:hover": { boxShadow: "0 10px 32px rgba(100,70,230,0.5)", transform: "translateY(-1px)" }, "&:active": { transform: "translateY(0)" }, "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}>
                  {saving ? <CircularProgress size={18} sx={{ color: "rgba(255,255,255,0.5)" }} /> : "Criar Personagem"}
                </Button>

                <Button onClick={() => { setStep(1); setError(null); }}
                  startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: 13.5, color: "rgba(255,255,255,0.32)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Voltar
                </Button>
              </Stack>
            )}

          </CardContent>
        </Glass>

        {/* Race Detail Dialog */}
        <Dialog
          open={!!detailRace}
          onClose={() => setDetailRace(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { bgcolor: "#1a1530", border: "1px solid rgba(120,85,255,0.2)", borderRadius: "20px", backgroundImage: "none" } }}
        >
          {detailRace && (
            <DialogContent sx={{ p: 0 }}>
              {/* Header */}
              <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={0.75}>
                  <Typography sx={{ fontSize: 28, lineHeight: 1 }}>{RACE_ICON[detailRace.name] ?? "🎲"}</Typography>
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 17, color: "rgba(255,255,255,0.95)", lineHeight: 1.2 }}>{detailRace.name}</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {(Object.entries(detailRace.bonuses) as [AttrKey, number][])
                        .filter(([, v]) => v > 0)
                        .map(([k, v]) => (
                          <Box key={k} sx={{ px: 0.75, py: 0.25, borderRadius: "6px", bgcolor: "rgba(120,85,255,0.18)", border: "1px solid rgba(120,85,255,0.3)", fontSize: 10.5, fontWeight: 800, color: "rgba(200,180,255,0.9)" }}>
                            +{v} {ATTR_BADGE[k]}
                          </Box>
                        ))}
                    </Stack>
                  </Box>
                </Stack>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                  {detailRace.description}
                </Typography>
              </Box>

              {/* Traits */}
              {detailRace.traits?.length > 0 && (
                <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,150,255,0.55)", mb: 1.25 }}>
                    Traços Raciais
                  </Typography>
                  <Stack spacing={1}>
                    {detailRace.traits.map((t) => (
                      <Box key={t.name}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{t.name}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>{t.description}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Sub-races */}
              {detailRace.subRaces?.length > 0 && (
                <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,150,255,0.55)", mb: 1.25 }}>
                    Sub-raça <Box component="span" sx={{ color: "rgba(255,100,100,0.7)", ml: 0.25 }}>*</Box>
                  </Typography>
                  <Stack spacing={0.75}>
                    {detailRace.subRaces.map((sr) => {
                      const srBonuses = (Object.entries(sr.bonuses) as [AttrKey, number][]).filter(([, v]) => v > 0);
                      const isChosen  = tempSubRaceId === sr.id;
                      return (
                        <Box
                          key={sr.id}
                          onClick={() => setTempSubRaceId(sr.id)}
                          sx={{
                            display: "flex", alignItems: "flex-start", gap: 1,
                            px: 1.5, py: 1.25, borderRadius: "12px", cursor: "pointer",
                            border: `1.5px solid ${isChosen ? "rgba(160,130,255,0.5)" : "rgba(255,255,255,0.07)"}`,
                            bgcolor: isChosen ? "rgba(120,85,255,0.1)" : "rgba(255,255,255,0.025)",
                            transition: "all 0.18s",
                            "&:hover": { borderColor: "rgba(160,130,255,0.3)", bgcolor: "rgba(120,85,255,0.06)" },
                          }}
                        >
                          <Radio
                            checked={isChosen}
                            size="small"
                            sx={{ p: 0, mt: 0.2, color: "rgba(255,255,255,0.2)", "&.Mui-checked": { color: "rgba(160,130,255,0.9)" } }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                              <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: "rgba(255,255,255,0.9)" }}>{sr.name}</Typography>
                              {srBonuses.map(([k, v]) => (
                                <Box key={k} sx={{ px: 0.6, py: 0.2, borderRadius: "5px", bgcolor: "rgba(120,85,255,0.15)", border: "1px solid rgba(120,85,255,0.25)", fontSize: 10, fontWeight: 800, color: "rgba(200,180,255,0.85)" }}>
                                  +{v} {ATTR_BADGE[k]}
                                </Box>
                              ))}
                            </Stack>
                            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.5, mt: 0.25 }}>{sr.description}</Typography>
                            {sr.traits?.length > 0 && (
                              <Stack spacing={0.5} mt={0.75}>
                                {sr.traits.map((t) => (
                                  <Box key={t.name}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{t.name}</Typography>
                                    <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{t.description}</Typography>
                                  </Box>
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Confirm */}
              <Box sx={{ px: 2.5, py: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={confirmRaceDetail}
                  disabled={(detailRace.subRaces?.length ?? 0) > 0 && tempSubRaceId === null}
                  sx={{ py: 1.25, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)", "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}
                >
                  Selecionar {detailRace.name}
                  {(detailRace.subRaces?.length ?? 0) > 0 && tempSubRaceId === null && " (escolha uma sub-raça)"}
                </Button>
                <Button fullWidth onClick={() => setDetailRace(null)} sx={{ mt: 0.75, textTransform: "none", fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.3)", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Cancelar
                </Button>
              </Box>
            </DialogContent>
          )}
        </Dialog>

        {/* Dialogs */}
        <SkillsDialog open={skillsOpen} onClose={() => setSkillsOpen(false)} selected={selectedSkills} toggle={toggleDraftSkill} max={5} />
        <RollDialog open={moneyOpen} onClose={() => setMoneyOpen(false)} title="Rolar Dinheiro" helperText="Role 1D20 × 1D3 e insira o resultado (0–60)." value={tempRoll} onChange={setTempRoll} onConfirm={confirmMoneyRoll} inputSx={{ mt: 0.5, ...inputSx }} />
        <RollDialog open={healthOpen} onClose={() => setHealthOpen(false)} title="Rolar Vida" helperText="Role 1D20 ÷ 2 + 1D6 e insira o resultado (0–16)." value={tempRoll} onChange={setTempRoll} onConfirm={confirmHealthRoll} inputSx={{ mt: 0.5, ...inputSx }} />

      </Container>
    </Page>
  );
}
