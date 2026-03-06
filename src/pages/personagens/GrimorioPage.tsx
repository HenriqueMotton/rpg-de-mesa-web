import { useEffect, useState } from "react";
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
import GrimorioSection from "./GrimorioSection";
import { getCharacter } from "../../modules/characters/characters.api";
import type { ClassSpellEntry } from "../../modules/classes/classes.api";

export default function GrimorioPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classSpells, setClassSpells]     = useState<ClassSpellEntry[]>([]);
  const [characterNivel, setCharacterNivel] = useState(1);

  useEffect(() => {
    if (!id) return;
    getCharacter(id).then((c) => {
      setCharacterNivel((c as any).nivel ?? 1);
      setClassSpells((c as any).dndClass?.classSpells ?? []);
    }).catch(() => {});
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
            <PageTitle>Grimório</PageTitle>
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
            {id && (
              <GrimorioSection
                characterId={id}
                classSpells={classSpells}
                characterNivel={characterNivel}
              />
            )}
          </Box>
        </Glass>
      </Container>
    </Page>
  );
}
