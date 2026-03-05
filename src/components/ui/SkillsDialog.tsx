import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import AppDialog, { AppDialogConfirmButton } from "./AppDialog";
import { listSkills, type Skill } from "../../modules/characters/characters.api";

type Props = {
  open: boolean;
  onClose: () => void;
  selected: number[];
  toggle: (skillId: number) => void;
  max: number;
};

export default function SkillsDialog({ open, onClose, selected, toggle, max }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [animatingId, setAnimatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listSkills();
        if (!alive) return;
        setSkills(data ?? []);
      } catch {
        if (!alive) return;
        setError("Erro ao carregar perícias.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open]);

  const handleToggle = (skillId: number) => {
    setAnimatingId(skillId);
    toggle(skillId);
    setTimeout(() => setAnimatingId(null), 300);
  };

  const headerText = useMemo(
    () => `Selecionar Perícias`,
    []
  );

  const progressPct = (selected.length / max) * 100;

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={headerText}
      dividers
      actions={
        <AppDialogConfirmButton onClick={onClose} sx={{ px: 4, py: 1.2, borderRadius: "12px" }}>
          Confirmar
        </AppDialogConfirmButton>
      }
    >
      {/* Progress bar + counter */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
          }}>
            Perícias selecionadas
          </Typography>
          <Typography sx={{
            fontSize: 13,
            fontWeight: 700,
            color: progressPct >= 100 ? "rgba(160,120,255,0.9)" : "rgba(255,255,255,0.65)",
            fontVariantNumeric: "tabular-nums",
            transition: "color .3s",
          }}>
            <span style={{ color: progressPct > 0 ? "rgba(160,120,255,1)" : "rgba(255,255,255,0.4)" }}>
              {selected.length}
            </span>
            <span style={{ opacity: 0.35 }}> / {max}</span>
          </Typography>
        </Box>

        {/* progress track */}
        <Box sx={{
          height: 4,
          borderRadius: 99,
          bgcolor: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}>
          <Box sx={{
            height: "100%",
            borderRadius: 99,
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #7c4dff, #b47eff)",
            transition: "width .35s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 0 12px rgba(140,80,255,0.5)",
          }} />
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: "12px",
            bgcolor: "rgba(220,60,60,0.08)",
            border: "1px solid rgba(220,60,60,0.15)",
            color: "rgba(255,140,140,0.9)",
            fontSize: 13,
          }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress
            size={28}
            thickness={2.5}
            sx={{ color: "rgba(140,90,255,0.7)" }}
          />
          <Typography sx={{ mt: 2, fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>
            Carregando perícias…
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.75}>
          {skills.map((sk, i) => {
            const isSelected = selected.includes(sk.id);
            const isDisabled = selected.length >= max && !isSelected;
            const isExpanded = expandedId === sk.id;
            const isAnimating = animatingId === sk.id;

            return (
              <Box
                key={sk.id}
                sx={{
                  borderRadius: "14px",
                  border: isSelected
                    ? "1px solid rgba(140,80,255,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  bgcolor: isSelected
                    ? "rgba(110,65,255,0.12)"
                    : "rgba(255,255,255,0.025)",
                  opacity: isDisabled ? 0.38 : 1,
                  transition: "all .2s cubic-bezier(.4,0,.2,1)",
                  overflow: "hidden",
                  boxShadow: isSelected
                    ? "0 0 0 1px rgba(140,80,255,0.1) inset, 0 4px 20px rgba(110,65,255,0.08)"
                    : "none",
                  transform: isAnimating ? "scale(0.985)" : "scale(1)",
                  animationDelay: `${i * 30}ms`,
                  "&:hover": !isDisabled ? {
                    border: isSelected
                      ? "1px solid rgba(150,95,255,0.45)"
                      : "1px solid rgba(255,255,255,0.12)",
                    bgcolor: isSelected
                      ? "rgba(110,65,255,0.17)"
                      : "rgba(255,255,255,0.045)",
                  } : {},
                }}
              >
                {/* Main row */}
                <Box
                  onClick={() => !isDisabled && handleToggle(sk.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.5,
                    py: 1.25,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    userSelect: "none",
                  }}
                >
                  {/* Selection indicator */}
                  <Box sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "7px",
                    flexShrink: 0,
                    border: isSelected
                      ? "1px solid rgba(150,100,255,0.6)"
                      : "1px solid rgba(255,255,255,0.12)",
                    bgcolor: isSelected
                      ? "rgba(120,75,255,0.35)"
                      : "rgba(255,255,255,0.04)",
                    display: "grid",
                    placeItems: "center",
                    transition: "all .2s",
                  }}>
                    {isSelected && (
                      <CheckRoundedIcon sx={{
                        fontSize: 14,
                        color: "rgba(200,170,255,1)",
                      }} />
                    )}
                  </Box>

                  {/* Text */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontWeight: 600,
                      fontSize: 13.5,
                      lineHeight: 1.3,
                      color: isSelected ? "rgba(220,200,255,0.95)" : "rgba(255,255,255,0.85)",
                      transition: "color .2s",
                    }}>
                      {sk.name}
                      {sk.attribute && (
                        <Typography component="span" sx={{
                          ml: 0.7,
                          fontSize: 11.5,
                          fontWeight: 500,
                          color: isSelected ? "rgba(180,145,255,0.7)" : "rgba(255,255,255,0.35)",
                          transition: "color .2s",
                        }}>
                          {sk.attribute}
                        </Typography>
                      )}
                    </Typography>

                    {isDisabled && !isSelected && (
                      <Typography sx={{
                        fontSize: 10.5,
                        mt: 0.25,
                        color: "rgba(255,255,255,0.28)",
                        letterSpacing: "0.04em",
                      }}>
                        Limite de {max} perícias atingido
                      </Typography>
                    )}
                  </Box>

                  {/* Info toggle */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId((prev) => (prev === sk.id ? null : sk.id));
                    }}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "9px",
                      border: isExpanded
                        ? "1px solid rgba(140,90,255,0.3)"
                        : "1px solid rgba(255,255,255,0.07)",
                      bgcolor: isExpanded
                        ? "rgba(120,75,255,0.15)"
                        : "rgba(255,255,255,0.04)",
                      flexShrink: 0,
                      transition: "all .2s",
                      "&:hover": {
                        bgcolor: isExpanded
                          ? "rgba(120,75,255,0.22)"
                          : "rgba(255,255,255,0.08)",
                        border: isExpanded
                          ? "1px solid rgba(140,90,255,0.45)"
                          : "1px solid rgba(255,255,255,0.14)",
                      },
                    }}
                  >
                    {isExpanded ? (
                      <ExpandLessRoundedIcon sx={{ fontSize: 15, color: "rgba(175,145,255,0.85)" }} />
                    ) : (
                      <InfoOutlinedIcon sx={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }} />
                    )}
                  </IconButton>
                </Box>

                {/* Expanded description */}
                {isExpanded && (
                  <Box sx={{
                    px: 1.5,
                    pb: 1.25,
                    pt: 0,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    mt: 0,
                  }}>
                    <Typography sx={{
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.55)",
                      pt: 1,
                      fontStyle: sk.description?.trim() ? "normal" : "italic",
                    }}>
                      {sk.description?.trim() || "Sem descrição cadastrada."}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </AppDialog>
  );
}