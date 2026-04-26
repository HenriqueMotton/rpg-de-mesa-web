import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SwordsRoundedIcon from "@mui/icons-material/SportsMartialArtsRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";

import {
  SectionDivider,
  SectionIconBox,
  SectionLabelText,
  SkillEmptyBox,
} from "./ViewCharacter.styles";
import { listAllCharacters } from "../../modules/characters/characters.api";
import { listCustomNpcsPaginated } from "../../modules/custom-npcs/custom-npcs.api";
import {
  getActiveInitiative,
  publishInitiative,
  deactivateInitiative,
  setInitiativeTurn,
  updateEntryHp,
  type InitiativeEntry,
} from "../../modules/initiative/initiative.api";
import MonsterLibraryModal, { type MonsterSelection } from "./MonsterLibraryModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type CharacterRow = {
  id: number;
  name: string;
  classIcon?: string;
  className?: string;
  checked: boolean;
  initiative: string;
};

// Display-only (paginated list)
type NpcRow = {
  id: number;
  name: string;
  race?: string | null;
  role?: string | null;
  maxHp?: number | null;
};

// Persists selections across pages/searches
type NpcSelection = {
  name: string;
  race?: string | null;
  role?: string | null;
  maxHp?: number | null;
  initiative: string;
};

type MonsterRow = {
  tempId: string; // unique key (monsterId + index)
  monsterId: number;
  name: string;
  type: string;
  cr: string;
  xp: number;
  ac: number;
  acType?: string;
  maxHp: number;
  hpOverride: string; // custom HP input
  initiative: string;
  attacks: InitiativeEntry["attacks"];
  traits: InitiativeEntry["traits"];
  speed?: string;
  size?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  Humanoide: "🧑", "Morto-vivo": "🧟", Fera: "🐺", Dragão: "🐉",
  Gigante: "👹", Monstruosidade: "👾", Elemental: "🌊", Construto: "⚙️",
};
function typeIcon(t?: string) { return t ? (TYPE_ICONS[t] ?? "👾") : "👾"; }

function crColor(cr?: string) {
  if (!cr) return { bg: "rgba(160,160,160,0.1)", border: "rgba(160,160,160,0.2)", text: "rgba(200,200,200,0.7)" };
  const n = cr === "1/8" ? 0.125 : cr === "1/4" ? 0.25 : cr === "1/2" ? 0.5 : Number(cr);
  if (n === 0)  return { bg: "rgba(160,160,160,0.1)", border: "rgba(160,160,160,0.2)", text: "rgba(200,200,200,0.7)" };
  if (n <= 0.5) return { bg: "rgba(80,160,120,0.12)", border: "rgba(80,160,120,0.25)", text: "rgba(100,220,160,0.9)" };
  if (n <= 2)   return { bg: "rgba(80,120,200,0.12)", border: "rgba(80,120,200,0.25)", text: "rgba(120,170,255,0.9)" };
  if (n <= 5)   return { bg: "rgba(120,80,220,0.12)", border: "rgba(120,80,220,0.25)", text: "rgba(170,130,255,0.9)" };
  if (n <= 10)  return { bg: "rgba(200,120,40,0.12)", border: "rgba(200,120,40,0.25)", text: "rgba(255,175,80,0.9)" };
  if (n <= 17)  return { bg: "rgba(200,60,60,0.12)",  border: "rgba(200,60,60,0.25)",  text: "rgba(255,120,120,0.9)" };
  return              { bg: "rgba(140,0,180,0.14)",  border: "rgba(160,0,200,0.3)",   text: "rgba(220,120,255,0.95)" };
}

// ─── NpcHpControl ─────────────────────────────────────────────────────────────

function NpcHpControl({
  entry, entryIndex, onUpdated,
}: {
  entry: InitiativeEntry;
  entryIndex: number;
  onUpdated: () => void;
}) {
  const [localHp, setLocalHp] = useState(entry.currentHp ?? entry.maxHp ?? 0);
  const [saving, setSaving] = useState(false);
  const max = entry.maxHp ?? 1;
  const pct = Math.max(0, Math.min(100, (localHp / max) * 100));
  const barColor = pct > 60 ? "rgba(80,200,120,0.8)" : pct > 25 ? "rgba(255,180,60,0.8)" : "rgba(220,60,60,0.9)";
  const isDead = localHp === 0;

  async function change(delta: number) {
    const next = Math.max(0, Math.min(max, localHp + delta));
    setLocalHp(next);
    setSaving(true);
    try { await updateEntryHp(entryIndex, next); onUpdated(); } catch { /* silently */ } finally { setSaving(false); }
  }

  async function setExact(val: number) {
    const next = Math.max(0, Math.min(max, val));
    setLocalHp(next);
    setSaving(true);
    try { await updateEntryHp(entryIndex, next); onUpdated(); } catch { /* silently */ } finally { setSaving(false); }
  }

  return (
    <Box sx={{
      borderRadius: "11px",
      border: isDead ? "1px solid rgba(150,30,30,0.4)" : "1px solid rgba(255,255,255,0.07)",
      bgcolor: isDead ? "rgba(100,20,20,0.15)" : "rgba(255,255,255,0.025)",
      overflow: "hidden", transition: "all .15s", opacity: isDead ? 0.75 : 1,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.85 }}>
        <Typography sx={{ fontSize: 14, flexShrink: 0 }}>🧑</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {isDead && <Typography sx={{ fontSize: 11 }}>💀</Typography>}
            <Typography sx={{
              fontWeight: 700, fontSize: 12.5,
              color: isDead ? "rgba(255,150,150,0.6)" : "rgba(255,255,255,0.85)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textDecoration: isDead ? "line-through" : "none",
            }}>
              {entry.name}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 9.5, color: "rgba(160,200,255,0.45)", fontWeight: 600 }}>NPC</Typography>
        </Box>
        {!isDead && (
          <Stack direction="row" alignItems="center" spacing={0.4} sx={{ flexShrink: 0 }}>
            <IconButton size="small" onClick={() => change(-1)} disabled={saving || localHp === 0} sx={{ width: 22, height: 22, color: "rgba(255,120,120,0.8)", "&:hover": { bgcolor: "rgba(220,60,60,0.12)" } }}>
              <RemoveRoundedIcon sx={{ fontSize: 13 }} />
            </IconButton>
            <TextField
              value={localHp}
              onChange={(e) => setLocalHp(Number(e.target.value) || 0)}
              onBlur={(e) => setExact(Number(e.target.value) || 0)}
              type="number" size="small"
              inputProps={{ min: 0, max, style: { textAlign: "center", padding: "2px 4px", fontSize: 13, fontWeight: 800, color: "rgba(255,220,180,0.95)", width: 38 } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "rgba(100,160,255,0.06)", "& fieldset": { borderColor: "rgba(100,160,255,0.2)" }, "&.Mui-focused fieldset": { borderColor: "rgba(100,160,255,0.45)", borderWidth: 1.5 } } }}
            />
            <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>/{max}</Typography>
            <IconButton size="small" onClick={() => change(+1)} disabled={saving || localHp >= max} sx={{ width: 22, height: 22, color: "rgba(120,220,120,0.8)", "&:hover": { bgcolor: "rgba(60,180,60,0.12)" } }}>
              <AddRoundedIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Stack>
        )}
      </Box>
      {!isDead && (
        <Box sx={{ mx: 1, mb: 0.75, height: 4, borderRadius: "2px", bgcolor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: barColor, borderRadius: "2px", transition: "width .25s, background-color .25s" }} />
        </Box>
      )}
    </Box>
  );
}

// ─── MonsterHpControl ─────────────────────────────────────────────────────────

function MonsterHpControl({
  entry, entryIndex, onUpdated,
}: {
  entry: InitiativeEntry;
  entryIndex: number;
  onUpdated: () => void;
}) {
  const [localHp, setLocalHp] = useState(entry.currentHp ?? entry.maxHp ?? 0);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const max = entry.maxHp ?? 1;
  const pct = Math.max(0, Math.min(100, (localHp / max) * 100));
  const barColor = pct > 60 ? "rgba(80,200,120,0.8)" : pct > 25 ? "rgba(255,180,60,0.8)" : "rgba(220,60,60,0.9)";
  const isDead = entry.dead || localHp === 0;

  async function change(delta: number) {
    const next = Math.max(0, Math.min(max, localHp + delta));
    setLocalHp(next);
    setSaving(true);
    try {
      await updateEntryHp(entryIndex, next);
      onUpdated();
    } catch { /* silently */ } finally { setSaving(false); }
  }

  async function setExact(val: number) {
    const next = Math.max(0, Math.min(max, val));
    setLocalHp(next);
    setSaving(true);
    try {
      await updateEntryHp(entryIndex, next);
      onUpdated();
    } catch { /* silently */ } finally { setSaving(false); }
  }

  const lc = crColor(entry.cr);

  return (
    <Box
      sx={{
        borderRadius: "11px",
        border: isDead
          ? "1px solid rgba(150,30,30,0.4)"
          : "1px solid rgba(255,255,255,0.07)",
        bgcolor: isDead ? "rgba(100,20,20,0.15)" : "rgba(255,255,255,0.025)",
        overflow: "hidden",
        transition: "all .15s",
        opacity: isDead ? 0.75 : 1,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.85 }}>
        {/* Icon + name */}
        <Typography sx={{ fontSize: 14, flexShrink: 0 }}>{typeIcon(entry.monsterType)}</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {isDead && <Typography sx={{ fontSize: 11 }}>💀</Typography>}
            <Typography sx={{
              fontWeight: 700, fontSize: 12.5,
              color: isDead ? "rgba(255,150,150,0.6)" : "rgba(255,255,255,0.85)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textDecoration: isDead ? "line-through" : "none",
            }}>
              {entry.name}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Chip label={`CR ${entry.cr}`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 900, bgcolor: lc.bg, border: `1px solid ${lc.border}`, color: lc.text, "& .MuiChip-label": { px: 0.7 } }} />
            <Typography sx={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)" }}>CA {entry.ac}</Typography>
            {isDead && entry.xp && (
              <Chip label={`+${entry.xp.toLocaleString()} XP`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 900, bgcolor: "rgba(255,210,60,0.1)", border: "1px solid rgba(255,210,60,0.25)", color: "rgba(255,220,80,0.9)", "& .MuiChip-label": { px: 0.7 } }} />
            )}
          </Stack>
        </Box>

        {/* HP controls */}
        {!isDead && (
          <Stack direction="row" alignItems="center" spacing={0.4} sx={{ flexShrink: 0 }}>
            <IconButton size="small" onClick={() => change(-1)} disabled={saving || localHp === 0} sx={{ width: 22, height: 22, color: "rgba(255,120,120,0.8)", "&:hover": { bgcolor: "rgba(220,60,60,0.12)" } }}>
              <RemoveRoundedIcon sx={{ fontSize: 13 }} />
            </IconButton>
            <TextField
              value={localHp}
              onChange={(e) => setLocalHp(Number(e.target.value) || 0)}
              onBlur={(e) => setExact(Number(e.target.value) || 0)}
              type="number"
              size="small"
              inputProps={{ min: 0, max, style: { textAlign: "center", padding: "2px 4px", fontSize: 13, fontWeight: 800, color: "rgba(255,220,180,0.95)", width: 38 } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "rgba(255,120,60,0.06)", "& fieldset": { borderColor: "rgba(255,120,60,0.2)" }, "&.Mui-focused fieldset": { borderColor: "rgba(255,120,60,0.45)", borderWidth: 1.5 } } }}
            />
            <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>/{max}</Typography>
            <IconButton size="small" onClick={() => change(+1)} disabled={saving || localHp >= max} sx={{ width: 22, height: 22, color: "rgba(120,220,120,0.8)", "&:hover": { bgcolor: "rgba(60,180,60,0.12)" } }}>
              <AddRoundedIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Stack>
        )}

        {/* Expand for attacks/traits */}
        {(entry.attacks?.length || entry.traits?.length) ? (
          <Box onClick={() => setExpanded((v) => !v)} sx={{ cursor: "pointer", display: "grid", placeItems: "center", ml: 0.25 }}>
            <ExpandMoreRoundedIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.18)", transition: "transform .15s", transform: expanded ? "rotate(180deg)" : "none" }} />
          </Box>
        ) : null}
      </Box>

      {/* HP bar */}
      {!isDead && (
        <Box sx={{ mx: 1, mb: 0.75, height: 4, borderRadius: "2px", bgcolor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: barColor, borderRadius: "2px", transition: "width .25s, background-color .25s" }} />
        </Box>
      )}

      {/* Expanded attacks/traits */}
      <Collapse in={expanded} timeout={150}>
        <Box sx={{ px: 1, pb: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {entry.attacks && entry.attacks.length > 0 && (
            <Box sx={{ mt: 0.75 }}>
              <Typography sx={{ fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.18)", mb: 0.4 }}>Ataques</Typography>
              <Stack spacing={0.35}>
                {entry.attacks.map((atk, i) => (
                  <Box key={i} sx={{ borderRadius: "6px", px: 0.75, py: 0.4, bgcolor: "rgba(255,120,60,0.05)", border: "1px solid rgba(255,120,60,0.1)" }}>
                    <Typography component="span" sx={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,180,100,0.9)" }}>{atk.name} </Typography>
                    <Typography component="span" sx={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                      +{atk.bonus} · {atk.damage} {atk.damageType !== "—" ? atk.damageType : ""}
                    </Typography>
                    {atk.notes && <Typography sx={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)" }}>{atk.notes}</Typography>}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
          {entry.traits && entry.traits.length > 0 && (
            <Box sx={{ mt: 0.75 }}>
              <Typography sx={{ fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.18)", mb: 0.4 }}>Habilidades</Typography>
              <Stack spacing={0.3}>
                {entry.traits.map((t, i) => (
                  <Typography key={i} sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: "rgba(200,180,255,0.8)" }}>{t.name}. </Box>
                    {t.description}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InitiativeManager({ isMaster = false }: { isMaster?: boolean }) {
  const [rows, setRows]               = useState<CharacterRow[]>([]);
  const [monsterRows, setMonsterRows] = useState<MonsterRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [libOpen, setLibOpen]         = useState(false);
  const [charOpen, setCharOpen]       = useState(true);
  const [npcOpen, setNpcOpen]         = useState(false);
  const [monstersOpen, setMonstersOpen] = useState(true);

  // NPC — paginação + seleção independente
  const NPC_PAGE_SIZE = 20;
  const [npcItems, setNpcItems]         = useState<NpcRow[]>([]);
  const [npcTotal, setNpcTotal]         = useState(0);
  const [npcPage, setNpcPage]           = useState(1);
  const [npcLoadingMore, setNpcLoadingMore] = useState(false);
  const [npcSearchInput, setNpcSearchInput] = useState("");
  const [npcSearchActive, setNpcSearchActive] = useState("");
  const [npcChecked, setNpcChecked]     = useState<Record<number, NpcSelection>>({});
  const [activeSession, setActiveSession] = useState<{
    entries: InitiativeEntry[];
    currentTurnIndex: number;
    updatedAt: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [chars, session] = await Promise.all([
        listAllCharacters(),
        getActiveInitiative(),
      ]);

      setActiveSession(session?.isActive
        ? { entries: session.entries, currentTurnIndex: session.currentTurnIndex ?? 0, updatedAt: session.updatedAt }
        : null);

      setRows(chars.map((c) => ({
        id: c.id, name: c.name,
        classIcon: c.dndClass?.icon, className: c.dndClass?.name,
        checked: false, initiative: "",
      })));

    } catch {
      setError("Não foi possível carregar os personagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Character rows ──────────────────────────────────────────────────
  function toggle(id: number) { setRows((p) => p.map((r) => r.id === id ? { ...r, checked: !r.checked } : r)); }
  function setIni(id: number, v: string) { setRows((p) => p.map((r) => r.id === id ? { ...r, initiative: v } : r)); }

  // ── NPC paginação ────────────────────────────────────────────────────
  const loadNpcPage = useCallback(async (page: number, search: string, append: boolean) => {
    setNpcLoadingMore(true);
    try {
      const res = await listCustomNpcsPaginated({ page, limit: NPC_PAGE_SIZE, search: search || undefined, status: "alive" });
      const rows: NpcRow[] = res.data.map((n) => ({ id: n.id, name: n.name, race: n.race, role: n.role, maxHp: n.maxHp }));
      setNpcItems((prev) => append ? [...prev, ...rows] : rows);
      setNpcTotal(res.total);
      setNpcPage(page);
    } catch { /* silently */ } finally {
      setNpcLoadingMore(false);
    }
  }, [NPC_PAGE_SIZE]);

  // Abre a seção: carrega a primeira página
  useEffect(() => {
    if (npcOpen && npcItems.length === 0 && !npcLoadingMore) {
      loadNpcPage(1, npcSearchActive, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npcOpen]);

  // Debounce da busca: 400ms após o usuário parar de digitar
  useEffect(() => {
    const t = setTimeout(() => {
      setNpcSearchActive(npcSearchInput);
      setNpcItems([]);
      setNpcPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [npcSearchInput]);

  // Re-carrega quando a busca ativa muda (e a seção está aberta)
  useEffect(() => {
    if (!npcOpen) return;
    loadNpcPage(1, npcSearchActive, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npcSearchActive]);

  function handleNpcScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const npcHasMore = npcItems.length < npcTotal;
    if (scrollHeight - scrollTop - clientHeight < 50 && npcHasMore && !npcLoadingMore) {
      loadNpcPage(npcPage + 1, npcSearchActive, true);
    }
  }

  // ── NPC seleção ──────────────────────────────────────────────────────
  function toggleNpc(npc: NpcRow) {
    setNpcChecked((prev) => {
      if (prev[npc.id]) {
        const { [npc.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [npc.id]: { name: npc.name, race: npc.race, role: npc.role, maxHp: npc.maxHp, initiative: "" } };
    });
  }
  function setNpcIni(id: number, v: string) {
    setNpcChecked((prev) => prev[id] ? { ...prev, [id]: { ...prev[id], initiative: v } } : prev);
  }
  function removeNpcSelection(id: number) {
    setNpcChecked((prev) => { const { [id]: _, ...rest } = prev; return rest; });
  }

  // ── Monster staging ─────────────────────────────────────────────────
  function handleLibConfirm(selections: MonsterSelection[]) {
    const newRows: MonsterRow[] = [];
    for (const sel of selections) {
      for (let i = 0; i < sel.count; i++) {
        const tempId = `${sel.monster.id}-${Date.now()}-${i}`;
        newRows.push({
          tempId,
          monsterId: sel.monster.id,
          name: sel.count > 1 ? `${sel.monster.name} ${i + 1}` : sel.monster.name,
          type: sel.monster.type,
          cr: sel.monster.cr,
          xp: sel.monster.xp,
          ac: sel.monster.ac,
          acType: sel.monster.acType,
          maxHp: sel.monster.hp,
          hpOverride: String(sel.monster.hp),
          initiative: "",
          attacks: sel.monster.attacks,
          traits: sel.monster.traits,
          speed: sel.monster.speed,
          size: sel.monster.size,
        });
      }
    }
    setMonsterRows((p) => [...p, ...newRows]);
    setLibOpen(false);
  }

  function setMonsterIni(tempId: string, v: string) {
    setMonsterRows((p) => p.map((r) => r.tempId === tempId ? { ...r, initiative: v } : r));
  }
  function setMonsterHp(tempId: string, v: string) {
    setMonsterRows((p) => p.map((r) => r.tempId === tempId ? { ...r, hpOverride: v } : r));
  }
  function removeMonster(tempId: string) {
    setMonsterRows((p) => p.filter((r) => r.tempId !== tempId));
  }

  // ── Publish ─────────────────────────────────────────────────────────
  const selectedChars = rows.filter((r) => r.checked);
  const selectedNpcs  = Object.entries(npcChecked).map(([id, data]) => ({ id: Number(id), ...data }));

  async function handlePublish() {
    if (selectedChars.length === 0 && selectedNpcs.length === 0 && monsterRows.length === 0) {
      setError("Selecione ao menos um personagem, NPC ou monstro.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const charEntries: InitiativeEntry[] = selectedChars.map((r) => ({
        characterId: r.id, name: r.name, initiative: Number(r.initiative) || 0,
      }));
      const npcEntries: InitiativeEntry[] = selectedNpcs.map((n) => ({
        characterId: null,
        name: n.name,
        initiative: Number(n.initiative) || 0,
        isNpc: true,
        npcId: n.id,
        ...(n.maxHp ? { maxHp: n.maxHp, currentHp: n.maxHp, dead: false } : {}),
      }));
      const monsterEntries: InitiativeEntry[] = monsterRows.map((r) => ({
        characterId: null,
        name: r.name,
        initiative: Number(r.initiative) || 0,
        isMonster: true,
        monsterId: String(r.monsterId),
        monsterType: r.type,
        size: r.size,
        cr: r.cr,
        xp: r.xp,
        ac: r.ac,
        acType: r.acType,
        maxHp: Number(r.hpOverride) || r.maxHp,
        currentHp: Number(r.hpOverride) || r.maxHp,
        dead: false,
        speed: r.speed,
        attacks: r.attacks,
        traits: r.traits,
      }));
      await publishInitiative([...charEntries, ...npcEntries, ...monsterEntries]);
      setMonsterRows([]);
      setNpcChecked({});
      await load();
    } catch {
      setError("Não foi possível publicar a iniciativa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetTurn(index: number) {
    try {
      await setInitiativeTurn(index);
      setActiveSession((p) => p ? { ...p, currentTurnIndex: index } : p);
    } catch {
      setError("Não foi possível atualizar o turno.");
    }
  }

  async function handleDeactivate() {
    setSaving(true);
    setError(null);
    try {
      await deactivateInitiative();
      setActiveSession(null);
    } catch {
      setError("Não foi possível encerrar a sessão.");
    } finally {
      setSaving(false);
    }
  }

  // ── XP summary ──────────────────────────────────────────────────────
  const defeated = (activeSession?.entries ?? []).filter((e) => e.isMonster && e.dead);
  const totalXp = defeated.reduce((s, e) => s + (e.xp ?? 0), 0);

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <SectionIconBox>
          <SwordsRoundedIcon sx={{ fontSize: 14, color: "rgba(255,195,60,0.7)" }} />
        </SectionIconBox>
        <SectionLabelText>Iniciativa</SectionLabelText>
        <SectionDivider />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: 13, bgcolor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.18)", color: "rgba(255,150,150,0.9)" }}>
          {error}
        </Alert>
      )}

      {/* ── Active session ────────────────────────────────────────────────── */}
      {activeSession && (
        <Box sx={{ mb: 2, px: 1.75, py: 1.25, borderRadius: "13px", bgcolor: "rgba(255,195,60,0.07)", border: "1px solid rgba(255,195,60,0.2)" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,215,100,0.7)" }}>
              ⚔️ Sessão ativa
            </Typography>
            <Button
              size="small" onClick={handleDeactivate} disabled={saving}
              startIcon={saving ? <CircularProgress size={10} /> : <StopRoundedIcon sx={{ fontSize: "13px !important" }} />}
              sx={{ textTransform: "none", fontWeight: 800, fontSize: 11.5, color: "rgba(255,130,130,0.8)", borderRadius: "8px", "&:hover": { bgcolor: "rgba(220,60,60,0.08)" } }}
            >
              Encerrar
            </Button>
          </Stack>

          {/* Turn navigator */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25, px: 0.25 }}>
            <Tooltip title="Turno anterior"><span>
              <IconButton size="small" disabled={activeSession.currentTurnIndex === 0} onClick={() => handleSetTurn(activeSession.currentTurnIndex - 1)} sx={{ color: "rgba(255,215,100,0.6)", "&:hover": { bgcolor: "rgba(255,195,60,0.1)" }, "&.Mui-disabled": { color: "rgba(255,255,255,0.12)" } }}>
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </span></Tooltip>
            <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "rgba(255,230,130,0.85)", textAlign: "center", flex: 1 }}>
              Vez de: {activeSession.entries[activeSession.currentTurnIndex]?.name ?? "—"}
            </Typography>
            <Tooltip title="Próximo turno"><span>
              <IconButton size="small" disabled={activeSession.currentTurnIndex >= activeSession.entries.length - 1} onClick={() => handleSetTurn(activeSession.currentTurnIndex + 1)} sx={{ color: "rgba(255,215,100,0.6)", "&:hover": { bgcolor: "rgba(255,195,60,0.1)" }, "&.Mui-disabled": { color: "rgba(255,255,255,0.12)" } }}>
                <ArrowForwardIosRoundedIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </span></Tooltip>
          </Stack>

          {/* Entry list */}
          <Stack spacing={0.5}>
            {activeSession.entries.map((e, i) => {
              const isCurrent = i === activeSession.currentTurnIndex;
              if (e.isMonster) {
                return (
                  <Box key={i} sx={{ border: isCurrent ? "1px solid rgba(255,195,60,0.3)" : "1px solid transparent", borderRadius: "11px", transition: "border .15s" }}>
                    <MonsterHpControl
                      entry={e}
                      entryIndex={i}
                      onUpdated={load}
                    />
                    {isCurrent && (
                      <Box sx={{ mx: 1, mb: 0.5 }}>
                        <Chip label="▶ Vez deste" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 800, bgcolor: "rgba(255,195,60,0.15)", color: "rgba(255,220,80,0.9)", border: "1px solid rgba(255,195,60,0.3)", "& .MuiChip-label": { px: 0.7 } }} />
                      </Box>
                    )}
                  </Box>
                );
              }
              if (e.isNpc) {
                if (e.maxHp) {
                  return (
                    <Box key={i} sx={{ border: isCurrent ? "1px solid rgba(100,160,255,0.35)" : "1px solid transparent", borderRadius: "11px", transition: "border .15s" }}>
                      <NpcHpControl entry={e} entryIndex={i} onUpdated={load} />
                      {isCurrent && (
                        <Box sx={{ mx: 1, mb: 0.5 }}>
                          <Chip label="▶ Vez deste" size="small" sx={{ height: 16, fontSize: 9, fontWeight: 800, bgcolor: "rgba(100,160,255,0.15)", color: "rgba(160,200,255,0.9)", border: "1px solid rgba(100,160,255,0.3)", "& .MuiChip-label": { px: 0.7 } }} />
                        </Box>
                      )}
                    </Box>
                  );
                }
                // NPC sem HP — renderiza como personagem simples
                return (
                  <Stack
                    key={i} direction="row" alignItems="center" spacing={1}
                    onClick={() => handleSetTurn(i)}
                    sx={{
                      px: 0.75, py: 0.5, borderRadius: "8px", cursor: "pointer",
                      bgcolor: isCurrent ? "rgba(100,160,255,0.12)" : "transparent",
                      border: isCurrent ? "1px solid rgba(100,160,255,0.3)" : "1px solid transparent",
                      transition: "all .15s",
                      "&:hover": { bgcolor: isCurrent ? "rgba(100,160,255,0.16)" : "rgba(255,255,255,0.04)" },
                    }}
                  >
                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: isCurrent ? "rgba(160,200,255,0.85)" : "rgba(160,200,255,0.4)", width: 16 }}>
                      {isCurrent ? "▶" : `${i + 1}.`}
                    </Typography>
                    <Typography sx={{ fontSize: 14, flexShrink: 0 }}>🧑</Typography>
                    <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "rgba(210,230,255,0.95)" : "rgba(255,255,255,0.65)" }}>
                      {e.name}
                    </Typography>
                    <Typography sx={{ fontSize: 9.5, color: "rgba(160,200,255,0.4)", fontWeight: 600 }}>NPC</Typography>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: isCurrent ? "rgba(160,200,255,0.85)" : "rgba(160,200,255,0.45)" }}>
                      {e.initiative}
                    </Typography>
                  </Stack>
                );
              }
              // Character entry
              return (
                <Stack
                  key={i} direction="row" alignItems="center" spacing={1}
                  onClick={() => handleSetTurn(i)}
                  sx={{
                    px: 0.75, py: 0.5, borderRadius: "8px", cursor: "pointer",
                    bgcolor: isCurrent ? "rgba(255,195,60,0.12)" : "transparent",
                    border: isCurrent ? "1px solid rgba(255,195,60,0.3)" : "1px solid transparent",
                    transition: "all .15s",
                    "&:hover": { bgcolor: isCurrent ? "rgba(255,195,60,0.16)" : "rgba(255,255,255,0.04)" },
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 900, color: isCurrent ? "rgba(255,215,100,0.85)" : "rgba(255,215,100,0.4)", width: 16 }}>
                    {isCurrent ? "▶" : `${i + 1}.`}
                  </Typography>
                  <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "rgba(255,240,180,0.95)" : "rgba(255,255,255,0.65)" }}>
                    {e.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: isCurrent ? "rgba(255,215,100,0.85)" : "rgba(255,215,100,0.45)" }}>
                    {e.initiative}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>

          {/* XP Summary */}
          {defeated.length > 0 && (
            <Box sx={{ mt: 1.5, pt: 1.25, borderTop: "1px solid rgba(255,195,60,0.15)" }}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
                <EmojiEventsRoundedIcon sx={{ fontSize: 14, color: "rgba(255,215,60,0.7)" }} />
                <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,215,60,0.7)" }}>
                  XP dos Derrotados
                </Typography>
                <Chip
                  label={`${totalXp.toLocaleString()} XP total`}
                  size="small"
                  sx={{ height: 18, fontSize: 10, fontWeight: 900, bgcolor: "rgba(255,210,60,0.12)", border: "1px solid rgba(255,210,60,0.3)", color: "rgba(255,230,80,0.95)", "& .MuiChip-label": { px: 0.8 } }}
                />
              </Stack>
              <Stack spacing={0.3}>
                {defeated.map((e, i) => (
                  <Stack key={i} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5 }}>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                      💀 {e.name}
                      <Typography component="span" sx={{ fontSize: 10, color: "rgba(255,255,255,0.25)", ml: 0.5 }}>(CR {e.cr})</Typography>
                    </Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "rgba(255,220,80,0.8)" }}>
                      +{e.xp?.toLocaleString()} XP
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      )}

      {/* ── Personagens ──────────────────────────────────────────────────── */}
      <Box sx={{ mt: 0 }}>
        {/* Header colapsável */}
        <Box
          onClick={() => setCharOpen((v) => !v)}
          sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.85, borderRadius: "10px", cursor: "pointer", userSelect: "none", transition: "background .15s", "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,215,100,0.55)", flex: 1 }}>
            ⚔️ Personagens
          </Typography>
          {selectedChars.length > 0 && (
            <Chip label={`${selectedChars.length}/${rows.length}`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 900, bgcolor: "rgba(255,195,60,0.15)", color: "rgba(255,225,100,0.9)", border: "1px solid rgba(255,195,60,0.3)", "& .MuiChip-label": { px: 0.7 } }} />
          )}
          <ExpandMoreRoundedIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.18)", transition: "transform .2s", transform: charOpen ? "rotate(180deg)" : "none" }} />
        </Box>
        <Collapse in={charOpen} timeout={180}>
          <Box sx={{ maxHeight: 230, overflowY: "auto", pr: 0.25, "&::-webkit-scrollbar": { width: 3 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 } }}>
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 3 }}>
                <CircularProgress size={20} thickness={2.5} sx={{ color: "rgba(255,195,60,0.5)" }} />
              </Box>
            ) : rows.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic", textAlign: "center", py: 1.5 }}>
                Nenhum personagem cadastrado.
              </Typography>
            ) : (
              <Stack spacing={0.5} sx={{ py: 0.25 }}>
                {rows.map((row) => (
                  <Box
                    key={row.id} onClick={() => toggle(row.id)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1,
                      pl: 0.5, pr: 1, py: 0.75, borderRadius: "12px",
                      border: row.checked ? "1px solid rgba(255,195,60,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      bgcolor: row.checked ? "rgba(255,195,60,0.06)" : "rgba(255,255,255,0.025)",
                      cursor: "pointer", transition: "all .15s",
                      "&:hover": { bgcolor: row.checked ? "rgba(255,195,60,0.1)" : "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <Checkbox
                      checked={row.checked} size="small"
                      onClick={(e) => e.stopPropagation()} onChange={() => toggle(row.id)}
                      sx={{ color: "rgba(255,255,255,0.2)", p: 0.5, "&.Mui-checked": { color: "rgba(255,195,60,0.75)" } }}
                    />
                    {row.classIcon && <Typography sx={{ fontSize: 15, flexShrink: 0 }}>{row.classIcon}</Typography>}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.name}
                      </Typography>
                      {row.className && <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>{row.className}</Typography>}
                    </Box>
                    {row.checked && (
                      <TextField
                        value={row.initiative} onChange={(e) => { e.stopPropagation(); setIni(row.id, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Init." type="number"
                        inputProps={{ min: 0, max: 30, style: { textAlign: "center", padding: "4px 6px", fontSize: 13, fontWeight: 800, color: "rgba(255,220,100,0.9)", width: 42 } }}
                        sx={{ flexShrink: 0, "& .MuiOutlinedInput-root": { borderRadius: "9px", bgcolor: "rgba(255,195,60,0.07)", "& fieldset": { borderColor: "rgba(255,195,60,0.25)" }, "&:hover fieldset": { borderColor: "rgba(255,195,60,0.45)" }, "&.Mui-focused fieldset": { borderColor: "rgba(255,195,60,0.55)", borderWidth: 1.5 } } }}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* ── NPCs ─────────────────────────────────────────────────────────── */}
      <Box sx={{ mt: 0.5 }}>
        {/* Header colapsável */}
        <Box
          onClick={() => setNpcOpen((v) => !v)}
          sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.85, borderRadius: "10px", cursor: "pointer", userSelect: "none", transition: "background .15s", "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(100,160,255,0.55)", flex: 1 }}>
            🧑 NPCs
          </Typography>
          {selectedNpcs.length > 0 && (
            <Chip label={`${selectedNpcs.length} sel.`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 900, bgcolor: "rgba(100,160,255,0.15)", color: "rgba(160,200,255,0.9)", border: "1px solid rgba(100,160,255,0.3)", "& .MuiChip-label": { px: 0.7 } }} />
          )}
          {npcTotal > 0 && (
            <Chip label={`${npcTotal}`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", "& .MuiChip-label": { px: 0.7 } }} />
          )}
          <ExpandMoreRoundedIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.18)", transition: "transform .2s", transform: npcOpen ? "rotate(180deg)" : "none" }} />
        </Box>

        <Collapse in={npcOpen} timeout={180}>
          <Box sx={{ pb: 0.5 }}>
            {/* NPCs selecionados (persistem mesmo ao mudar a busca) */}
            {selectedNpcs.length > 0 && (
              <Box sx={{ mb: 0.75, px: 0.5 }}>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {selectedNpcs.map((n) => (
                    <Chip
                      key={n.id}
                      label={n.name}
                      size="small"
                      onDelete={() => removeNpcSelection(n.id)}
                      sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: "rgba(100,160,255,0.12)", color: "rgba(160,200,255,0.9)", border: "1px solid rgba(100,160,255,0.25)", "& .MuiChip-label": { px: 0.75 }, "& .MuiChip-deleteIcon": { fontSize: 12, color: "rgba(160,200,255,0.5)", "&:hover": { color: "rgba(160,200,255,0.9)" } } }}
                    />
                  ))}
                </Stack>
                {/* Inputs de iniciativa para selecionados */}
                <Stack spacing={0.4} sx={{ mt: 0.5 }}>
                  {selectedNpcs.map((n) => (
                    <Stack key={n.id} direction="row" alignItems="center" spacing={1} sx={{ px: 0.25 }}>
                      <Typography sx={{ flex: 1, fontSize: 11.5, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        🧑 {n.name}
                      </Typography>
                      <TextField
                        value={n.initiative}
                        onChange={(e) => setNpcIni(n.id, e.target.value)}
                        placeholder="Init." type="number"
                        inputProps={{ min: 0, max: 30, style: { textAlign: "center", padding: "3px 5px", fontSize: 12, fontWeight: 800, color: "rgba(160,200,255,0.9)", width: 40 } }}
                        sx={{ flexShrink: 0, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "rgba(100,160,255,0.07)", "& fieldset": { borderColor: "rgba(100,160,255,0.2)" }, "&.Mui-focused fieldset": { borderColor: "rgba(100,160,255,0.5)", borderWidth: 1.5 } } }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Busca com debounce */}
            <TextField
              value={npcSearchInput}
              onChange={(e) => setNpcSearchInput(e.target.value)}
              placeholder="Buscar NPC..." size="small" fullWidth
              inputProps={{ style: { fontSize: 12, padding: "5px 10px", color: "rgba(255,255,255,0.7)" } }}
              sx={{ mb: 0.75, "& .MuiOutlinedInput-root": { borderRadius: "9px", bgcolor: "rgba(255,255,255,0.03)", "& fieldset": { borderColor: "rgba(255,255,255,0.08)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.15)" }, "&.Mui-focused fieldset": { borderColor: "rgba(100,160,255,0.4)", borderWidth: 1.5 } } }}
            />

            {/* Lista paginada com scroll */}
            <Box
              onScroll={handleNpcScroll}
              sx={{ maxHeight: 220, overflowY: "auto", pr: 0.25, "&::-webkit-scrollbar": { width: 3 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 } }}
            >
              {npcItems.length === 0 && !npcLoadingMore ? (
                <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.2)", fontStyle: "italic", textAlign: "center", py: 1.5 }}>
                  {npcSearchInput ? "Nenhum NPC encontrado." : "Nenhum NPC vivo cadastrado."}
                </Typography>
              ) : (
                <Stack spacing={0.45}>
                  {npcItems.map((npc) => {
                    const isChecked = !!npcChecked[npc.id];
                    return (
                      <Box
                        key={npc.id} onClick={() => toggleNpc(npc)}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1,
                          pl: 0.5, pr: 1, py: 0.55, borderRadius: "11px",
                          border: isChecked ? "1px solid rgba(100,160,255,0.35)" : "1px solid rgba(255,255,255,0.06)",
                          bgcolor: isChecked ? "rgba(100,160,255,0.07)" : "rgba(255,255,255,0.025)",
                          cursor: "pointer", transition: "all .15s",
                          "&:hover": { bgcolor: isChecked ? "rgba(100,160,255,0.11)" : "rgba(255,255,255,0.05)" },
                        }}
                      >
                        <Checkbox
                          checked={isChecked} size="small"
                          onClick={(e) => e.stopPropagation()} onChange={() => toggleNpc(npc)}
                          sx={{ color: "rgba(255,255,255,0.2)", p: 0.5, "&.Mui-checked": { color: "rgba(100,160,255,0.75)" } }}
                        />
                        <Typography sx={{ fontSize: 13, flexShrink: 0 }}>🧑</Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 12, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {npc.name}
                          </Typography>
                          {(npc.race || npc.role) && (
                            <Typography sx={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)" }}>
                              {[npc.race, npc.role].filter(Boolean).join(" · ")}
                            </Typography>
                          )}
                        </Box>
                        {npc.maxHp && (
                          <Typography sx={{ fontSize: 10, color: "rgba(100,200,120,0.5)", fontWeight: 700, flexShrink: 0 }}>
                            ♥{npc.maxHp}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}

                  {/* Sentinel / loading indicator */}
                  {npcLoadingMore && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                      <CircularProgress size={14} thickness={3} sx={{ color: "rgba(100,160,255,0.5)" }} />
                    </Box>
                  )}
                  {!npcLoadingMore && npcItems.length < npcTotal && (
                    <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.18)", textAlign: "center", py: 0.5 }}>
                      Scroll para carregar mais ({npcTotal - npcItems.length} restantes)
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* ── Monstros ─────────────────────────────────────────────────────── */}
      <Box sx={{ mt: 0.5 }}>
        {/* Header colapsável */}
        <Box
          onClick={() => setMonstersOpen((v) => !v)}
          sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.85, borderRadius: "10px", cursor: "pointer", userSelect: "none", transition: "background .15s", "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(220,80,80,0.6)", flex: 1 }}>
            🧟 Monstros
          </Typography>
          {monsterRows.length > 0 && (
            <Chip label={`${monsterRows.length}`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 900, bgcolor: "rgba(220,80,80,0.12)", color: "rgba(255,150,150,0.85)", border: "1px solid rgba(220,80,80,0.25)", "& .MuiChip-label": { px: 0.7 } }} />
          )}
          <Box onClick={(e) => e.stopPropagation()}>
            <Button
              size="small" onClick={() => setLibOpen(true)}
              startIcon={<BugReportRoundedIcon sx={{ fontSize: "12px !important" }} />}
              sx={{ textTransform: "none", fontWeight: 800, fontSize: 10.5, borderRadius: "8px", color: "rgba(255,130,130,0.8)", border: "1px solid rgba(220,80,80,0.25)", bgcolor: "rgba(220,80,80,0.06)", py: 0.3, px: 1, "&:hover": { bgcolor: "rgba(220,80,80,0.12)", borderColor: "rgba(220,80,80,0.45)" } }}
            >
              Biblioteca
            </Button>
          </Box>
          <ExpandMoreRoundedIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.18)", transition: "transform .2s", transform: monstersOpen ? "rotate(180deg)" : "none" }} />
        </Box>
        <Collapse in={monstersOpen} timeout={180}>
          <Box sx={{ maxHeight: 260, overflowY: "auto", pr: 0.25, pb: 0.25, "&::-webkit-scrollbar": { width: 3 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 } }}>
            {monsterRows.length === 0 ? (
              <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.2)", fontStyle: "italic", textAlign: "center", py: 1 }}>
                Nenhum monstro adicionado.
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                {monsterRows.map((m) => {
                  const lc = crColor(m.cr);
                  return (
                    <Box key={m.tempId} sx={{ display: "flex", alignItems: "center", gap: 1, pl: 0.75, pr: 0.5, py: 0.65, borderRadius: "11px", border: "1px solid rgba(220,80,80,0.2)", bgcolor: "rgba(220,80,80,0.05)" }}>
                      <Typography sx={{ fontSize: 14, flexShrink: 0 }}>{typeIcon(m.type)}</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 12, color: "rgba(255,180,180,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.name}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip label={`CR ${m.cr}`} size="small" sx={{ height: 14, fontSize: 8.5, fontWeight: 900, bgcolor: lc.bg, border: `1px solid ${lc.border}`, color: lc.text, "& .MuiChip-label": { px: 0.5 } }} />
                          <Typography sx={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>CA {m.ac}</Typography>
                        </Stack>
                      </Box>
                      <TextField
                        value={m.hpOverride} onChange={(e) => setMonsterHp(m.tempId, e.target.value)}
                        placeholder="HP" type="number"
                        inputProps={{ min: 1, style: { textAlign: "center", padding: "3px 4px", fontSize: 12, fontWeight: 700, color: "rgba(255,200,160,0.9)", width: 34 } }}
                        sx={{ flexShrink: 0, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "rgba(255,100,60,0.07)", "& fieldset": { borderColor: "rgba(255,100,60,0.2)" }, "&.Mui-focused fieldset": { borderColor: "rgba(255,100,60,0.45)", borderWidth: 1.5 } } }}
                      />
                      <TextField
                        value={m.initiative} onChange={(e) => setMonsterIni(m.tempId, e.target.value)}
                        placeholder="Init." type="number"
                        inputProps={{ min: 0, max: 30, style: { textAlign: "center", padding: "3px 4px", fontSize: 12, fontWeight: 700, color: "rgba(255,220,100,0.9)", width: 34 } }}
                        sx={{ flexShrink: 0, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "rgba(255,195,60,0.07)", "& fieldset": { borderColor: "rgba(255,195,60,0.2)" }, "&.Mui-focused fieldset": { borderColor: "rgba(255,195,60,0.45)", borderWidth: 1.5 } } }}
                      />
                      <IconButton size="small" onClick={() => removeMonster(m.tempId)} sx={{ color: "rgba(255,100,100,0.4)", "&:hover": { color: "rgba(255,100,100,0.8)", bgcolor: "rgba(220,60,60,0.1)" } }}>
                        <StopRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* ── Publish button ───────────────────────────────────────────────── */}
      {(selectedChars.length > 0 || selectedNpcs.length > 0 || monsterRows.length > 0) && (
        <Button
          onClick={handlePublish} disabled={saving}
          variant="outlined"
          startIcon={saving ? <CircularProgress size={13} sx={{ color: "rgba(255,215,100,0.7)" }} /> : <PublishRoundedIcon />}
          fullWidth
          sx={{
            mt: 2, borderRadius: "13px", py: 1.1,
            textTransform: "none", fontWeight: 800, fontSize: 13,
            borderColor: "rgba(255,195,60,0.35)", color: "rgba(255,220,100,0.9)",
            bgcolor: "rgba(255,195,60,0.06)",
            "&:hover": { borderColor: "rgba(255,195,60,0.6)", bgcolor: "rgba(255,195,60,0.12)" },
          }}
        >
          Publicar iniciativa ({selectedChars.length} personagens{selectedNpcs.length > 0 ? ` + ${selectedNpcs.length} NPCs` : ""} + {monsterRows.length} monstros)
        </Button>
      )}

      <MonsterLibraryModal
        open={libOpen}
        isMaster={isMaster}
        onClose={() => setLibOpen(false)}
        onConfirm={handleLibConfirm}
      />
    </Box>
  );
}
