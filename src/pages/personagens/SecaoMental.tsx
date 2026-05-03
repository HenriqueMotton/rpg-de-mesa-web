import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import SanidadeBar from './SanidadeBar';
import { getEstadoMental } from '../../modules/exposicao/exposicao.utils';
import type { ExposicaoAmbar } from '../../modules/exposicao/exposicao.types';
import type { SanidadePersonagem } from '../../modules/sanidade/sanidade.types';

type Props = {
  exposicao?: ExposicaoAmbar | null;
  sanidade?: SanidadePersonagem | null;
  barraAtivouAgora?: boolean;
};

export default function SecaoMental({ exposicao, sanidade, barraAtivouAgora }: Props) {
  const estado = exposicao ? getEstadoMental(exposicao) : 'sem_exposicao';

  // Controla fade-in quando a barra acabou de ser ativada
  const [opacidade, setOpacidade] = useState(barraAtivouAgora ? 0 : 1);
  const animacaoDisparada = useRef(false);

  useEffect(() => {
    if (barraAtivouAgora && !animacaoDisparada.current) {
      animacaoDisparada.current = true;
      requestAnimationFrame(() => setOpacidade(1));
    }
  }, [barraAtivouAgora]);

  if (estado !== 'ativo' || !sanidade) return null;

  return (
    <Box
      sx={{
        opacity: opacidade,
        transition: barraAtivouAgora ? 'opacity 1.5s ease' : 'none',
      }}
    >
      <SanidadeBar sanidade={sanidade} />
    </Box>
  );
}
