import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { getCharacterTraumas, type Trauma, type TraumaSeverity } from "../../modules/psychology/psychology.api";

const SEV = {
  mild:     { label: "Leve",     color: "rgba(245,158,11,0.9)",  bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)", icon: "😟" },
  moderate: { label: "Moderado", color: "rgba(249,115,22,0.9)",  bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)", icon: "😰" },
  severe:   { label: "Grave",    color: "rgba(239,68,68,0.95)",  bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.28)",  icon: "😨" },
} as const;

export default function TraumaSection({ characterId }: { characterId: number | string }) {
  const [traumas, setTraumas] = useState<Trauma[]>([]);

  useEffect(() => {
    getCharacterTraumas(characterId).then(setTraumas).catch(() => {});
  }, [characterId]);

  const active = traumas.filter((t) => t.isActive);
  if (active.length === 0) return null;

  return (
    <Box>
      {/* Section header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
        <Box sx={{
          width: 22, height: 22, borderRadius: "7px", flexShrink: 0,
          bgcolor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
          display: "grid", placeItems: "center",
          fontSize: 12,
        }}>
          🧠
        </Box>
        <Typography sx={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "rgba(255,100,100,0.7)",
        }}>
          Estado Psicológico
        </Typography>
        <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(239,68,68,0.15)" }} />
      </Stack>

      <Stack spacing={0.75}>
        {active.map((t) => {
          const sev = SEV[t.severity as TraumaSeverity] ?? SEV.mild;
          return (
            <Box key={t.id} sx={{
              px: 1.4, py: 1,
              borderRadius: "12px",
              border: `1px solid ${sev.border}`,
              bgcolor: sev.bg,
            }}>
              <Stack direction="row" alignItems="flex-start" gap={1}>
                <Typography sx={{ fontSize: 17, lineHeight: 1, flexShrink: 0, mt: 0.1 }}>
                  {sev.icon}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap={0.65} flexWrap="wrap">
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.88)", lineHeight: 1.2 }}>
                      {t.title}
                    </Typography>
                    <Box sx={{
                      px: 0.65, py: 0.1, borderRadius: "5px",
                      bgcolor: sev.bg, border: `1px solid ${sev.border}`,
                    }}>
                      <Typography sx={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: sev.color }}>
                        {sev.label}
                      </Typography>
                    </Box>
                  </Stack>
                  {t.description && (
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)", mt: 0.35, lineHeight: 1.5 }}>
                      {t.description}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
