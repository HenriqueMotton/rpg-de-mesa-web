import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { saveExposicao } from '../../modules/exposicao/exposicao.api';
import {
  registrarExposicao,
  PONTOS_EXPOSICAO,
  TIPO_INFO,
  type ResultadoRegistroExposicao,
} from '../../modules/exposicao/exposicao.utils';
import type { ExposicaoAmbar, TipoExposicaoAmbar } from '../../modules/exposicao/exposicao.types';

// ─── Ordem de apresentação no dropdown ───────────────────────────────────────

const TIPOS_ORDENADOS: TipoExposicaoAmbar[] = [
  'toque_refinado',
  'toque_bruto',
  'uso_alquimico',
  'exposicao_prolongada',
  'eco_direcionado',
  'toque_saturado',
  'zona_instabilidade',
  'uso_reliquia',
  'custom',
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PersonagemMinimo = {
  id: number;
  name: string;
  exposicaoAmbar: ExposicaoAmbar;
  nivel?: number;
  attributes?: Record<string, number>;
  idAttribute?: Record<string, number>;
};

type Props = {
  personagem: PersonagemMinimo;
  sessaoAtual: number;
  isOpen: boolean;
  onClose: () => void;
  onRegistrar: (r: ResultadoRegistroExposicao) => void;
};

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '10px',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.09)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(255,195,60,0.45)', borderWidth: 1.5 },
  },
  '& .MuiInputBase-input': { color: 'rgba(255,255,255,0.82)', fontSize: 13 },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.3)' },
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ModalRegistrarExposicao({
  personagem,
  sessaoAtual,
  isOpen,
  onClose,
  onRegistrar,
}: Props) {
  const [tipo, setTipo] = useState<TipoExposicaoAmbar>('toque_bruto');
  const [descricao, setDescricao] = useState('');
  const [pontosCustom, setPontosCustom] = useState(0);
  const [saving, setSaving] = useState(false);

  const pontosEvento = tipo === 'custom' ? pontosCustom : PONTOS_EXPOSICAO[tipo];
  const totalApos = personagem.exposicaoAmbar.pontosAcumulados + pontosEvento;
  const pct = Math.round(
    Math.min(totalApos / personagem.exposicaoAmbar.limiarAtivacao, 1) * 100,
  );
  const vaiAtivar =
    !personagem.exposicaoAmbar.barraAtiva &&
    totalApos >= personagem.exposicaoAmbar.limiarAtivacao;

  async function handleConfirmar() {
    if (!descricao.trim()) return;
    setSaving(true);
    try {
      const resultado = registrarExposicao(
        personagem,
        tipo,
        descricao.trim(),
        tipo === 'custom' ? pontosCustom : undefined,
        sessaoAtual,
      );
      await saveExposicao(
        personagem.id,
        resultado.exposicaoAtualizada,
        resultado.sanidadeIniciada ?? undefined,
      );
      onRegistrar(resultado);
      setTipo('toque_bruto');
      setDescricao('');
      setPontosCustom(0);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(14,18,30,0.98)',
          border: '1px solid rgba(255,195,60,0.2)',
          borderRadius: '18px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          m: 2, maxWidth: 420, width: '100%',
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,210,100,0.95)', pb: 0.5 }}>
        🌿 Registrar Exposição — {personagem.name}
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5 }}>
        <Stack spacing={1.5}>

          {/* Tipo do evento */}
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', mb: 0.6 }}>
              Tipo de evento
            </Typography>
            <Select
              size="small"
              fullWidth
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoExposicaoAmbar)}
              sx={{ ...inputSx, '& .MuiSelect-select': { py: 1, fontSize: 13 } }}
              renderValue={(v) => (
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
                    {TIPO_INFO[v].nome}
                  </Typography>
                  {v !== 'custom' && (
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,195,60,0.85)' }}>
                      +{PONTOS_EXPOSICAO[v]} pts
                    </Typography>
                  )}
                </Stack>
              )}
            >
              {TIPOS_ORDENADOS.map((t) => (
                <MenuItem key={t} value={t}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%', gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{TIPO_INFO[t].nome}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{TIPO_INFO[t].descricao}</Typography>
                    </Box>
                    {t !== 'custom' && (
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,195,60,0.8)', flexShrink: 0 }}>
                        +{PONTOS_EXPOSICAO[t]}
                      </Typography>
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Pontos customizados */}
          {tipo === 'custom' && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', mb: 0.6 }}>
                Pontos
              </Typography>
              <TextField
                type="number"
                size="small"
                fullWidth
                value={pontosCustom}
                onChange={(e) => setPontosCustom(Math.max(0, parseInt(e.target.value, 10) || 0))}
                inputProps={{ min: 0 }}
                sx={inputSx}
              />
            </Box>
          )}

          {/* Descrição narrativa */}
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', mb: 0.6 }}>
              Descrição narrativa{' '}
              <Typography component="span" sx={{ color: 'rgba(255,100,100,0.6)', fontSize: 10 }}>*</Typography>
            </Typography>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              placeholder="O que aconteceu na sessão…"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              sx={inputSx}
            />
          </Box>

          {/* Preview */}
          <Box sx={{ px: 1.25, py: 1, borderRadius: '10px', bgcolor: 'rgba(255,195,60,0.06)', border: '1px solid rgba(255,195,60,0.15)' }}>
            <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', mb: 0.6 }}>
              Este evento adicionará{' '}
              <Typography component="span" sx={{ fontWeight: 900, color: 'rgba(255,215,80,0.9)' }}>
                +{pontosEvento} pontos
              </Typography>.
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ flex: 1, height: 6, borderRadius: '4px', bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <Box sx={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, rgba(180,120,30,0.9), rgba(255,195,60,0.9))',
                  transition: 'width .25s',
                  borderRadius: '4px',
                }} />
              </Box>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,215,80,0.75)', flexShrink: 0 }}>
                {totalApos} / {personagem.exposicaoAmbar.limiarAtivacao} ({pct}%)
              </Typography>
            </Stack>
          </Box>

          {/* Aviso de ativação */}
          {vaiAtivar && (
            <Stack
              direction="row" alignItems="flex-start" spacing={1}
              sx={{ px: 1.1, py: 0.85, borderRadius: '10px', bgcolor: 'rgba(255,195,60,0.1)', border: '1px solid rgba(255,195,60,0.3)' }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: 15, color: 'rgba(255,195,60,0.9)', mt: 0.1, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12, color: 'rgba(255,215,100,0.9)', fontWeight: 700 }}>
                Este evento ativará a seção Mental deste personagem.
              </Typography>
            </Stack>
          )}

          {/* Botões */}
          <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
            <Button
              fullWidth variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
            >
              Cancelar
            </Button>
            <Button
              fullWidth variant="outlined"
              onClick={handleConfirmar}
              disabled={saving || !descricao.trim()}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, borderColor: 'rgba(255,195,60,0.4)', bgcolor: 'rgba(255,195,60,0.1)', color: 'rgba(255,220,100,0.95)', '&:hover': { bgcolor: 'rgba(255,195,60,0.18)' }, '&:disabled': { opacity: 0.35 } }}
            >
              {saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : 'Registrar'}
            </Button>
          </Stack>

        </Stack>
      </DialogContent>
    </Dialog>
  );
}
