import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import {
  BackButton,
  Glass,
  Noise,
  OrbSide,
  OrbTop,
  Page,
  PageLabel,
  PageTitle,
} from "./ViewCharacter.styles";
import {
  getCharacter,
  saveNotes,
  type CharacterNote,
} from "../../modules/characters/characters.api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(120,85,255,0.5)", borderWidth: 1.5 },
  },
  "& .MuiInputBase-input": { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.65 },
};

export default function NotasPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<CharacterNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add note state
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const addRef = useRef<HTMLTextAreaElement>(null);

  // Edit note state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCharacter(id)
      .then((c) => setNotes((c as any).notes ?? []))
      .finally(() => setLoading(false));
  }, [id]);

  async function persist(next: CharacterNote[]) {
    if (!id) return;
    setSaving(true);
    try {
      await saveNotes(id, next);
    } finally {
      setSaving(false);
    }
  }

  function handleAdd() {
    const text = addText.trim();
    if (!text) return;
    const note: CharacterNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      createdAt: new Date().toISOString(),
    };
    const next = [note, ...notes];
    setNotes(next);
    setAddText("");
    setAddOpen(false);
    persist(next);
  }

  function handleDelete(noteId: string) {
    const next = notes.filter((n) => n.id !== noteId);
    setNotes(next);
    persist(next);
  }

  function startEdit(note: CharacterNote) {
    setEditingId(note.id);
    setEditText(note.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function handleEdit() {
    if (!editingId) return;
    const text = editText.trim();
    if (!text) {
      handleDelete(editingId);
      setEditingId(null);
      return;
    }
    const next = notes.map((n) =>
      n.id === editingId ? { ...n, text } : n
    );
    setNotes(next);
    setEditingId(null);
    persist(next);
  }

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

      <Container maxWidth="sm" sx={{ pt: 2.5, px: 2, pb: 12 }}>
        {/* ── Header ── */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
          <Box>
            <PageLabel>Personagem</PageLabel>
            <PageTitle>Notas</PageTitle>
          </Box>
          <Stack alignItems="flex-end" spacing={0.75}>
            <BackButton
              onClick={() => navigate(`/personagens/${id}`)}
              startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "15px !important" }} />}
            >
              Voltar
            </BackButton>
            {saving && (
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>Salvando…</Typography>
            )}
          </Stack>
        </Stack>

        {/* ── Add note card ── */}
        <Glass elevation={0} sx={{ mb: 1.75 }}>
          <Box sx={{ p: { xs: 1.75, sm: 2 } }}>
            {addOpen ? (
              <Stack spacing={1.25}>
                <TextField
                  autoFocus
                  multiline
                  minRows={3}
                  maxRows={10}
                  placeholder="Escreva sua nota… (Ctrl+Enter para salvar)"
                  value={addText}
                  onChange={(e) => setAddText(e.target.value)}
                  fullWidth
                  inputRef={addRef}
                  sx={inputSx}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) handleAdd();
                    if (e.key === "Escape") { setAddOpen(false); setAddText(""); }
                  }}
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Box
                    component="button"
                    onClick={() => { setAddOpen(false); setAddText(""); }}
                    sx={{
                      px: 1.5, py: 0.55, border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px",
                      bgcolor: "transparent", color: "rgba(255,255,255,0.4)",
                      fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)" },
                    }}
                  >
                    Cancelar
                  </Box>
                  <Box
                    component="button"
                    disabled={!addText.trim()}
                    onClick={handleAdd}
                    sx={{
                      px: 1.75, py: 0.55, border: "none", borderRadius: "9px",
                      bgcolor: "rgba(120,85,255,0.2)", color: "rgba(190,165,255,0.95)",
                      fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                      transition: "all .12s",
                      "&:hover:not(:disabled)": { bgcolor: "rgba(120,85,255,0.32)" },
                      "&:disabled": { opacity: 0.4, cursor: "not-allowed" },
                    }}
                  >
                    Salvar nota
                  </Box>
                </Stack>
              </Stack>
            ) : (
              <Box
                onClick={() => setAddOpen(true)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.25,
                  px: 0.5, py: 0.25, cursor: "text",
                  borderRadius: "10px",
                  transition: "all .13s",
                  "&:hover": { opacity: 0.75 },
                }}
              >
                <Box sx={{
                  width: 32, height: 32, borderRadius: "9px", flexShrink: 0,
                  bgcolor: "rgba(120,85,255,0.1)", border: "1px solid rgba(120,85,255,0.2)",
                  display: "grid", placeItems: "center",
                }}>
                  <AddRoundedIcon sx={{ fontSize: 16, color: "rgba(160,130,255,0.75)" }} />
                </Box>
                <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>
                  Adicionar nova nota…
                </Typography>
              </Box>
            )}
          </Box>
        </Glass>

        {/* ── Notes list ── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={24} sx={{ color: "rgba(120,85,255,0.5)" }} />
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography sx={{ fontSize: 36, mb: 1.25, lineHeight: 1 }}>📝</Typography>
            <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>
              Nenhuma nota ainda.
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.18)", mt: 0.5 }}>
              Registre aqui o que acontece com seu personagem!
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {notes.map((note) => {
              const isEditing = editingId === note.id;
              return (
                <Glass elevation={0} key={note.id}>
                  <Box sx={{ p: { xs: 1.5, sm: 1.75 } }}>
                    {isEditing ? (
                      <Stack spacing={1.25}>
                        <TextField
                          autoFocus
                          multiline
                          minRows={2}
                          maxRows={12}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          fullWidth
                          sx={inputSx}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) handleEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                          <Tooltip title="Cancelar">
                            <IconButton
                              size="small"
                              onClick={cancelEdit}
                              sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "rgba(255,255,255,0.65)" } }}
                            >
                              <CloseRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Salvar (Ctrl+Enter)">
                            <IconButton
                              size="small"
                              onClick={handleEdit}
                              sx={{
                                color: "rgba(120,200,130,0.8)", bgcolor: "rgba(60,180,100,0.1)",
                                border: "1px solid rgba(60,180,100,0.2)",
                                "&:hover": { bgcolor: "rgba(60,180,100,0.2)", color: "rgba(140,230,150,0.95)" },
                              }}
                            >
                              <CheckRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack direction="row" alignItems="flex-start" gap={1}>
                        {/* Note content — click to edit */}
                        <Box
                          flex={1}
                          onClick={() => startEdit(note)}
                          sx={{ cursor: "pointer", minWidth: 0 }}
                        >
                          <Typography
                            sx={{
                              fontSize: 13.5,
                              color: "rgba(255,255,255,0.82)",
                              lineHeight: 1.65,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              mb: 0.75,
                            }}
                          >
                            {note.text}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontWeight: 500 }}>
                            {formatDate(note.createdAt)}
                          </Typography>
                        </Box>

                        {/* Delete */}
                        <Tooltip title="Excluir nota">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(note.id)}
                            sx={{
                              flexShrink: 0,
                              color: "rgba(255,255,255,0.18)",
                              mt: 0.25,
                              "&:hover": { color: "#ef4444", bgcolor: "rgba(239,68,68,0.08)" },
                            }}
                          >
                            <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Box>
                </Glass>
              );
            })}
          </Stack>
        )}
      </Container>
    </Page>
  );
}
