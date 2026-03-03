import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Box,
} from "@mui/material";

import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { createUser } from "../../shared/http/api";

import { SignUpWrapper, OrbTop, OrbBottom, Noise, GlassCard } from "./SignUp.styles";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      !loading,
    [name, email, password, loading]
  );

  const inputSx = {
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.3)", fontSize: 13.5 },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgba(160,130,255,0.8)" },
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.88)",
      fontSize: 14,
      "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&.Mui-focused fieldset": {
        borderColor: "rgba(120,85,255,0.55)",
        borderWidth: 1.5,
      },
    },
    "& .MuiInputAdornment-root svg": {
      color: "rgba(255,255,255,0.22)",
      fontSize: 18,
    },
  };

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      await createUser({ name, email, password });
      setSuccess("Cadastro realizado com sucesso! Faça login para continuar.");
      // opcional: volta automático pro login
      setTimeout(() => navigate(ROUTES.login), 900);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SignUpWrapper>
      <OrbTop />
      <OrbBottom />
      <Noise />

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={() => navigate(ROUTES.login)}
            size="small"
            sx={{
              color: "rgba(255,255,255,0.45)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              "&:hover": { color: "rgba(255,255,255,0.75)" },
            }}
          >
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>

          <Box>
            <Typography sx={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: "rgba(160,130,255,0.6)" }}>
              CRIAR CONTA
            </Typography>
            <Typography sx={{ mt: 0.4, fontSize: 13, opacity: 0.7 }}>
              Cadastre-se para acessar a mesa
            </Typography>
          </Box>
        </Box>

        <GlassCard elevation={0}>
          <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  borderRadius: "10px",
                  py: 0.5,
                  backgroundColor: "rgba(220,60,60,0.09)",
                  border: "1px solid rgba(220,60,60,0.18)",
                  color: "rgba(255,150,150,0.9)",
                  fontSize: 13,
                  "& .MuiAlert-icon": { color: "rgba(255,110,110,0.7)", fontSize: 18 },
                }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 2.5,
                  borderRadius: "10px",
                  py: 0.5,
                  backgroundColor: "rgba(50,200,120,0.10)",
                  border: "1px solid rgba(50,200,120,0.18)",
                  color: "rgba(180,255,220,0.9)",
                  fontSize: 13,
                  "& .MuiAlert-icon": { color: "rgba(120,255,180,0.7)", fontSize: 18 },
                }}
              >
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSignUp} sx={{ display: "grid", gap: 1.8 }}>
              <TextField
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRoundedIcon />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRoundedIcon />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              <TextField
                label="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRoundedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass((v) => !v)}
                        edge="end"
                        size="small"
                        sx={{ color: "rgba(255,255,255,0.22)", "&:hover": { color: "rgba(255,255,255,0.5)" } }}
                      >
                        {showPass ? (
                          <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!canSubmit}
                sx={{
                  mt: 0.8,
                  py: 1.35,
                  fontWeight: 700,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontSize: 14.5,
                  background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)",
                  boxShadow: "0 6px 24px rgba(100, 70, 230, 0.35)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: "linear-gradient(135deg, #8B64FF 0%, #6B9FFF 100%)",
                    boxShadow: "0 10px 32px rgba(100, 70, 230, 0.5)",
                    transform: "translateY(-1px)",
                  },
                  "&.Mui-disabled": {
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={16} sx={{ color: "rgba(255,255,255,0.6)" }} />
                ) : (
                  "Cadastrar"
                )}
              </Button>

              <Button
                type="button"
                variant="text"
                onClick={() => navigate(ROUTES.login)}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  opacity: 0.85,
                }}
              >
                Voltar
              </Button>
            </Box>
          </CardContent>
        </GlassCard>
      </Container>
    </SignUpWrapper>
  );
}