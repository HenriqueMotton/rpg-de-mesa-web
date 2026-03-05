import { styled, keyframes } from "@mui/material/styles";
import { Box, Card, Typography, Button, LinearProgress, Stack, IconButton } from "@mui/material";

// ─── Animations ───────────────────────────────────────────────────────────────

const pulse = keyframes`
  0%   { opacity: .55; transform: scale(1); }
  50%  { opacity: 1;   transform: scale(1.05); }
  100% { opacity: .55; transform: scale(1); }
`;

// ─── Page background ──────────────────────────────────────────────────────────

export const Page = styled(Box)(() => ({
  minHeight: "100%",
  color: "rgba(255,255,255,0.92)",
  position: "relative",
  overflow: "hidden",
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

// ─── Header ───────────────────────────────────────────────────────────────────

export const PageLabel = styled(Typography)(() => ({
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(160,130,255,0.5)",
  marginBottom: 4,
}));

export const PageTitle = styled(Typography)(() => ({
  fontSize: 26,
  fontWeight: 900,
  letterSpacing: "-0.03em",
  color: "rgba(255,255,255,0.93)",
  lineHeight: 1.1,
}));

export const BackButton = styled(Button)(() => ({
  marginTop: 4,
  flexShrink: 0,
  textTransform: "none",
  fontWeight: 700,
  fontSize: 12.5,
  color: "rgba(255,255,255,0.3)",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.07)",
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 6,
  paddingBottom: 6,
  backgroundColor: "rgba(255,255,255,0.03)",
  "&:hover": {
    color: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
}));

export const LoadingBar = styled(LinearProgress)(() => ({
  marginTop: 8,
  borderRadius: 2,
  height: 2,
  backgroundColor: "rgba(255,255,255,0.05)",
  "& .MuiLinearProgress-bar": {
    background: "linear-gradient(90deg,#7B54FF,#5B8FFF)",
  },
}));

// ─── SectionLabel parts ───────────────────────────────────────────────────────

export const SectionIconBox = styled(Box)(() => ({
  width: 28,
  height: 28,
  borderRadius: 8,
  display: "grid",
  placeItems: "center",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: 14,
}));

export const SectionLabelText = styled(Typography)(() => ({
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
}));

export const SectionDivider = styled(Box)(() => ({
  flex: 1,
  height: 1,
  backgroundColor: "rgba(255,255,255,0.06)",
}));

// ─── HP bar ───────────────────────────────────────────────────────────────────

export const HpBarOverlay = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingLeft: 16,
  paddingRight: 16,
  pointerEvents: "none",
}));

export const HpValueText = styled(Typography)(() => ({
  fontSize: 17,
  fontWeight: 900,
  color: "rgba(255,255,255,0.92)",
}));

export const HpValueSub = styled(Typography)(() => ({
  fontSize: 13,
  fontWeight: 600,
  opacity: 0.55,
})) as typeof Typography;

// ─── Gold pill ────────────────────────────────────────────────────────────────

export const GoldPill = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 10,
  paddingBottom: 10,
  borderRadius: 14,
  backgroundColor: "rgba(255,195,70,0.07)",
  border: "1px solid rgba(255,195,70,0.16)",
}));

export const GoldIconBox = styled(Box)(() => ({
  width: 36,
  height: 36,
  borderRadius: 11,
  display: "grid",
  placeItems: "center",
  backgroundColor: "rgba(255,195,70,0.12)",
  border: "1px solid rgba(255,195,70,0.22)",
  flexShrink: 0,
}));

export const GoldLabel = styled(Typography)(() => ({
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,195,70,0.5)",
}));

export const GoldAmount = styled(Typography)(() => ({
  fontSize: 16,
  fontWeight: 900,
  color: "rgba(255,220,130,0.95)",
  lineHeight: 1.2,
}));

// ─── Attribute card ───────────────────────────────────────────────────────────

export const AttrGrid = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
}));

export const AttrHint = styled(Typography)(() => ({
  fontSize: 11,
  color: "rgba(255,255,255,0.22)",
  marginBottom: 10,
  letterSpacing: "0.02em",
}));

export const AttrProgressTrack = styled(Box)(() => ({
  height: 3,
  borderRadius: 99,
  backgroundColor: "rgba(0,0,0,0.22)",
  marginBottom: 9,
  overflow: "hidden",
}));

export const AttrRangeLabel = styled(Typography)(() => ({
  fontSize: 10,
  color: "rgba(255,255,255,0.2)",
  userSelect: "none",
  letterSpacing: "0.04em",
}));

// ─── Skill row ────────────────────────────────────────────────────────────────

export const SkillRow = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 9,
  paddingBottom: 9,
  borderRadius: 13,
  border: "1px solid rgba(255,255,255,0.06)",
  backgroundColor: "rgba(255,255,255,0.025)",
  transition: "all .15s",
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
}));

export const SkillIconBox = styled(Box)(() => ({
  width: 34,
  height: 34,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  backgroundColor: "rgba(120,85,255,0.1)",
  border: "1px solid rgba(120,85,255,0.18)",
  fontSize: 16,
  flexShrink: 0,
}));

export const SkillEmptyBox = styled(Box)(() => ({
  paddingTop: 32,
  paddingBottom: 32,
  borderRadius: 14,
  border: "1px dashed rgba(255,255,255,0.08)",
  backgroundColor: "rgba(255,255,255,0.02)",
  display: "grid",
  placeItems: "center",
}));

// ─── FAB ──────────────────────────────────────────────────────────────────────

export const FabPill = styled(Stack)(() => ({
  borderRadius: 18,
  backgroundColor: "rgba(12,9,22,0.94)",
  border: "1px solid rgba(130,90,255,0.25)",
  boxShadow:
    "0 20px 56px rgba(0,0,0,0.65), 0 0 0 1px rgba(130,90,255,0.08) inset",
  backdropFilter: "blur(20px)",
  overflow: "hidden",
}));

export const FabDiscardButton = styled(IconButton)(() => ({
  borderRadius: 0,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 11,
  paddingBottom: 11,
  color: "rgba(255,255,255,0.38)",
  borderRight: "1px solid rgba(255,255,255,0.06)",
  transition: "background-color .15s, color .15s",
  "&:hover": {
    backgroundColor: "rgba(255,80,80,0.08)",
    color: "rgba(255,140,140,0.8)",
  },
  "&.Mui-disabled": { opacity: 0.25 },
}));

export const FabDot = styled(Box)(() => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: "rgba(160,120,255,0.7)",
  boxShadow: "0 0 8px rgba(150,100,255,0.7)",
  marginBottom: 3,
}));

export const FabCenterLabel = styled(Typography)(() => ({
  fontSize: 10,
  fontWeight: 700,
  color: "rgba(255,255,255,0.25)",
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
  userSelect: "none",
}));

export const FabSaveButton = styled(Button)(() => ({
  borderRadius: 0,
  borderLeft: "1px solid rgba(130,90,255,0.18)",
  textTransform: "none",
  fontWeight: 900,
  fontSize: 13,
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 11,
  paddingBottom: 11,
  color: "rgba(210,190,255,0.95)",
  background:
    "linear-gradient(135deg, rgba(95,60,210,0.4) 0%, rgba(75,105,255,0.3) 100%)",
  transition: "background .18s",
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(110,72,230,0.55) 0%, rgba(88,122,255,0.45) 100%)",
  },
  "&.Mui-disabled": { opacity: 0.35 },
}));