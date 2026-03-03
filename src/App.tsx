import { useMemo, useState } from "react";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Container,
  CssBaseline,
  Paper,
  Toolbar,
  Typography,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import CasinoIcon from "@mui/icons-material/Casino";
import BookIcon from "@mui/icons-material/Book";
import SettingsIcon from "@mui/icons-material/Settings";

function Screen({ title }: { title: string }) {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ opacity: 0.85 }}>
        Conteúdo aqui.
      </Typography>
    </Box>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "dark",
          background: { default: "#0f1115", paper: "#151823" },
        },
        shape: { borderRadius: 16 },
        typography: {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        },
      }),
    []
  );

  const title =
    tab === 0 ? "Mesa" : tab === 1 ? "Personagens" : tab === 2 ? "Rolagens" : tab === 3 ? "Anotações" : "Config";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", pb: 8 }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              RPG de Mesa
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="sm">
          <Screen title={title} />
        </Container>

        <Paper
          elevation={8}
          sx={{ position: "fixed", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          <BottomNavigation value={tab} onChange={(_, v) => setTab(v)} showLabels>
            <BottomNavigationAction label="Mesa" icon={<GroupsIcon />} />
            <BottomNavigationAction label="Personagens" icon={<GroupsIcon />} />
            <BottomNavigationAction label="Rolagens" icon={<CasinoIcon />} />
            <BottomNavigationAction label="Notas" icon={<BookIcon />} />
            <BottomNavigationAction label="Config" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}