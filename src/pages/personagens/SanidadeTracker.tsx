import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import PsychologyAltRoundedIcon from '@mui/icons-material/PsychologyAltRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

import { listAllCharacters } from '../../modules/characters/characters.api';
import { saveSanidade } from '../../modules/sanidade/sanidade.api';
import { getSettings, updateSettings } from '../../modules/settings/settings.api';
import {
  ESTAGIOS,
  GATILHOS_EMOCIONAIS,
  MODIFICADORES_PADRAO,
  RITUAIS,
  VETORES_DANO,
  aplicarAncoraTemporalSeNecessario,
  aplicarCuraEmocional,
  aplicarDano,
  aplicarRitual,
  calcularCDRitual,
  calcularEstagio,
  calcularHPPsiquico,
  getEstagioInfo,
  iniciarNovaSessao,
  normalizarSanidade,
  verificarGatilhoDisponivel,
  CATEGORIA_COR,
} from '../../modules/sanidade/sanidade.utils';
import type { SanidadePersonagem, EventoSanidade } from '../../modules/sanidade/sanidade.types';
import { saveExposicao } from '../../modules/exposicao/exposicao.api';
import type { ExposicaoAmbar } from '../../modules/exposicao/exposicao.types';
import {
  ativarBarraManualmente,
  getEstadoMental,
  exposicaoDefault,
  type ResultadoRegistroExposicao,
} from '../../modules/exposicao/exposicao.utils';
import ModalRegistrarExposicao from './ModalRegistrarExposicao';

// ─── tipos locais ─────────────────────────────────────────────────────────────

type CharSummary = {
  id: number;
  name: string;
  nivel?: number;
  dndClass?: { name: string; icon: string } | null;
  race?: { name: string } | null;
  idAttribute?: Record<string, number>;
  attributes?: Record<string, number>;
  sanidade?: SanidadePersonagem | null;
  exposicaoAmbar?: ExposicaoAmbar | null;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const ESTAGIO_COLOR: Record<number, string> = {
  1: '#4CAF50', 2: '#FFC107', 3: '#FF9800', 4: '#F44336', 5: '#7060cc',
};

function getAttrs(c: CharSummary) {
  return c.idAttribute ?? c.attributes ?? {};
}

// ─── subcomponentes ───────────────────────────────────────────────────────────

/** Barra compacta para o tracker do mestre */
function MiniSanidadeBar({ sanidade }: { sanidade: SanidadePersonagem }) {
  const { hpPsiquicoTotal, danoAcumulado, estagioAtual } = sanidade;
  const hpAtual = Math.max(0, hpPsiquicoTotal - danoAcumulado);
  const pct = hpPsiquicoTotal > 0 ? hpAtual / hpPsiquicoTotal : 0;
  const cor = ESTAGIO_COLOR[estagioAtual];
  const estagio = getEstagioInfo(estagioAtual);

  return (
    <Stack spacing={0.4}>
      <Box sx={{
        position: 'relative', borderRadius: '8px', overflow: 'hidden', height: 22,
        bgcolor: `${cor}12`, border: `1px solid ${cor}30`,
      }}>
        <Box sx={{
          position: 'absolute', inset: '0 auto 0 0',
          width: `${Math.round(pct * 100)}%`,
          bgcolor: cor, opacity: 0.35,
          transition: 'width .4s cubic-bezier(.4,0,.2,1)',
        }} />
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', px: 1,
        }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>
            {hpAtual}/{hpPsiquicoTotal}
            <Typography component="span" sx={{ fontSize: 9.5, opacity: 0.5, ml: 0.4 }}>PSI</Typography>
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: cor }}>
            E{estagioAtual} {estagio.nome}
          </Typography>
        </Box>
      </Box>
      {estagioAtual >= 3 && (
        <Typography sx={{
          fontSize: 10.5, color: `${cor}cc`, fontStyle: 'italic',
          px: 0.25,
        }}>
          ⚙️ {estagio.efeitoMecanico}
        </Typography>
      )}
    </Stack>
  );
}

// ─── modal de inicialização ───────────────────────────────────────────────────

type InitModalProps = {
  char: CharSummary;
  open: boolean;
  onClose: () => void;
  onSaved: (s: SanidadePersonagem) => void;
};

function InitModal({ char, open, onClose, onSaved }: InitModalProps) {
  const attrs = getAttrs(char);
  const sab = Number(attrs.sabedoria ?? 8);
  const con = Number(attrs.constituicao ?? 8);
  const nivel = char.nivel ?? 1;

  const [mods, setMods] = useState<string[]>([]);
  const [traumaMult, setTraumaMult] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const hpPreview = calcularHPPsiquico(sab, con, nivel, mods);

  function toggleMod(id: string) {
    setMods((prev) => {
      if (id === 'vinculo_ativo') {
        const count = prev.filter((x) => x === 'vinculo_ativo').length;
        if (count >= 3) return prev.filter((x) => x !== 'vinculo_ativo');
        return [...prev, 'vinculo_ativo'];
      }
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }

  async function handleSave() {
    setSaving(true);
    const sanidade: SanidadePersonagem = {
      hpPsiquicoTotal: hpPreview,
      danoAcumulado: 0,
      estagioAtual: 1,
      modificadores: mods,
      historicoEventos: [],
      traumaMultiplicador: traumaMult,
      temAncoraTemporalAtiva: false,
      rituaisConsecutivos: 0,
      gatilhosUsadosNaSessao: [],
      memoriaAncoraUsadaPorEstagio: {},
    };
    try {
      await saveSanidade(char.id, sanidade);
      onSaved(sanidade);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const TRAUMA_OPCOES: { valor: number; label: string; descricao: string }[] = [
    { valor: 1,    label: 'Nenhum',    descricao: 'Sem agravante emocional' },
    { valor: 1.25, label: 'Leve',      descricao: 'Perda recente, separação' },
    { valor: 1.5,  label: 'Moderado',  descricao: 'Morte próxima, traição' },
    { valor: 2.0,  label: 'Severo',    descricao: 'Atrocidade, ruptura moral profunda' },
  ];

  const grouped = MODIFICADORES_PADRAO.reduce<Record<string, typeof MODIFICADORES_PADRAO>>((acc, m) => {
    (acc[m.tipo] = acc[m.tipo] ?? []).push(m);
    return acc;
  }, {});

  const tipoLabel: Record<string, string> = {
    treinamento: 'Treinamento', vinculo: 'Vínculos',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(14,18,30,0.98)', border: '1px solid rgba(120,85,255,0.22)',
          borderRadius: '18px', backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          m: 2, maxWidth: 420, width: '100%', maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 14, fontWeight: 800, color: 'rgba(200,170,255,0.95)', pb: 0.5 }}>
        🌀 Inicializar Sanidade — {char.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 0.5 }}>
        {/* Preview */}
        <Box sx={{
          mb: 2, px: 1.5, py: 1, borderRadius: '12px',
          bgcolor: 'rgba(120,85,255,0.08)', border: '1px solid rgba(120,85,255,0.2)',
        }}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              SAB {sab} · CON {con} · Nv {nivel}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ fontSize: 22, fontWeight: 900, color: 'rgba(180,150,255,0.95)' }}>
              {hpPreview}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>HP PSI</Typography>
          </Stack>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', mt: 0.3 }}>
            (⌈(SAB+CON)/2⌉ × Nv × 2) + (Nv × 5) + modificadores — mín. {Math.max(30, nivel * 10)}
          </Typography>
        </Box>

        {/* Modificadores por grupo */}
        <Stack spacing={1.25}>
          {/* Traumas — multiplicador de dano emocional */}
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', mb: 0.25 }}>
              Traumas
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: 'rgba(255,255,255,0.22)', mb: 0.6, fontStyle: 'italic' }}>
              Aumenta o impacto de eventos emocionais — não reduz o HP inicial
            </Typography>
            <Stack spacing={0.4}>
              {TRAUMA_OPCOES.map((op) => {
                const active = traumaMult === op.valor;
                return (
                  <Box
                    key={op.valor}
                    onClick={() => setTraumaMult(op.valor)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1.1, py: 0.7, borderRadius: '10px', cursor: 'pointer',
                      bgcolor: active ? 'rgba(244,67,54,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all .12s',
                      '&:hover': { bgcolor: active ? undefined : 'rgba(255,255,255,0.05)' },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>
                        {op.label}
                      </Typography>
                      <Typography sx={{ fontSize: 10.5, color: 'rgba(255,255,255,0.28)' }}>
                        {op.descricao}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: active ? 'rgba(255,130,120,0.9)' : 'rgba(255,255,255,0.25)' }}>
                      ×{op.valor.toFixed(2).replace('.00', '')}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {Object.entries(grouped).map(([tipo, lista]) => (
            <Box key={tipo}>
              <Typography sx={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', mb: 0.6,
              }}>
                {tipoLabel[tipo] ?? tipo}
              </Typography>
              <Stack spacing={0.4}>
                {lista.map((m) => {
                  const count = mods.filter((x) => x === m.id).length;
                  const active = m.id === 'vinculo_ativo' ? count > 0 : mods.includes(m.id);
                  const isPos = m.valor > 0;
                  return (
                    <Box
                      key={m.id}
                      onClick={() => toggleMod(m.id)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        px: 1.1, py: 0.7, borderRadius: '10px', cursor: 'pointer',
                        bgcolor: active ? (isPos ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.08)') : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? (isPos ? 'rgba(76,175,80,0.35)' : 'rgba(244,67,54,0.3)') : 'rgba(255,255,255,0.06)'}`,
                        transition: 'all .12s',
                        '&:hover': { bgcolor: active ? undefined : 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      <Typography sx={{ fontSize: 12, flex: 1, color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>
                        {m.nome}
                      </Typography>
                      {m.id === 'vinculo_ativo' && count > 0 && (
                        <Typography sx={{ fontSize: 10.5, color: 'rgba(130,220,160,0.85)', fontWeight: 700 }}>
                          ×{count}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: isPos ? 'rgba(130,220,150,0.9)' : 'rgba(255,130,120,0.9)' }}>
                        {isPos ? '+' : ''}{m.valor}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
          <Button fullWidth variant="outlined" onClick={onClose}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
          >
            Cancelar
          </Button>
          <Button fullWidth variant="outlined" onClick={handleSave} disabled={saving}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, borderColor: 'rgba(120,85,255,0.4)', bgcolor: 'rgba(120,85,255,0.1)', color: 'rgba(190,165,255,0.95)', '&:hover': { bgcolor: 'rgba(120,85,255,0.18)' } }}
          >
            {saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : 'Inicializar'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// ─── modal de dano psíquico ───────────────────────────────────────────────────

type DamageModalProps = {
  char: CharSummary;
  open: boolean;
  onClose: () => void;
  onApplied: (s: SanidadePersonagem) => void;
  sessaoAtual: number;
};

function DamageModal({ char, open, onClose, onApplied, sessaoAtual }: DamageModalProps) {
  const [vetorId, setVetorId] = useState(VETORES_DANO[0].id);
  const [narrativa, setNarrativa] = useState('');
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [stageChange, setStageChange] = useState<string | null>(null);

  const vetor = VETORES_DANO.find((v) => v.id === vetorId)!;
  const sanidade = char.sanidade!;

  function maxDado(expr: string): number {
    const fixed = parseInt(expr, 10);
    if (!isNaN(fixed) && !expr.includes('d')) return fixed;
    const match = expr.match(/^(\d+)d(\d+)$/);
    if (!match) return 999;
    return parseInt(match[1], 10) * parseInt(match[2], 10);
  }

  const rollMax = maxDado(vetor.dadoDano);

  async function handleApply() {
    if (lastRoll === null) return;
    setSaving(true);
    const result = aplicarDano(sanidade.danoAcumulado, lastRoll, sanidade.hpPsiquicoTotal, vetor, sanidade.traumaMultiplicador ?? 1);
    const evento: EventoSanidade = {
      id: crypto.randomUUID(),
      sessao: sessaoAtual,
      vetorId,
      danoRolado: lastRoll,
      descricaoNarrativa: narrativa || vetor.descricao,
      timestamp: new Date().toISOString(),
    };
    const next: SanidadePersonagem = {
      ...sanidade,
      danoAcumulado: result.novoDano,
      estagioAtual: result.novoEstagio,
      historicoEventos: [evento, ...sanidade.historicoEventos],
    };
    try {
      await saveSanidade(char.id, next);
      onApplied(next);
      if (result.mudouEstagio) {
        setStageChange(`⚠️ Novo estágio: ${result.novoEstagio} — ${getEstagioInfo(result.novoEstagio).nome}`);
        setTimeout(() => setStageChange(null), 5000);
      }
      onClose();
      setLastRoll(null);
      setNarrativa('');
    } finally {
      setSaving(false);
    }
  }

  const inputSx = {
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
    '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(255,150,140,0.9)' },
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)',
      color: 'rgba(255,255,255,0.9)', fontSize: 13,
      '& fieldset': { borderColor: 'rgba(255,255,255,0.09)' },
      '&:hover fieldset': { borderColor: 'rgba(244,67,54,0.3)' },
      '&.Mui-focused fieldset': { borderColor: 'rgba(244,67,54,0.5)' },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(14,18,30,0.98)', border: '1px solid rgba(244,67,54,0.22)',
          borderRadius: '18px', backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          m: 2, maxWidth: 400, width: '100%', maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,160,140,0.95)', pb: 0.5 }}>
        <PsychologyAltRoundedIcon sx={{ fontSize: 16, mr: 0.75, verticalAlign: 'middle' }} />
        Dano Psíquico — {char.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 0.5 }}>
        {stageChange && (
          <Box sx={{ mb: 1.5, px: 1.25, py: 0.7, borderRadius: '10px', bgcolor: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,130,120,0.95)' }}>{stageChange}</Typography>
          </Box>
        )}

        {/* HP atual */}
        <Box sx={{ mb: 1.5, px: 1.25, py: 0.85, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <MiniSanidadeBar sanidade={sanidade} />
        </Box>

        {/* Seletor de vetor */}
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', mb: 0.6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Vetor de dano
        </Typography>
        <Select
          fullWidth
          size="small"
          value={vetorId}
          onChange={(e) => { setVetorId(e.target.value as string); setLastRoll(null); }}

          sx={{
            mb: 1.25, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.85)', fontSize: 13,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.09)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(244,67,54,0.3)' },
          }}
          MenuProps={{ PaperProps: { sx: { bgcolor: 'rgba(14,18,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', maxHeight: 300 } } }}
        >
          {VETORES_DANO.map((v) => (
            <MenuItem key={v.id} value={v.id} sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }, '&.Mui-selected': { bgcolor: 'rgba(244,67,54,0.1)' } }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: CATEGORIA_COR[v.categoria], minWidth: 36 }}>
                  {v.dadoDano}
                </Typography>
                <Typography sx={{ flex: 1, fontSize: 12.5 }}>{v.nome}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>

        {/* Info do vetor */}
        <Box sx={{ mb: 1.5, px: 1, py: 0.65, borderRadius: '9px', bgcolor: `${CATEGORIA_COR[vetor.categoria]}12`, border: `1px solid ${CATEGORIA_COR[vetor.categoria]}28` }}>
          <Typography sx={{ fontSize: 11, color: CATEGORIA_COR[vetor.categoria], fontWeight: 700, mb: 0.15 }}>
            {vetor.categoria.toUpperCase()} · {vetor.dadoDano}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{vetor.descricao}</Typography>
          {vetor.testeResistencia && (
            <Typography sx={{ fontSize: 11, color: 'rgba(255,215,100,0.75)', mt: 0.3 }}>
              Teste {vetor.testeResistencia.atributo} CD {vetor.testeResistencia.cd} — falha: {vetor.testeResistencia.efeitoFalha}
            </Typography>
          )}
        </Box>

        {/* Resultado da rolagem física */}
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
          <Box sx={{
            px: 1.25, py: 0.75, borderRadius: '10px', flexShrink: 0,
            bgcolor: `${CATEGORIA_COR[vetor.categoria]}10`,
            border: `1px solid ${CATEGORIA_COR[vetor.categoria]}30`,
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: CATEGORIA_COR[vetor.categoria], letterSpacing: '0.04em' }}>
              Role {vetor.dadoDano}
            </Typography>
          </Box>
          <TextField
            fullWidth size="small" type="number" label="Resultado da rolagem"
            value={lastRoll ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.min(parseInt(e.target.value, 10), rollMax);
              setLastRoll(v);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            inputProps={{ min: 1, max: rollMax }}
            sx={inputSx}
          />
        </Stack>

        {/* Narrativa */}
        <TextField
          fullWidth size="small" label="Descrição narrativa (opcional)"
          value={narrativa} onChange={(e) => setNarrativa(e.target.value)}
          multiline rows={2}
          sx={{ ...inputSx, mb: 2 }}
        />

        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" onClick={onClose}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
          >
            Cancelar
          </Button>
          <Button fullWidth variant="outlined" onClick={handleApply} disabled={lastRoll === null || saving}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, borderColor: 'rgba(244,67,54,0.5)', bgcolor: 'rgba(244,67,54,0.15)', color: 'rgba(255,200,190,1)', '&:hover': { bgcolor: 'rgba(244,67,54,0.24)' }, '&:disabled': { opacity: 0.4 } }}
          >
            {saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : 'Aplicar Dano'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// ─── modal de cura ────────────────────────────────────────────────────────────

type CureModalProps = {
  char: CharSummary;
  open: boolean;
  onClose: () => void;
  onApplied: (s: SanidadePersonagem) => void;
};

function CureModal({ char, open, onClose, onApplied }: CureModalProps) {
  const [tab, setTab] = useState(0);

  // ── Ancoragem Emocional ──
  const [selectedGatilho, setSelectedGatilho] = useState<string | null>(null);
  const [rollEmocional, setRollEmocional] = useState<number | null>(null);

  // ── Ritual Arcano ──
  const [ritualId, setRitualId] = useState(RITUAIS[0].id);
  const [arcanismoRoll, setArcanismoRoll] = useState<number | null>(null);
  const [aliadoSucesso, setAliadoSucesso] = useState(false);
  const [falhaCritica, setFalhaCritica] = useState(false);
  const [combinacaoBonus, setCombinacaoBonus] = useState(false);

  const [saving, setSaving] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ tipo: 'sucesso' | 'falha' | 'info'; texto: string } | null>(null);

  const sanidade = normalizarSanidade(char.sanidade!);
  const ritual = RITUAIS.find((r) => r.id === ritualId)!;
  const cdBase = calcularCDRitual(ritual, sanidade);
  const cdEfetivo = cdBase - (combinacaoBonus ? 2 : 0) - (ritual.nivel === 'avancado' && aliadoSucesso ? 2 : 0);
  const isAvancado = ritual.nivel === 'avancado';

  function maxDado(expr: string): number {
    const fixed = parseInt(expr, 10);
    if (!isNaN(fixed) && !expr.includes('d')) return fixed;
    const match = expr.match(/^(\d+)d(\d+)$/);
    if (!match) return 999;
    return parseInt(match[1], 10) * parseInt(match[2], 10);
  }

  function resetState() {
    setSelectedGatilho(null);
    setRollEmocional(null);
    setArcanismoRoll(null);
    setAliadoSucesso(false);
    setFalhaCritica(false);
    setCombinacaoBonus(false);
    setResultMsg(null);
  }

  async function handleApplyEmocional() {
    if (!selectedGatilho || rollEmocional === null) return;
    const gatilho = GATILHOS_EMOCIONAIS.find((g) => g.id === selectedGatilho)!;
    setSaving(true);

    const result = aplicarCuraEmocional(
      sanidade.danoAcumulado, sanidade.hpPsiquicoTotal, rollEmocional, sanidade.estagioAtual, gatilho,
    );

    let next: SanidadePersonagem = {
      ...sanidade,
      danoAcumulado: result.novoDano,
      estagioAtual: result.novoEstagio,
      gatilhosUsadosNaSessao: [...sanidade.gatilhosUsadosNaSessao, selectedGatilho],
    };

    if (gatilho.limiteporEstagio) {
      next = {
        ...next,
        memoriaAncoraUsadaPorEstagio: {
          ...sanidade.memoriaAncoraUsadaPorEstagio,
          [sanidade.estagioAtual]: true,
        },
      };
    }

    next = aplicarAncoraTemporalSeNecessario(next, next.hpPsiquicoTotal);

    try {
      await saveSanidade(char.id, next);
      onApplied(next);
      const texto = result.semEfeito
        ? '— Sem efeito neste estágio.'
        : result.estabilizouSemRegredir
          ? `Estabilizou no E${result.novoEstagio} — não regride, não avança.`
          : result.mudouEstagio
            ? `✓ Regrediu para E${result.novoEstagio} — ${getEstagioInfo(result.novoEstagio).nome}!`
            : `✓ Recuperou ${rollEmocional} PSI.`;
      setResultMsg({ tipo: result.semEfeito ? 'info' : 'sucesso', texto });
      setRollEmocional(null);
      setSelectedGatilho(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyRitual() {
    if (arcanismoRoll === null && !falhaCritica) return;
    setSaving(true);

    const sucesso = !falhaCritica && arcanismoRoll !== null && arcanismoRoll >= cdEfetivo;
    const result = aplicarRitual(
      sanidade.danoAcumulado, sanidade.hpPsiquicoTotal, sanidade.estagioAtual, ritual, sucesso, falhaCritica,
    );

    let next: SanidadePersonagem = {
      ...sanidade,
      danoAcumulado: result.novoDano,
      estagioAtual: result.novoEstagio,
      rituaisConsecutivos: sucesso ? 0 : sanidade.rituaisConsecutivos + 1,
    };

    if (result.estabilizadoAte) next = { ...next, estabilizadoAte: result.estabilizadoAte };
    next = aplicarAncoraTemporalSeNecessario(next, next.hpPsiquicoTotal);

    try {
      await saveSanidade(char.id, next);
      onApplied(next);
      let texto = result.mensagem;
      if (result.praticanteDanoPsiquico) texto += ` Praticante sofre ${result.praticanteDanoPsiquico} PSI de dano.`;
      setResultMsg({ tipo: sucesso ? 'sucesso' : 'falha', texto });
      setArcanismoRoll(null);
      setFalhaCritica(false);
    } finally {
      setSaving(false);
    }
  }

  const inputSx = {
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
    '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(76,175,80,0.9)' },
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)',
      color: 'rgba(255,255,255,0.9)', fontSize: 13,
      '& fieldset': { borderColor: 'rgba(255,255,255,0.09)' },
      '&:hover fieldset': { borderColor: 'rgba(76,175,80,0.3)' },
      '&.Mui-focused fieldset': { borderColor: 'rgba(76,175,80,0.5)' },
    },
  };

  const checkboxSx = (active: boolean, color: string) => ({
    width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
    bgcolor: active ? `${color}b3` : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
    display: 'grid', placeItems: 'center',
  });

  return (
    <Dialog
      open={open}
      onClose={() => { resetState(); onClose(); }}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(14,18,30,0.98)', border: '1px solid rgba(76,175,80,0.22)',
          borderRadius: '18px', backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          m: 2, maxWidth: 440, width: '100%', maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ fontSize: 14, fontWeight: 800, color: 'rgba(130,220,160,0.95)', pb: 0.5 }}>
        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16, mr: 0.75, verticalAlign: 'middle' }} />
        Aplicar Cura — {char.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {/* HP atual */}
        <Box sx={{ mb: 1.25, px: 1.25, py: 0.85, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <MiniSanidadeBar sanidade={sanidade} />
        </Box>

        {/* Resultado */}
        {resultMsg && (
          <Box sx={{
            mb: 1.25, px: 1.25, py: 0.75, borderRadius: '10px',
            bgcolor: resultMsg.tipo === 'sucesso' ? 'rgba(76,175,80,0.1)' : resultMsg.tipo === 'falha' ? 'rgba(244,67,54,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${resultMsg.tipo === 'sucesso' ? 'rgba(76,175,80,0.3)' : resultMsg.tipo === 'falha' ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            <Typography sx={{
              fontSize: 12, fontWeight: 700,
              color: resultMsg.tipo === 'sucesso' ? 'rgba(130,220,160,0.95)' : resultMsg.tipo === 'falha' ? 'rgba(255,130,120,0.95)' : 'rgba(255,255,255,0.45)',
            }}>
              {resultMsg.texto}
            </Typography>
          </Box>
        )}

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setResultMsg(null); }}
          sx={{
            mb: 1.5, minHeight: 34,
            '& .MuiTab-root': { minHeight: 34, fontSize: 11.5, fontWeight: 700, textTransform: 'none', color: 'rgba(255,255,255,0.38)', py: 0.5, px: 1.5 },
            '& .MuiTab-root.Mui-selected': { color: 'rgba(130,220,160,0.9)' },
            '& .MuiTabs-indicator': { bgcolor: 'rgba(76,175,80,0.7)', height: 2 },
          }}
        >
          <Tab label="Ancoragem Emocional" />
          <Tab label="Ritual Arcano" />
        </Tabs>

        {/* ── Tab Emocional ── */}
        {tab === 0 && (
          <Stack spacing={0.75}>
            {GATILHOS_EMOCIONAIS.map((g) => {
              const status = verificarGatilhoDisponivel(g.id, sanidade);
              const isSelected = selectedGatilho === g.id;
              const isDisponivel = status.disponivel;
              const estagioEstabiliza = g.estagiosEstabiliza.includes(sanidade.estagioAtual);

              return (
                <Box key={g.id}>
                  <Box
                    onClick={() => isDisponivel && setSelectedGatilho(isSelected ? null : g.id)}
                    sx={{
                      px: 1.25, py: 0.85, borderRadius: '10px',
                      cursor: isDisponivel ? 'pointer' : 'default',
                      bgcolor: isSelected ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? 'rgba(76,175,80,0.4)' : isDisponivel ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)'}`,
                      opacity: isDisponivel ? 1 : 0.45,
                      transition: 'all .12s',
                      '&:hover': isDisponivel ? { bgcolor: isSelected ? 'rgba(76,175,80,0.12)' : 'rgba(255,255,255,0.04)' } : {},
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: isDisponivel ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)' }}>
                            {g.nome}
                          </Typography>
                          <Chip
                            label={g.dado}
                            size="small"
                            sx={{
                              height: 18, fontSize: 10.5, fontWeight: 800,
                              bgcolor: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)',
                              color: 'rgba(130,220,160,0.85)', borderRadius: '5px',
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                          {estagioEstabiliza && isDisponivel && (
                            <Typography sx={{ fontSize: 10, color: 'rgba(255,193,7,0.75)', fontWeight: 600 }}>
                              estabiliza
                            </Typography>
                          )}
                          {!isDisponivel && (
                            <Typography sx={{ fontSize: 10, color: 'rgba(255,100,100,0.65)', fontWeight: 600 }}>
                              {status.motivo}
                            </Typography>
                          )}
                        </Stack>
                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, mt: 0.2 }}>
                          {g.descricao}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {isSelected && (
                    <Box sx={{ mt: 0.5, pl: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ px: 1, py: 0.6, borderRadius: '8px', bgcolor: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', flexShrink: 0 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'rgba(130,220,160,0.85)' }}>
                            Role {g.dado}
                          </Typography>
                        </Box>
                        <TextField
                          size="small" type="number" label="Resultado"
                          value={rollEmocional ?? ''}
                          onChange={(e) => {
                            const v = e.target.value === '' ? null : Math.min(parseInt(e.target.value, 10), maxDado(g.dado));
                            setRollEmocional(v);
                          }}
                          inputProps={{ min: 1, max: maxDado(g.dado) }}
                          sx={{ flex: 1, ...inputSx }}
                        />
                        <Button
                          variant="outlined" size="small"
                          onClick={handleApplyEmocional}
                          disabled={rollEmocional === null || saving}
                          sx={{
                            borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: 11.5,
                            borderColor: 'rgba(76,175,80,0.4)', bgcolor: 'rgba(76,175,80,0.08)',
                            color: 'rgba(130,220,150,0.95)', flexShrink: 0,
                            '&:hover': { bgcolor: 'rgba(76,175,80,0.16)' },
                            '&:disabled': { opacity: 0.35 },
                          }}
                        >
                          {saving ? <CircularProgress size={12} sx={{ color: 'inherit' }} /> : 'Aplicar'}
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Box>
              );
            })}

            {sanidade.estagioAtual >= 4 && (
              <Box sx={{ mt: 0.5, px: 1.25, py: 0.65, borderRadius: '9px', bgcolor: 'rgba(244,67,54,0.07)', border: '1px solid rgba(244,67,54,0.2)' }}>
                <Typography sx={{ fontSize: 11, color: 'rgba(255,130,120,0.75)' }}>
                  E{sanidade.estagioAtual} — Ancoragem emocional não reverte estágio. Só o Ritual Arcano pode ajudar.
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* ── Tab Ritual ── */}
        {tab === 1 && (
          <Stack spacing={1.25}>
            {/* Seletor de ritual */}
            <Select
              fullWidth size="small"
              value={ritualId}
              onChange={(e) => {
                setRitualId(e.target.value as string);
                setArcanismoRoll(null); setFalhaCritica(false); setResultMsg(null);
              }}
              sx={{
                borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.85)', fontSize: 13,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.09)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(76,175,80,0.3)' },
              }}
              MenuProps={{ PaperProps: { sx: { bgcolor: 'rgba(14,18,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' } } }}
            >
              {RITUAIS.map((r) => (
                <MenuItem key={r.id} value={r.id} sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', '&.Mui-selected': { bgcolor: 'rgba(76,175,80,0.1)' } }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{
                      px: 0.75, py: 0.1, borderRadius: '5px',
                      bgcolor: r.nivel === 'basico' ? 'rgba(76,175,80,0.12)' : 'rgba(120,85,255,0.12)',
                      border: `1px solid ${r.nivel === 'basico' ? 'rgba(76,175,80,0.3)' : 'rgba(120,85,255,0.3)'}`,
                    }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: r.nivel === 'basico' ? 'rgba(130,220,160,0.9)' : 'rgba(190,165,255,0.9)' }}>
                        {r.nivel === 'basico' ? 'Básico' : 'Avançado'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12.5 }}>{r.nome}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>

            {/* Requisitos */}
            <Box sx={{ px: 1, py: 0.75, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', mb: 0.5 }}>
                Requisitos · {ritual.duracaoHoras}h
              </Typography>
              <Stack spacing={0.2}>
                {ritual.requisitos.map((req, i) => (
                  <Typography key={i} sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>· {req}</Typography>
                ))}
              </Stack>
            </Box>

            {/* CD efetiva */}
            <Box sx={{ px: 1.25, py: 0.85, borderRadius: '10px', bgcolor: 'rgba(120,85,255,0.08)', border: '1px solid rgba(120,85,255,0.2)' }}>
              <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', mb: 0.15 }}>
                {ritual.teste.atributo} — CD efetiva
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.75}>
                <Typography sx={{ fontSize: 22, fontWeight: 900, color: 'rgba(190,165,255,0.95)' }}>
                  {cdEfetivo}
                </Typography>
                {(combinacaoBonus || (isAvancado && aliadoSucesso)) && (
                  <Typography sx={{ fontSize: 11, color: 'rgba(76,175,80,0.75)' }}>
                    (base {cdBase}{combinacaoBonus ? ' −2' : ''}{isAvancado && aliadoSucesso ? ' −2' : ''})
                  </Typography>
                )}
                {sanidade.rituaisConsecutivos > 0 && (
                  <Typography sx={{ fontSize: 11, color: 'rgba(255,152,0,0.75)' }}>
                    +{sanidade.rituaisConsecutivos * ritual.teste.cdIncrementoConsecutivo} consecutivos
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Checkbox: combinação emocional */}
            <Box
              onClick={() => setCombinacaoBonus((p) => !p)}
              sx={{
                px: 1.25, py: 0.75, borderRadius: '10px', cursor: 'pointer',
                bgcolor: combinacaoBonus ? 'rgba(76,175,80,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${combinacaoBonus ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.07)'}`,
                transition: 'all .12s',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={checkboxSx(combinacaoBonus, 'rgba(76,175,80,0.9)')}>
                  {combinacaoBonus && <Typography sx={{ fontSize: 10, color: '#fff', lineHeight: 1 }}>✓</Typography>}
                </Box>
                <Typography sx={{ fontSize: 12, color: combinacaoBonus ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)' }}>
                  Houve ancoragem emocional antes? (−2 CD)
                </Typography>
              </Stack>
            </Box>

            {/* Checkbox: aliado (apenas avançado) */}
            {isAvancado && ritual.teste.aliado && (
              <Box
                onClick={() => setAliadoSucesso((p) => !p)}
                sx={{
                  px: 1.25, py: 0.75, borderRadius: '10px', cursor: 'pointer',
                  bgcolor: aliadoSucesso ? 'rgba(120,85,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${aliadoSucesso ? 'rgba(120,85,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all .12s',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={checkboxSx(aliadoSucesso, 'rgba(120,85,255,0.9)')}>
                    {aliadoSucesso && <Typography sx={{ fontSize: 10, color: '#fff', lineHeight: 1 }}>✓</Typography>}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: aliadoSucesso ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)' }}>
                    Aliado passou em {ritual.teste.aliado.pericia} CD {ritual.teste.aliado.cd} (−2 CD)
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* Checkbox: falha crítica */}
            {ritual.falhaCriticaEfeito && (
              <Box
                onClick={() => setFalhaCritica((p) => !p)}
                sx={{
                  px: 1.25, py: 0.75, borderRadius: '10px', cursor: 'pointer',
                  bgcolor: falhaCritica ? 'rgba(244,67,54,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${falhaCritica ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all .12s',
                }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box sx={{ ...checkboxSx(falhaCritica, 'rgba(244,67,54,0.9)'), mt: 0.2 }}>
                    {falhaCritica && <Typography sx={{ fontSize: 10, color: '#fff', lineHeight: 1 }}>✓</Typography>}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 12, color: falhaCritica ? 'rgba(255,150,140,0.85)' : 'rgba(255,255,255,0.4)' }}>
                      Falha crítica (d20 = 1)
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: 'rgba(255,100,100,0.55)' }}>
                      {ritual.falhaCriticaEfeito}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Input de Arcanismo */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ px: 1, py: 0.6, borderRadius: '8px', bgcolor: 'rgba(120,85,255,0.08)', border: '1px solid rgba(120,85,255,0.25)', flexShrink: 0 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'rgba(190,165,255,0.85)' }}>
                  Role d20
                </Typography>
              </Box>
              <TextField
                size="small" type="number" label={ritual.teste.atributo}
                value={arcanismoRoll ?? ''}
                onChange={(e) => {
                  const v = e.target.value === '' ? null : Math.min(parseInt(e.target.value, 10), 30);
                  setArcanismoRoll(v);
                }}
                inputProps={{ min: 1, max: 30 }}
                disabled={falhaCritica}
                sx={{ flex: 1, ...inputSx }}
              />
            </Stack>

            {/* Preview do resultado */}
            {(arcanismoRoll !== null || falhaCritica) && (
              <Box sx={{
                px: 1.25, py: 0.7, borderRadius: '10px',
                bgcolor: falhaCritica
                  ? 'rgba(244,67,54,0.08)'
                  : arcanismoRoll !== null && arcanismoRoll >= cdEfetivo
                    ? 'rgba(76,175,80,0.08)'
                    : 'rgba(255,152,0,0.08)',
                border: `1px solid ${falhaCritica
                  ? 'rgba(244,67,54,0.25)'
                  : arcanismoRoll !== null && arcanismoRoll >= cdEfetivo
                    ? 'rgba(76,175,80,0.25)'
                    : 'rgba(255,152,0,0.25)'}`,
              }}>
                <Typography sx={{
                  fontSize: 12, fontWeight: 700,
                  color: falhaCritica
                    ? 'rgba(255,130,120,0.9)'
                    : arcanismoRoll !== null && arcanismoRoll >= cdEfetivo
                      ? 'rgba(130,220,160,0.9)'
                      : 'rgba(255,180,80,0.9)',
                }}>
                  {falhaCritica
                    ? `Falha crítica — ${ritual.falhaCriticaEfeito}`
                    : arcanismoRoll !== null && arcanismoRoll >= cdEfetivo
                      ? `✓ Sucesso (${arcanismoRoll} ≥ CD ${cdEfetivo}) — remove ${ritual.sucessoEfeito.removeEstagios} estágio(s)`
                      : `✗ Falha (${arcanismoRoll} < CD ${cdEfetivo}) — ${ritual.falhaEfeito}`}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Botões */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button fullWidth variant="outlined"
            onClick={() => { resetState(); onClose(); }}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
          >
            Fechar
          </Button>
          {tab === 1 && (
            <Button fullWidth variant="outlined"
              onClick={handleApplyRitual}
              disabled={(arcanismoRoll === null && !falhaCritica) || saving}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, borderColor: 'rgba(76,175,80,0.4)', bgcolor: 'rgba(76,175,80,0.08)', color: 'rgba(130,220,150,0.95)', '&:hover': { bgcolor: 'rgba(76,175,80,0.16)' }, '&:disabled': { opacity: 0.35 } }}
            >
              {saving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : 'Aplicar Ritual'}
            </Button>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

// ─── card de exposição ao âmbar (personagens sem barra ativa) ────────────────

type CharExposicaoCardProps = {
  char: CharSummary;
  sessaoAtual: number;
  onRegistrar: (id: number, r: ResultadoRegistroExposicao) => void;
};

function CharExposicaoCard({ char, sessaoAtual, onRegistrar }: CharExposicaoCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [ativando, setAtivando] = useState(false);
  const [resetando, setResetando] = useState(false);

  const attrs = getAttrs(char);
  const sab = Number(attrs.sabedoria ?? 8);
  const con = Number(attrs.constituicao ?? 8);
  const nivel = char.nivel ?? 1;

  const exposicao = char.exposicaoAmbar ?? exposicaoDefault(sab, con, nivel);
  const estado = getEstadoMental(exposicao);
  const pct = exposicao.limiarAtivacao > 0
    ? Math.min(exposicao.pontosAcumulados / exposicao.limiarAtivacao, 1)
    : 0;

  async function handleAtivarManualmente() {
    setAtivando(true);
    try {
      const { exposicaoAtualizada, sanidadeIniciada } = ativarBarraManualmente({
        exposicaoAmbar: exposicao,
        nivel: char.nivel,
        attributes: char.attributes,
        idAttribute: char.idAttribute,
      });
      await saveExposicao(char.id, exposicaoAtualizada, sanidadeIniciada);
      onRegistrar(char.id, {
        exposicaoAtualizada,
        sanidadeIniciada,
        barraAtivouAgora: true,
        pontosGanhos: 0,
        estadoMentalAnterior: estado,
        estadoMentalNovo: 'ativo',
      });
    } finally {
      setAtivando(false);
    }
  }

  return (
    <Box sx={{
      borderRadius: '14px',
      bgcolor: 'rgba(255,255,255,0.02)',
      border: estado === 'em_acumulo'
        ? '1px solid rgba(255,195,60,0.2)'
        : '1px solid rgba(255,255,255,0.06)',
      px: 1.5, py: 1.1,
    }}>
      <Stack direction="row" alignItems="center" gap={1.25}>
        {/* Ícone */}
        <Box sx={{
          width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
          bgcolor: 'rgba(255,195,60,0.08)', border: '1px solid rgba(255,195,60,0.18)',
          display: 'grid', placeItems: 'center',
        }}>
          <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{char.dndClass?.icon ?? '🎲'}</Typography>
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>
              {char.name}
            </Typography>
            {char.nivel && (
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,210,80,0.55)' }}>
                Nv {char.nivel}
              </Typography>
            )}
          </Stack>

          {estado === 'em_acumulo' ? (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.4 }}>
              <Box sx={{ flex: 1, height: 5, borderRadius: '3px', bgcolor: 'rgba(255,195,60,0.1)', overflow: 'hidden' }}>
                <Box sx={{
                  height: '100%',
                  width: `${Math.round(pct * 100)}%`,
                  background: 'linear-gradient(90deg, rgba(160,100,20,0.9), rgba(255,195,60,0.85))',
                  transition: 'width .4s cubic-bezier(.4,0,.2,1)',
                  borderRadius: '3px',
                }} />
              </Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,195,60,0.7)', flexShrink: 0 }}>
                {exposicao.pontosAcumulados}/{exposicao.limiarAtivacao}
              </Typography>
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', mt: 0.1, fontStyle: 'italic' }}>
              Sem exposição ao Âmbar
            </Typography>
          )}
        </Box>

        {/* Label âmbar */}
        {estado === 'em_acumulo' && (
          <Box sx={{ px: 0.85, py: 0.25, borderRadius: '7px', bgcolor: 'rgba(255,195,60,0.12)', border: '1px solid rgba(255,195,60,0.3)', flexShrink: 0 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,215,80,0.9)' }}>
              {Math.round(pct * 100)}%
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Ações */}
      <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
        <Button
          size="small" variant="outlined" fullWidth
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: 11.5, py: 0.65, borderColor: 'rgba(255,195,60,0.3)', bgcolor: 'rgba(255,195,60,0.06)', color: 'rgba(255,215,80,0.9)', '&:hover': { bgcolor: 'rgba(255,195,60,0.12)' } }}
        >
          Registrar Exposição
        </Button>
        {estado === 'em_acumulo' && (
          <Button
            size="small" variant="outlined"
            onClick={handleAtivarManualmente}
            disabled={ativando}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: 11, py: 0.65, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)' }, whiteSpace: 'nowrap' }}
          >
            Ativar manualmente
          </Button>
        )}
      </Stack>

      {/* Resetar exposição */}
      {estado === 'em_acumulo' && (
        <Tooltip title="Zera os pontos acumulados e limpa o histórico de exposição" placement="top">
          <Box
            component="button"
            onClick={async () => {
              setResetando(true);
              try {
                const exposicaoZerada: ExposicaoAmbar = {
                  ...exposicao,
                  pontosAcumulados: 0,
                  historicoExposicao: [],
                  primeiraExposicao: undefined,
                };
                await saveExposicao(char.id, exposicaoZerada);
                onRegistrar(char.id, {
                  exposicaoAtualizada: exposicaoZerada,
                  sanidadeIniciada: null,
                  barraAtivouAgora: false,
                  pontosGanhos: 0,
                  estadoMentalAnterior: 'em_acumulo',
                  estadoMentalNovo: 'sem_exposicao',
                });
              } finally {
                setResetando(false);
              }
            }}
            disabled={resetando}
            sx={{
              width: '100%', py: 0.5, mt: 0.25,
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: '8px', bgcolor: 'transparent', cursor: 'pointer',
              color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700,
              transition: 'all .12s',
              '&:hover:not(:disabled)': { borderColor: 'rgba(255,100,100,0.3)', color: 'rgba(255,130,130,0.5)', bgcolor: 'rgba(255,80,80,0.04)' },
              '&:disabled': { opacity: 0.3, cursor: 'not-allowed' },
            }}
          >
            Resetar exposição
          </Box>
        </Tooltip>
      )}

      <ModalRegistrarExposicao
        personagem={{ ...char, exposicaoAmbar: exposicao }}
        sessaoAtual={sessaoAtual}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onRegistrar={(r) => onRegistrar(char.id, r)}
      />
    </Box>
  );
}

// ─── card de personagem no tracker ───────────────────────────────────────────

type CharCardProps = {
  char: CharSummary;
  sessaoAtual: number;
  onChange: (id: number, s: SanidadePersonagem | null) => void;
  onRevert: (id: number) => void;
};

function CharSanidadeCard({ char, sessaoAtual, onChange, onRevert }: CharCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [initOpen, setInitOpen] = useState(false);
  const [dmgOpen, setDmgOpen] = useState(false);
  const [cureOpen, setCureOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  const sanidade = char.sanidade;
  const hasData = !!sanidade && sanidade.hpPsiquicoTotal > 0;
  const isEco = sanidade?.estagioAtual === 5;

  async function handleRemove() {
    setRemoving(true);
    try {
      await saveSanidade(char.id, null);
      onChange(char.id, null);
    } finally {
      setRemoving(false);
    }
  }

  async function handleRecalcularHP() {
    if (!sanidade) return;
    setRecalculando(true);
    try {
      const attrs = getAttrs(char);
      const sab = Number(attrs.sabedoria ?? 8);
      const con = Number(attrs.constituicao ?? 8);
      const nivel = char.nivel ?? 1;
      const novoHP = calcularHPPsiquico(sab, con, nivel, sanidade.modificadores);
      const next: SanidadePersonagem = {
        ...normalizarSanidade(sanidade),
        hpPsiquicoTotal: novoHP,
        danoAcumulado: Math.min(sanidade.danoAcumulado, novoHP),
        estagioAtual: calcularEstagio(Math.min(sanidade.danoAcumulado, novoHP), novoHP),
      };
      await saveSanidade(char.id, next);
      onChange(char.id, next);
    } finally {
      setRecalculando(false);
    }
  }

  async function handleRevert() {
    setReverting(true);
    try {
      if (char.exposicaoAmbar) {
        const exposicaoAtualizada = { ...char.exposicaoAmbar, barraAtiva: false };
        await saveExposicao(char.id, exposicaoAtualizada, null);
      } else {
        await saveSanidade(char.id, null);
      }
      onRevert(char.id);
    } finally {
      setReverting(false);
    }
  }

  return (
    <Box sx={{
      borderRadius: '14px',
      bgcolor: 'rgba(255,255,255,0.02)',
      border: hasData
        ? `1px solid ${ESTAGIO_COLOR[sanidade!.estagioAtual]}33`
        : '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <Stack
        direction="row" alignItems="center" gap={1.25}
        onClick={() => setExpanded((p) => !p)}
        sx={{ px: 1.5, py: 1.1, cursor: 'pointer' }}
      >
        <Box sx={{
          width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
          bgcolor: 'rgba(120,85,255,0.1)', border: '1px solid rgba(120,85,255,0.2)',
          display: 'grid', placeItems: 'center',
        }}>
          <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{char.dndClass?.icon ?? '🎲'}</Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>
              {char.name}
            </Typography>
            {char.nivel && (
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,210,80,0.65)' }}>
                Nv {char.nivel}
              </Typography>
            )}
            {isEco && (
              <Tooltip title="Eco do Tempo — personagem dissolvido">
                <WarningAmberRoundedIcon sx={{ fontSize: 13, color: 'rgba(255,100,100,0.8)' }} />
              </Tooltip>
            )}
          </Stack>
          {hasData && (
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', mt: 0.1 }}>
              {sanidade!.hpPsiquicoTotal - sanidade!.danoAcumulado}/{sanidade!.hpPsiquicoTotal} PSI
              · E{sanidade!.estagioAtual} {getEstagioInfo(sanidade!.estagioAtual).nome}
            </Typography>
          )}
        </Box>

        {!hasData ? (
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
            não iniciado
          </Typography>
        ) : (
          <Box sx={{
            px: 0.85, py: 0.25, borderRadius: '7px',
            bgcolor: `${ESTAGIO_COLOR[sanidade!.estagioAtual]}18`,
            border: `1px solid ${ESTAGIO_COLOR[sanidade!.estagioAtual]}38`,
          }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: ESTAGIO_COLOR[sanidade!.estagioAtual] }}>
              E{sanidade!.estagioAtual}
            </Typography>
          </Box>
        )}
        {expanded
          ? <ExpandLessRoundedIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
          : <ExpandMoreRoundedIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />}
      </Stack>

      {/* Expandido */}
      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1.25 }}>
          <Divider sx={{ mb: 1.25, borderColor: 'rgba(255,255,255,0.06)' }} />

          {hasData ? (
            <Stack spacing={1.25}>
              <MiniSanidadeBar sanidade={sanidade!} />

              {/* Efeito mecânico atual */}
              {sanidade!.estagioAtual >= 2 && (
                <Box sx={{
                  px: 1.1, py: 0.65, borderRadius: '10px',
                  bgcolor: `${ESTAGIO_COLOR[sanidade!.estagioAtual]}0f`,
                  border: `1px solid ${ESTAGIO_COLOR[sanidade!.estagioAtual]}28`,
                }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: ESTAGIO_COLOR[sanidade!.estagioAtual] }}>
                    ⚙️ {getEstagioInfo(sanidade!.estagioAtual).efeitoMecanico}
                  </Typography>
                </Box>
              )}

              {/* Ações */}
              <Stack direction="row" spacing={0.75} flexWrap="wrap">
                {!isEco && (
                  <Button size="small" variant="outlined"
                    onClick={() => setDmgOpen(true)}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: 11.5, py: 0.65, flex: 1, borderColor: 'rgba(244,67,54,0.3)', bgcolor: 'rgba(244,67,54,0.06)', color: 'rgba(255,150,140,0.9)', '&:hover': { bgcolor: 'rgba(244,67,54,0.12)' } }}
                  >
                    <PsychologyAltRoundedIcon sx={{ fontSize: 13, mr: 0.5 }} />
                    Dano
                  </Button>
                )}
                {!isEco && (
                  <Button size="small" variant="outlined"
                    onClick={() => setCureOpen(true)}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: 11.5, py: 0.65, flex: 1, borderColor: 'rgba(76,175,80,0.3)', bgcolor: 'rgba(76,175,80,0.06)', color: 'rgba(130,220,150,0.9)', '&:hover': { bgcolor: 'rgba(76,175,80,0.12)' } }}
                  >
                    Curar
                  </Button>
                )}
                <Button size="small" variant="outlined"
                  onClick={handleRemove} disabled={removing}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: 11.5, py: 0.65, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                >
                  Remover
                </Button>
              </Stack>

              {/* Recalcular HP com nova fórmula */}
              {hasData && (() => {
                const attrs = getAttrs(char);
                const novoHP = calcularHPPsiquico(
                  Number(attrs.sabedoria ?? 8),
                  Number(attrs.constituicao ?? 8),
                  char.nivel ?? 1,
                  sanidade!.modificadores,
                );
                if (novoHP === sanidade!.hpPsiquicoTotal) return null;
                return (
                  <Tooltip title={`HP atual: ${sanidade!.hpPsiquicoTotal} → Novo: ${novoHP} (nova fórmula)`} placement="top">
                    <Box
                      component="button"
                      onClick={handleRecalcularHP}
                      disabled={recalculando}
                      sx={{
                        width: '100%', py: 0.5,
                        border: '1px dashed rgba(120,85,255,0.25)',
                        borderRadius: '8px', bgcolor: 'transparent', cursor: 'pointer',
                        color: 'rgba(180,150,255,0.45)', fontSize: 11, fontWeight: 700,
                        transition: 'all .12s',
                        '&:hover:not(:disabled)': { borderColor: 'rgba(120,85,255,0.5)', color: 'rgba(200,175,255,0.75)', bgcolor: 'rgba(120,85,255,0.06)' },
                        '&:disabled': { opacity: 0.3, cursor: 'not-allowed' },
                      }}
                    >
                      Recalcular HP ({sanidade!.hpPsiquicoTotal} → {novoHP})
                    </Box>
                  </Tooltip>
                );
              })()}

              {/* Reverter para exposição */}
              <Tooltip title="Remove a barra de sanidade e devolve o personagem ao controle de exposição ao Âmbar" placement="top">
                <Box
                  component="button"
                  onClick={handleRevert}
                  disabled={reverting}
                  sx={{
                    width: '100%', py: 0.5, mt: 0.25,
                    border: '1px dashed rgba(255,195,60,0.15)',
                    borderRadius: '8px', bgcolor: 'transparent', cursor: 'pointer',
                    color: 'rgba(255,195,60,0.35)', fontSize: 11, fontWeight: 700,
                    transition: 'all .12s',
                    '&:hover:not(:disabled)': { borderColor: 'rgba(255,195,60,0.35)', color: 'rgba(255,215,80,0.7)', bgcolor: 'rgba(255,195,60,0.05)' },
                    '&:disabled': { opacity: 0.3, cursor: 'not-allowed' },
                  }}
                >
                  ← Voltar à Exposição ao Âmbar
                </Box>
              </Tooltip>

              {/* Log de eventos recentes */}
              {sanidade!.historicoEventos.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', mb: 0.6 }}>
                    Histórico
                  </Typography>
                  <Stack spacing={0.4}>
                    {sanidade!.historicoEventos.slice(0, 5).map((ev) => {
                      const vetor = VETORES_DANO.find((v) => v.id === ev.vetorId);
                      return (
                        <Stack key={ev.id} direction="row" alignItems="flex-start" spacing={0.75}
                          sx={{ px: 1, py: 0.55, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,130,110,0.85)', minWidth: 22, textAlign: 'center' }}>
                            −{ev.danoRolado}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                              {ev.descricaoNarrativa || vetor?.nome || ev.vetorId}
                            </Typography>
                            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                              Sessão {ev.sessao} · {new Date(ev.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : (
            <Button fullWidth variant="outlined"
              onClick={() => setInitOpen(true)}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, borderColor: 'rgba(120,85,255,0.35)', bgcolor: 'rgba(120,85,255,0.07)', color: 'rgba(190,165,255,0.9)', '&:hover': { bgcolor: 'rgba(120,85,255,0.14)' } }}
            >
              🌀 Inicializar Sanidade
            </Button>
          )}
        </Box>
      </Collapse>

      {/* Modais */}
      <InitModal
        char={char}
        open={initOpen}
        onClose={() => setInitOpen(false)}
        onSaved={(s) => onChange(char.id, s)}
      />
      {hasData && (
        <>
          <DamageModal
            char={char}
            open={dmgOpen}
            onClose={() => setDmgOpen(false)}
            onApplied={(s) => onChange(char.id, s)}
            sessaoAtual={sessaoAtual}
          />
          <CureModal
            char={char}
            open={cureOpen}
            onClose={() => setCureOpen(false)}
            onApplied={(s) => onChange(char.id, s)}
          />
        </>
      )}
    </Box>
  );
}

// ─── descrições detalhadas dos estágios ──────────────────────────────────────

const ESTAGIO_DETALHE: Record<number, { oQue: string; mecanica: string; emJogo: string }> = {
  1: {
    oQue:
      'O personagem começa a receber fragmentos de ecos antes que os momentos aconteçam — como um déjà vu involuntário e constante. Por ora parece inofensivo, quase útil. É o primeiro sinal de que o âmbar está interferindo na percepção do presente.',
    mecanica:
      '1x por sessão, ao rolar iniciativa, o personagem rola o d20 duas vezes e fica com o resultado maior. Ele não controla — acontece automaticamente, como se tivesse "sentido" o início do combate uma fração de segundo antes. É uma vantagem que não foi pedida, gerada por algo que está corroendo por dentro.',
    emJogo:
      'Ao tocar objetos cotidianos, pode receber ecos involuntários breves. O personagem às vezes para no meio de uma frase como se já soubesse o que vem a seguir.',
  },
  2: {
    oQue:
      'Ecos espontâneos começam a se sobrepor à visão do personagem em momentos de estresse — o passado aparece sobre o presente por frações de segundo, com frequência crescente. A fronteira entre o que está acontecendo agora e o que já aconteceu começa a ficar porosa.',
    mecanica:
      'Desvantagem em testes de Percepção situacional — rola dois d20 e fica com o pior. Em combate, uma vez por encontro o mestre pode descrever algo que o personagem vê que não está lá. O personagem precisa de um teste de SAB CD 12 para ignorar — se falhar, perde a ação daquele turno reagindo a algo que não existe.',
    emJogo:
      'O personagem pode hesitar antes de entrar em lugares que parecem "familiares demais". Às vezes descreve detalhes de um local que nunca visitou — porque viu o eco de quem esteve ali antes.',
  },
  3: {
    oQue:
      'O personagem perde a âncora do presente. Às vezes responde a perguntas com informações de horas atrás. Em combate, pode agir como se um inimigo derrotado ainda estivesse de pé. A identidade ainda existe — mas o presente deixou de ser confiável.',
    mecanica:
      'Desvantagem em testes de Inteligência e Sabedoria. Uma vez por encontro, o mestre tem controle narrativo de um turno: o personagem "reage a um eco" e age como se estivesse num momento passado da batalha.',
    emJogo:
      'O personagem pode chamar aliados pelo nome errado. Pode se recusar a entrar em lugares que "deram errado antes", mesmo que nunca tenha estado lá.',
  },
  4: {
    oQue:
      'A identidade do personagem se fragmenta entre os ecos que acumulou. Ele ainda funciona — ainda luta, ainda fala — mas não tem certeza se é ele mesmo ou uma repetição de si mesmo. Às vezes fala no passado sobre eventos que ainda não aconteceram. A dissolução completa pode acontecer a qualquer momento, sem aviso.',
    mecanica:
      'Desvantagem em todos os testes de Sabedoria. Uma vez por sessão o mestre rola 1d20 em segredo: se o resultado for 1 a 4 (20% de chance), o personagem avança para o Estágio 5 espontaneamente no início da próxima cena — sem precisar receber nenhum dano novo.',
    emJogo:
      'O personagem pode acordar sem saber onde está, falar com pessoas que não estão presentes, ou tomar decisões que contradizem completamente o que disse horas antes. Os aliados percebem que ele está escorregando — e o relógio está correndo.',
  },
  5: {
    oQue:
      'A consciência do personagem se dissolve completamente no âmbar que carregava. O corpo permanece — mas quem o habita agora é uma colagem de todos os ecos que acumulou. Ele se torna uma criatura atemporal, sem memória linear, sem identidade fixa. É o fim de um arco de personagem.',
    mecanica:
      'O personagem sai do controle do jogador. O mestre assume. Ele passa a usar as estatísticas de Eco do Tempo do Manual do Âmbar. O jogador pode criar um novo personagem ou aguardar uma possível cura.',
    emJogo:
      'O corpo ainda parece o personagem. A voz ainda soa parecida. Mas os olhos não focam no presente. Camadas finas de âmbar cristalizado começam a crescer nas mãos e no pescoço. E às vezes, por um segundo, a pessoa real ainda está lá — pedindo para ser trazida de volta.',
  },
};

function EstagioReferencia({ e }: { e: typeof ESTAGIOS[number] }) {
  const [open, setOpen] = useState(false);
  const cor = e.numero === 5 ? 'rgba(160,140,220,0.9)' : e.corUI;
  const detalhe = ESTAGIO_DETALHE[e.numero];

  return (
    <Box sx={{ borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
      <Stack
        direction="row" alignItems="flex-start" spacing={1}
        onClick={() => setOpen((p) => !p)}
        sx={{ px: 1, py: 0.75, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}
      >
        <Box sx={{ minWidth: 24, height: 24, borderRadius: '6px', bgcolor: `${e.corUI}20`, border: `1px solid ${e.corUI}40`, display: 'grid', placeItems: 'center', flexShrink: 0, mt: 0.1 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 900, color: cor }}>E{e.numero}</Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: cor, lineHeight: 1.2 }}>{e.nome}</Typography>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{e.efeitoMecanico}</Typography>
        </Box>
        {open
          ? <ExpandLessRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', flexShrink: 0, mt: 0.3 }} />
          : <ExpandMoreRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', flexShrink: 0, mt: 0.3 }} />}
      </Stack>

      <Collapse in={open}>
        <Stack spacing={1} sx={{ px: 1.25, pb: 1.25 }}>
          <Divider sx={{ borderColor: `${e.corUI}20` }} />

          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: e.numero === 5 ? cor : `${cor}99`, mb: 0.4 }}>
              O que está acontecendo
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
              {detalhe.oQue}
            </Typography>
          </Box>

          <Box sx={{ px: 1, py: 0.75, borderRadius: '8px', bgcolor: e.numero === 5 ? 'rgba(160,140,220,0.07)' : `${e.corUI}0d`, border: `1px solid ${e.numero === 5 ? 'rgba(160,140,220,0.2)' : `${e.corUI}25`}` }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: e.numero === 5 ? cor : `${cor}99`, mb: 0.4 }}>
              Efeito mecânico
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>
              {detalhe.mecanica}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: e.numero === 5 ? cor : `${cor}99`, mb: 0.4 }}>
              Como aparece em jogo
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, fontStyle: 'italic' }}>
              {detalhe.emJogo}
            </Typography>
          </Box>
        </Stack>
      </Collapse>
    </Box>
  );
}

// ─── export principal ─────────────────────────────────────────────────────────

export default function SanidadeTracker() {
  const [chars, setChars] = useState<CharSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [sessaoAtual, setSessaoAtual] = useState(1);
  const [barraAtivouNotification, setBarraAtivouNotification] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listAllCharacters(),
      getSettings(),
    ]).then(([list, settings]) => {
      setChars(list as CharSummary[]);
      setEnabled(settings.sanidadeEnabled);
    }).finally(() => setLoading(false));
  }, []);

  async function toggleEnabled(v: boolean) {
    setToggling(true);
    try {
      const s = await updateSettings({ sanidadeEnabled: v });
      setEnabled(s.sanidadeEnabled);
    } finally {
      setToggling(false);
    }
  }

  function updateChar(id: number, sanidade: SanidadePersonagem | null) {
    setChars((prev) => prev.map((c) => c.id === id ? { ...c, sanidade } : c));
  }

  function handleRevert(id: number) {
    setChars((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        sanidade: null,
        ...(c.exposicaoAmbar ? { exposicaoAmbar: { ...c.exposicaoAmbar, barraAtiva: false } } : {}),
      };
    }));
  }

  function handleRegistrarExposicao(id: number, r: ResultadoRegistroExposicao) {
    setChars((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        exposicaoAmbar: r.exposicaoAtualizada,
        ...(r.sanidadeIniciada ? { sanidade: r.sanidadeIniciada } : {}),
      };
    }));
    if (r.barraAtivouAgora) {
      const nome = chars.find((c) => c.id === id)?.name ?? '';
      setBarraAtivouNotification(`${nome} — seção Mental ativada.`);
      setTimeout(() => setBarraAtivouNotification(null), 6000);
    }
  }

  const atRisk = chars.filter((c) => c.sanidade && c.sanidade.estagioAtual >= 3);

  async function handleNovaSessao() {
    const toUpdate = chars.filter((c) => c.sanidade != null);
    await Promise.all(toUpdate.map((c) => {
      const next = iniciarNovaSessao(normalizarSanidade(c.sanidade!));
      return saveSanidade(c.id, next).then(() => updateChar(c.id, next));
    }));
    setSessaoAtual((s) => s + 1);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={22} sx={{ color: 'rgba(255,195,60,0.6)' }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Toggle do sistema */}
      <Box sx={{
        px: 1.75, py: 1.25, borderRadius: '14px',
        bgcolor: enabled ? 'rgba(120,85,255,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${enabled ? 'rgba(120,85,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all .2s',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography sx={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>🌀</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: enabled ? 'rgba(200,175,255,0.95)' : 'rgba(255,255,255,0.55)' }}>
              Sistema Âmbar
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', mt: 0.1 }}>
              HP Psíquico (Sanidade) — campanha Âmbar
            </Typography>
          </Box>
          {toggling
            ? <CircularProgress size={18} sx={{ color: 'rgba(120,85,255,0.7)' }} />
            : (
              <Switch
                checked={enabled}
                onChange={(e) => toggleEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: 'rgba(160,130,255,0.9)' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'rgba(120,85,255,0.5)' },
                }}
              />
            )}
        </Stack>
        {enabled && (
          <Typography sx={{ fontSize: 11, color: 'rgba(180,150,255,0.6)', mt: 0.75, px: 0.25 }}>
            Sistema ativo — barras de sanidade visíveis nas fichas dos jogadores
          </Typography>
        )}
      </Box>

      {!enabled ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ fontSize: 28, mb: 1 }}>🌀</Typography>
          <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
            Ative o sistema Âmbar para gerenciar a sanidade dos personagens.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Notificação de ativação — visível apenas para o mestre */}
          {barraAtivouNotification && (
            <Box sx={{
              px: 1.5, py: 1, borderRadius: '12px',
              bgcolor: 'rgba(255,195,60,0.1)', border: '1px solid rgba(255,195,60,0.28)',
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 15, color: 'rgba(255,215,80,0.85)', flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,215,100,0.9)' }}>
                {barraAtivouNotification}
              </Typography>
            </Box>
          )}

          {/* Alertas */}
          {atRisk.length > 0 && (
            <Box sx={{ px: 1.5, py: 1, borderRadius: '12px', bgcolor: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.22)' }}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                <WarningAmberRoundedIcon sx={{ fontSize: 14, color: 'rgba(255,130,100,0.85)' }} />
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,150,130,0.9)' }}>
                  {atRisk.length} personagem{atRisk.length > 1 ? 's' : ''} em risco
                </Typography>
              </Stack>
              {atRisk.map((c) => (
                <Typography key={c.id} sx={{ fontSize: 11.5, color: 'rgba(255,180,160,0.75)', pl: 2.5 }}>
                  {c.name} — E{c.sanidade!.estagioAtual} {getEstagioInfo(c.sanidade!.estagioAtual).nome}
                </Typography>
              ))}
            </Box>
          )}

          {/* Sessão atual */}
          <Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap">
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>Sessão:</Typography>
            <TextField
              type="number"
              size="small"
              value={sessaoAtual}
              onChange={(e) => setSessaoAtual(Math.max(1, parseInt(e.target.value, 10) || 1))}
              inputProps={{ min: 1 }}
              sx={{
                width: 80,
                '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.8)', fontSize: 13, '& fieldset': { borderColor: 'rgba(255,255,255,0.09)' } },
              }}
            />
            <Button
              size="small" variant="outlined"
              onClick={handleNovaSessao}
              sx={{
                borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: 11.5,
                borderColor: 'rgba(255,193,7,0.3)', bgcolor: 'rgba(255,193,7,0.06)',
                color: 'rgba(255,220,100,0.85)',
                '&:hover': { bgcolor: 'rgba(255,193,7,0.12)' },
              }}
            >
              Nova Sessão
            </Button>
          </Stack>

          {/* ── Exposição ao Âmbar (personagens sem barra ativa) ── */}
          {(() => {
            const semBarra = chars.filter((c) => !c.exposicaoAmbar?.barraAtiva && !c.sanidade);
            if (semBarra.length === 0) return null;
            return (
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,195,60,0.45)', mb: 0.75 }}>
                  Exposição ao Âmbar
                </Typography>
                <Stack spacing={0.75}>
                  {semBarra.map((c) => (
                    <CharExposicaoCard
                      key={c.id}
                      char={c}
                      sessaoAtual={sessaoAtual}
                      onRegistrar={handleRegistrarExposicao}
                    />
                  ))}
                </Stack>
              </Box>
            );
          })()}

          {/* ── Sanidade (personagens com barra ativa) ── */}
          {(() => {
            const comBarra = chars.filter((c) => c.exposicaoAmbar?.barraAtiva || c.sanidade);
            if (chars.length === 0) {
              return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
                    Nenhum personagem encontrado.
                  </Typography>
                </Box>
              );
            }
            if (comBarra.length === 0) return null;
            return (
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(120,85,255,0.5)', mb: 0.75 }}>
                  HP Psíquico
                </Typography>
                <Stack spacing={0.75}>
                  {comBarra.map((c) => (
                    <CharSanidadeCard
                      key={c.id}
                      char={c}
                      sessaoAtual={sessaoAtual}
                      onChange={updateChar}
                      onRevert={handleRevert}
                    />
                  ))}
                </Stack>
              </Box>
            );
          })()}

          {/* Legenda dos estágios */}
          <Box sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', mb: 0.75 }}>
              Referência de estágios
            </Typography>
            <Stack spacing={0.4}>
              {ESTAGIOS.map((e) => (
                <EstagioReferencia key={e.numero} e={e} />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
