import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  Popover,
  IconButton,
  InputAdornment,
  LinearProgress,
  Radio,
  Slider,
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
import InfoOutlinedIcon          from "@mui/icons-material/InfoOutlined";

import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { createCharacter } from "../../modules/characters/characters.api";
import { addInventoryItem } from "../../modules/inventory/inventory.api";
import { useCharactersStore } from "../../modules/characters/characters.store";
import { listRaces, type Race } from "../../modules/races/races.api";
import { listClasses, type DndClass } from "../../modules/classes/classes.api";
import { listKits, type Kit } from "../../modules/kits/kits.api";
import { addEquipment } from "../../modules/equipment/equipment.api";
import { Glass, Page, OrbTop, OrbSide, Noise } from "./CreateCharacter.styles";
import AppDialog, { AppDialogCancelButton, AppDialogConfirmButton } from "../../components/ui/AppDialog";
import SkillsDialog from "../../components/ui/SkillsDialog";

type AttrKey = "forca" | "destreza" | "constituicao" | "inteligencia" | "sabedoria" | "carisma";

// ─── Kit name matching ────────────────────────────────────────────────────────
function normalize(s: string) {
  return s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findKit(name: string, kits: Kit[]): Kit | undefined {
  const key = normalize(name);
  return kits.find((k) => normalize(k.name) === key);
}

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

type SizeKey = "TINY" | "SMALL" | "MEDIUM" | "LARGE" | "HUGE" | "GARGANTUAN";

const RACE_HEIGHT: Record<string, { min: number; max: number; size: SizeKey }> = {
  "Humano":    { min: 150, max: 200, size: "MEDIUM" },
  "Elfo":      { min: 160, max: 200, size: "MEDIUM" },
  "Anão":      { min: 120, max: 150, size: "MEDIUM" },
  "Gnomo":     { min: 90,  max: 120, size: "SMALL"  },
  "Meio-Orc":  { min: 180, max: 220, size: "MEDIUM" },
  "Meio-Elfo": { min: 160, max: 200, size: "MEDIUM" },
  "Draconato": { min: 180, max: 210, size: "MEDIUM" },
  "Hobbit":    { min: 90,  max: 120, size: "SMALL"  },
};

const SIZE_MULTIPLIER: Record<SizeKey, number> = {
  TINY: 0.5, SMALL: 1, MEDIUM: 1, LARGE: 2, HUGE: 4, GARGANTUAN: 8,
};

const HIT_DICE_BY_CLASS: Record<string, number> = {
  "Bárbaro": 12, "Bardo": 8, "Bruxo": 8, "Clérico": 8, "Druida": 8,
  "Feiticeiro": 6, "Guerreiro": 10, "Ladino": 8, "Mago": 6,
  "Monge": 8, "Paladino": 10, "Patrulheiro": 10,
};

type GoldDice = { dice: number; sides: number; multiplier: number };
const GOLD_DICE_BY_CLASS: Record<string, GoldDice> = {
  "Bárbaro":     { dice: 2, sides: 4, multiplier: 10 },
  "Bardo":       { dice: 5, sides: 4, multiplier: 10 },
  "Bruxo":       { dice: 4, sides: 4, multiplier: 10 },
  "Clérico":     { dice: 5, sides: 4, multiplier: 10 },
  "Druida":      { dice: 2, sides: 4, multiplier: 10 },
  "Feiticeiro":  { dice: 3, sides: 4, multiplier: 10 },
  "Guerreiro":   { dice: 5, sides: 4, multiplier: 10 },
  "Ladino":      { dice: 4, sides: 4, multiplier: 10 },
  "Mago":        { dice: 4, sides: 4, multiplier: 10 },
  "Monge":       { dice: 5, sides: 4, multiplier: 10 },
  "Paladino":    { dice: 5, sides: 4, multiplier: 10 },
  "Patrulheiro": { dice: 5, sides: 4, multiplier: 10 },
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
  const setDraftPP              = useCharactersStore((s) => s.setDraftPP);
  const setDraftMoney           = useCharactersStore((s) => s.setDraftMoney);
  const setDraftPL              = useCharactersStore((s) => s.setDraftPL);
  const setDraftHealth          = useCharactersStore((s) => s.setDraftHealth);
  const setDraftMaxHealth       = useCharactersStore((s) => s.setDraftMaxHealth);
  const toggleDraftSkill        = useCharactersStore((s) => s.toggleDraftSkill);
  const setDraftRaceId          = useCharactersStore((s) => s.setDraftRaceId);
  const setDraftSubRaceId       = useCharactersStore((s) => s.setDraftSubRaceId);
  const setDraftClass           = useCharactersStore((s) => s.setDraftClass);

  const { name, attributes, pointsRemaining, pp, money, pl, health, maxHealth, selectedSkills, selectedRaceId, selectedSubRaceId, selectedClassId } = draft;

  const [step,       setStep]       = useState<1 | 2 | 3 | 4>(1);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [moneyOpen,  setMoneyOpen]  = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [tempRoll,   setTempRoll]   = useState("");

  const [races,          setRaces]          = useState<Race[]>([]);
  const [racesLoading,   setRacesLoading]   = useState(false);
  const [detailRace,     setDetailRace]     = useState<Race | null>(null);
  const [tempSubRaceId,  setTempSubRaceId]  = useState<number | null>(null);
  const [classes,           setClasses]           = useState<DndClass[]>([]);
  const [classesLoading,    setClassesLoading]    = useState(false);
  const [kits,              setKits]              = useState<Kit[]>([]);
  const [detailClass,       setDetailClass]       = useState<DndClass | null>(null);
  const [imgError,          setImgError]          = useState<Record<string, boolean>>({});
  const [pendingEquipment,  setPendingEquipment]  = useState<string[]>([]);
  const [tempEquipSel,      setTempEquipSel]      = useState<Map<string, string | null>>(new Map());
  const [infoAnchorEl,      setInfoAnchorEl]      = useState<HTMLButtonElement | null>(null);
  const [infoPackKey,       setInfoPackKey]       = useState<string | null>(null);
  const [height,            setHeight]            = useState<number>(170);

  useEffect(() => {
    setRacesLoading(true);
    listRaces().then(setRaces).catch(() => {}).finally(() => setRacesLoading(false));
  }, []);

  useEffect(() => {
    setClassesLoading(true);
    listClasses().then(setClasses).catch(() => {}).finally(() => setClassesLoading(false));
  }, []);

  useEffect(() => {
    listKits().then(setKits).catch(() => {});
  }, []);

  useEffect(() => {
    if (detailClass) {
      const m = new Map<string, string | null>();
      detailClass.equipment.forEach((eq) => {
        // Pre-select first option (works for both simple items and "ou" choices)
        const first = eq.split(/\s+ou\s+/i)[0].trim();
        m.set(eq, first);
      });
      setTempEquipSel(m);
    }
  }, [detailClass]);

  const selectedRace  = races.find((r) => r.id === selectedRaceId) ?? null;
  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;
  const hitDie        = HIT_DICE_BY_CLASS[selectedClass?.name ?? ""] ?? 8;
  const goldDice      = GOLD_DICE_BY_CLASS[selectedClass?.name ?? ""] ?? { dice: 4, sides: 4, multiplier: 10 };

  useEffect(() => {
    if (selectedRace) {
      const range = RACE_HEIGHT[selectedRace.name];
      if (range) setHeight(Math.round((range.min + range.max) / 2));
    }
  }, [selectedRaceId]);

  // Quando a classe muda, define HP e ouro padrão baseados na classe
  useEffect(() => {
    if (selectedClassId && classes.length > 0) {
      const cls = classes.find((c) => c.id === selectedClassId);
      if (cls) {
        const die  = HIT_DICE_BY_CLASS[cls.name] ?? 8;
        setDraftHealth(die);
        setDraftMaxHealth(die);
        const gd   = GOLD_DICE_BY_CLASS[cls.name] ?? { dice: 4, sides: 4, multiplier: 10 };
        const avgRoll = Math.round(gd.dice * (gd.sides + 1) / 2);
        setDraftPP(0);
        setDraftMoney(avgRoll * gd.multiplier);
        setDraftPL(0);
      }
    }
  }, [selectedClassId, classes]);
  const selectedSubRace = selectedRace?.subRaces?.find((sr) => sr.id === selectedSubRaceId) ?? null;
  const conRaceBonus    = (selectedRace?.bonuses?.constituicao ?? 0) + (selectedSubRace?.bonuses?.constituicao ?? 0);
  const conMod          = Math.floor((attributes.constituicao + conRaceBonus - 10) / 2);
  const effectiveHp     = health + conMod;

  const canNext = useMemo(
    () => name.trim().length > 0 && selectedSkills.length >= 5,
    [name, selectedSkills.length]
  );
  const raceHasSubRaces = (selectedRace?.subRaces?.length ?? 0) > 0;
  const canGoStep3 = selectedRaceId !== null && (!raceHasSubRaces || selectedSubRaceId !== null);
  const canSave    = canGoStep3 && selectedClassId !== null && pointsRemaining === 0 && !saving;

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
    const v   = Number(tempRoll);
    const min = goldDice.dice;
    const max = goldDice.dice * goldDice.sides;
    if (!Number.isFinite(v) || v < min || v > max) {
      setError(`Valor inválido. Informe entre ${min} e ${max}.`);
      return;
    }
    setDraftMoney(v * goldDice.multiplier);
    setMoneyOpen(false);
  }

  function confirmHealthRoll() {
    const v = Number(tempRoll);
    if (!Number.isFinite(v) || v < 1 || v > hitDie) {
      setError(`Valor inválido. Informe um número entre 1 e ${hitDie}.`);
      return;
    }
    setDraftMaxHealth(v);
    setDraftHealth(v);
    setHealthOpen(false);
  }

  function handleNext() {
    setError(null);
    if (!name.trim())              return setError("O nome do personagem é obrigatório.");
    if (selectedSkills.length < 5) return setError("Selecione pelo menos 5 perícias.");
    setStep(4);
  }

  async function handleSave() {
    if (!selectedRaceId)        return setError("Selecione uma raça para continuar.");
    if (!selectedClassId)       return setError("Selecione uma classe para continuar.");
    if (pointsRemaining > 0)    return setError("Você ainda tem pontos para distribuir.");
    setError(null);
    setSaving(true);
    try {
      const char = await createCharacter({
        name,
        attributes,
        selectedSkills: selectedSkills.slice(0, 5),
        pp,
        money,
        pl,
        health: Math.max(1, effectiveHp),
        raceId: selectedRaceId ?? undefined,
        subRaceId: selectedSubRaceId ?? undefined,
        classId: selectedClassId ?? undefined,
        height,
      });

      if (pendingEquipment.length > 0 && (char as any)?.id) {
        const charId = (char as any).id;

        await Promise.allSettled(
          pendingEquipment.map((itemName) => {
            const kit = findKit(itemName, kits);
            if (kit) {
              // Kit → expande itens com peso no inventário
              return Promise.allSettled(
                kit.items.map(({ name, quantity, weight }) =>
                  addInventoryItem(charId, { name, quantity, weight, category: "Equipamento" })
                )
              );
            }
            // Item simples → equipment sem peso
            return addEquipment(charId, { name: itemName, fromClass: true });
          })
        );
      }

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
          </Stack>
          {saving && (
            <LinearProgress sx={{ mt: 0.5, borderRadius: 2, height: 2, bgcolor: "rgba(255,255,255,0.06)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #7B54FF, #5B8FFF)" } }} />
          )}
        </Stack>

        <Glass elevation={0}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>

            <StepIndicator current={step} total={4} />

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", py: 0.5, bgcolor: "rgba(220,60,60,0.09)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)", fontSize: 13, "& .MuiAlert-icon": { color: "rgba(255,110,110,0.7)", fontSize: 18 } }}>
                {error}
              </Alert>
            )}

            {/* ══ STEP 1 — Escolha de raça ══ */}
            {step === 1 && (
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

                {/* Preview de bônus da raça */}
                {selectedRace && (
                  <Box sx={{ borderRadius: "14px", border: "1px solid rgba(120,85,255,0.2)", bgcolor: "rgba(120,85,255,0.06)", p: 1.75 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,150,255,0.6)", mb: 0.5 }}>
                      Bônus racial
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", mb: 1.25 }}>
                      {selectedRace.name}{selectedSubRace ? ` · ${selectedSubRace.name}` : ""}
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.75 }}>
                      {ATTRS.map((a) => {
                        const rBonus  = selectedRace.bonuses[a.key] ?? 0;
                        const srBonus = selectedSubRace?.bonuses[a.key] ?? 0;
                        const bonus   = rBonus + srBonus;
                        if (bonus === 0) return null;
                        return (
                          <Box key={a.key} sx={{
                            borderRadius: "10px", p: 1,
                            border: "1px solid rgba(160,130,255,0.3)",
                            bgcolor: "rgba(120,85,255,0.1)",
                            textAlign: "center",
                          }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
                              {ATTR_BADGE[a.key]}
                            </Typography>
                            <Typography sx={{ fontSize: 16, fontWeight: 900, color: "rgba(200,180,255,0.95)", lineHeight: 1.2 }}>
                              +{bonus}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                <Button onClick={() => { if (!canGoStep3) return setError("Selecione uma raça para continuar."); setError(null); setStep(2); }} variant="contained" disabled={!canGoStep3}
                  sx={{ py: 1.35, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14.5, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)", "&:hover": { boxShadow: "0 10px 32px rgba(100,70,230,0.5)", transform: "translateY(-1px)" }, "&:active": { transform: "translateY(0)" }, "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}>
                  Próximo
                </Button>

                <Button type="button" onClick={() => navigate(ROUTES.personagens)}
                  startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: 13.5, color: "rgba(255,255,255,0.32)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Cancelar
                </Button>
              </Stack>
            )}

            {/* ══ STEP 2 — Escolha de classe ══ */}
            {step === 2 && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: "rgba(255,255,255,0.92)", mb: 0.5 }}>
                    Escolha sua classe
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
                    Sua classe define seu papel, habilidades e estilo de jogo.
                  </Typography>
                </Box>

                {classesLoading ? (
                  <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                    <CircularProgress size={28} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.1 }}>
                    {classes.map((cls) => {
                      const selected = selectedClassId === cls.id;
                      return (
                        <Box
                          key={cls.name}
                          onClick={() => setDetailClass(cls)}
                          sx={{
                            borderRadius: "15px",
                            border: `1.5px solid ${selected ? "rgba(160,130,255,0.55)" : "rgba(255,255,255,0.07)"}`,
                            bgcolor: selected ? "rgba(120,85,255,0.12)" : "rgba(255,255,255,0.03)",
                            p: 1.4,
                            cursor: "pointer",
                            transition: "all 0.18s",
                            position: "relative",
                            boxShadow: selected ? "0 0 18px rgba(120,85,255,0.2)" : "none",
                            "&:hover": {
                              border: "1.5px solid rgba(160,130,255,0.35)",
                              bgcolor: selected ? "rgba(120,85,255,0.16)" : "rgba(120,85,255,0.07)",
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

                          <Typography sx={{ fontSize: 20, lineHeight: 1, mb: 0.65 }}>{cls.icon}</Typography>

                          <Typography sx={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,0.92)", lineHeight: 1.2, mb: 0.4 }}>
                            {cls.name}
                          </Typography>

                          <Typography sx={{
                            fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.4,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}>
                            {cls.tagline}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <Button
                  onClick={() => { if (!selectedClassId) return setError("Selecione uma classe para continuar."); setError(null); setStep(3); }}
                  variant="contained"
                  disabled={!selectedClassId}
                  sx={{ py: 1.35, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14.5, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)", "&:hover": { boxShadow: "0 10px 32px rgba(100,70,230,0.5)", transform: "translateY(-1px)" }, "&:active": { transform: "translateY(0)" }, "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}>
                  Próximo
                </Button>

                <Button onClick={() => { setStep(1); setError(null); }}
                  startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: 13.5, color: "rgba(255,255,255,0.32)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Voltar
                </Button>
              </Stack>
            )}

            {/* ══ STEP 3 — Nome, Ouro e Perícias ══ */}
            {step === 3 && (
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

                {/* Ouro — card clicável */}
                <Box
                  onClick={() => { setTempRoll(""); setError(null); setMoneyOpen(true); }}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    px: 1.75, py: 1.5,
                    borderRadius: "14px",
                    cursor: "pointer",
                    bgcolor: "rgba(255,195,80,0.07)",
                    border: "1.5px solid rgba(255,195,80,0.28)",
                    transition: "all 0.18s",
                    "&:hover": {
                      bgcolor: "rgba(255,195,80,0.13)",
                      borderColor: "rgba(255,195,80,0.5)",
                      boxShadow: "0 0 18px rgba(255,195,80,0.1)",
                    },
                    "&:active": { transform: "scale(0.985)" },
                  }}
                >
                  {/* Icon */}
                  <Box sx={{ width: 40, height: 40, borderRadius: "11px", display: "grid", placeItems: "center", flexShrink: 0, bgcolor: "rgba(255,195,80,0.13)", border: "1px solid rgba(255,210,100,0.22)" }}>
                    <MonetizationOnRoundedIcon sx={{ fontSize: 20, color: "rgba(255,215,100,0.9)" }} />
                  </Box>

                  {/* Texts */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,210,100,0.5)", lineHeight: 1, mb: 0.3 }}>
                      Ouro Inicial
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1} flexWrap="wrap">
                      {pp > 0 && (
                        <Stack direction="row" alignItems="baseline" spacing={0.4}>
                          <Typography sx={{ fontSize: 17, fontWeight: 900, color: "rgba(200,210,230,0.9)", lineHeight: 1 }}>{pp}</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "rgba(180,195,220,0.55)" }}>pp</Typography>
                        </Stack>
                      )}
                      <Stack direction="row" alignItems="baseline" spacing={0.4}>
                        <Typography sx={{ fontSize: 22, fontWeight: 900, color: "rgba(255,220,120,0.95)", lineHeight: 1 }}>{money}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,210,100,0.6)" }}>po</Typography>
                      </Stack>
                      {pl > 0 && (
                        <Stack direction="row" alignItems="baseline" spacing={0.4}>
                          <Typography sx={{ fontSize: 17, fontWeight: 900, color: "rgba(200,240,255,0.9)", lineHeight: 1 }}>{pl}</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "rgba(160,220,255,0.55)" }}>pl</Typography>
                        </Stack>
                      )}
                    </Stack>
                    <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", mt: 0.25 }}>
                      Role {goldDice.dice}d{goldDice.sides} (PO) e toque aqui para registrar
                    </Typography>
                  </Box>

                  {/* Edit cue */}
                  <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", px: 1, py: 0.5, borderRadius: "8px", bgcolor: "rgba(255,195,80,0.12)", border: "1px solid rgba(255,210,100,0.2)" }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "rgba(255,220,120,0.8)" }}>Definir</Typography>
                  </Box>
                </Box>

                {/* ── PERÍCIAS ─────────────────────────────────────── */}
                <Box
                  onClick={() => setSkillsOpen(true)}
                  sx={{
                    px: 1.75, py: 1.5, borderRadius: "14px", cursor: "pointer",
                    border: selectedSkills.length >= 5
                      ? "1px solid rgba(120,85,255,0.35)"
                      : "1.5px dashed rgba(255,255,255,0.14)",
                    bgcolor: selectedSkills.length >= 5
                      ? "rgba(120,85,255,0.08)"
                      : "rgba(255,255,255,0.02)",
                    transition: "all .2s",
                    "&:hover": {
                      borderColor: "rgba(120,85,255,0.55)",
                      bgcolor: "rgba(120,85,255,0.13)",
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AutoAwesomeRoundedIcon sx={{ fontSize: 15, color: selectedSkills.length >= 5 ? "rgba(180,150,255,0.85)" : "rgba(255,255,255,0.35)" }} />
                      <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: selectedSkills.length >= 5 ? "rgba(220,200,255,0.95)" : "rgba(255,255,255,0.75)" }}>
                        Perícias
                      </Typography>
                    </Stack>
                    <Box sx={{
                      px: 1, py: 0.25, borderRadius: "8px",
                      bgcolor: selectedSkills.length >= 5 ? "rgba(120,85,255,0.2)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${selectedSkills.length >= 5 ? "rgba(120,85,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                    }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: selectedSkills.length >= 5 ? "rgba(200,175,255,0.95)" : "rgba(255,255,255,0.4)" }}>
                        {selectedSkills.length} / 5
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography sx={{ fontSize: 12.5, color: selectedSkills.length >= 5 ? "rgba(180,155,255,0.6)" : "rgba(255,255,255,0.32)", mb: 1.1 }}>
                    {selectedSkills.length === 0
                      ? "Toque aqui para escolher as 5 perícias do seu personagem"
                      : selectedSkills.length < 5
                      ? `Escolha mais ${5 - selectedSkills.length} perícia${5 - selectedSkills.length > 1 ? "s" : ""}`
                      : "Perícias selecionadas ✓"}
                  </Typography>

                  <Box sx={{ height: 3, borderRadius: 99, bgcolor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <Box sx={{
                      height: "100%", borderRadius: 99,
                      width: `${(selectedSkills.length / 5) * 100}%`,
                      background: "linear-gradient(90deg, #7c4dff, #b47eff)",
                      transition: "width .35s cubic-bezier(.4,0,.2,1)",
                      boxShadow: selectedSkills.length > 0 ? "0 0 8px rgba(140,80,255,0.45)" : "none",
                    }} />
                  </Box>
                </Box>

                {/* ── Altura ─────────────────────────────────────── */}
                {(() => {
                  const range = selectedRace ? RACE_HEIGHT[selectedRace.name] : null;
                  if (!range) return null;
                  return (
                    <Box sx={{ px: 1.75, py: 1.5, borderRadius: "14px", border: "1px solid rgba(255,255,255,0.07)", bgcolor: "rgba(255,255,255,0.02)" }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1 }}>📏</Typography>
                          <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: "rgba(255,255,255,0.85)" }}>Altura</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="baseline" spacing={0.4}>
                          <Typography sx={{ fontWeight: 900, fontSize: 20, color: "rgba(190,165,255,0.95)", lineHeight: 1 }}>{height}</Typography>
                          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>cm</Typography>
                        </Stack>
                      </Stack>
                      <Slider
                        value={height}
                        min={range.min}
                        max={range.max}
                        step={1}
                        onChange={(_, v) => setHeight(v as number)}
                        sx={{
                          color: "rgba(120,85,255,0.85)",
                          height: 4,
                          "& .MuiSlider-thumb": {
                            width: 16, height: 16,
                            bgcolor: "#fff",
                            boxShadow: "0 0 0 3px rgba(120,85,255,0.4)",
                            "&:hover": { boxShadow: "0 0 0 5px rgba(120,85,255,0.3)" },
                          },
                          "& .MuiSlider-rail": { bgcolor: "rgba(255,255,255,0.1)" },
                        }}
                      />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{range.min} cm</Typography>
                        <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{range.size}</Typography>
                        <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{range.max} cm</Typography>
                      </Stack>
                    </Box>
                  );
                })()}

                <Button onClick={handleNext} variant="contained" disabled={!canNext}
                  sx={{ mt: 0.5, py: 1.35, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14.5, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)", "&:hover": { boxShadow: "0 10px 32px rgba(100,70,230,0.5)", transform: "translateY(-1px)" }, "&:active": { transform: "translateY(0)" }, "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}>
                  Próximo
                </Button>

                <Button onClick={() => { setStep(2); setError(null); }}
                  startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: 13.5, color: "rgba(255,255,255,0.32)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Voltar
                </Button>
              </Stack>
            )}

            {/* ══ STEP 4 — Atributos e Vida ══ */}
            {step === 4 && (
              <Stack spacing={2.5}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: "rgba(255,255,255,0.92)", mb: 0.5 }}>
                    Atributos e Vida
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
                    Distribua seus pontos e defina a vida inicial do personagem.
                    {selectedRace && (
                      <> Os bônus de <b style={{ color: "rgba(180,150,255,0.75)" }}>{selectedRace.name}</b> serão somados automaticamente.</>
                    )}
                  </Typography>
                </Box>

                {/* HP Card + Carry capacity */}
                {(() => {
                  const raceRange   = selectedRace ? RACE_HEIGHT[selectedRace.name] : null;
                  const size        = raceRange?.size ?? "MEDIUM";
                  const sizeMulti   = SIZE_MULTIPLIER[size];
                  const forcaRBonus = (selectedRace?.bonuses?.forca ?? 0) + (selectedSubRace?.bonuses?.forca ?? 0);
                  const forcaTotal  = attributes.forca + forcaRBonus;
                  const carryKg     = Math.round(forcaTotal * 15 * sizeMulti * 0.453592);
                  return (
                    <Stack spacing={1}>
                      {/* HP — card clicável */}
                      <Box
                        onClick={() => { setTempRoll(""); setError(null); setHealthOpen(true); }}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1.5,
                          px: 1.75, py: 1.5,
                          borderRadius: "14px",
                          cursor: "pointer",
                          bgcolor: "rgba(75,175,130,0.08)",
                          border: "1.5px solid rgba(75,175,130,0.28)",
                          transition: "all 0.18s",
                          "&:hover": {
                            bgcolor: "rgba(75,175,130,0.14)",
                            borderColor: "rgba(75,175,130,0.5)",
                            boxShadow: "0 0 18px rgba(75,200,130,0.12)",
                          },
                          "&:active": { transform: "scale(0.985)" },
                        }}
                      >
                        {/* Icon */}
                        <Box sx={{ width: 40, height: 40, borderRadius: "11px", display: "grid", placeItems: "center", flexShrink: 0, bgcolor: "rgba(75,175,130,0.15)", border: "1px solid rgba(75,200,130,0.22)" }}>
                          <FavoriteRoundedIcon sx={{ fontSize: 20, color: "rgba(100,230,170,0.9)" }} />
                        </Box>

                        {/* Texts */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(100,220,160,0.55)", lineHeight: 1, mb: 0.3 }}>
                            Pontos de Vida
                          </Typography>
                          <Stack direction="row" alignItems="baseline" spacing={0.5}>
                            <Typography sx={{ fontSize: 22, fontWeight: 900, color: "rgba(130,245,185,0.95)", lineHeight: 1 }}>
                              {effectiveHp}
                            </Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(100,220,160,0.6)" }}>HP</Typography>
                            {conMod !== 0 && (
                              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "rgba(120,185,255,0.7)" }}>
                                ({health} {conMod > 0 ? "+" : ""}{conMod} CON)
                              </Typography>
                            )}
                          </Stack>
                          <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", mt: 0.25 }}>
                            Role 1d{hitDie} e toque aqui para registrar
                          </Typography>
                        </Box>

                        {/* Edit cue */}
                        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, borderRadius: "8px", bgcolor: "rgba(75,175,130,0.12)", border: "1px solid rgba(75,200,130,0.2)" }}>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "rgba(100,230,170,0.8)" }}>Definir</Typography>
                        </Box>
                      </Box>

                      {/* Carry capacity — pequeno, só informativo */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.2, py: 0.55, borderRadius: "9px", bgcolor: "rgba(255,180,50,0.07)", border: "1px solid rgba(255,180,50,0.15)", alignSelf: "flex-start" }}>
                        <Typography sx={{ fontSize: 13, lineHeight: 1 }}>🎒</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,200,100,0.8)" }}>
                          Carga máx. {carryKg} kg
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })()}

                {/* Atributos */}
                <Stack spacing={0.9}>
                  {ATTRS.map((a) => {
                    const v       = attributes[a.key];
                    const rBonus  = (selectedRace?.bonuses[a.key] ?? 0) + (selectedSubRace?.bonuses[a.key] ?? 0);
                    const total   = v + rBonus;
                    const mod     = getModifier(total);
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
                            <Typography sx={{ fontSize: 11.5, lineHeight: 1.2, color: "white" }}>
                              <span style={{ opacity: 0.5 }}>mod <b style={{ opacity: 0.5 }}>{fmtMod(mod)}</b></span>
                              {rBonus > 0 && (
                                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: "rgba(160,130,255,0.8)" }}>+{rBonus} raça</span>
                              )}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                          <IconButton size="small" onClick={() => decreaseAttribute(a.key)} disabled={!canDown}
                            sx={{ width: 32, height: 32, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.55)", flexShrink: 0, "&.Mui-disabled": { opacity: 0.18 } }}>
                            <RemoveRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Typography sx={{ width: 28, textAlign: "center", fontWeight: 800, fontSize: 16, flexShrink: 0, color: total > 10 ? "rgba(190,165,255,0.95)" : "rgba(255,255,255,0.85)" }}>
                            {total}
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
                <Button onClick={handleSave} variant="contained" disabled={!canSave}
                  sx={{ mt: 0.5, py: 1.35, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14.5, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)", "&:hover": { boxShadow: "0 10px 32px rgba(100,70,230,0.5)", transform: "translateY(-1px)" }, "&:active": { transform: "translateY(0)" }, "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" } }}>
                  {saving ? <CircularProgress size={18} sx={{ color: "rgba(255,255,255,0.5)" }} /> : "Criar Personagem"}
                </Button>

                <Button onClick={() => { setStep(3); setError(null); }}
                  startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: 13.5, color: "rgba(255,255,255,0.32)", borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Voltar
                </Button>
              </Stack>
            )}

          </CardContent>
        </Glass>

        {/* ── Class Detail Dialog ────────────────────────────────────────────── */}
        <Dialog
          open={!!detailClass}
          onClose={() => setDetailClass(null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { bgcolor: "#12101e", border: "1px solid rgba(120,85,255,0.2)", borderRadius: "20px", backgroundImage: "none", overflow: "hidden" } }}
        >
          {detailClass && (
            <DialogContent sx={{ p: 0 }}>

              {/* ── Image area ── */}
              <Box sx={{ position: "relative", width: "100%", height: 200, overflow: "hidden" }}>
                {!imgError[detailClass.name] ? (
                  <Box
                    component="img"
                    src={`/classes/${detailClass.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "-")}.jpg`}
                    alt={detailClass.name}
                    onError={() => setImgError((prev) => ({ ...prev, [detailClass.name]: true }))}
                    sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                  />
                ) : (
                  <Box sx={{
                    width: "100%", height: "100%",
                    background: detailClass.imgGradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Typography sx={{ fontSize: 80, lineHeight: 1, filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.6))" }}>
                      {detailClass.icon}
                    </Typography>
                  </Box>
                )}
                {/* gradient overlay at bottom */}
                <Box sx={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
                  background: "linear-gradient(to bottom, transparent, #12101e)",
                  pointerEvents: "none",
                }} />
                {/* class name over image */}
                <Box sx={{ position: "absolute", bottom: 14, left: 20 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 22, color: "#fff", lineHeight: 1.1, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
                    {detailClass.icon} {detailClass.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", mt: 0.25, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
                    {detailClass.tagline}
                  </Typography>
                </Box>
              </Box>

              {/* ── Description ── */}
              <Box sx={{ px: 2.5, pt: 1.75, pb: 1, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
                  {detailClass.description}
                </Typography>
              </Box>

              {/* ── Equipment (selectable) ── */}
              {detailClass.equipment.length > 0 && (
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={{ flex: 1, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,150,255,0.55)" }}>
                      Equipamento inicial
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)" }}>
                      {[...tempEquipSel.values()].filter(Boolean).length}/{detailClass.equipment.length} selecionados
                    </Typography>
                  </Stack>

                  <Stack spacing={0.75}>
                    {detailClass.equipment.map((eq) => {
                      const parts = eq.split(/\s+ou\s+/i).map((p) => p.trim());
                      const isChoice = parts.length > 1;
                      const selected = tempEquipSel.get(eq) ?? null;

                      if (isChoice) {
                        // "ou" item — exclusive radio-style choice
                        return (
                          <Box
                            key={eq}
                            sx={{
                              borderRadius: "12px",
                              border: selected
                                ? "1px solid rgba(255,195,80,0.3)"
                                : "1px solid rgba(255,255,255,0.07)",
                              bgcolor: selected
                                ? "rgba(255,195,80,0.05)"
                                : "rgba(255,255,255,0.015)",
                              p: 1.1,
                              transition: "all 0.15s",
                            }}
                          >
                            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,195,80,0.5)", mb: 0.75 }}>
                              Escolha um
                            </Typography>
                            <Stack spacing={0.5}>
                              {parts.map((opt) => {
                                const active = selected === opt;
                                return (
                                  <Box
                                    key={opt}
                                    onClick={() =>
                                      setTempEquipSel((prev) => {
                                        const n = new Map(prev);
                                        n.set(eq, active ? null : opt);
                                        return n;
                                      })
                                    }
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.1,
                                      px: 1.1,
                                      py: 0.75,
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      border: `1px solid ${active ? "rgba(255,195,80,0.45)" : "rgba(255,255,255,0.06)"}`,
                                      bgcolor: active ? "rgba(255,195,80,0.12)" : "rgba(255,255,255,0.02)",
                                      transition: "all 0.15s",
                                      "&:hover": { border: `1px solid ${active ? "rgba(255,195,80,0.6)" : "rgba(255,255,255,0.12)"}` },
                                    }}
                                  >
                                    {/* Radio dot */}
                                    <Box
                                      sx={{
                                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                                        border: `1.5px solid ${active ? "rgba(255,195,80,0.9)" : "rgba(255,255,255,0.2)"}`,
                                        bgcolor: active ? "rgba(255,195,80,0.85)" : "transparent",
                                        display: "grid", placeItems: "center",
                                        transition: "all 0.15s",
                                      }}
                                    >
                                      {active && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#1c1200" }} />}
                                    </Box>
                                    <Typography sx={{ flex: 1, fontSize: 13, lineHeight: 1.4, color: active ? "rgba(255,215,100,0.9)" : "rgba(255,255,255,0.42)", transition: "color 0.15s" }}>
                                      {opt}
                                    </Typography>
                                    {findKit(opt, kits) && (
                                      <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); setInfoPackKey(normalize(opt)); setInfoAnchorEl(e.currentTarget); }}
                                        sx={{ p: 0.3, color: "rgba(255,255,255,0.25)", "&:hover": { color: "rgba(255,215,100,0.7)" } }}
                                      >
                                        <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    )}
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Box>
                        );
                      }

                      // Simple item — checkbox
                      const checked = selected !== null;
                      const kitMatch = findKit(eq, kits);
                      const isPack   = Boolean(kitMatch);
                      return (
                        <Box
                          key={eq}
                          onClick={() =>
                            setTempEquipSel((prev) => {
                              const n = new Map(prev);
                              n.set(eq, checked ? null : eq);
                              return n;
                            })
                          }
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            px: 1.25,
                            py: 0.9,
                            borderRadius: "10px",
                            cursor: "pointer",
                            border: `1px solid ${checked ? "rgba(120,85,255,0.35)" : "rgba(255,255,255,0.07)"}`,
                            bgcolor: checked ? "rgba(120,85,255,0.1)" : "rgba(255,255,255,0.02)",
                            transition: "all 0.15s",
                            "&:hover": {
                              border: `1px solid ${checked ? "rgba(120,85,255,0.5)" : "rgba(255,255,255,0.14)"}`,
                              bgcolor: checked ? "rgba(120,85,255,0.14)" : "rgba(255,255,255,0.04)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 18, height: 18, borderRadius: "5px", flexShrink: 0,
                              border: `1.5px solid ${checked ? "rgba(120,85,255,0.9)" : "rgba(255,255,255,0.22)"}`,
                              bgcolor: checked ? "rgba(120,85,255,0.85)" : "transparent",
                              display: "grid", placeItems: "center",
                              transition: "all 0.15s",
                            }}
                          >
                            {checked && <CheckRoundedIcon sx={{ fontSize: 12, color: "#fff" }} />}
                          </Box>
                          <Typography sx={{ flex: 1, fontSize: 13, lineHeight: 1.4, color: checked ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.42)", transition: "color 0.15s" }}>
                            {eq}
                          </Typography>
                          {isPack && kitMatch && (
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setInfoPackKey(normalize(kitMatch.name)); setInfoAnchorEl(e.currentTarget); }}
                              sx={{ p: 0.3, color: "rgba(255,255,255,0.25)", "&:hover": { color: "rgba(180,150,255,0.8)" } }}
                            >
                              <InfoOutlinedIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>

                  <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.25)", mt: 0.9, pl: 0.25 }}>
                    Itens selecionados serão adicionados ao inventário.
                  </Typography>
                </Box>
              )}

              {/* ── Proficiências ── */}
              {detailClass.proficiencies && (() => {
                const prof = detailClass.proficiencies!;
                const groups = [
                  { label: "Armaduras",            icon: "🛡️", items: prof.armor        },
                  { label: "Armas",                 icon: "⚔️", items: prof.weapons      },
                  { label: "Ferramentas",           icon: "🔧", items: prof.tools        },
                  { label: "Testes de Resistência", icon: "🎯", items: prof.savingThrows },
                ].filter((g) => g.items.length > 0);
                if (groups.length === 0) return null;
                return (
                  <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,150,255,0.55)", mb: 1.25 }}>
                      Proficiências
                    </Typography>
                    <Stack spacing={1.25}>
                      {groups.map((g) => (
                        <Box key={g.label}>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.6 }}>
                            <Typography sx={{ fontSize: 12, lineHeight: 1 }}>{g.icon}</Typography>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                              {g.label}
                            </Typography>
                          </Stack>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                            {g.items.map((item) => (
                              <Box key={item} sx={{ px: 1, py: 0.3, borderRadius: "7px", bgcolor: "rgba(120,85,255,0.1)", border: "1px solid rgba(120,85,255,0.22)" }}>
                                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "rgba(200,180,255,0.85)" }}>{item}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                );
              })()}

              {/* ── Features ── */}
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,150,255,0.55)", mb: 1.25 }}>
                  Características únicas
                </Typography>
                <Stack spacing={1}>
                  {detailClass.features.map((f) => (
                    <Box key={f.name}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>{f.name}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>{f.description}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* ── Actions ── */}
              <Box sx={{ px: 2.5, py: 2 }}>
                <Button
                  fullWidth variant="contained"
                  onClick={() => {
                    setDraftClass(detailClass.id);
                    setPendingEquipment(
                      [...tempEquipSel.values()].filter((v): v is string => v !== null)
                    );
                    setDetailClass(null);
                    setError(null);
                  }}
                  sx={{ py: 1.25, borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 14, background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)", boxShadow: "0 6px 24px rgba(100,70,230,0.35)" }}
                >
                  Jogar como {detailClass.name}
                </Button>
                <Button fullWidth onClick={() => setDetailClass(null)}
                  sx={{ mt: 0.75, textTransform: "none", fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.3)", "&:hover": { color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.04)" } }}>
                  Cancelar
                </Button>
              </Box>

            </DialogContent>
          )}
        </Dialog>

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

        {/* Pack info popover */}
        <Popover
          open={Boolean(infoAnchorEl)}
          anchorEl={infoAnchorEl}
          onClose={() => { setInfoAnchorEl(null); setInfoPackKey(null); }}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          PaperProps={{
            sx: {
              bgcolor: "rgba(14,11,26,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              p: 1.75,
              minWidth: 220,
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
            },
          }}
        >
          {infoPackKey && (() => {
            const kit = kits.find((k) => normalize(k.name) === infoPackKey);
            if (!kit) return null;
            const items = kit.items;
            const totalWeight = items.reduce((s, i) => s + i.weight * i.quantity, 0);
            return (
              <Stack spacing={0.5}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(180,150,255,0.6)", mb: 0.5 }}>
                  Conteúdo do pacote
                </Typography>
                {items.map(({ name, quantity, weight }) => (
                  <Stack key={name} direction="row" alignItems="center" spacing={1} justifyContent="space-between">
                    <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                      {quantity > 1 ? `${name} ×${quantity}` : name}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                      {weight > 0 ? `${weight * quantity} kg` : "—"}
                    </Typography>
                  </Stack>
                ))}
                <Divider sx={{ opacity: 0.12, my: 0.5 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
                    Peso total
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(180,150,255,0.8)" }}>
                    {totalWeight} kg
                  </Typography>
                </Stack>
              </Stack>
            );
          })()}
        </Popover>

        {/* Dialogs */}
        <SkillsDialog open={skillsOpen} onClose={() => setSkillsOpen(false)} selected={selectedSkills} toggle={toggleDraftSkill} max={5} />
        {/* Money Roll Dialog */}
        <AppDialog
          open={moneyOpen}
          onClose={() => { setMoneyOpen(false); setError(null); }}
          title={`Ouro Inicial — ${goldDice.dice}d${goldDice.sides} × ${goldDice.multiplier}`}
          dividers
          actions={
            <>
              <AppDialogCancelButton onClick={() => { setMoneyOpen(false); setError(null); }}>Cancelar</AppDialogCancelButton>
              <AppDialogConfirmButton onClick={confirmMoneyRoll}>Confirmar</AppDialogConfirmButton>
            </>
          }
        >
          <Stack spacing={2}>
            {/* Formula info */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.25, borderRadius: "12px", bgcolor: "rgba(255,195,80,0.07)", border: "1px solid rgba(255,195,80,0.2)" }}>
              <Typography sx={{ fontSize: 26, lineHeight: 1 }}>🪙</Typography>
              <Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,210,100,0.55)", lineHeight: 1, mb: 0.25 }}>
                  Fórmula — {selectedClass?.name ?? "Classe"}
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 900, color: "rgba(255,220,120,0.95)", lineHeight: 1.2 }}>
                  {goldDice.dice}d{goldDice.sides} × {goldDice.multiplier} po
                </Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.38)", mt: 0.3, lineHeight: 1.4 }}>
                  Role {goldDice.dice} dado{goldDice.dice > 1 ? "s" : ""} de {goldDice.sides} lados, some e multiplique por {goldDice.multiplier}.
                </Typography>
              </Box>
            </Box>

            {/* Range hint */}
            <Box sx={{ display: "flex", justifyContent: "space-between", px: 1.25, py: 0.85, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                Mín: <b style={{ color: "rgba(255,215,100,0.7)" }}>{goldDice.dice * goldDice.multiplier} po</b>
              </Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                Máx: <b style={{ color: "rgba(255,215,100,0.7)" }}>{goldDice.dice * goldDice.sides * goldDice.multiplier} po</b>
              </Typography>
            </Box>

            {/* Input */}
            <TextField
              label={`Soma dos dados (${goldDice.dice}–${goldDice.dice * goldDice.sides})`}
              value={tempRoll}
              onChange={(e) => { setTempRoll(e.target.value.replace(/\D/g, "")); setError(null); }}
              inputMode="numeric"
              fullWidth
              sx={inputSx}
            />

            {/* Preview */}
            {tempRoll !== "" && Number(tempRoll) >= goldDice.dice && Number(tempRoll) <= goldDice.dice * goldDice.sides && (
              <Box sx={{ px: 1.5, py: 1, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Ouro inicial</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 900, color: "rgba(255,220,120,0.95)" }}>
                  {Number(tempRoll) * goldDice.multiplier} po
                  <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, opacity: 0.6, ml: 0.5 }}>
                    ({tempRoll} × {goldDice.multiplier})
                  </Typography>
                </Typography>
              </Box>
            )}

            {error && (
              <Typography sx={{ fontSize: 12, color: "rgba(255,100,100,0.8)", fontWeight: 600 }}>{error}</Typography>
            )}
          </Stack>
        </AppDialog>
        {/* Health Roll Dialog */}
        <AppDialog
          open={healthOpen}
          onClose={() => { setHealthOpen(false); setError(null); }}
          title={`Vida Inicial — 1d${hitDie}`}
          dividers
          actions={
            <>
              <AppDialogCancelButton onClick={() => { setHealthOpen(false); setError(null); }}>Cancelar</AppDialogCancelButton>
              <AppDialogConfirmButton onClick={confirmHealthRoll}>Confirmar</AppDialogConfirmButton>
            </>
          }
        >
          <Stack spacing={2}>
            {/* Die info */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.25, borderRadius: "12px", bgcolor: "rgba(75,175,130,0.07)", border: "1px solid rgba(75,175,130,0.18)" }}>
              <Typography sx={{ fontSize: 26, lineHeight: 1 }}>🎲</Typography>
              <Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(100,220,160,0.6)", lineHeight: 1, mb: 0.3 }}>
                  Dado de Vida — {selectedClass?.name ?? "Classe"}
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 900, color: "rgba(130,240,180,0.95)", lineHeight: 1.2 }}>
                  1d{hitDie}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.38)", mt: 0.3, lineHeight: 1.4 }}>
                  No nível 1 você começa com o valor máximo por padrão. Role se preferir.
                </Typography>
              </Box>
            </Box>

            {/* CON mod info */}
            {conMod !== 0 && (
              <Box sx={{ px: 1.25, py: 0.85, borderRadius: "10px", bgcolor: "rgba(80,150,255,0.07)", border: "1px solid rgba(80,150,255,0.16)", display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 13, color: "rgba(120,185,255,0.85)", fontWeight: 700 }}>
                  Mod. de CON: <span style={{ fontWeight: 900 }}>{conMod > 0 ? `+${conMod}` : conMod}</span> será somado ao resultado
                </Typography>
              </Box>
            )}

            {/* Input */}
            <TextField
              label={`Resultado (1–${hitDie})`}
              value={tempRoll}
              onChange={(e) => { setTempRoll(e.target.value.replace(/\D/g, "")); setError(null); }}
              inputMode="numeric"
              fullWidth
              sx={inputSx}
            />

            {/* Preview */}
            {tempRoll !== "" && Number(tempRoll) >= 1 && Number(tempRoll) <= hitDie && (
              <Box sx={{ px: 1.5, py: 1, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Vida inicial</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 900, color: "rgba(100,240,170,0.95)" }}>
                  {Math.max(1, Number(tempRoll) + conMod)} HP
                  {conMod !== 0 && (
                    <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, opacity: 0.65, ml: 0.5 }}>
                      ({tempRoll} {conMod > 0 ? `+${conMod}` : conMod})
                    </Typography>
                  )}
                </Typography>
              </Box>
            )}

            {error && (
              <Typography sx={{ fontSize: 12, color: "rgba(255,100,100,0.8)", fontWeight: 600 }}>{error}</Typography>
            )}
          </Stack>
        </AppDialog>

      </Container>

      {/* ── Floating points counter (portal to escape overflow:hidden) ── */}
      {step === 4 && createPortal(
        <Box sx={{
          position: "fixed",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1300,
          pointerEvents: "none",
        }}>
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1,
            px: 1.75, py: 0.8,
            borderRadius: "99px",
            bgcolor: pointsRemaining > 0 ? "rgba(10,8,20,0.93)" : "rgba(10,8,20,0.93)",
            border: `1px solid ${pointsRemaining > 0 ? "rgba(120,85,255,0.45)" : "rgba(60,180,120,0.45)"}`,
            boxShadow: pointsRemaining > 0
              ? "0 4px 24px rgba(0,0,0,0.55), 0 0 12px rgba(120,85,255,0.18)"
              : "0 4px 24px rgba(0,0,0,0.55), 0 0 12px rgba(60,200,130,0.18)",
            backdropFilter: "blur(16px)",
            transition: "border-color .3s, box-shadow .3s",
          }}>
            <PsychologyRoundedIcon sx={{
              fontSize: 14,
              color: pointsRemaining > 0 ? "rgba(180,150,255,0.9)" : "rgba(80,210,150,0.9)",
              transition: "color .3s",
            }} />
            <Typography sx={{
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: "0.03em",
              color: pointsRemaining > 0 ? "rgba(200,175,255,0.95)" : "rgba(100,230,170,0.95)",
              transition: "color .3s",
              whiteSpace: "nowrap",
            }}>
              {pointsRemaining > 0
                ? `${pointsRemaining} ponto${pointsRemaining > 1 ? "s" : ""} para distribuir`
                : "Atributos distribuídos ✓"}
            </Typography>
          </Box>
        </Box>,
        document.body
      )}
    </Page>
  );
}
