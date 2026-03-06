import { useParams, useNavigate } from "react-router-dom";
import { Box, Container, Stack } from "@mui/material";
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
import InventorySection from "./InventorySection";

export default function InventoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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
            <PageTitle>Inventário</PageTitle>
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
            {id && <InventorySection characterId={id} />}
          </Box>
        </Glass>
      </Container>
    </Page>
  );
}
