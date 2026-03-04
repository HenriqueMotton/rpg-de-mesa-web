import { styled } from "@mui/material/styles";
import { Box, Card } from "@mui/material";

export const Page = styled(Box)(() => ({
  minHeight: "100vh",
  background: "#07090F",
}));

export const Glow = styled(Box)(() => ({
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background: `
    radial-gradient(900px circle at 10% 10%, rgba(108,75,230,0.22), transparent 60%),
    radial-gradient(900px circle at 90% 30%, rgba(60,100,220,0.16), transparent 62%),
    radial-gradient(900px circle at 50% 110%, rgba(140,105,255,0.10), transparent 60%)
  `,
}));

export const Glass = styled(Card)(() => ({
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
}));