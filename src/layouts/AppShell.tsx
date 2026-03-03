import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../app/routes";

import {
  AppBar,
  Box,
  Container,
  Paper,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";

import GroupsIcon from "@mui/icons-material/Groups";
import CasinoIcon from "@mui/icons-material/Casino";
import BookIcon from "@mui/icons-material/Book";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";

function routeToTab(pathname: string) {
  if (pathname.startsWith(ROUTES.personagens)) return 1;
  if (pathname.startsWith(ROUTES.rolagens)) return 2;
  if (pathname.startsWith(ROUTES.notas)) return 3;
  if (pathname.startsWith(ROUTES.config)) return 4;
  return 0; // mesa
}

function tabToRoute(tab: number) {
  switch (tab) {
    case 1:
      return ROUTES.personagens;
    case 2:
      return ROUTES.rolagens;
    case 3:
      return ROUTES.notas;
    case 4:
      return ROUTES.config;
    default:
      return ROUTES.mesa;
  }
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const tab = routeToTab(location.pathname);

  return (
    <Box sx={{ minHeight: "100vh", pb: 8 }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            RPG de Mesa
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm">
        <Outlet />
      </Container>

      <Paper
        elevation={8}
        sx={{ position: "fixed", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        <BottomNavigation
          value={tab}
          onChange={(_, v) => navigate(tabToRoute(v))}
          showLabels
        >
          <BottomNavigationAction label="Mesa" icon={<HomeIcon />} />
          <BottomNavigationAction label="Personagens" icon={<GroupsIcon />} />
          <BottomNavigationAction label="Rolagens" icon={<CasinoIcon />} />
          <BottomNavigationAction label="Notas" icon={<BookIcon />} />
          <BottomNavigationAction label="Config" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}