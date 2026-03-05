import * as React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  type DialogProps,
} from "@mui/material";

type AppDialogProps = {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  dividers?: boolean;
  dialogProps?: Omit<DialogProps, "open" | "onClose">;
};

const dialogPaperSx = {
  borderRadius: "18px",
  background: "rgba(12, 15, 23, 0.97)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
  m: 2,
};

const dialogTitleSx = {
  fontWeight: 800,
  fontSize: 16,
  pt: 2.5,
  pb: 1,
  color: "rgba(255,255,255,0.95)",
};

export default function AppDialog({
  open,
  title,
  onClose,
  actions,
  children,
  dividers,
  dialogProps,
}: AppDialogProps) {
  return (
    <Dialog
      open={open}
      fullWidth={true}
      onClose={onClose}
      PaperProps={{ sx: dialogPaperSx }}
      {...dialogProps}
    >
      {title ? <DialogTitle sx={dialogTitleSx}>{title}</DialogTitle> : null}

      <DialogContent
        dividers={dividers}
        sx={{
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {children}
      </DialogContent>

      {actions ? <DialogActions sx={{ p: 2, gap: 1 }}>{actions}</DialogActions> : null}
    </Dialog>
  );
}

/** Helpers prontos (opcional) */
export function AppDialogCancelButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      sx={{
        textTransform: "none",
        fontWeight: 700,
        fontSize: 13.5,
        borderRadius: "9px",
        color: "rgba(255,255,255,0.5)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
        ...(props.sx || {}),
      }}
    />
  );
}

export function AppDialogConfirmButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="contained"
      {...props}
      sx={{
        textTransform: "none",
        fontWeight: 700,
        fontSize: 13.5,
        borderRadius: "9px",
        px: 2.5,
        background: "linear-gradient(135deg, #7B54FF 0%, #5B8FFF 100%)",
        boxShadow: "0 4px 16px rgba(100,70,230,0.3)",
        "&:hover": { boxShadow: "0 6px 22px rgba(100,70,230,0.5)" },
        ...(props.sx || {}),
      }}
    />
  );
}