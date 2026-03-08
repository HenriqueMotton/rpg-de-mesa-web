import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import { useChatSocket } from "./useChatSocket";
import type { ChatMessage, ConversationPartner } from "./chat.types";
import { useAuthStore } from "../auth/auth.store";
import { decodeToken } from "../../shared/auth/token";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── Bolha de mensagem ───────────────────────────────────────────────────────

function Bubble({ msg, myUserId }: { msg: ChatMessage; myUserId: number }) {
  const isMine = msg.senderId === myUserId;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", mb: 0.75 }}>
      {!isMine && (
        <Typography sx={{ fontSize: 10, color: msg.isMasterSender ? "#f87171" : "rgba(255,255,255,0.45)", fontWeight: 700, px: 0.5, mb: 0.2 }}>
          {msg.senderName}
        </Typography>
      )}
      <Box
        sx={{
          maxWidth: "82%",
          px: 1.25,
          py: 0.7,
          borderRadius: isMine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
          bgcolor: isMine
            ? (msg.isMasterSender ? "rgba(220,80,60,0.22)" : "rgba(120,85,255,0.22)")
            : "rgba(255,255,255,0.07)",
          border: "1px solid",
          borderColor: isMine
            ? (msg.isMasterSender ? "rgba(220,80,60,0.38)" : "rgba(120,85,255,0.38)")
            : "rgba(255,255,255,0.09)",
        }}
      >
        <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.45, wordBreak: "break-word" }}>
          {msg.content}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 9, color: "rgba(255,255,255,0.2)", px: 0.5, mt: 0.2 }}>
        {formatTime(msg.createdAt)}
      </Typography>
    </Box>
  );
}

// ─── Thread de mensagens ─────────────────────────────────────────────────────

function MessageThread({
  messages,
  myUserId,
  input,
  onInputChange,
  onSend,
  isMaster,
}: {
  messages: ChatMessage[];
  myUserId: number;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isMaster: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Mensagens */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.25,
          py: 1,
          display: "flex",
          flexDirection: "column",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.08)", borderRadius: 2 },
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              Nenhuma mensagem ainda.
            </Typography>
          </Box>
        )}
        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} myUserId={myUserId} />
        ))}
        <div ref={endRef} />
      </Box>

      {/* Input */}
      <Box sx={{ px: 1.25, py: 1, borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <Stack direction="row" alignItems="flex-end" spacing={0.75}>
          <TextField
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Mensagem…"
            multiline
            maxRows={3}
            size="small"
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.04)",
                fontSize: 12,
                "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&.Mui-focused fieldset": {
                  borderColor: isMaster ? "rgba(220,80,60,0.5)" : "rgba(120,85,255,0.5)",
                },
              },
              "& .MuiInputBase-input": { color: "rgba(255,255,255,0.88)", fontSize: 12, py: "6px" },
              "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.2)", opacity: 1 },
            }}
          />
          <IconButton
            onClick={onSend}
            disabled={!input.trim()}
            size="small"
            sx={{
              width: 34, height: 34, flexShrink: 0,
              bgcolor: isMaster ? "rgba(220,80,60,0.2)" : "rgba(120,85,255,0.2)",
              color: isMaster ? "#f87171" : "#a78bfa",
              border: "1px solid",
              borderColor: isMaster ? "rgba(220,80,60,0.35)" : "rgba(120,85,255,0.35)",
              borderRadius: "10px",
              "&:hover:not(:disabled)": { bgcolor: isMaster ? "rgba(220,80,60,0.32)" : "rgba(120,85,255,0.32)" },
              "&:disabled": { opacity: 0.3 },
            }}
          >
            <SendRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>
    </>
  );
}

// ─── Item da lista de conversas (visão mestre) ───────────────────────────────

function ConversationItem({
  partner,
  unread,
  isOnline,
  onClick,
}: {
  partner: ConversationPartner;
  unread: number;
  isOnline: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.5, py: 1,
        display: "flex", alignItems: "center", gap: 1.25,
        cursor: "pointer",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        transition: "background 0.15s",
        "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
      }}
    >
      {/* Avatar placeholder */}
      <Box
        sx={{
          width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
          bgcolor: "rgba(120,85,255,0.18)",
          border: "1px solid rgba(120,85,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#a78bfa" }}>
          {partner.userName.charAt(0).toUpperCase()}
        </Typography>
        {/* Indicador online */}
        <FiberManualRecordIcon
          sx={{
            fontSize: 9, position: "absolute", bottom: -1, right: -1,
            color: isOnline ? "#22c55e" : "rgba(255,255,255,0.2)",
            filter: isOnline ? "drop-shadow(0 0 3px rgba(34,197,94,0.7))" : "none",
          }}
        />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)" }} noWrap>
            {partner.userName}
          </Typography>
          <Typography sx={{ fontSize: 9, color: "rgba(255,255,255,0.25)", flexShrink: 0, ml: 1 }}>
            {formatDate(partner.lastMessageAt)}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.2 }}>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }} noWrap>
            {partner.lastMessage}
          </Typography>
          {unread > 0 && (
            <Box
              sx={{
                ml: 1, flexShrink: 0,
                minWidth: 18, height: 18, borderRadius: "9px",
                bgcolor: "#7B54FF", display: "flex", alignItems: "center", justifyContent: "center",
                px: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{unread}</Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

// ─── ChatWidget principal ────────────────────────────────────────────────────

export default function ChatWidget() {
  const token = useAuthStore((s) => s.token);
  const isMaster = useAuthStore((s) => s.isMaster);
  const payload = decodeToken(token);
  const myUserId = payload.sub as number;

  const [open, setOpen] = useState(false);
  // Para o mestre: qual jogador está selecionado (null = lista)
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const [input, setInput] = useState("");

  const {
    messagesByPlayer,
    onlineUsers,
    conversationPartners,
    unread,
    totalUnread,
    sendMessage,
    loadConversation,
    setOpenPlayer,
  } = useChatSocket(token, isMaster);

  const masterOnline = onlineUsers.some((u) => u.isMaster);

  // Sinaliza qual conversa está aberta (para limpar não-lidos)
  useEffect(() => {
    if (!open) {
      setOpenPlayer(null);
    } else if (isMaster) {
      setOpenPlayer(activePlayerId);
    } else {
      setOpenPlayer(0);
    }
  }, [open, activePlayerId, isMaster]); // eslint-disable-line react-hooks/exhaustive-deps

  function openPlayerConversation(playerId: number) {
    setActivePlayerId(playerId);
    setOpenPlayer(playerId);
    // Carrega mensagens se ainda não carregadas
    if (!messagesByPlayer[playerId]) {
      loadConversation(playerId);
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (isMaster) {
      if (!activePlayerId) return;
      sendMessage(trimmed, activePlayerId);
    } else {
      sendMessage(trimmed);
    }
    setInput("");
  }

  const activeMessages = isMaster
    ? (messagesByPlayer[activePlayerId ?? -1] ?? [])
    : (messagesByPlayer[0] ?? []);

  const activePartner = isMaster
    ? conversationPartners.find((c) => c.userId === activePlayerId)
    : null;

  const activePlayerOnline = isMaster && activePlayerId
    ? onlineUsers.some((u) => u.userId === activePlayerId)
    : false;

  // ── Header label ──
  const headerTitle = (() => {
    if (isMaster && activePlayerId && activePartner) return activePartner.userName;
    if (isMaster) return "Chat — Jogadores";
    return "Mestre";
  })();

  return (
    <>
      {/* Botão flutuante */}
      <Tooltip title="Chat" placement="left">
        <Badge
          badgeContent={totalUnread}
          max={99}
          sx={{
            position: "fixed", bottom: 80, right: 16, zIndex: 1300,
            "& .MuiBadge-badge": { bgcolor: "#7B54FF", color: "#fff", fontWeight: 800, fontSize: 10 },
          }}
        >
          <IconButton
            onClick={() => setOpen((v) => !v)}
            sx={{
              width: 48, height: 48,
              bgcolor: open ? "rgba(120,85,255,0.25)" : "rgba(14,11,28,0.92)",
              border: "1px solid",
              borderColor: open ? "rgba(120,85,255,0.55)" : "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              color: open ? "#a78bfa" : "rgba(255,255,255,0.6)",
              transition: "all 0.18s",
              "&:hover": { bgcolor: "rgba(120,85,255,0.2)", borderColor: "rgba(120,85,255,0.45)", color: "#a78bfa" },
            }}
          >
            <ChatRoundedIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Badge>
      </Tooltip>

      {/* Painel */}
      {open && (
        <Paper
          elevation={0}
          sx={{
            position: "fixed", bottom: 140, right: 16,
            width: 320, maxWidth: "calc(100vw - 32px)",
            height: 420, maxHeight: "calc(100vh - 180px)",
            zIndex: 1299,
            bgcolor: "rgba(10, 8, 22, 0.97)",
            border: "1px solid",
            borderColor: isMaster ? "rgba(220,80,60,0.2)" : "rgba(120,85,255,0.2)",
            borderRadius: "16px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          {/* Header */}
          <Stack
            direction="row" alignItems="center" justifyContent="space-between"
            sx={{ px: 1.5, py: 1, borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              {/* Botão voltar (mestre dentro de uma conversa) */}
              {isMaster && activePlayerId !== null && (
                <IconButton
                  size="small"
                  onClick={() => { setActivePlayerId(null); setOpenPlayer(null); }}
                  sx={{ color: "rgba(255,255,255,0.4)", p: 0.25 }}
                >
                  <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              <ChatRoundedIcon sx={{ fontSize: 15, color: isMaster ? "#f87171" : "#a78bfa" }} />
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
                {headerTitle}
              </Typography>
              {/* Indicador online (na conversa ativa ou mestre para o jogador) */}
              {((isMaster && activePlayerId !== null) || !isMaster) && (
                <Tooltip title={
                  isMaster
                    ? (activePlayerOnline ? "Online" : "Offline")
                    : (masterOnline ? "Mestre online" : "Mestre offline")
                }>
                  <FiberManualRecordIcon
                    sx={{
                      fontSize: 9,
                      color: (isMaster ? activePlayerOnline : masterOnline) ? "#22c55e" : "rgba(255,255,255,0.2)",
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
            <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: "rgba(255,255,255,0.3)", p: 0.25 }}>
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          {/* ── Visão do MESTRE: lista de conversas ── */}
          {isMaster && activePlayerId === null && (
            <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.08)", borderRadius: 2 } }}>
              {(() => {
                // Jogadores online sem conversa prévia
                const newPlayers = onlineUsers.filter(
                  (u) => !u.isMaster && !conversationPartners.some((c) => c.userId === u.userId),
                );

                if (conversationPartners.length === 0 && newPlayers.length === 0) {
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", p: 3 }}>
                      <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                        Nenhum jogador online.
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <>
                    {/* Conversas existentes */}
                    {conversationPartners.map((partner) => (
                      <ConversationItem
                        key={partner.userId}
                        partner={partner}
                        unread={unread[partner.userId] ?? 0}
                        isOnline={onlineUsers.some((u) => u.userId === partner.userId)}
                        onClick={() => openPlayerConversation(partner.userId)}
                      />
                    ))}

                    {/* Jogadores online sem histórico */}
                    {newPlayers.length > 0 && (
                      <>
                        {conversationPartners.length > 0 && (
                          <Typography sx={{ px: 1.5, pt: 1.25, pb: 0.5, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: 0.5, textTransform: "uppercase" }}>
                            Online sem conversa
                          </Typography>
                        )}
                        {newPlayers.map((u) => (
                          <ConversationItem
                            key={u.userId}
                            partner={{ userId: u.userId, userName: u.userName, lastMessage: "Iniciar conversa…", lastMessageAt: new Date().toISOString() }}
                            unread={0}
                            isOnline
                            onClick={() => openPlayerConversation(u.userId)}
                          />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </Box>
          )}

          {/* ── Visão do MESTRE: conversa aberta ── */}
          {isMaster && activePlayerId !== null && (
            <MessageThread
              messages={activeMessages}
              myUserId={myUserId}
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              isMaster={isMaster}
            />
          )}

          {/* ── Visão do JOGADOR ── */}
          {!isMaster && (
            <>
              {!masterOnline && (
                <Box sx={{ px: 1.5, py: 0.6, bgcolor: "rgba(255,200,0,0.07)", borderBottom: "1px solid rgba(255,200,0,0.1)" }}>
                  <Typography sx={{ fontSize: 11, color: "rgba(255,200,0,0.6)" }}>
                    O mestre está offline — sua mensagem será entregue quando ele conectar.
                  </Typography>
                </Box>
              )}
              <MessageThread
                messages={activeMessages}
                myUserId={myUserId}
                input={input}
                onInputChange={setInput}
                onSend={handleSend}
                isMaster={isMaster}
              />
            </>
          )}
        </Paper>
      )}
    </>
  );
}
