import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Box,
  Container,
} from "@mui/material";

import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

import { setToken as setTokenLocal } from "../../shared/auth/token";
import { useAppStore } from "../../app/store";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../app/routes";
import { login } from "../../shared/http/api";

import { LoginWrapper, OrbTop, OrbBottom, Noise, GlassCard } from "./Login.styles";

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokenStore = useAppStore((s) => s.setToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0 && !loading,
    [email, password, loading]
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError("Email e senha são obrigatórios."); return; }
    setLoading(true);
    try {
      const data = await login({ email, password });
      setTokenLocal(data.access_token);
      setTokenStore(data.access_token);
      navigate(ROUTES.mesa);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Credenciais inválidas ou erro no servidor.");
    } finally {
      setLoading(false);
    }
  }

  const inputSx = {
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.3)",
      fontSize: 13.5,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "rgba(160,130,255,0.8)",
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.88)",
      fontSize: 14,
      "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(120,85,255,0.55)", borderWidth: 1.5 },
    },
    "& .MuiInputAdornment-root svg": { color: "rgba(255,255,255,0.22)", fontSize: 18 },
  };

  return (
    <LoginWrapper>
      <OrbTop />
      <OrbBottom />
      <Noise />

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(160,130,255,0.6)",
              mb: 1.5,
            }}
          >
            RPG de Mesa
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              color: "rgba(255,255,255,0.93)",
              fontSize: { xs: "2rem", sm: "2.4rem" },
            }}
          >
            Bem-vindo
            <Box
              component="span"
              sx={{
                display: "block",
                background: "linear-gradient(90deg, rgba(140,105,255,1) 0%, rgba(100,160,255,1) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              de volta.
            </Box>
          </Typography>
        </Box>

        {/* Card */}
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

            <Box
              component="form"
              onSubmit={handleLogin}
              sx={{ display: "grid", gap: 1.8 }}
            >
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
                autoComplete="current-password"
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
                        {showPass
                          ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                          : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
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
                  letterSpacing: 0.2,
                  background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)",
                  boxShadow: "0 6px 24px rgba(100, 70, 230, 0.35)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: "linear-gradient(135deg, #8B64FF 0%, #6B9FFF 100%)",
                    boxShadow: "0 10px 32px rgba(100, 70, 230, 0.5)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": { transform: "translateY(0)" },
                  "&.Mui-disabled": {
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={16} sx={{ color: "rgba(255,255,255,0.6)" }} />
                ) : (
                  "Entrar"
                )}
              </Button>
            </Box>
          </CardContent>
        </GlassCard>

        {/* Rodapé */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography
            component="span"
            sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}
          >
            Não tem conta?{" "}
          </Typography>
          <Typography
            component="span"
            onClick={() => alert("Cadastro a gente cria já já 😄")}
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(160,130,255,0.75)",
              cursor: "pointer",
              transition: "color 0.15s",
              "&:hover": { color: "rgba(180,155,255,1)" },
            }}
          >
            Cadastre-se
          </Typography>
        </Box>

        {apiBase && (
          <Typography
            sx={{ mt: 3, textAlign: "center", opacity: 0.25, fontSize: 11, wordBreak: "break-word" }}
          >
            {apiBase}
          </Typography>
        )}
      </Container>
    </LoginWrapper>
  );
}