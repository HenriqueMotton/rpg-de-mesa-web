import { useEffect, useRef, useState } from "react";
import { Box, Collapse, IconButton, Stack, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { getActiveInitiative, type InitiativeEntry } from "../../modules/initiative/initiative.api";
import { useCharactersStore } from "../../modules/characters/characters.store";

const POLL_MS = 5000;

export default function InitiativeWidget() {
  const selected = useCharactersStore((s) => s.selected);
  const [entries, setEntries]           = useState<InitiativeEntry[]>([]);
  const [currentTurnIndex, setTurnIdx]  = useState(0);
  const [open, setOpen]                 = useState(false);
  const intervalRef                     = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    try {
      const session = await getActiveInitiative();
      if (session?.isActive && session.entries.length > 0) {
        setEntries(session.entries);
        setTurnIdx(session.currentTurnIndex ?? 0);
      } else {
        setEntries([]);
        setTurnIdx(0);
        setOpen(false);
      }
    } catch {
      // silent — don't disrupt the player if polling fails
    }
  }

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (entries.length === 0) return null;

  const myCharId = (selected as any)?.id;

  if (myCharId && !entries.some((e) => e.characterId != null && e.characterId === myCharId)) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 70,
        right: 16,
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 0.75,
      }}
    >
      {/* Expanded panel */}
      <Collapse in={open} unmountOnExit>
        <Box
          sx={{
            borderRadius: "18px",
            bgcolor: "rgba(10, 8, 20, 0.96)",
            border: "1px solid rgba(255,195,60,0.2)",
            boxShadow: "0 20px 56px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,195,60,0.06) inset",
            backdropFilter: "blur(20px)",
            minWidth: 200,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              px: 1.75, py: 1,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: 14 }}>⚔️</Typography>
            <Typography sx={{
              flex: 1, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "rgba(255,195,60,0.8)",
            }}>
              Ordem de Iniciativa
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: "rgba(255,255,255,0.3)", width: 24, height: 24, "&:hover": { color: "rgba(255,255,255,0.7)" } }}
            >
              <CloseRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>

          {/* Entries */}
          <Stack spacing={0} sx={{ py: 0.5 }}>
            {entries.map((entry, i) => {
              const isMe = entry.characterId != null && entry.characterId === myCharId;
              const isCurrent = i === currentTurnIndex;
              return (
                <Stack
                  key={`${entry.characterId ?? "m"}-${i}`}
                  direction="row"
                  alignItems="center"
                  sx={{
                    px: 1.75, py: 0.85,
                    gap: 1.25,
                    bgcolor: isCurrent
                      ? "rgba(255,195,60,0.1)"
                      : isMe ? "rgba(255,195,60,0.04)" : "transparent",
                    borderLeft: isCurrent
                      ? "2px solid rgba(255,195,60,0.7)"
                      : isMe ? "2px solid rgba(255,195,60,0.3)" : "2px solid transparent",
                    transition: "background .15s",
                  }}
                >
                  {/* Position badge */}
                  <Box sx={{
                    width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                    display: "grid", placeItems: "center",
                    bgcolor: isCurrent ? "rgba(255,195,60,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isCurrent ? "rgba(255,195,60,0.45)" : "rgba(255,255,255,0.08)"}`,
                  }}>
                    <Typography sx={{
                      fontSize: 10, fontWeight: 900,
                      color: isCurrent ? "rgba(255,230,100,1)" : "rgba(255,255,255,0.4)",
                    }}>
                      {isCurrent ? "▶" : i + 1}
                    </Typography>
                  </Box>

                  {/* Name */}
                  <Typography sx={{
                    flex: 1, fontSize: 13, fontWeight: (isMe || isCurrent) ? 800 : 600,
                    color: isCurrent
                      ? "rgba(255,240,160,0.98)"
                      : isMe ? "rgba(255,230,130,0.85)" : "rgba(255,255,255,0.72)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {entry.name}
                  </Typography>

                  {/* Initiative value */}
                  <Typography sx={{
                    fontSize: 12, fontWeight: 800,
                    color: isCurrent ? "rgba(255,220,100,0.85)" : "rgba(255,255,255,0.3)",
                    flexShrink: 0,
                  }}>
                    {entry.initiative}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Collapse>

      {/* Floating button */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex", alignItems: "center", gap: 1,
          px: 1.5, py: 0.9,
          borderRadius: "14px",
          bgcolor: "rgba(10, 8, 20, 0.94)",
          border: "1px solid rgba(255,195,60,0.3)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 0 12px rgba(255,195,60,0.08)",
          backdropFilter: "blur(16px)",
          cursor: "pointer",
          transition: "border-color .15s, box-shadow .15s",
          "&:hover": {
            borderColor: "rgba(255,195,60,0.55)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.65), 0 0 18px rgba(255,195,60,0.14)",
          },
          // Pulse dot
          position: "relative",
        }}
      >
        <Typography sx={{ fontSize: 15, lineHeight: 1 }}>⚔️</Typography>
        <Stack>
          <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,195,60,0.65)", lineHeight: 1 }}>
            Vez de
          </Typography>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>
            {entries[currentTurnIndex]?.name}
          </Typography>
        </Stack>
        {/* Live indicator */}
        <Box sx={{
          position: "absolute", top: 6, right: 6,
          width: 6, height: 6, borderRadius: "50%",
          bgcolor: "rgba(255,195,60,0.8)",
          boxShadow: "0 0 6px rgba(255,195,60,0.6)",
          animation: "pulse 2s ease-in-out infinite",
          "@keyframes pulse": {
            "0%, 100%": { opacity: 0.6, transform: "scale(1)" },
            "50%":       { opacity: 1,   transform: "scale(1.3)" },
          },
        }} />
      </Box>
    </Box>
  );
}
