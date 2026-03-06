import { Box, Container, Stack, Typography } from "@mui/material";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import { BackButton, Glass, Noise, OrbSide, OrbTop, Page, PageLabel, PageTitle } from "./personagens/ViewCharacter.styles";

export default function ConfigPage() {
  const navigate = useNavigate();

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

      <Container maxWidth="sm" sx={{ pt: 2.5, px: 2, pb: 12 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3.5 }}>
          <Box>
            <PageLabel>Área restrita</PageLabel>
            <PageTitle>Configurações</PageTitle>
          </Box>
          <BackButton
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "15px !important" }} />}
          >
            Voltar
          </BackButton>
        </Stack>

        <Glass elevation={0}>
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: "10px",
                  display: "grid", placeItems: "center",
                  bgcolor: "rgba(120,85,255,0.12)",
                  border: "1px solid rgba(120,85,255,0.22)",
                }}
              >
                <SettingsRoundedIcon sx={{ fontSize: 18, color: "rgba(160,130,255,0.8)" }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: "rgba(255,255,255,0.88)" }}>
                  Painel do Mestre
                </Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  Configurações da sessão e da campanha
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                mt: 2, px: 2, py: 3,
                borderRadius: "14px",
                border: "1px dashed rgba(255,255,255,0.08)",
                bgcolor: "rgba(255,255,255,0.02)",
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                Em breve: gerenciamento de sessão, NPCs e lojas.
              </Typography>
            </Box>
          </Box>
        </Glass>
      </Container>
    </Page>
  );
}
