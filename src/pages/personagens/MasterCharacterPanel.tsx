import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

import {
  SectionDivider,
  SectionIconBox,
  SectionLabelText,
  SkillEmptyBox,
} from "./ViewCharacter.styles";
import { listAllCharacters, getMasterCharacter } from "../../modules/characters/characters.api";
import { getMasterInventory, type InventoryItem } from "../../modules/inventory/inventory.api";
import { getMasterCharacterSpells, type CharacterSpell } from "../../modules/spells/spells.api";
import type { CharacterNote } from "../../modules/characters/characters.api";

// ─── helpers ────────────────────────────────────────────────────────────────

const RACE_ICON: Record<string, string> = {
  "Anão": "⛏️", "Elfo": "🌿", "Meio-Elfo": "🌟", "Humano": "🏛️",
  "Draconato": "🐉", "Gnomo": "⚙️", "Meio-Orc": "💪", "Hobbit": "🌻",
};

const ATTR_LABEL: Record<string, string> = {
  forca: "FOR", destreza: "DES", constituicao: "CON",
  inteligencia: "INT", sabedoria: "SAB", carisma: "CAR",
};

const ATTR_ICON: Record<string, string> = {
  forca: "🏋️", destreza: "🏃", constituicao: "🫀",
  inteligencia: "🧠", sabedoria: "👁️", carisma: "🗣️",
};

const SCHOOL_ICON: Record<string, string> = {
  "Abjuração": "🛡️", "Adivinhação": "🔮", "Conjuração": "✨",
  "Encantamento": "💫", "Evocação": "🔥", "Ilusão": "🌀",
  "Necromancia": "💀", "Transmutação": "⚗️",
};

const ARMOR_LABEL: Record<string, string> = {
  light: "Leve", medium: "Média", heavy: "Pesada", shield: "Escudo",
};

function mod(v: number) { return Math.floor((v - 10) / 2); }
function fmtMod(m: number) { return m >= 0 ? `+${m}` : `${m}`; }
function hpColor(pct: number) {
  if (pct > 0.5) return "rgba(60,220,130,0.9)";
  if (pct > 0.25) return "rgba(255,200,60,0.9)";
  return "rgba(255,90,90,0.9)";
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
      <SectionIconBox>{icon}</SectionIconBox>
      <SectionLabelText>{label}</SectionLabelText>
      <SectionDivider />
    </Stack>
  );
}

function CollapsibleSection({
  icon, label, children,
}: {
  icon: string; label: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Box>
      <Stack
        direction="row" alignItems="center" spacing={1}
        onClick={() => setOpen((p) => !p)}
        sx={{ mb: open ? 1.25 : 0, cursor: "pointer", userSelect: "none" }}
      >
        <SectionIconBox>{icon}</SectionIconBox>
        <SectionLabelText>{label}</SectionLabelText>
        <SectionDivider />
        <IconButton size="small" sx={{ color: "rgba(255,255,255,0.3)", ml: 0.5, flexShrink: 0 }}>
          {open ? <ExpandLessRoundedIcon sx={{ fontSize: 15 }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Stack>
      <Collapse in={open}>{children}</Collapse>
    </Box>
  );
}

// ─── Character List Card ─────────────────────────────────────────────────────

type ListCharacter = {
  id: number;
  name: string;
  nivel?: number;
  health?: number;
  maxHealth?: number;
  race?: { name: string } | null;
  subRace?: { name: string } | null;
  dndClass?: { name: string; icon: string } | null;
  idUser?: { name: string } | null;
};

function CharacterCard({ c, onClick }: { c: ListCharacter; onClick: () => void }) {
  const hpPct = c.maxHealth ? Math.max(0, (c.health ?? 0) / c.maxHealth) : 1;
  const hpClr = hpColor(hpPct);
  const raceName = c.race?.name ?? "";
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.5, py: 1.25, borderRadius: "14px", cursor: "pointer",
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "all .13s",
        "&:hover": { bgcolor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.14)" },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5}>
        {/* Class icon bubble */}
        <Box sx={{
          width: 40, height: 40, borderRadius: "12px", flexShrink: 0,
          bgcolor: "rgba(120,85,255,0.12)", border: "1px solid rgba(120,85,255,0.22)",
          display: "grid", placeItems: "center",
        }}>
          <Typography sx={{ fontSize: 20, lineHeight: 1 }}>
            {c.dndClass?.icon ?? "🎲"}
          </Typography>
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="baseline" spacing={0.75} flexWrap="wrap">
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.88)", lineHeight: 1.2 }}>
              {c.name}
            </Typography>
            {c.nivel && (
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "rgba(255,210,80,0.75)" }}>
                Nv {c.nivel}
              </Typography>
            )}
          </Stack>
          <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", mt: 0.2 }}>
            {[
              c.dndClass?.name,
              raceName ? `${RACE_ICON[raceName] ?? "🎲"} ${raceName}` : null,
              c.idUser?.name ? `👤 ${c.idUser.name}` : null,
            ].filter(Boolean).join(" · ")}
          </Typography>
        </Box>

        {/* HP pill */}
        {c.maxHealth != null && (
          <Box sx={{
            px: 1, py: 0.35, borderRadius: "8px", flexShrink: 0,
            bgcolor: "rgba(0,0,0,0.25)", border: `1px solid ${hpClr}44`,
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: hpClr, lineHeight: 1 }}>
              {c.health}/{c.maxHealth}
            </Typography>
            <Typography sx={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 600, textAlign: "center" }}>HP</Typography>
          </Box>
        )}

        <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
      </Stack>
    </Box>
  );
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

type DetailState = {
  char: any;
  inventory: InventoryItem[];
  spells: CharacterSpell[];
};

function DetailPanel({ charId, onBack }: { charId: number; onBack: () => void }) {
  const [state, setState] = useState<DetailState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      getMasterCharacter(charId),
      getMasterInventory(charId).then((r) => r.items).catch(() => []),
      getMasterCharacterSpells(charId).catch(() => []),
    ]).then(([char, inventory, spells]) => {
      if (!alive) return;
      setState({ char, inventory, spells });
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [charId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={22} sx={{ color: "rgba(255,195,60,0.6)" }} />
      </Box>
    );
  }

  if (!state) return null;

  const { char, inventory, spells } = state;
  const attrs = char.idAttribute ?? {};
  const skills: any[] = char.characterSkills ?? [];
  const notes: CharacterNote[] = char.notes ?? [];
  const raceName = char.race?.name ?? "";
  const className = char.dndClass?.name ?? "";
  const hpPct = char.maxHealth ? Math.max(0, char.health / char.maxHealth) : 1;
  const hpClr = hpColor(hpPct);
  const equippedArmor = inventory.filter((i) => i.isEquipped && i.armorType);

  return (
    <Box>
      {/* Back button */}
      <Box
        onClick={onBack}
        sx={{
          display: "inline-flex", alignItems: "center", gap: 0.75,
          mb: 2, cursor: "pointer", color: "rgba(255,255,255,0.4)",
          fontSize: 12.5, fontWeight: 700,
          transition: "color .12s",
          "&:hover": { color: "rgba(255,255,255,0.75)" },
        }}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 15 }} />
        Voltar à lista
      </Box>

      {/* ── Hero header ── */}
      <Box sx={{
        px: 2, py: 1.75, borderRadius: "16px", mb: 2,
        background: "linear-gradient(135deg, rgba(120,85,255,0.1) 0%, rgba(60,130,255,0.08) 100%)",
        border: "1px solid rgba(120,85,255,0.2)",
      }}>
        <Stack direction="row" alignItems="flex-start" gap={1.5}>
          <Box sx={{
            width: 52, height: 52, borderRadius: "15px", flexShrink: 0,
            bgcolor: "rgba(120,85,255,0.15)", border: "1px solid rgba(120,85,255,0.28)",
            display: "grid", placeItems: "center",
          }}>
            <Typography sx={{ fontSize: 26, lineHeight: 1 }}>
              {char.dndClass?.icon ?? "🎲"}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 900, color: "rgba(255,255,255,0.92)", lineHeight: 1.2 }}>
              {char.name}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.42)", mt: 0.3 }}>
              {[
                className && `${className}`,
                raceName && `${RACE_ICON[raceName] ?? "🎲"} ${raceName}${char.subRace ? ` · ${char.subRace.name}` : ""}`,
                char.background?.name && `📖 ${char.background.name}`,
              ].filter(Boolean).join("  ·  ")}
            </Typography>
            {char.idUser?.name && (
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.25)", mt: 0.3 }}>
                👤 {char.idUser.name}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Stats row */}
        <Stack direction="row" gap={1} sx={{ mt: 1.5 }} flexWrap="wrap">
          {[
            { label: "Nível", value: String(char.nivel ?? 1), color: "rgba(255,210,80,0.9)" },
            { label: "HP", value: `${char.health ?? 0}/${char.maxHealth ?? 0}`, color: hpClr },
            { label: "XP", value: (char.xp ?? 0).toLocaleString("pt-BR"), color: "rgba(180,150,255,0.85)" },
            { label: "PO", value: String(char.money ?? 0), color: "rgba(255,215,80,0.8)" },
          ].map(({ label, value, color }) => (
            <Box key={label} sx={{
              flex: "1 1 0", minWidth: 54, px: 1, py: 0.65, borderRadius: "10px",
              bgcolor: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
            }}>
              <Typography sx={{ fontSize: 14, fontWeight: 900, color, lineHeight: 1 }}>{value}</Typography>
              <Typography sx={{ fontSize: 9.5, color: "rgba(255,255,255,0.28)", fontWeight: 700, mt: 0.2 }}>{label}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Stack spacing={2}>
        {/* ── Attributes ── */}
        <CollapsibleSection icon="⚡" label="Atributos">
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0.75,
          }}>
            {Object.entries(ATTR_LABEL).map(([key, badge]) => {
              const val = Number(attrs[key] ?? 8);
              const m = mod(val);
              return (
                <Box key={key} sx={{
                  px: 1, py: 0.85, borderRadius: "12px", textAlign: "center",
                  bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <Typography sx={{ fontSize: 11, lineHeight: 1, mb: 0.3 }}>{ATTR_ICON[key]}</Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 900, color: "rgba(255,255,255,0.88)", lineHeight: 1 }}>
                    {val}
                  </Typography>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>
                    {badge}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: m >= 0 ? "rgba(100,220,160,0.85)" : "rgba(255,110,110,0.85)", mt: 0.2 }}>
                    {fmtMod(m)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </CollapsibleSection>

        {/* ── Skills ── */}
        {skills.length > 0 && (
          <CollapsibleSection icon="✨" label="Perícias">
            <Stack spacing={0.5}>
              {skills.map((cs: any, i: number) => (
                <Stack key={cs.id ?? i} direction="row" alignItems="center" gap={1}
                  sx={{ px: 1, py: 0.5, borderRadius: "8px", bgcolor: "rgba(255,255,255,0.02)" }}
                >
                  <Typography sx={{ fontSize: 12 }}>
                    {cs.skill?.attribute?.toLowerCase().includes("for") ? "🏋️"
                      : cs.skill?.attribute?.toLowerCase().includes("des") ? "🏃"
                      : cs.skill?.attribute?.toLowerCase().includes("int") ? "🧠"
                      : cs.skill?.attribute?.toLowerCase().includes("sab") ? "👁️"
                      : cs.skill?.attribute?.toLowerCase().includes("car") ? "🗣️"
                      : "✨"}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.78)", fontWeight: 600, flex: 1 }}>
                    {cs.skill?.name ?? "–"}
                  </Typography>
                  {cs.source && (
                    <Box sx={{
                      px: 0.65, py: 0.1, borderRadius: "5px",
                      bgcolor: cs.source === "class" ? "rgba(120,85,255,0.15)" : cs.source === "race" ? "rgba(60,180,130,0.12)" : "rgba(255,160,40,0.1)",
                      border: `1px solid ${cs.source === "class" ? "rgba(140,100,255,0.3)" : cs.source === "race" ? "rgba(80,200,160,0.28)" : "rgba(255,180,60,0.28)"}`,
                    }}>
                      <Typography sx={{ fontSize: 9, fontWeight: 800, color: cs.source === "class" ? "rgba(190,165,255,0.9)" : cs.source === "race" ? "rgba(120,230,180,0.9)" : "rgba(255,210,120,0.9)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {cs.source === "class" ? "Classe" : cs.source === "race" ? "Raça" : "Antecedente"}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              ))}
            </Stack>
          </CollapsibleSection>
        )}

        {/* ── Inventory ── */}
        <CollapsibleSection icon="🎒" label="Inventário">
          {inventory.length === 0 ? (
            <SkillEmptyBox>
              <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>Inventário vazio.</Typography>
            </SkillEmptyBox>
          ) : (
            <Stack spacing={0.5}>
              {inventory.map((item) => (
                <Stack key={item.id} direction="row" alignItems="center" gap={1}
                  sx={{ px: 1, py: 0.65, borderRadius: "9px", bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <Typography sx={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>
                    {item.armorType === "shield" ? "🔰"
                      : item.armorType ? "🛡️"
                      : item.category === "Arma" ? "⚔️"
                      : item.category === "Poção" ? "🧪"
                      : item.category === "Ferramenta" ? "🔧"
                      : item.category === "Magia" ? "✨"
                      : "📦"}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: item.isEquipped ? "rgba(100,220,160,0.9)" : "rgba(255,255,255,0.78)" }}>
                        {item.name}
                      </Typography>
                      {item.isEquipped && (
                        <Box sx={{ px: 0.55, py: 0.1, borderRadius: "4px", bgcolor: "rgba(60,180,100,0.15)", border: "1px solid rgba(60,180,100,0.28)" }}>
                          <Typography sx={{ fontSize: 9, fontWeight: 800, color: "rgba(100,220,140,0.9)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Equipado</Typography>
                        </Box>
                      )}
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {[
                        `x${item.quantity}`,
                        item.weight > 0 ? `${item.weight} kg` : null,
                        item.armorType ? `CA ${item.armorAc} · ${ARMOR_LABEL[item.armorType] ?? item.armorType}` : null,
                        item.category,
                      ].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </CollapsibleSection>

        {/* ── Spells ── */}
        {spells.length > 0 && (
          <CollapsibleSection icon="📖" label="Magias">
            <Stack spacing={0.5}>
              {spells.map((sp) => (
                <Stack key={sp.id} direction="row" alignItems="flex-start" gap={1}
                  sx={{ px: 1, py: 0.65, borderRadius: "9px", bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <Typography sx={{ fontSize: 13, lineHeight: 1, flexShrink: 0, mt: 0.1 }}>
                    {sp.school ? (SCHOOL_ICON[sp.school] ?? "✨") : "✨"}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.82)" }}>{sp.name}</Typography>
                      {sp.isRacial && (
                        <Box sx={{ px: 0.55, py: 0.1, borderRadius: "4px", bgcolor: "rgba(60,180,130,0.12)", border: "1px solid rgba(80,200,160,0.25)" }}>
                          <Typography sx={{ fontSize: 9, fontWeight: 800, color: "rgba(120,230,180,0.85)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Racial</Typography>
                        </Box>
                      )}
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {sp.level === 0 ? "Truque" : `${sp.level}° nível`}
                      {sp.school ? ` · ${sp.school}` : ""}
                      {sp.castingTime ? ` · ${sp.castingTime}` : ""}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </CollapsibleSection>
        )}

        {/* ── Notes ── */}
        {notes.length > 0 && (
          <CollapsibleSection icon="📝" label="Notas do Jogador">
            <Stack spacing={0.75}>
              {notes.map((note) => (
                <Box key={note.id} sx={{
                  px: 1.25, py: 1, borderRadius: "10px",
                  bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {note.text}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: "rgba(255,255,255,0.22)", mt: 0.5 }}>
                    {new Date(note.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CollapsibleSection>
        )}
      </Stack>
    </Box>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function MasterCharacterPanel() {
  const [characters, setCharacters] = useState<ListCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    listAllCharacters()
      .then((list) => setCharacters(list as ListCharacter[]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={22} sx={{ color: "rgba(255,195,60,0.6)" }} />
      </Box>
    );
  }

  if (selectedId !== null) {
    return (
      <DetailPanel
        charId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  if (characters.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography sx={{ fontSize: 32, mb: 1 }}>🎲</Typography>
        <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
          Nenhum personagem criado ainda.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", mb: 1.5 }}>
        {characters.length} personagem{characters.length !== 1 ? "s" : ""} · clique para ver detalhes
      </Typography>
      <Stack spacing={0.75}>
        {characters.map((c) => (
          <CharacterCard key={c.id} c={c} onClick={() => setSelectedId(c.id)} />
        ))}
      </Stack>
    </Box>
  );
}
