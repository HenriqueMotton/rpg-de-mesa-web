import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Container, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

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
import { getCharacter } from "../../modules/characters/characters.api";

export default function ClassePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCharacter(id)
      .then((c) => setCls((c as any).dndClass ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

      <Container maxWidth="sm" sx={{ pt: 2.5, px: 2, pb: 12 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 3.5 }}
        >
          <Box>
            <PageLabel>Personagem</PageLabel>
            <PageTitle>Classe</PageTitle>
          </Box>
          <BackButton
            onClick={() => navigate(`/personagens/${id}`)}
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "15px !important" }} />}
          >
            Voltar
          </BackButton>
        </Stack>

        <Glass elevation={0}>
          <Box sx={{ p: { xs: 2, sm: 2.25 } }}>
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                <CircularProgress size={28} thickness={2.5} sx={{ color: "rgba(140,90,255,0.7)" }} />
              </Box>
            ) : !cls ? (
              <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.35)", textAlign: "center", py: 6, fontStyle: "italic" }}>
                Este personagem não tem uma classe definida.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {/* Banner card */}
                <Box sx={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Box sx={{ background: cls.imgGradient, px: 2.25, pt: 2.25, pb: 2 }}>
                    <Typography sx={{ fontSize: 28, lineHeight: 1, mb: 0.75 }}>{cls.icon}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 20, color: "#fff", lineHeight: 1.2 }}>
                      {cls.name}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", mt: 0.4 }}>
                      {cls.tagline}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      px: 2.25,
                      py: 1.75,
                      bgcolor: "rgba(255,255,255,0.025)",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                      {cls.description}
                    </Typography>
                  </Box>
                </Box>

                {/* Features */}
                {cls.features?.length > 0 && (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.28)",
                        mb: 1,
                      }}
                    >
                      Habilidades da classe
                    </Typography>
                    <Stack spacing={0.75}>
                      {cls.features.map((f: any, i: number) => (
                        <Box
                          key={i}
                          sx={{
                            borderRadius: "12px",
                            px: 1.75,
                            py: 1.25,
                            bgcolor: "rgba(120,85,255,0.06)",
                            border: "1px solid rgba(120,85,255,0.14)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: 13.5,
                              color: "rgba(200,180,255,0.9)",
                              mb: 0.35,
                            }}
                          >
                            {f.name}
                          </Typography>
                          <Typography
                            sx={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.6 }}
                          >
                            {f.description}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}
          </Box>
        </Glass>
      </Container>
    </Page>
  );
}
