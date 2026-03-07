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
  Tooltip,
  Typography,
} from "@mui/material";
import SwordsRoundedIcon from "@mui/icons-material/SportsMartialArtsRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

import {
  SectionDivider,
  SectionIconBox,
  SectionLabelText,
  SkillEmptyBox,
} from "./ViewCharacter.styles";
import { listAllCharacters } from "../../modules/characters/characters.api";
import {
  getActiveInitiative,
  publishInitiative,
  deactivateInitiative,
  setInitiativeTurn,
  type InitiativeEntry,
} from "../../modules/initiative/initiative.api";

type CharacterRow = {
  id: number;
  name: string;
  classIcon?: string;
  className?: string;
  checked: boolean;
  initiative: string;
};

export default function InitiativeManager() {
  const [rows, setRows]         = useState<CharacterRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{ entries: InitiativeEntry[]; currentTurnIndex: number; updatedAt: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [chars, session] = await Promise.all([
        listAllCharacters(),
        getActiveInitiative(),
      ]);

      setActiveSession(session?.isActive ? { entries: session.entries, currentTurnIndex: session.currentTurnIndex ?? 0, updatedAt: session.updatedAt } : null);

      setRows(
        chars.map((c) => ({
          id:        c.id,
          name:      c.name,
          classIcon: c.dndClass?.icon,
          className: c.dndClass?.name,
          checked:   false,
          initiative: "",
        }))
      );
    } catch {
      setError("Não foi possível carregar os personagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggle(id: number) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, checked: !r.checked } : r));
  }

  function setIni(id: number, value: string) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, initiative: value } : r));
  }

  const selected = rows.filter((r) => r.checked);

  async function handlePublish() {
    if (selected.length === 0) { setError("Selecione ao menos um personagem."); return; }
    setSaving(true);
    setError(null);
    try {
      const entries: InitiativeEntry[] = selected.map((r) => ({
        characterId: r.id,
        name:        r.name,
        initiative:  Number(r.initiative) || 0,
      }));
      await publishInitiative(entries);
      await load();
    } catch {
      setError("Não foi possível publicar a iniciativa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetTurn(index: number) {
    try {
      await setInitiativeTurn(index);
      setActiveSession((prev) => prev ? { ...prev, currentTurnIndex: index } : prev);
    } catch {
      setError("Não foi possível atualizar o turno.");
    }
  }

  async function handleDeactivate() {
    setSaving(true);
    setError(null);
    try {
      await deactivateInitiative();
      setActiveSession(null);
    } catch {
      setError("Não foi possível encerrar a sessão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <SectionIconBox>
          <SwordsRoundedIcon sx={{ fontSize: 14, color: "rgba(255,195,60,0.7)" }} />
        </SectionIconBox>
        <SectionLabelText>Iniciativa</SectionLabelText>
        <SectionDivider />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: 13, bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)" }}>
          {error}
        </Alert>
      )}

      {/* Active session banner */}
      {activeSession && (
        <Box sx={{
          mb: 2, px: 1.75, py: 1.25, borderRadius: "13px",
          bgcolor: "rgba(255,195,60,0.07)", border: "1px solid rgba(255,195,60,0.2)",
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,215,100,0.7)" }}>
              ⚔️ Sessão ativa
            </Typography>
            <Button
              size="small"
              onClick={handleDeactivate}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={10} /> : <StopRoundedIcon sx={{ fontSize: "13px !important" }} />}
              sx={{ textTransform: "none", fontWeight: 800, fontSize: 11.5, color: "rgba(255,130,130,0.8)", borderRadius: "8px", "&:hover": { bgcolor: "rgba(220,60,60,0.08)" } }}
            >
              Encerrar
            </Button>
          </Stack>

          {/* Turn navigator */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25, px: 0.25 }}>
            <Tooltip title="Turno anterior">
              <span>
                <IconButton
                  size="small"
                  disabled={activeSession.currentTurnIndex === 0}
                  onClick={() => handleSetTurn(activeSession.currentTurnIndex - 1)}
                  sx={{ color: "rgba(255,215,100,0.6)", "&:hover": { bgcolor: "rgba(255,195,60,0.1)" }, "&.Mui-disabled": { color: "rgba(255,255,255,0.12)" } }}
                >
                  <ArrowBackIosNewRoundedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "rgba(255,230,130,0.85)", textAlign: "center", flex: 1 }}>
              Vez de: {activeSession.entries[activeSession.currentTurnIndex]?.name ?? "—"}
            </Typography>
            <Tooltip title="Próximo turno">
              <span>
                <IconButton
                  size="small"
                  disabled={activeSession.currentTurnIndex >= activeSession.entries.length - 1}
                  onClick={() => handleSetTurn(activeSession.currentTurnIndex + 1)}
                  sx={{ color: "rgba(255,215,100,0.6)", "&:hover": { bgcolor: "rgba(255,195,60,0.1)" }, "&.Mui-disabled": { color: "rgba(255,255,255,0.12)" } }}
                >
                  <ArrowForwardIosRoundedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Stack spacing={0.4}>
            {activeSession.entries.map((e, i) => {
              const isCurrent = i === activeSession.currentTurnIndex;
              return (
                <Stack
                  key={e.characterId}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  onClick={() => handleSetTurn(i)}
                  sx={{
                    px: 0.75, py: 0.5, borderRadius: "8px", cursor: "pointer",
                    bgcolor: isCurrent ? "rgba(255,195,60,0.12)" : "transparent",
                    border: isCurrent ? "1px solid rgba(255,195,60,0.3)" : "1px solid transparent",
                    transition: "all .15s",
                    "&:hover": { bgcolor: isCurrent ? "rgba(255,195,60,0.16)" : "rgba(255,255,255,0.04)" },
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 900, color: isCurrent ? "rgba(255,215,100,0.85)" : "rgba(255,215,100,0.4)", width: 16 }}>
                    {isCurrent ? "▶" : `${i + 1}.`}
                  </Typography>
                  <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "rgba(255,240,180,0.95)" : "rgba(255,255,255,0.65)" }}>
                    {e.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: isCurrent ? "rgba(255,215,100,0.85)" : "rgba(255,215,100,0.45)" }}>
                    {e.initiative}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Character list */}
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
          <CircularProgress size={22} thickness={2.5} sx={{ color: "rgba(255,195,60,0.6)" }} />
        </Box>
      ) : rows.length === 0 ? (
        <SkillEmptyBox>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            Nenhum personagem cadastrado.
          </Typography>
        </SkillEmptyBox>
      ) : (
        <Stack spacing={0.6}>
          {rows.map((row) => (
            <Box
              key={row.id}
              onClick={() => toggle(row.id)}
              sx={{
                display: "flex", alignItems: "center", gap: 1,
                pl: 0.5, pr: 1, py: 0.75,
                borderRadius: "12px",
                border: row.checked ? "1px solid rgba(255,195,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
                bgcolor: row.checked ? "rgba(255,195,60,0.06)" : "rgba(255,255,255,0.025)",
                cursor: "pointer",
                transition: "all .15s",
                "&:hover": { bgcolor: row.checked ? "rgba(255,195,60,0.1)" : "rgba(255,255,255,0.05)" },
              }}
            >
              <Checkbox
                checked={row.checked}
                size="small"
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggle(row.id)}
                sx={{
                  color: "rgba(255,255,255,0.2)", p: 0.5,
                  "&.Mui-checked": { color: "rgba(255,195,60,0.75)" },
                }}
              />
              {row.classIcon && (
                <Typography sx={{ fontSize: 15, flexShrink: 0 }}>{row.classIcon}</Typography>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.name}
                </Typography>
                {row.className && (
                  <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{row.className}</Typography>
                )}
              </Box>

              {row.checked && (
                <TextField
                  value={row.initiative}
                  onChange={(e) => { e.stopPropagation(); setIni(row.id, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Init."
                  type="number"
                  inputProps={{ min: 0, max: 30, style: { textAlign: "center", padding: "4px 6px", fontSize: 13, fontWeight: 800, color: "rgba(255,220,100,0.9)", width: 42 } }}
                  sx={{
                    flexShrink: 0,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "9px",
                      bgcolor: "rgba(255,195,60,0.07)",
                      "& fieldset": { borderColor: "rgba(255,195,60,0.25)" },
                      "&:hover fieldset": { borderColor: "rgba(255,195,60,0.45)" },
                      "&.Mui-focused fieldset": { borderColor: "rgba(255,195,60,0.55)", borderWidth: 1.5 },
                    },
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>
      )}

      {/* Publish button */}
      {selected.length > 0 && (
        <Button
          onClick={handlePublish}
          disabled={saving}
          variant="outlined"
          startIcon={saving ? <CircularProgress size={13} sx={{ color: "rgba(255,215,100,0.7)" }} /> : <PublishRoundedIcon />}
          fullWidth
          sx={{
            mt: 2, borderRadius: "13px", py: 1.1,
            textTransform: "none", fontWeight: 800, fontSize: 13,
            borderColor: "rgba(255,195,60,0.35)", color: "rgba(255,220,100,0.9)",
            bgcolor: "rgba(255,195,60,0.06)",
            "&:hover": { borderColor: "rgba(255,195,60,0.6)", bgcolor: "rgba(255,195,60,0.12)" },
          }}
        >
          Publicar iniciativa ({selected.length} personagens)
        </Button>
      )}
    </Box>
  );
}
