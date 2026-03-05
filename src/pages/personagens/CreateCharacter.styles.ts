import { styled, keyframes } from "@mui/material/styles";
import { Box, Card } from "@mui/material";

const pulse = keyframes`
  0%   { opacity: .55; transform: scale(1); }
  50%  { opacity: 1;   transform: scale(1.05); }
  100% { opacity: .55; transform: scale(1); }
`;

export const Page = styled(Box)(() => ({
  minHeight: "100%",
  color: "rgba(255,255,255,0.92)",
  position: "relative",
  overflow: "hidden",
  // Espaço suficiente para o conteúdo não ficar atrás do BottomNav (62px) + safe area
  paddingBottom: 80,
}));

export const OrbTop = styled(Box)(() => ({
  position: "absolute",
  width: 720,
  height: 720,
  borderRadius: "50%",
  top: "-360px",
  left: "50%",
  transform: "translateX(-50%)",
  background:
    "radial-gradient(circle, rgba(108,75,230,0.35) 0%, rgba(100,160,255,0.12) 35%, transparent 70%)",
  filter: "blur(6px)",
  animation: `${pulse} 9s ease-in-out infinite`,
  pointerEvents: "none",
  zIndex: 0,
}));

export const OrbSide = styled(Box)(() => ({
  position: "absolute",
  width: 520,
  height: 520,
  borderRadius: "50%",
  bottom: "-280px",
  right: "-240px",
  background:
    "radial-gradient(circle, rgba(60,100,220,0.20) 0%, transparent 70%)",
  filter: "blur(10px)",
  pointerEvents: "none",
  zIndex: 0,
}));

export const Noise = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.03,
  zIndex: 0,
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
}));

export const Glass = styled(Card)(() => ({
  borderRadius: 22,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(20px)",
  boxShadow:
    "0 0 0 1px rgba(108,75,230,0.10), 0 32px 80px rgba(0,0,0,0.62)",
}));