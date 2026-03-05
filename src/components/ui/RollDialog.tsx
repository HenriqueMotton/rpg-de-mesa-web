import * as React from "react";
import { TextField, Typography } from "@mui/material";
import AppDialog, { AppDialogCancelButton, AppDialogConfirmButton } from "./AppDialog";

type RollDialogProps = {
  open: boolean;
  title: string;
  helperText: string;
  label?: string;

  value: string;
  onChange: (v: string) => void;

  onClose: () => void;
  onConfirm: () => void;

  inputSx?: any; // seu sx do TextField
};

export default function RollDialog({
  open,
  title,
  helperText,
  label = "Resultado",
  value,
  onChange,
  onClose,
  onConfirm,
  inputSx,
}: RollDialogProps) {
  return (
    <AppDialog
      open={open}
      title={title}
      onClose={onClose}
      actions={
        <>
          <AppDialogCancelButton onClick={onClose}>Cancelar</AppDialogCancelButton>
          <AppDialogConfirmButton onClick={onConfirm}>Confirmar</AppDialogConfirmButton>
        </>
      }
    >
      <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", mb: 1.5 }}>
        {helperText}
      </Typography>

      <TextField
        autoFocus
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        fullWidth
        sx={inputSx}
      />
    </AppDialog>
  );
}