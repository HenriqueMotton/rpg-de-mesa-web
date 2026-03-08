import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingRoundedIcon from "@mui/icons-material/PendingRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import type { BugReport } from "../../modules/bug-reports/bug-reports.api";
import {
  deleteBugReport,
  getBugReports,
  updateBugReport,
} from "../../modules/bug-reports/bug-reports.api";

const STATUS_CONFIG = {
  open:        { label: "Aberto",       color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: <PendingRoundedIcon        sx={{ fontSize: 13 }} /> },
  in_progress: { label: "Em análise",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: <HourglassTopRoundedIcon   sx={{ fontSize: 13 }} /> },
  resolved:    { label: "Resolvido",    color: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: <CheckCircleRoundedIcon    sx={{ fontSize: 13 }} /> },
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function BugCard({ report, onUpdated, onDeleted }: {
  report: BugReport;
  onUpdated: (r: BugReport) => void;
  onDeleted: (id: number) => void;
}) {
  const cfg = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open;
  const [expanded, setExpanded] = useState(false);
  const [resolution, setResolution] = useState(report.resolution ?? "");
  const [saving, setSaving] = useState(false);

  async function setStatus(status: string) {
    setSaving(true);
    try {
      const updated = await updateBugReport(report.id, { status });
      onUpdated(updated);
    } finally { setSaving(false); }
  }

  async function saveResolution() {
    setSaving(true);
    try {
      const updated = await updateBugReport(report.id, { resolution: resolution.trim() || null });
      onUpdated(updated);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    await deleteBugReport(report.id);
    onDeleted(report.id);
  }

  return (
    <Box sx={{
      borderRadius: "12px",
      border: `1px solid ${cfg.color}28`,
      bgcolor: "rgba(255,255,255,0.02)",
      overflow: "hidden",
      transition: "border-color .15s",
      "&:hover": { borderColor: `${cfg.color}44` },
    }}>
      {/* Header row */}
      <Box
        onClick={() => setExpanded((p) => !p)}
        sx={{ px: 1.5, py: 1.1, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 1 }}
      >
        {/* Status chip */}
        <Box sx={{
          display: "inline-flex", alignItems: "center", gap: 0.5,
          px: 0.8, py: 0.3, borderRadius: "6px", flexShrink: 0, mt: 0.1,
          bgcolor: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.color}30`,
          fontSize: 11, fontWeight: 700,
        }}>
          {cfg.icon}
          {cfg.label}
        </Box>

        {/* Title + meta */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", lineHeight: 1.3 }}>
            {report.title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.3 }} flexWrap="wrap">
            {report.characterName && (
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                🧙 {report.characterName}
              </Typography>
            )}
            {report.page && (
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                📍 {report.page}
              </Typography>
            )}
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
              {formatDate(report.createdAt)}
            </Typography>
          </Stack>
        </Box>

        <Tooltip title="Excluir">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            sx={{ color: "rgba(255,255,255,0.2)", "&:hover": { color: "#ef4444" }, flexShrink: 0 }}
          >
            <DeleteRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Expanded content */}
      {expanded && (
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1.25 }} />

          <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, mb: 1.5, whiteSpace: "pre-wrap" }}>
            {report.description}
          </Typography>

          {/* Status buttons */}
          <Stack direction="row" spacing={0.75} sx={{ mb: 1.5 }}>
            {(["open", "in_progress", "resolved"] as const).map((s) => {
              const c = STATUS_CONFIG[s];
              const active = report.status === s;
              return (
                <Box
                  key={s}
                  component="button"
                  disabled={saving || active}
                  onClick={() => setStatus(s)}
                  sx={{
                    flex: 1, py: 0.55, border: "1px solid", borderRadius: "8px",
                    fontSize: 11, fontWeight: 800, cursor: active ? "default" : "pointer",
                    borderColor: active ? c.color : "rgba(255,255,255,0.08)",
                    bgcolor: active ? c.bg : "transparent",
                    color: active ? c.color : "rgba(255,255,255,0.35)",
                    transition: "all .12s",
                    "&:hover:not(:disabled)": { bgcolor: c.bg, borderColor: c.color, color: c.color },
                    "&:disabled": { opacity: active ? 1 : 0.5 },
                  }}
                >
                  {c.label}
                </Box>
              );
            })}
          </Stack>

          {/* Resolution note */}
          <TextField
            size="small"
            multiline
            minRows={2}
            placeholder="Nota de resolução (opcional)…"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            fullWidth
            sx={{
              mb: 0.75,
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.03)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                "&.Mui-focused fieldset": { borderColor: "rgba(34,197,94,0.4)" },
              },
              "& .MuiInputBase-input": { fontSize: 12.5, color: "rgba(255,255,255,0.65)" },
            }}
          />
          <Box
            component="button"
            disabled={saving}
            onClick={saveResolution}
            sx={{
              px: 1.5, py: 0.5, border: "none", borderRadius: "7px",
              bgcolor: "rgba(34,197,94,0.12)", color: "rgba(100,220,140,0.85)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              "&:hover:not(:disabled)": { bgcolor: "rgba(34,197,94,0.2)" },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            {saving ? "Salvando…" : "Salvar nota"}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── FILTER BAR ─────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { id: "all",        label: "Todos" },
  { id: "open",       label: "Abertos" },
  { id: "in_progress",label: "Em análise" },
  { id: "resolved",   label: "Resolvidos" },
] as const;

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function BugReportsPanel() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading]  = useState(true);
  const [filter,  setFilter]   = useState<string>("open");

  useEffect(() => {
    getBugReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  function handleUpdated(updated: BugReport) {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function handleDeleted(id: number) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  const visible = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  const counts = {
    all:        reports.length,
    open:       reports.filter((r) => r.status === "open").length,
    in_progress:reports.filter((r) => r.status === "in_progress").length,
    resolved:   reports.filter((r) => r.status === "resolved").length,
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} sx={{ color: "rgba(255,195,60,0.6)" }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter chips */}
      <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mb: 1.5 }}>
        {STATUS_FILTERS.map(({ id, label }) => {
          const active = filter === id;
          const count = counts[id as keyof typeof counts];
          const cfg = id !== "all" ? STATUS_CONFIG[id as keyof typeof STATUS_CONFIG] : null;
          return (
            <Chip
              key={id}
              label={`${label} (${count})`}
              size="small"
              onClick={() => setFilter(id)}
              sx={{
                fontSize: 12, fontWeight: active ? 800 : 600,
                bgcolor: active && cfg ? cfg.bg : active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                color: active && cfg ? cfg.color : active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
                border: "1px solid",
                borderColor: active && cfg ? `${cfg.color}44` : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          );
        })}
      </Stack>

      {visible.length === 0 ? (
        <Typography sx={{ textAlign: "center", py: 4, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
          {filter === "open" ? "Nenhum bug aberto 🎉" : "Nenhum item encontrado"}
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {visible.map((r) => (
            <BugCard key={r.id} report={r} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
