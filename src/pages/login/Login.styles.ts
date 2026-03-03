import { styled, keyframes } from "@mui/material/styles";
import { Box, Card } from "@mui/material";

const pulse = keyframes`
  0%   { opacity: 0.6; transform: scale(1); }
  50%  { opacity: 1;   transform: scale(1.06); }
  100% { opacity: 0.6; transform: scale(1); }
`;

export const LoginWrapper = styled(Box)(() => ({
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 16,
  position: "relative",
  overflow: "hidden",
  background: "#07090F",
}));

export const OrbTop = styled(Box)(() => ({
  position: "absolute",
  width: 600,
  height: 600,
  borderRadius: "50%",
  top: "-260px",
  left: "50%",
  transform: "translateX(-50%)",
  background:
    "radial-gradient(circle, rgba(108, 75, 230, 0.28) 0%, transparent 68%)",
  filter: "blur(4px)",
  animation: `${pulse} 8s ease-in-out infinite`,
  pointerEvents: "none",
}));

export const OrbBottom = styled(Box)(() => ({
  position: "absolute",
  width: 400,
  height: 400,
  borderRadius: "50%",
  bottom: "-180px",
  right: "-80px",
  background:
    "radial-gradient(circle, rgba(60, 100, 220, 0.15) 0%, transparent 70%)",
  filter: "blur(6px)",
  pointerEvents: "none",
}));

export const Noise = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.028,
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
}));

export const GlassCard = styled(Card)(() => ({
  borderRadius: 20,
  backgroundColor: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(24px)",
  boxShadow:
    "0 0 0 1px rgba(108,75,230,0.1), 0 32px 80px rgba(0,0,0,0.7)",
}));