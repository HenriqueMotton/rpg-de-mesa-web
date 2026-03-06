import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import AddRoundedIcon          from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon       from "@mui/icons-material/DeleteRounded";
import PaidRoundedIcon         from "@mui/icons-material/PaidRounded";
import FavoriteRoundedIcon     from "@mui/icons-material/FavoriteRounded";
import StarRoundedIcon         from "@mui/icons-material/StarRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RefreshRoundedIcon      from "@mui/icons-material/RefreshRounded";

import { useNavigate } from "react-router-dom";

const RACE_ICON: Record<string, string> = {
  "Anão": "⛏️", "Elfo": "🌿", "Meio-Elfo": "🌟", "Humano": "🏛️",
  "Draconato": "🐉", "Gnomo": "⚙️", "Meio-Orc": "💪", "Hobbit": "🌻",
};
import {
  deleteCharacter,
  getCharacter,
  listCharacters,
  type CharacterListItem,
} from "../../modules/characters/characters.api";
import { useCharactersStore } from "../../modules/characters/characters.store";
import { Page, Glow, Glass } from "./Personagens.styles";
import { ROUTES } from "../../app/routes";

export default function PersonagensPage() {
  const navigate        = useNavigate();
  const characters      = useCharactersStore((s) => s.characters);
  const setCharacters   = useCharactersStore((s) => s.setCharacters);
  const removeCharacter = useCharactersStore((s) => s.removeCharacter);
  const setSelected     = useCharactersStore((s) => s.setSelected);

  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [toDelete,    setToDelete]    = useState<CharacterListItem | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  async function load() {
    setLoading(true);
    try { setCharacters(await listCharacters()); }
    finally { setLoading(false); }
  }

  async function refresh() {
    setRefreshing(true);
    try { setCharacters(await listCharacters()); }
    finally { setRefreshing(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleOpenCharacter(c: CharacterListItem) {
    const full = await getCharacter(c.id);
    setSelected(full);
    navigate(`/personagens/${c.id}`);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCharacter(toDelete.id);
      removeCharacter(toDelete.id);
      setDeleteOpen(false);
      setToDelete(null);
    } finally { setDeleting(false); }
  }

  const hpPercent = (c: CharacterListItem) =>
    c.maxHealth ? Math.round(((c.health ?? 0) / c.maxHealth) * 100) : 0;

  const hpColor = (pct: number) =>
    pct > 60 ? "#4CAF82" : pct > 30 ? "#FFB347" : "#FF5C5C";

  return (
    <Page>
      <Glow />
      <Container maxWidth="sm" sx={{ py: 2.5, position: "relative", color: "rgba(255,255,255,0.9)" }}>

        {/* ── Header ── */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "rgba(160,130,255,0.55)", mb: 0.8 }}>
              Personagens
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, color: "rgba(255,255,255,0.93)" }}>
              Meus Personagens
            </Typography>
            <Typography sx={{ opacity: 0.4, fontSize: 12.5, mt: 0.4 }}>
              {characters.length === 0
                ? "Crie seu primeiro personagem para começar."
                : `${characters.length} personagem${characters.length > 1 ? "s" : ""} na mesa`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={refresh}
              disabled={refreshing || loading}
              size="small"
              sx={{
                width: 34, height: 34, borderRadius: "9px",
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.4)",
                transition: "all 0.18s",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" },
              }}
            >
              {refreshing
                ? <CircularProgress size={15} sx={{ color: "rgba(255,255,255,0.4)" }} />
                : <RefreshRoundedIcon sx={{ fontSize: 17 }} />}
            </IconButton>

            <Button
              variant="contained"
              onClick={() => navigate(ROUTES.personagemNovo)}
              startIcon={<AddRoundedIcon sx={{ fontSize: "17px !important" }} />}
              sx={{
                height: 34, borderRadius: "9px", textTransform: "none",
                fontWeight: 700, fontSize: 13.5, px: 1.8,
                background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)",
                boxShadow: "0 6px 20px rgba(100,70,230,0.35)",
                transition: "all 0.18s",
                "&:hover": { boxShadow: "0 10px 28px rgba(100,70,230,0.5)", transform: "translateY(-1px)" },
              }}
            >
              Criar
            </Button>
          </Stack>
        </Stack>

        {/* Loading bar */}
        {(loading || refreshing) && (
          <LinearProgress
            sx={{
              mb: 2, borderRadius: 2, height: 2,
              bgcolor: "rgba(255,255,255,0.06)",
              "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #7B54FF, #5B8FFF)" },
            }}
          />
        )}

        {/* ── Empty state ── */}
        {!loading && characters.length === 0 && (
          <Glass elevation={0}>
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography sx={{ fontSize: 32, mb: 1 }}>🎲</Typography>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Nenhum personagem ainda</Typography>
              <Typography sx={{ opacity: 0.45, fontSize: 13 }}>
                Clique em <b style={{ opacity: 0.8 }}>Criar</b> para montar seu primeiro personagem.
              </Typography>
            </Box>
          </Glass>
        )}

        {/* ── Character cards ── */}
        <Stack spacing={1.5}>
          {characters.map((c) => {
            const pct   = hpPercent(c);
            const color = hpColor(pct);

            return (
              <Glass
                key={String(c.id)}
                elevation={0}
                onClick={() => handleOpenCharacter(c)}
                sx={{
                  cursor: "pointer", transition: "all 0.18s",
                  "&:hover": { transform: "translateY(-1px)", boxShadow: "0 0 0 1px rgba(120,85,255,0.2), 0 24px 60px rgba(0,0,0,0.6)" },
                }}
              >
                <Box sx={{ p: 2.2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>

                    {/* Left */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: c.race ? 0.4 : 1.2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 15.5, letterSpacing: -0.3, color: "white" }}>
                          {c.name}
                        </Typography>
                        <Box sx={{ px: 0.9, py: 0.15, borderRadius: "6px", bgcolor: "rgba(120,85,255,0.15)", border: "1px solid rgba(120,85,255,0.25)", display: "flex", alignItems: "center", gap: 0.4 }}>
                          <StarRoundedIcon sx={{ fontSize: 11, color: "rgba(180,150,255,0.85)" }} />
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "rgba(180,150,255,0.9)", lineHeight: 1 }}>
                            Nível {c.nivel ?? 1}
                          </Typography>
                        </Box>
                      </Stack>

                      {c.race && (
                        <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.32)", mb: 1, letterSpacing: "0.01em" }}>
                          {RACE_ICON[c.race.name] ?? "🎲"} {c.race.name}
                          {c.subRace ? ` · ${c.subRace.name}` : ""}
                        </Typography>
                      )}

                      {/* HP bar */}
                      <Box sx={{ mb: 1.4 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <FavoriteRoundedIcon sx={{ fontSize: 12, color, opacity: 0.85 }} />
                            <Typography sx={{ fontSize: 11.5, fontWeight: 600, opacity: 0.75, color: "white" }}>Vida</Typography>
                          </Stack>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color, opacity: 0.9 }}>
                            {c.health ?? 0} / {c.maxHealth ?? 0}
                          </Typography>
                        </Stack>
                        <Box sx={{ height: 4, borderRadius: 4, bgcolor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: 4, bgcolor: color, boxShadow: `0 0 8px ${color}88`, transition: "width 0.4s ease" }} />
                        </Box>
                      </Box>

                      {/* Gold */}
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PaidRoundedIcon sx={{ fontSize: 13, color: "rgba(255,195,80,0.7)" }} />
                        <Typography sx={{ fontSize: 12, opacity: 0.55, fontWeight: 600, color: "white" }}>
                          {c.money ?? 0} ouro
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Right — actions */}
                    <Stack direction="column" spacing={0.8} alignItems="center" sx={{ flexShrink: 0 }}>
                      <IconButton
                        onClick={(e) => { e.stopPropagation(); setToDelete(c); setDeleteOpen(true); }}
                        size="small"
                        sx={{
                          width: 32, height: 32, borderRadius: "8px",
                          color: "rgba(255,100,100,0.5)",
                          bgcolor: "rgba(220,60,60,0.08)",
                          border: "1px solid rgba(220,60,60,0.12)",
                          transition: "all 0.18s",
                          "&:hover": { color: "rgba(255,100,100,0.9)", bgcolor: "rgba(220,60,60,0.16)", borderColor: "rgba(220,60,60,0.3)" },
                        }}
                      >
                        <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>

                      <IconButton
                        onClick={(e) => { e.stopPropagation(); handleOpenCharacter(c); }}
                        size="small"
                        sx={{
                          width: 32, height: 32, borderRadius: "8px",
                          color: "rgba(255,255,255,0.5)",
                          bgcolor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          transition: "all 0.18s",
                          "&:hover": { color: "rgba(255,255,255,0.9)", bgcolor: "rgba(120,85,255,0.15)", borderColor: "rgba(120,85,255,0.3)" },
                        }}
                      >
                        <ChevronRightRoundedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              </Glass>
            );
          })}
        </Stack>

        {/* ── Delete dialog ── */}
        <Dialog
          open={deleteOpen}
          onClose={() => !deleting && setDeleteOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: "18px",
              background: "rgba(12, 15, 23, 0.96)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
              m: 2,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontSize: 16, pt: 2.5, pb: 1, color: "rgba(255,255,255,0.95)" }}>
            Excluir personagem?
          </DialogTitle>
          <DialogContent sx={{ pb: 1 }}>
            <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)" }}>
              <b style={{ color: "#fff", fontWeight: 700 }}>{toDelete?.name}</b> será removido permanentemente. Essa ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              sx={{
                textTransform: "none", fontWeight: 700, fontSize: 13.5,
                borderRadius: "9px", color: "rgba(255,255,255,0.5)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              variant="contained"
              sx={{
                textTransform: "none", fontWeight: 700, fontSize: 13.5,
                borderRadius: "9px", px: 2.5,
                bgcolor: "rgba(200,50,50,0.85)",
                boxShadow: "0 4px 16px rgba(200,50,50,0.3)",
                "&:hover": { bgcolor: "rgba(220,60,60,0.95)" },
                "&.Mui-disabled": { bgcolor: "rgba(200,50,50,0.3)", color: "rgba(255,255,255,0.3)" },
              }}
            >
              {deleting
                ? <CircularProgress size={14} sx={{ color: "rgba(255,255,255,0.5)" }} />
                : "Excluir"}
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Page>
  );
}