import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAMES_M = [
  "Aldric", "Bram", "Casimir", "Dorian", "Edric", "Faolan", "Gareth", "Hadwin",
  "Ivan", "Jasper", "Kael", "Leoric", "Marek", "Nolan", "Oryn", "Percival",
  "Quillan", "Roran", "Soren", "Thaddeus", "Ulrik", "Varis", "Wulfric", "Xander",
  "Yoren", "Zakary", "Balin", "Corwin", "Darian", "Fenwick", "Gideon", "Halvard",
  "Igor", "Jovan", "Kaleb", "Lorn", "Malachar", "Nils", "Oswald", "Pavel",
  "Roland", "Sigurd", "Torsten", "Viran", "Zadric", "Brann", "Cato", "Emric",
  "Fenn", "Gregor", "Holt", "Jude", "Kane", "Lars", "Miro", "Neron",
  "Orin", "Pax", "Renn", "Sable", "Thorn", "Udo", "Vex", "Wren",
];

const NAMES_F = [
  "Aelindra", "Brynn", "Catriona", "Delia", "Elara", "Fiora", "Galatea",
  "Hilde", "Isolde", "Jaina", "Kalista", "Lyria", "Mira", "Nera", "Ondine",
  "Petra", "Qara", "Renna", "Sasha", "Tara", "Ursa", "Vara", "Wynne",
  "Xena", "Yara", "Zoe", "Amara", "Britta", "Calia", "Dara", "Eira",
  "Faye", "Gwen", "Hana", "Ilara", "Jana", "Kira", "Lira", "Myla",
  "Nira", "Osha", "Pira", "Rhea", "Sera", "Tova", "Vela", "Wren",
  "Ysolde", "Zia", "Brea", "Cira", "Dwyn", "Eris", "Fara", "Gala",
];

const SURNAMES = [
  "Forja-Fria", "Pedra-Alta", "Vento-Negro", "Mão-de-Ferro", "Olho-de-Águia",
  "Cinza", "Sombra", "Goldthorn", "Silverstone", "Blackwood", "Ashford",
  "Ironwood", "Greymane", "Dunhill", "Whitlock", "Redwood", "Brightwood",
  "Coldwater", "Nightfall", "Stormwind", "Ironsong", "Ramos", "Ferreira",
  "Cavalcante", "Braga", "Monteiro", "Carvalho", "Nogueira", "Tavares",
  "Fonseca", "Magalhães", "Queiroz", "Vilareal", "Drummond", "Lacerda",
  "Branco", "da Serra", "do Vale", "das Pedras", "do Rio",
];

const RACES = [
  "Humano", "Humano", "Humano", // humanos são maioria
  "Elfo", "Meio-Elfo", "Anão",
  "Halfling", "Gnomo", "Tiefling",
  "Draconato", "Meio-Orc", "Aasimar",
];

const PROFESSIONS = [
  "Ferreiro", "Comerciante", "Estalajadeiro", "Clérigo", "Mercador ambulante",
  "Guarda da cidade", "Ladrão aposentado", "Sábio excêntrico", "Alquimista",
  "Bardo itinerante", "Fazendeiro", "Pescador", "Caçador de recompensas",
  "Minerador", "Mensageiro", "Nobre menor", "Banqueiro", "Escriba",
  "Herbalista", "Carpinteiro", "Curtidor", "Alfaiate", "Açougueiro",
  "Padeiro", "Moleiro", "Armeiro", "Curandeira", "Marinheiro",
  "Capitão de guarda", "Soldado veterano", "Mago da torre local",
  "Espião disfarçado", "Contrabandista", "Monge viajante",
  "Druida da floresta", "Juiz de paz", "Coveiro", "Tecelã",
  "Domador de animais", "Astrólogo", "Gravador de runas",
  "Ex-aventureiro", "Mercenário", "Cozinheiro", "Enólogo",
];

const PERSONALITIES = [
  "Desconfiado e reservado com estranhos",
  "Alegre, tagarela e conta histórias a todos",
  "Ambicioso e calculista — sempre avalia o que pode ganhar",
  "Honesto até a brutalidade, sem meias palavras",
  "Medroso, mas extremamente útil quando convencido",
  "Leal ao extremo à sua família ou guilda",
  "Ganancioso e oportunista, mas nunca mente abertamente",
  "Curioso e fascinado por qualquer coisa incomum",
  "Melancólico e nostálgico de dias melhores",
  "Arrogante e desdenhoso com quem considera inferior",
  "Gentil e protetor dos mais fracos",
  "Fanático por sua causa ou crença",
  "Cansado da vida, mas ainda ajuda quem precisa",
  "Bebedor compulsivo mas surpreendentemente sábio",
  "Nervoso e ansioso, fala rápido e evita contato visual",
  "Sereno e filosófico, responde perguntas com perguntas",
  "Rude na forma, mas justo no conteúdo",
  "Misterioso e evasivo — nunca responde diretamente",
  "Devotamente religioso, cita escrituras com frequência",
  "Ex-criminoso regenerado que carrega culpa",
  "Ávido por ouvir histórias de aventura",
  "Saudoso da terra natal, menciona toda hora",
  "Obcecado com dívidas — as suas e as dos outros",
  "Finge ser mais importante do que realmente é",
  "Traumatizado por uma guerra passada",
  "Ressente-se de aventureiros por uma razão pessoal",
  "Leal ao rei ou senhor local acima de tudo",
  "Deseja secretamente viver grandes aventuras",
  "Orgulhoso do seu ofício ao ponto da obsessão",
  "Paranoico — acha que está sendo vigiado",
];

const MANNERISMS = [
  "Fala muito rápido e raramente termina as frases",
  "Sussurra quase sempre, mesmo sem motivo",
  "Usa palavras rebuscadas e difíceis desnecessariamente",
  "Repete as últimas palavras do interlocutor",
  "Faz pausas longas antes de responder qualquer coisa",
  "Usa ditados e provérbios para tudo",
  "Nunca olha nos olhos — sempre desvia o olhar",
  "Ri nervosamente ao terminar cada frase",
  "Gesticula excessivamente ao falar",
  "Faz perguntas mas raramente espera a resposta",
  "Sempre está com algo para mastigar ou beber",
  "Coça a nuca ou a barba ao pensar",
  "Assobia levemente quando está nervoso",
  "Refere-se a si mesmo em terceira pessoa",
  "Interrompe os outros e depois pede desculpas",
  "Está sempre olhando ao redor, como se esperasse alguém",
  "Canta ou tatareia baixinho enquanto trabalha",
  "Usa o nome completo das pessoas em cada frase",
  "Nunca se senta — prefere ficar de pé ou andar",
  "Anota tudo em um caderninho surrado",
];

const SECRETS = [
  "Esconde uma dívida enorme com uma guilda criminosa",
  "É um informante da guarda, mas ninguém sabe",
  "Já matou um homem e enterrou o segredo fundo",
  "Sua verdadeira identidade é a de um nobre fugitivo",
  "Está apaixonado por alguém inacessível",
  "Guarda um objeto mágico sem saber o que é",
  "Tem um filho secreto em outra cidade",
  "Era aventureiro e se aposentou por covardia num momento crucial",
  "Rouba pequenas quantias há anos sem ser pego",
  "Testemunhou um crime do senhor local e vive com medo",
  "É membro de um culto menor, mas inofensivo",
  "Seu passado inclui escravidão que prefere esquecer",
  "Está sendo chantageado por alguém da cidade",
  "Perdeu a família numa tragédia e culpa os aventureiros",
  "Tem um talento mágico latente que teme usar",
  "É espião a serviço de uma nação estrangeira",
  "Falsificou as próprias credenciais profissionais",
  "Conhece a localização de um tesouro enterrado",
];

const APPEARANCES = [
  "Cicatriz horizontal no queixo",
  "Olhos de cores diferentes (heterocromia)",
  "Cabelos completamente brancos apesar da pouca idade",
  "Manca levemente da perna esquerda",
  "Tatuagem de âncora no pescoço",
  "Nariz claramente quebrado mais de uma vez",
  "Sorriso permanente e levemente perturbador",
  "Mãos enormes e calejadas de trabalho",
  "Sempre com roupas surradas mas limpas",
  "Usa joias caras com roupas simples",
  "Muito alto — bate a cabeça nas portas",
  "Muito baixo para a raça, visivelmente incomodado com isso",
  "Barba ou cabelo sempre perfeitamente arrumados",
  "Olhos cansados que parecem nunca dormir o suficiente",
  "Uma orelha parcialmente cortada",
  "Dedo faltando na mão direita",
  "Sempre de capuz mesmo no calor",
  "Pele com vitiligo em manchas irregulares",
  "Voz surpreendentemente grave para o tamanho do corpo",
  "Voz surpreendentemente aguda para o tamanho do corpo",
  "Dentes de ouro — um ou dois",
  "Marca de nascença em forma de lua na testa",
  "Sempre carrega flores frescas na lapela",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildName(): string {
  const female = Math.random() < 0.5;
  const firstName = pick(female ? NAMES_F : NAMES_M);
  const showSurname = Math.random() < 0.7;
  return showSurname ? `${firstName} ${pick(SURNAMES)}` : firstName;
}

type NpcData = {
  name: string;
  race: string;
  profession: string;
  personality: string;
  mannerism: string;
  secret: string;
  appearance: string;
};

function generateNpc(locked: Partial<NpcData>, current: NpcData | null): NpcData {
  return {
    name:        locked.name        ?? buildName(),
    race:        locked.race        ?? pick(RACES),
    profession:  locked.profession  ?? pick(PROFESSIONS),
    personality: locked.personality ?? pick(PERSONALITIES),
    mannerism:   locked.mannerism   ?? pick(MANNERISMS),
    secret:      locked.secret      ?? pick(SECRETS),
    appearance:  locked.appearance  ?? pick(APPEARANCES),
  };
  // ensure current different from newly generated when regenerating
}

// ─── Field row ────────────────────────────────────────────────────────────────

const FIELD_COLORS: Record<keyof NpcData, { accent: string; bg: string; border: string }> = {
  name:        { accent: "rgba(255,215,100,0.85)", bg: "rgba(255,195,60,0.07)", border: "rgba(255,195,60,0.18)" },
  race:        { accent: "rgba(140,200,255,0.85)", bg: "rgba(80,160,255,0.07)", border: "rgba(80,160,255,0.18)" },
  profession:  { accent: "rgba(160,240,160,0.85)", bg: "rgba(80,200,80,0.06)",  border: "rgba(80,200,80,0.16)"  },
  personality: { accent: "rgba(200,160,255,0.9)",  bg: "rgba(140,80,255,0.07)", border: "rgba(140,80,255,0.18)" },
  mannerism:   { accent: "rgba(255,180,80,0.85)",  bg: "rgba(255,140,40,0.06)", border: "rgba(255,140,40,0.16)" },
  secret:      { accent: "rgba(255,120,120,0.85)", bg: "rgba(200,60,60,0.07)",  border: "rgba(200,60,60,0.16)"  },
  appearance:  { accent: "rgba(180,220,255,0.8)",  bg: "rgba(80,160,220,0.06)", border: "rgba(80,160,220,0.15)" },
};

const FIELD_LABELS: Record<keyof NpcData, string> = {
  name: "Nome", race: "Raça", profession: "Profissão",
  personality: "Personalidade", mannerism: "Maneirismo",
  secret: "Segredo", appearance: "Aparência",
};

const FIELD_ICONS: Record<keyof NpcData, string> = {
  name: "🪪", race: "🌍", profession: "⚒️",
  personality: "🧠", mannerism: "💬", secret: "🔐", appearance: "👁️",
};

function FieldRow({
  field, value, locked, onToggleLock, onReroll,
}: {
  field: keyof NpcData;
  value: string;
  locked: boolean;
  onToggleLock: () => void;
  onReroll: () => void;
}) {
  const c = FIELD_COLORS[field];
  return (
    <Box
      sx={{
        borderRadius: "13px",
        border: locked ? `1.5px solid ${c.border}` : "1px solid rgba(255,255,255,0.07)",
        bgcolor: locked ? c.bg : "rgba(255,255,255,0.025)",
        px: 1.5, py: 1.1,
        transition: "all .15s",
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        {/* Label */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: locked ? c.accent : "rgba(255,255,255,0.3)", mb: 0.3 }}>
            {FIELD_ICONS[field]} {FIELD_LABELS[field]}
          </Typography>
          <Typography sx={{ fontSize: 13.5, fontWeight: locked ? 700 : 600, color: locked ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
            {value}
          </Typography>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, mt: 0.25 }}>
          <Tooltip title={locked ? "Desbloquear" : "Travar (não sortear novamente)"}>
            <IconButton
              size="small"
              onClick={onToggleLock}
              sx={{ width: 26, height: 26, color: locked ? c.accent : "rgba(255,255,255,0.2)", bgcolor: locked ? `${c.bg}` : "transparent", borderRadius: "8px", "&:hover": { bgcolor: locked ? c.bg : "rgba(255,255,255,0.06)" } }}
            >
              {locked ? <LockRoundedIcon sx={{ fontSize: 13 }} /> : <LockOpenRoundedIcon sx={{ fontSize: 13 }} />}
            </IconButton>
          </Tooltip>
          {!locked && (
            <Tooltip title="Sortear só este campo">
              <IconButton
                size="small"
                onClick={onReroll}
                sx={{ width: 26, height: 26, color: "rgba(255,255,255,0.18)", borderRadius: "8px", "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" } }}
              >
                <CasinoRoundedIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── History card (mini) ──────────────────────────────────────────────────────

function HistoryCard({ npc, onRestore }: { npc: NpcData; onRestore: () => void }) {
  return (
    <Box
      onClick={onRestore}
      sx={{
        px: 1.25, py: 0.9, borderRadius: "11px",
        border: "1px solid rgba(255,255,255,0.07)",
        bgcolor: "rgba(255,255,255,0.02)",
        cursor: "pointer", transition: "all .13s",
        "&:hover": { bgcolor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.14)" },
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: "rgba(255,215,100,0.85)" }}>{npc.name}</Typography>
      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{npc.race} · {npc.profession}</Typography>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const FIELDS = Object.keys(FIELD_LABELS) as (keyof NpcData)[];

export default function NpcGenerator() {
  const [npc, setNpc] = useState<NpcData | null>(null);
  const [locked, setLocked] = useState<Partial<Record<keyof NpcData, boolean>>>({});
  const [history, setHistory] = useState<NpcData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  function generate(overrideLocked?: Partial<Record<keyof NpcData, boolean>>) {
    const locks = overrideLocked ?? locked;
    const lockedValues: Partial<NpcData> = {};
    if (npc) {
      for (const key of FIELDS) {
        if (locks[key]) lockedValues[key] = npc[key];
      }
    }
    const next = generateNpc(lockedValues, npc);
    if (npc) setHistory((h) => [npc, ...h].slice(0, 8));
    setNpc(next);
  }

  function rerollField(field: keyof NpcData) {
    if (!npc) return;
    const pickers: Record<keyof NpcData, () => string> = {
      name: buildName,
      race: () => pick(RACES),
      profession: () => pick(PROFESSIONS),
      personality: () => pick(PERSONALITIES),
      mannerism: () => pick(MANNERISMS),
      secret: () => pick(SECRETS),
      appearance: () => pick(APPEARANCES),
    };
    setNpc({ ...npc, [field]: pickers[field]() });
  }

  function toggleLock(field: keyof NpcData) {
    setLocked((p) => ({ ...p, [field]: !p[field] }));
  }

  function clearAll() {
    setNpc(null);
    setLocked({});
  }

  function restore(old: NpcData) {
    if (npc) setHistory((h) => [npc, ...h].slice(0, 8));
    setNpc(old);
    setHistory((h) => h.filter((x) => x !== old));
    setShowHistory(false);
  }

  function copyToClipboard() {
    if (!npc) return;
    const text = [
      `📛 ${npc.name}`,
      `🌍 ${npc.race} · ⚒️ ${npc.profession}`,
      `👁️ ${npc.appearance}`,
      `🧠 ${npc.personality}`,
      `💬 ${npc.mannerism}`,
      `🔐 Segredo: ${npc.secret}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const anyLocked = FIELDS.some((f) => locked[f]);

  return (
    <Box>
      {/* Header actions */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button
          onClick={() => generate()}
          variant="contained"
          startIcon={<CasinoRoundedIcon />}
          sx={{
            flex: 1, borderRadius: "13px", py: 1.15, textTransform: "none",
            fontWeight: 900, fontSize: 14,
            bgcolor: "rgba(120,80,220,0.85)",
            boxShadow: "0 4px 20px rgba(100,60,200,0.3)",
            "&:hover": { bgcolor: "rgba(140,100,240,0.9)" },
          }}
        >
          {npc ? "Sortear Novo NPC" : "Gerar NPC"}
        </Button>

        {npc && (
          <>
            <Tooltip title="Copiar para área de transferência">
              <IconButton
                onClick={copyToClipboard}
                sx={{ width: 40, height: 40, borderRadius: "11px", color: copied ? "rgba(100,220,140,0.9)" : "rgba(255,255,255,0.35)", border: "1px solid", borderColor: copied ? "rgba(80,180,100,0.4)" : "rgba(255,255,255,0.1)", bgcolor: copied ? "rgba(80,180,100,0.08)" : "rgba(255,255,255,0.04)", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
              >
                <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {anyLocked && (
              <Tooltip title="Limpar travas e NPC">
                <IconButton
                  onClick={clearAll}
                  sx={{ width: 40, height: 40, borderRadius: "11px", color: "rgba(255,120,120,0.5)", border: "1px solid rgba(220,60,60,0.2)", bgcolor: "rgba(220,60,60,0.05)", "&:hover": { bgcolor: "rgba(220,60,60,0.1)", color: "rgba(255,120,120,0.85)" } }}
                >
                  <RestartAltRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            {history.length > 0 && (
              <Tooltip title="Histórico">
                <IconButton
                  onClick={() => setShowHistory((v) => !v)}
                  sx={{ width: 40, height: 40, borderRadius: "11px", color: showHistory ? "rgba(255,215,80,0.85)" : "rgba(255,255,255,0.3)", border: "1px solid", borderColor: showHistory ? "rgba(255,195,60,0.35)" : "rgba(255,255,255,0.1)", bgcolor: showHistory ? "rgba(255,195,60,0.08)" : "rgba(255,255,255,0.04)", "&:hover": { bgcolor: "rgba(255,195,60,0.1)" } }}
                >
                  <HistoryRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Stack>

      {/* Help text when empty */}
      {!npc && (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <PersonRoundedIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.08)", mb: 1 }} />
          <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
            Gere um NPC de improviso com um clique.
            <br />
            Trave campos para mantê-los ao sortear novamente.
          </Typography>
        </Box>
      )}

      {/* NPC card */}
      {npc && (
        <Stack spacing={0.85}>
          {FIELDS.map((field) => (
            <FieldRow
              key={field}
              field={field}
              value={npc[field]}
              locked={!!locked[field]}
              onToggleLock={() => toggleLock(field)}
              onReroll={() => rerollField(field)}
            />
          ))}
        </Stack>
      )}

      {/* Hint about locks */}
      {npc && anyLocked && (
        <Box sx={{ mt: 1.5, px: 1.25, py: 0.9, borderRadius: "10px", bgcolor: "rgba(140,80,255,0.06)", border: "1px solid rgba(140,80,255,0.15)" }}>
          <Typography sx={{ fontSize: 11.5, color: "rgba(180,150,255,0.7)", textAlign: "center" }}>
            🔒 {FIELDS.filter((f) => locked[f]).length} campo{FIELDS.filter((f) => locked[f]).length !== 1 ? "s" : ""} travado{FIELDS.filter((f) => locked[f]).length !== 1 ? "s" : ""} — "Sortear Novo NPC" mantém esses valores
          </Typography>
        </Box>
      )}

      {/* History */}
      {showHistory && history.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", mb: 1 }}>
            Histórico (clique para restaurar)
          </Typography>
          <Stack spacing={0.6}>
            {history.map((h, i) => (
              <HistoryCard key={i} npc={h} onRestore={() => restore(h)} />
            ))}
          </Stack>
        </Box>
      )}

      {/* Locked field chips summary */}
      {npc && anyLocked && (
        <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mt: 1.5 }}>
          {FIELDS.filter((f) => locked[f]).map((f) => (
            <Chip
              key={f}
              label={`🔒 ${FIELD_LABELS[f]}`}
              size="small"
              onDelete={() => toggleLock(f)}
              sx={{
                height: 22, fontSize: 10.5, fontWeight: 700,
                bgcolor: FIELD_COLORS[f].bg,
                border: `1px solid ${FIELD_COLORS[f].border}`,
                color: FIELD_COLORS[f].accent,
                "& .MuiChip-deleteIcon": { color: FIELD_COLORS[f].accent, fontSize: 13, opacity: 0.6, "&:hover": { opacity: 1 } },
                "& .MuiChip-label": { px: 1 },
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
