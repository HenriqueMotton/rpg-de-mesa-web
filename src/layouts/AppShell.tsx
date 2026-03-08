import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Badge,
  Box,
  Toolbar,
  Typography,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";

import { ROUTES } from "../app/routes";
import { useAuthStore } from "../modules/auth/auth.store";
import { useCharactersStore } from "../modules/characters/characters.store";
import { getSpells } from "../modules/spells/spells.api";
import { getClassProgression, expectedSpellCounts } from "../modules/spells/spell-progression.data";

const HEADER_H = 58;
const NAV_H = 62;

const NAV_INVENTARIO = "/inventario";
const NAV_CLASSE     = "/classe";
const NAV_GRIMORIO   = "/grimorio";

export default function AppShell() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const logout    = useAuthStore((s) => s.logout);
  const isMaster  = useAuthStore((s) => s.isMaster);
  const selected  = useCharactersStore((s) => s.selected);

  const path = location.pathname;

  // Detecta se está no contexto de um personagem específico
  const charMatch = path.match(/^\/personagens\/(\d+)/);
  const charId = charMatch?.[1];
  const isCharacterContext = !!charId;
  const isMasterContext = isMaster && !isCharacterContext;

  const spellDeficit     = useCharactersStore((s) => s.spellDeficit);
  const setSpellDeficit  = useCharactersStore((s) => s.setSpellDeficit);

  // Compute spell deficit whenever the active character changes, regardless of which tab is open
  useEffect(() => {
    if (!charId || !selected) { setSpellDeficit(false); return; }
    const className  = (selected as any)?.dndClass?.name ?? "";
    const nivel      = (selected as any)?.nivel ?? 1;
    const progression = getClassProgression(className);
    if (!progression) { setSpellDeficit(false); return; }
    let cancelled = false;
    getSpells(charId).then((spells) => {
      if (cancelled) return;
      const known       = spells.filter((s: any) => !s.isRacial && !s.isCustom);
      const ownedCant   = known.filter((s: any) => s.level === 0).length;
      const ownedLev    = known.filter((s: any) => s.level > 0).length;
      const expected    = expectedSpellCounts(progression, nivel);
      const cantDef     = Math.max(0, expected.cantrips - ownedCant);
      const levDef      = (progression.system === 'known' || progression.system === 'grimoire')
        ? Math.max(0, expected.leveled - ownedLev) : 0;
      setSpellDeficit(cantDef > 0 || levDef > 0);
    }).catch(() => { if (!cancelled) setSpellDeficit(false); });
    return () => { cancelled = true; };
  }, [charId, selected, setSpellDeficit]);

  const charName      = selected?.name ?? "Personagem";
  const charNameShort = charName.length > 9 ? charName.slice(0, 9) + "…" : charName;
  const hasSpells     = ((selected as any)?.dndClass?.classSpells?.length ?? 0) > 0;

  const NAV_ITEMS = [
    { label: charNameShort, value: `/personagens/${charId}`, icon: <PersonRoundedIcon /> },
    { label: "Inventário",  value: NAV_INVENTARIO,           icon: <Inventory2RoundedIcon /> },
    { label: "Classe",      value: NAV_CLASSE,               icon: <SchoolRoundedIcon /> },
    ...(hasSpells ? [{
      label: "Grimório",
      value: NAV_GRIMORIO,
      icon: (
        <Badge
          variant="dot"
          invisible={!spellDeficit}
          sx={{
            "& .MuiBadge-dot": {
              width: 8, height: 8,
              bgcolor: "#f0c020",
              boxShadow: "0 0 6px rgba(240,192,32,0.8)",
              top: 2, right: 2,
            },
          }}
        >
          <AutoStoriesRoundedIcon />
        </Badge>
      ),
    }] : []),
    ...(isMaster ? [{ label: "Config",   value: ROUTES.config, icon: <SettingsRoundedIcon /> }] : []),
  ];

  const navValue = (() => {
    if (path.includes("/inventario")) return NAV_INVENTARIO;
    if (path.includes("/classe"))     return NAV_CLASSE;
    if (path.includes("/grimorio"))   return NAV_GRIMORIO;
    for (const item of NAV_ITEMS) {
      if (item.value && path.startsWith(item.value)) return item.value;
    }
    return `/personagens/${charId}`;
  })();

  function handleNavChange(_: unknown, value: string) {
    if (value === NAV_INVENTARIO) {
      if (charId) navigate(`/personagens/${charId}/inventario`);
    } else if (value === NAV_CLASSE) {
      if (charId) navigate(`/personagens/${charId}/classe`);
    } else if (value === NAV_GRIMORIO) {
      if (charId) navigate(`/personagens/${charId}/grimorio`);
    } else {
      navigate(value);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#07090F" }}>

      {/* ── Header ── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: HEADER_H,
          justifyContent: "center",
          bgcolor: "rgba(7, 9, 15, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
          // Linha roxa sutil na base do header
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "40%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(120,85,255,0.55), transparent)",
          },
        }}
      >
        <Toolbar sx={{ minHeight: HEADER_H, px: 2, gap: 1.5 }}>
          {/* Logo mark */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "9px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background:
                "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)",
              boxShadow: "0 4px 16px rgba(100,70,230,0.4)",
            }}
          >
            <CasinoRoundedIcon sx={{ fontSize: 16, color: "#fff" }} />
          </Box>

          {/* Title */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: -0.4,
                color: "rgba(255,255,255,0.93)",
                lineHeight: 1,
              }}
              noWrap
            >
              RPG de Mesa
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                letterSpacing: 0.2,
                color: "rgba(255,255,255,0.32)",
                mt: 0.35,
                lineHeight: 1,
              }}
              noWrap
            >
              Local • sua rede
            </Typography>
          </Box>

          {/* Voltar para lista de personagens (só no contexto de personagem) */}
          {isCharacterContext && (
            <IconButton
              onClick={() => navigate(ROUTES.personagens)}
              size="small"
              sx={{
                width: 34,
                height: 34,
                color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "9px",
                bgcolor: "rgba(255,255,255,0.03)",
                transition: "all 0.18s",
                "&:hover": {
                  color: "rgba(160,130,255,0.9)",
                  bgcolor: "rgba(120,85,255,0.1)",
                  borderColor: "rgba(120,85,255,0.22)",
                },
              }}
            >
              <GroupRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}

          {/* Logout */}
          <IconButton
            onClick={() => { logout(); navigate(ROUTES.login); }}
            size="small"
            sx={{
              width: 34,
              height: 34,
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "9px",
              bgcolor: "rgba(255,255,255,0.03)",
              transition: "all 0.18s",
              "&:hover": {
                color: "rgba(255,100,100,0.8)",
                bgcolor: "rgba(255,60,60,0.08)",
                borderColor: "rgba(255,60,60,0.18)",
              },
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ── Content ── */}
      <Box sx={{ pt: `${HEADER_H}px`, pb: (isCharacterContext || isMasterContext) ? `${NAV_H + 8}px` : 0 }}>
        <Outlet />
      </Box>

      {/* ── Bottom Nav (só no contexto de personagem) ── */}
      {isCharacterContext && <Paper
        elevation={0}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          pb: "env(safe-area-inset-bottom)",
          bgcolor: "rgba(7, 9, 15, 0.82)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.055)",
          // Mesma linha decorativa no topo do nav
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "40%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(120,85,255,0.45), transparent)",
          },
        }}
      >
        <BottomNavigation
          showLabels
          value={navValue}
          onChange={handleNavChange}
          sx={{
            height: NAV_H,
            bgcolor: "transparent",

            // Item padrão
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              px: 0.5,
              gap: 0.4,
              color: "rgba(255,255,255,0.28)",
              transition: "color 0.18s",
              "& .MuiBottomNavigationAction-label": {
                fontSize: "10.5px",
                fontWeight: 600,
                letterSpacing: 0.1,
                opacity: 1,
              },
            },

            // Item ativo
            "& .MuiBottomNavigationAction-root.Mui-selected": {
              color: "rgba(255,255,255,0.92)",
              "& svg": {
                filter: "drop-shadow(0 0 6px rgba(130,100,255,0.7))",
              },
              "& .MuiBottomNavigationAction-label": {
                fontWeight: 700,
              },
            },
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = navValue === item.value;
            return (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                value={item.value}
                icon={
                  <Box
                    sx={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 28,
                      borderRadius: "8px",
                      transition: "background 0.18s",
                      bgcolor: active
                        ? "rgba(120,85,255,0.15)"
                        : "transparent",
                      // Pill indicator
                      "&::before": active
                        ? {
                            content: '""',
                            position: "absolute",
                            top: -1,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 20,
                            height: 2,
                            borderRadius: "0 0 4px 4px",
                            background:
                              "linear-gradient(90deg, #7B54FF, #5B8FFF)",
                          }
                        : {},
                    }}
                  >
                    {item.icon}
                  </Box>
                }
              />
            );
          })}
        </BottomNavigation>
      </Paper>}

      {/* ── Master Bottom Nav (fora do contexto de personagem) ── */}
      {isMasterContext && (
        <Paper
          elevation={0}
          sx={{
            position: "fixed", left: 0, right: 0, bottom: 0,
            pb: "env(safe-area-inset-bottom)",
            bgcolor: "rgba(7, 9, 15, 0.82)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.055)",
            "&::before": {
              content: '""', position: "absolute", top: 0, left: "50%",
              transform: "translateX(-50%)", width: "40%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(220,80,60,0.4), transparent)",
            },
          }}
        >
          <BottomNavigation
            showLabels
            value={path}
            onChange={(_, val) => navigate(val)}
            sx={{
              height: NAV_H, bgcolor: "transparent",
              "& .MuiBottomNavigationAction-root": {
                minWidth: 0, px: 0.5, gap: 0.4,
                color: "rgba(255,255,255,0.28)", transition: "color 0.18s",
                "& .MuiBottomNavigationAction-label": { fontSize: "10.5px", fontWeight: 600, letterSpacing: 0.1, opacity: 1 },
              },
              "& .MuiBottomNavigationAction-root.Mui-selected": {
                color: "rgba(255,255,255,0.92)",
                "& svg": { filter: "drop-shadow(0 0 6px rgba(220,80,60,0.6))" },
                "& .MuiBottomNavigationAction-label": { fontWeight: 700 },
              },
            }}
          >
            {[
              { label: "Inimigos", value: ROUTES.inimigos, icon: <LocalFireDepartmentRoundedIcon /> },
              { label: "Config",   value: ROUTES.config,   icon: <SettingsRoundedIcon /> },
            ].map((item) => {
              const active = path === item.value || path.startsWith(item.value + "/");
              return (
                <BottomNavigationAction
                  key={item.value}
                  label={item.label}
                  value={item.value}
                  icon={
                    <Box sx={{
                      position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                      width: 36, height: 28, borderRadius: "8px", transition: "background 0.18s",
                      bgcolor: active ? "rgba(220,80,60,0.15)" : "transparent",
                      "&::before": active ? {
                        content: '""', position: "absolute", top: -1, left: "50%",
                        transform: "translateX(-50%)", width: 20, height: 2,
                        borderRadius: "0 0 4px 4px",
                        background: "linear-gradient(90deg, #DC5040, #FF8060)",
                      } : {},
                    }}>
                      {item.icon}
                    </Box>
                  }
                />
              );
            })}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}