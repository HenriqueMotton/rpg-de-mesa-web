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
import { Glass, Noise, OrbSide, OrbTop, Page, PageLabel, PageTitle } from "./personagens/ViewCharacter.styles";
import InitiativeManager from "./personagens/InitiativeManager";
import RestManager from "./personagens/RestManager";
import MasterGrimoire from "./personagens/MasterGrimoire";
import NpcGenerator from "./personagens/NpcGenerator";
import PriceTable from "./personagens/PriceTable";
import BugReportsPanel from "./personagens/BugReportsPanel";

type Section = "initiative" | "rest" | "grimoire" | "npc" | "prices" | "bugs";

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
    id: "bugs",
    label: "Bug Reports",
    icon: <BugReportRoundedIcon sx={{ fontSize: 18 }} />,
  },
];

function SectionContent({ section }: { section: Section }) {
  if (section === "initiative") return <InitiativeManager isMaster />;
  if (section === "rest")       return <RestManager />;
  if (section === "grimoire")   return <MasterGrimoire />;
  if (section === "npc")        return <NpcGenerator />;
  if (section === "prices")     return <PriceTable isMaster />;
  if (section === "bugs")       return <BugReportsPanel />;
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
