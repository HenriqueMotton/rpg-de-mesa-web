import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import NightlightRoundedIcon from "@mui/icons-material/NightlightRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import {
  SectionDivider,
  SectionIconBox,
  SectionLabelText,
  SkillEmptyBox,
} from "./ViewCharacter.styles";
import { listAllCharacters, restCharacter } from "../../modules/characters/characters.api";

const SHORT_REST_CLASSES = ["Bruxo"];

const HIT_DICE_BY_CLASS: Record<string, number> = {
  "Bárbaro": 12, "Bardo": 8, "Bruxo": 8, "Clérico": 8, "Druida": 8,
  "Feiticeiro": 6, "Guerreiro": 10, "Ladino": 8, "Mago": 6,
  "Monge": 8, "Paladino": 10, "Patrulheiro": 10,
};

type CharacterRow = {
  id: number;
  name: string;
  classIcon?: string;
  className?: string;
  checked: boolean;
};

type FeedbackResult = {
  name: string;
  className?: string;
  recovered: boolean;
  hitDiceSpent?: number;
  newHealth?: number;
  maxHealth?: number;
};

type Feedback = {
  type: "long" | "short";
  results: FeedbackResult[];
};

export default function RestManager() {
  const [rows, setRows]         = useState<CharacterRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Short-rest hit dice step
  const [shortRestPhase, setShortRestPhase] = useState(false);
  const [hitDiceInputs, setHitDiceInputs]   = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const chars = await listAllCharacters();
      setRows(chars.map((c) => ({ id: c.id, name: c.name, classIcon: c.dndClass?.icon, className: c.dndClass?.name, checked: false })));
    } catch {
      setError("Não foi possível carregar os personagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggle(id: number) {
    setFeedback(null);
    setShortRestPhase(false);
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, checked: !r.checked } : r));
  }

  function selectAll() {
    setFeedback(null); setShortRestPhase(false);
    setRows((prev) => prev.map((r) => ({ ...r, checked: true })));
  }

  function clearAll() {
    setFeedback(null); setShortRestPhase(false);
    setRows((prev) => prev.map((r) => ({ ...r, checked: false })));
  }

  const selected = rows.filter((r) => r.checked);

  // ── Long rest ────────────────────────────────────────────────────────────────
  async function applyLongRest() {
    if (selected.length === 0) { setError("Selecione ao menos um personagem."); return; }
    setSaving(true); setError(null); setFeedback(null);
    try {
      const results: FeedbackResult[] = await Promise.all(
        selected.map(async (r) => {
          const updated = await restCharacter(r.id, "long");
          return { name: r.name, className: r.className, recovered: true, newHealth: updated.health, maxHealth: updated.maxHealth };
        })
      );
      setFeedback({ type: "long", results });
      setRows((prev) => prev.map((r) => ({ ...r, checked: false })));
    } catch {
      setError("Não foi possível aplicar o descanso.");
    } finally {
      setSaving(false);
    }
  }

  // ── Short rest — step 1: open hit dice inputs ────────────────────────────────
  function openShortRest() {
    if (selected.length === 0) { setError("Selecione ao menos um personagem."); return; }
    setError(null); setFeedback(null);
    const initial: Record<number, string> = {};
    selected.forEach((r) => { initial[r.id] = "0"; });
    setHitDiceInputs(initial);
    setShortRestPhase(true);
  }

  // ── Short rest — step 2: confirm ──────────────────────────────────────────────
  async function confirmShortRest() {
    setSaving(true); setError(null);
    try {
      const results: FeedbackResult[] = await Promise.all(
        selected.map(async (r) => {
          const spent = Math.max(0, parseInt(hitDiceInputs[r.id] ?? "0", 10) || 0);
          const updated = await restCharacter(r.id, "short", spent);
          return {
            name: r.name, className: r.className,
            recovered: SHORT_REST_CLASSES.includes(r.className ?? "") || spent > 0,
            hitDiceSpent: spent, newHealth: updated.health, maxHealth: updated.maxHealth,
          };
        })
      );
      setFeedback({ type: "short", results });
      setRows((prev) => prev.map((r) => ({ ...r, checked: false })));
      setShortRestPhase(false);
    } catch {
      setError("Não foi possível aplicar o descanso.");
    } finally {
      setSaving(false);
    }
  }

  const anyChecked = selected.length > 0;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <SectionIconBox>
          <HotelRoundedIcon sx={{ fontSize: 14, color: "rgba(120,180,255,0.7)" }} />
        </SectionIconBox>
        <SectionLabelText>Descanso</SectionLabelText>
        <SectionDivider />
      </Stack>

      {/* Rules info */}
      <Box sx={{ mb: 2, px: 1.5, py: 1.25, borderRadius: "12px", bgcolor: "rgba(120,160,255,0.05)", border: "1px solid rgba(120,160,255,0.12)" }}>
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Typography sx={{ fontSize: 13, flexShrink: 0 }}>🌙</Typography>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(180,210,255,0.85)" }}>Descanso Longo</Typography>
              <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                HP ao máximo, todos os slots e metade dos dados de vida recuperados.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Typography sx={{ fontSize: 13, flexShrink: 0 }}>☕</Typography>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(180,210,255,0.85)" }}>Descanso Curto</Typography>
              <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                Informe quantos dados de vida cada jogador gastou. <strong style={{ color: "rgba(200,175,255,0.7)" }}>Bruxo</strong> recupera slots de Pacto.
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: 13, bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)" }}>
          {error}
        </Alert>
      )}

      {/* Feedback */}
      {feedback && (
        <Box sx={{ mb: 2, px: 1.5, py: 1.25, borderRadius: "12px", bgcolor: "rgba(60,180,120,0.07)", border: "1px solid rgba(60,180,120,0.2)" }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "rgba(100,220,160,0.85)", mb: 0.75 }}>
            {feedback.type === "long" ? "🌙 Descanso Longo aplicado" : "☕ Descanso Curto aplicado"}
          </Typography>
          <Stack spacing={0.6}>
            {feedback.results.map((r) => (
              <Box key={r.name} sx={{ pl: 0.25 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(200,240,220,0.85)" }}>{r.name}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 0.25, ml: 0.25 }}>
                  {feedback.type === "long" && r.newHealth !== undefined && (
                    <Typography sx={{ fontSize: 10.5, color: "rgba(100,230,170,0.65)" }}>❤️ HP {r.newHealth}/{r.maxHealth}</Typography>
                  )}
                  {feedback.type === "long" && (
                    <Typography sx={{ fontSize: 10.5, color: "rgba(140,180,255,0.55)" }}>✦ Slots restaurados</Typography>
                  )}
                  {feedback.type === "short" && r.hitDiceSpent !== undefined && r.hitDiceSpent > 0 && (
                    <Typography sx={{ fontSize: 10.5, color: "rgba(255,210,100,0.6)" }}>🎲 {r.hitDiceSpent} dado{r.hitDiceSpent !== 1 ? "s" : ""} gasto{r.hitDiceSpent !== 1 ? "s" : ""}</Typography>
                  )}
                  {feedback.type === "short" && SHORT_REST_CLASSES.includes(r.className ?? "") && (
                    <Typography sx={{ fontSize: 10.5, color: "rgba(200,175,255,0.55)" }}>✦ Slots de Pacto restaurados</Typography>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Select all / clear */}
      {!loading && rows.length > 0 && !shortRestPhase && (
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Typography onClick={selectAll} sx={{ fontSize: 11.5, fontWeight: 700, color: "rgba(120,160,255,0.7)", cursor: "pointer", "&:hover": { color: "rgba(160,190,255,0.9)" } }}>
            Selecionar todos
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.15)" }}>·</Typography>
          <Typography onClick={clearAll} sx={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.3)", cursor: "pointer", "&:hover": { color: "rgba(255,255,255,0.55)" } }}>
            Limpar
          </Typography>
        </Stack>
      )}

      {/* Character list */}
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
          <CircularProgress size={22} thickness={2.5} sx={{ color: "rgba(120,160,255,0.6)" }} />
        </Box>
      ) : rows.length === 0 ? (
        <SkillEmptyBox>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Nenhum personagem cadastrado.</Typography>
        </SkillEmptyBox>
      ) : !shortRestPhase ? (
        <Stack spacing={0.6} sx={{ mb: 2 }}>
          {rows.map((row) => (
            <Box key={row.id} onClick={() => toggle(row.id)} sx={{
              display: "flex", alignItems: "center", gap: 1,
              pl: 0.5, pr: 1.25, py: 0.75, borderRadius: "12px", cursor: "pointer",
              border: row.checked ? "1px solid rgba(120,160,255,0.35)" : "1px solid rgba(255,255,255,0.06)",
              bgcolor: row.checked ? "rgba(120,160,255,0.06)" : "rgba(255,255,255,0.025)",
              transition: "all .15s",
              "&:hover": { bgcolor: row.checked ? "rgba(120,160,255,0.1)" : "rgba(255,255,255,0.05)" },
            }}>
              <Checkbox checked={row.checked} size="small" onClick={(e) => e.stopPropagation()} onChange={() => toggle(row.id)}
                sx={{ color: "rgba(255,255,255,0.2)", p: 0.5, "&.Mui-checked": { color: "rgba(120,180,255,0.75)" } }}
              />
              {row.classIcon && <Typography sx={{ fontSize: 15, flexShrink: 0 }}>{row.classIcon}</Typography>}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.name}
                </Typography>
                {row.className && <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{row.className}</Typography>}
              </Box>
              {SHORT_REST_CLASSES.includes(row.className ?? "") && (
                <Box sx={{ px: 0.9, py: 0.25, borderRadius: "6px", bgcolor: "rgba(200,175,255,0.08)", border: "1px solid rgba(200,175,255,0.18)", flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: "rgba(200,175,255,0.7)" }}>☕ curto</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        /* ── Short rest — hit dice step ── */
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <IconButton size="small" onClick={() => setShortRestPhase(false)}
              sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "rgba(255,255,255,0.7)" } }}>
              <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Dados de vida gastos no descanso
            </Typography>
          </Stack>

          <Stack spacing={0.75}>
            {selected.map((r) => {
              const dieSize = HIT_DICE_BY_CLASS[r.className ?? ""] ?? 0;
              return (
                <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1.25, py: 0.85, borderRadius: "11px", border: "1px solid rgba(255,255,255,0.07)", bgcolor: "rgba(255,255,255,0.02)" }}>
                  {r.classIcon && <Typography sx={{ fontSize: 15, flexShrink: 0 }}>{r.classIcon}</Typography>}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name}
                    </Typography>
                    {dieSize > 0 && (
                      <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>d{dieSize}</Typography>
                    )}
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>dados gastos:</Typography>
                    <TextField
                      value={hitDiceInputs[r.id] ?? "0"}
                      onChange={(e) => setHitDiceInputs((prev) => ({ ...prev, [r.id]: e.target.value.replace(/\D/g, "") }))}
                      onClick={(e) => e.stopPropagation()}
                      type="number"
                      inputProps={{ min: 0, style: { textAlign: "center", padding: "4px 6px", fontSize: 14, fontWeight: 900, color: "rgba(255,220,120,0.9)", width: 36 } }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "9px",
                          bgcolor: "rgba(255,195,60,0.05)",
                          "& fieldset": { borderColor: "rgba(255,195,60,0.2)" },
                          "&:hover fieldset": { borderColor: "rgba(255,195,60,0.4)" },
                          "&.Mui-focused fieldset": { borderColor: "rgba(255,195,60,0.55)", borderWidth: 1.5 },
                        },
                      }}
                    />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Action buttons */}
      {anyChecked && !shortRestPhase && (
        <Stack spacing={1}>
          <Button onClick={applyLongRest} disabled={saving} variant="outlined" fullWidth
            startIcon={saving ? <CircularProgress size={13} sx={{ color: "rgba(160,200,255,0.7)" }} /> : <NightlightRoundedIcon />}
            sx={{ borderRadius: "13px", py: 1.1, textTransform: "none", fontWeight: 800, fontSize: 13, borderColor: "rgba(120,160,255,0.35)", color: "rgba(160,200,255,0.9)", bgcolor: "rgba(120,160,255,0.06)", "&:hover": { borderColor: "rgba(120,160,255,0.6)", bgcolor: "rgba(120,160,255,0.12)" } }}>
            🌙 Descanso Longo ({selected.length})
          </Button>
          <Button onClick={openShortRest} disabled={saving} variant="outlined" fullWidth
            startIcon={<HotelRoundedIcon />}
            sx={{ borderRadius: "13px", py: 1.1, textTransform: "none", fontWeight: 800, fontSize: 13, borderColor: "rgba(200,175,255,0.2)", color: "rgba(200,175,255,0.7)", bgcolor: "rgba(200,175,255,0.04)", "&:hover": { borderColor: "rgba(200,175,255,0.4)", bgcolor: "rgba(200,175,255,0.08)" } }}>
            ☕ Descanso Curto ({selected.length})
          </Button>
        </Stack>
      )}

      {shortRestPhase && (
        <Button onClick={confirmShortRest} disabled={saving} variant="outlined" fullWidth
          startIcon={saving ? <CircularProgress size={13} sx={{ color: "rgba(200,180,255,0.7)" }} /> : <HotelRoundedIcon />}
          sx={{ borderRadius: "13px", py: 1.1, textTransform: "none", fontWeight: 800, fontSize: 13, borderColor: "rgba(200,175,255,0.35)", color: "rgba(200,175,255,0.9)", bgcolor: "rgba(200,175,255,0.07)", "&:hover": { borderColor: "rgba(200,175,255,0.55)", bgcolor: "rgba(200,175,255,0.12)" } }}>
          Confirmar Descanso Curto
        </Button>
      )}
    </Box>
  );
}
