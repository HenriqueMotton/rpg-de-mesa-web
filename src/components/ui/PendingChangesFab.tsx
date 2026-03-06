import ReactDOM from "react-dom";
import { Box, CircularProgress, Stack, Tooltip } from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import {
  FabPill,
  FabDiscardButton,
  FabDot,
  FabCenterLabel,
  FabSaveButton,
} from "../../pages/personagens/ViewCharacter.styles";

interface Props {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export default function PendingChangesFab({ visible, saving, onSave, onDiscard }: Props) {
  return ReactDOM.createPortal(
    <Box
      sx={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        zIndex: 1300,
        pointerEvents: visible ? "auto" : "none",
        transform: visible
          ? "translateX(-50%) translateY(0) scale(1)"
          : "translateX(-50%) translateY(80px) scale(0.92)",
        opacity: visible ? 1 : 0,
        transition: "transform .38s cubic-bezier(.34,1.48,.64,1), opacity .22s",
      }}
    >
      <FabPill direction="row" alignItems="stretch">
        <Tooltip title="Descartar alterações" placement="top" arrow>
          <span>
            <FabDiscardButton onClick={onDiscard} disabled={saving}>
              <UndoRoundedIcon sx={{ fontSize: 17 }} />
            </FabDiscardButton>
          </span>
        </Tooltip>

        <Box sx={{ display: "flex", alignItems: "center", px: 1.8 }}>
          <Stack alignItems="center">
            <FabDot />
            <FabCenterLabel>alterações pendentes</FabCenterLabel>
          </Stack>
        </Box>

        <FabSaveButton
          onClick={onSave}
          disabled={saving}
          startIcon={
            saving
              ? <CircularProgress size={13} sx={{ color: "rgba(200,180,255,0.7)" }} />
              : <SaveRoundedIcon sx={{ fontSize: "15px !important" }} />
          }
        >
          Salvar
        </FabSaveButton>
      </FabPill>
    </Box>,
    document.body,
  );
}
