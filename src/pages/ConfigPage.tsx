import { useState } from "react";
import {
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SportsMartialArtsRoundedIcon from "@mui/icons-material/SportsMartialArtsRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import { Glass, Noise, OrbSide, OrbTop, Page, PageLabel, PageTitle } from "./personagens/ViewCharacter.styles";
import InitiativeManager from "./personagens/InitiativeManager";
import RestManager from "./personagens/RestManager";
import MasterGrimoire from "./personagens/MasterGrimoire";
import NpcGenerator from "./personagens/NpcGenerator";
import PriceTable from "./personagens/PriceTable";
import BugReportsPanel from "./personagens/BugReportsPanel";
import MasterCharacterPanel from "./personagens/MasterCharacterPanel";
import PsychologyMasterPanel from "./personagens/PsychologyMasterPanel";
import CustomNpcPanel from "./personagens/CustomNpcPanel";

type Section = "initiative" | "rest" | "grimoire" | "npc" | "prices" | "bugs" | "characters" | "psychology";

const MENU_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "initiative",
    label: "Iniciativa",
    icon: <SportsMartialArtsRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: "rest",
    label: "Descanso",
    icon: <HotelRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: "grimoire",
    label: "Grimório",
    icon: <AutoStoriesRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: "npc",
    label: "Gerador de NPC",
    icon: <PeopleAltRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: "prices",
    label: "Tabela de preços",
    icon: <LocalOfferRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: "characters",
    label: "Fichas dos Jogadores",
    icon: <AssignmentIndRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: "psychology",
    label: "Psicologia",
    icon: <PsychologyRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    id: "bugs",
    label: "Bug Reports",
    icon: <BugReportRoundedIcon sx={{ fontSize: 18 }} />,
  },
];

function NpcSection() {
  const [tab, setTab] = useState<"generator" | "roster">("generator");
  return (
    <Box>
      <Stack direction="row" spacing={0.75} sx={{ mb: 2 }}>
        {[
          { id: "generator" as const, label: "🎲 Gerador" },
          { id: "roster" as const, label: "📋 Cadastrados" },
        ].map(({ id, label }) => {
          const active = tab === id;
          return (
            <Box
              key={id}
              component="button"
              onClick={() => setTab(id)}
              sx={{
                px: 1.75, py: 0.6, border: "1px solid", borderRadius: "9px",
                fontSize: 12.5, fontWeight: active ? 800 : 600, cursor: "pointer",
                bgcolor: active ? "rgba(120,85,255,0.15)" : "rgba(255,255,255,0.04)",
                color: active ? "rgba(190,165,255,0.95)" : "rgba(255,255,255,0.45)",
                borderColor: active ? "rgba(120,85,255,0.4)" : "rgba(255,255,255,0.09)",
                transition: "all .12s",
                "&:hover:not(:disabled)": { bgcolor: active ? "rgba(120,85,255,0.22)" : "rgba(255,255,255,0.08)" },
              }}
            >
              {label}
            </Box>
          );
        })}
      </Stack>
      {tab === "generator" ? <NpcGenerator /> : <CustomNpcPanel />}
    </Box>
  );
}

function SectionContent({ section }: { section: Section }) {
  if (section === "initiative")  return <InitiativeManager isMaster />;
  if (section === "rest")        return <RestManager />;
  if (section === "grimoire")    return <MasterGrimoire />;
  if (section === "npc")         return <NpcSection />;
  if (section === "prices")      return <PriceTable isMaster />;
  if (section === "bugs")        return <BugReportsPanel />;
  if (section === "characters")  return <MasterCharacterPanel />;
  if (section === "psychology")  return <PsychologyMasterPanel />;
  return null;
}

export default function ConfigPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("initiative");

  const activeItem = MENU_ITEMS.find((m) => m.id === activeSection)!;

  return (
    <Page>
      <OrbTop />
      <OrbSide />
      <Noise />

      {/* Sidebar drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 230,
            bgcolor: "rgba(10, 8, 20, 0.97)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            pt: 2,
          },
        }}
      >
        <Typography sx={{
          px: 2, pb: 1.5,
          fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
        }}>
          Painel do Mestre
        </Typography>

        <List disablePadding>
          {MENU_ITEMS.map((item) => {
            const active = item.id === activeSection;
            return (
              <ListItemButton
                key={item.id}
                selected={active}
                onClick={() => { setActiveSection(item.id); setDrawerOpen(false); }}
                sx={{
                  mx: 1, mb: 0.5,
                  borderRadius: "12px",
                  "&.Mui-selected": {
                    bgcolor: "rgba(255,195,60,0.1)",
                    "&:hover": { bgcolor: "rgba(255,195,60,0.14)" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 34,
                  color: active ? "rgba(255,215,100,0.85)" : "rgba(255,255,255,0.35)",
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 13.5,
                    fontWeight: active ? 800 : 600,
                    color: active ? "rgba(255,230,130,0.95)" : "rgba(255,255,255,0.65)",
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Container maxWidth="sm" sx={{ pt: 2.5, px: 2, pb: 12 }}>
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" sx={{ mb: 3.5, gap: 1.5 }}>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              mt: 0.25,
              color: "rgba(255,255,255,0.55)",
              bgcolor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              width: 38, height: 38,
              flexShrink: 0,
              "&:hover": { bgcolor: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.85)" },
            }}
          >
            <MenuRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box>
            <PageLabel>Área restrita</PageLabel>
            <PageTitle>Configurações</PageTitle>
          </Box>
        </Stack>

        {/* Active section panel */}
        <Glass elevation={0} sx={{ mb: 2 }}>
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: "9px",
                display: "grid", placeItems: "center",
                bgcolor: "rgba(255,195,60,0.1)",
                border: "1px solid rgba(255,195,60,0.2)",
                color: "rgba(255,215,100,0.75)",
              }}>
                {activeItem.icon}
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: "rgba(255,255,255,0.88)" }}>
                {activeItem.label}
              </Typography>
            </Stack>

            <SectionContent section={activeSection} />
          </Box>
        </Glass>
      </Container>
    </Page>
  );
}
