import {
  Box,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { calcularFaixas, getEstagioInfo } from '../../modules/sanidade/sanidade.utils';
import type { SanidadePersonagem } from '../../modules/sanidade/sanidade.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

const ESTAGIO_GLOW: Record<number, string> = {
  1: 'rgba(76,175,80,0.35)',
  2: 'rgba(255,193,7,0.35)',
  3: 'rgba(255,152,0,0.35)',
  4: 'rgba(244,67,54,0.4)',
  5: 'rgba(26,26,46,0.9)',
};

const ESTAGIO_TRACK: Record<number, string> = {
  1: 'rgba(76,175,80,0.08)',
  2: 'rgba(255,193,7,0.08)',
  3: 'rgba(255,152,0,0.08)',
  4: 'rgba(244,67,54,0.09)',
  5: 'rgba(26,26,46,0.3)',
};

const ESTAGIO_BORDER: Record<number, string> = {
  1: 'rgba(76,175,80,0.28)',
  2: 'rgba(255,193,7,0.3)',
  3: 'rgba(255,152,0,0.32)',
  4: 'rgba(244,67,54,0.35)',
  5: 'rgba(100,80,180,0.4)',
};

const ESTAGIO_FILL: Record<number, string> = {
  1: 'linear-gradient(90deg,#2e7d32,#4CAF50)',
  2: 'linear-gradient(90deg,#f57f17,#FFC107)',
  3: 'linear-gradient(90deg,#e65100,#FF9800)',
  4: 'linear-gradient(90deg,#b71c1c,#F44336)',
  5: 'linear-gradient(90deg,#0d0d1a,#1a1a2e)',
};

// ─── componente ──────────────────────────────────────────────────────────────

type Props = {
  sanidade: SanidadePersonagem;
};

export default function SanidadeBar({ sanidade }: Props) {
  const { hpPsiquicoTotal, danoAcumulado, estagioAtual } = sanidade;
  const hpAtual = Math.max(0, hpPsiquicoTotal - danoAcumulado);
  const pct = hpPsiquicoTotal > 0 ? Math.max(0, hpAtual / hpPsiquicoTotal) : 0;

  const estagio = getEstagioInfo(estagioAtual);
  const faixas = calcularFaixas(hpPsiquicoTotal);

  const faixaMarks = [faixas.e1, faixas.e2, faixas.e3].map(
    (v) => ((hpPsiquicoTotal - v) / hpPsiquicoTotal) * 100,
  );

  const isEco = estagioAtual === 5;

  return (
    <Box>
      {/* ── Cabeçalho ── */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
        <Box sx={{
          width: 22, height: 22, borderRadius: '7px', flexShrink: 0,
          bgcolor: `${estagio.corUI}22`,
          border: `1px solid ${estagio.corUI}55`,
          display: 'grid', placeItems: 'center', fontSize: 12,
        }}>
          🌀
        </Box>
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', flex: 1,
        }}>
          HP Psíquico
        </Typography>
        {isEco && (
          <Tooltip title="Personagem dissolvido — fim de arco">
            <WarningAmberRoundedIcon sx={{ fontSize: 15, color: 'rgba(255,100,100,0.8)' }} />
          </Tooltip>
        )}
      </Stack>

      {/* ── Barra principal ── */}
      <Box sx={{
        position: 'relative', borderRadius: '14px', overflow: 'hidden',
        border: `1px solid ${ESTAGIO_BORDER[estagioAtual]}`,
        bgcolor: ESTAGIO_TRACK[estagioAtual],
      }}>
        <Box sx={{
          height: 44,
          width: `${Math.round(pct * 100)}%`,
          background: ESTAGIO_FILL[estagioAtual],
          transition: 'width .5s cubic-bezier(.4,0,.2,1)',
          boxShadow: `4px 0 18px ${ESTAGIO_GLOW[estagioAtual]}`,
        }} />

        {faixaMarks.map((markPct, i) => (
          <Box key={i} sx={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${markPct}%`,
            width: 1,
            bgcolor: 'rgba(255,255,255,0.12)',
            pointerEvents: 'none',
          }} />
        ))}

        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', px: 1.5,
          pointerEvents: 'none',
        }}>
          <Typography sx={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.92)', lineHeight: 1 }}>
            {hpAtual}
            <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, ml: 0.5, opacity: 0.55 }}>
              / {hpPsiquicoTotal} PSI
            </Typography>
          </Typography>

          <Box sx={{
            px: 1.1, py: 0.3, borderRadius: '8px',
            bgcolor: 'rgba(0,0,0,0.32)', border: `1px solid ${ESTAGIO_BORDER[estagioAtual]}`,
          }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', color: estagio.corUI }}>
              E{estagioAtual} · {estagio.nome}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
