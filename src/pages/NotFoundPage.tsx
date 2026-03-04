import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../app/routes";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Página não encontrada
      </Typography>
      <Button variant="contained" onClick={() => navigate(ROUTES.personagens)}>
        Voltar pra Mesa
      </Button>
    </Box>
  );
}