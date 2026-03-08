import { useEffect, useRef, useState, useCallback } from "react";
import { getChatSocket, disconnectChatSocket } from "./chat.socket";
import type { ChatMessage, ConversationPartner, OnlineUser } from "./chat.types";

export function useChatSocket(token: string | null, isMaster: boolean) {
  // Mensagens por jogador (mestre) ou mensagens diretas (jogador)
  const [messagesByPlayer, setMessagesByPlayer] = useState<Record<number, ChatMessage[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [conversationPartners, setConversationPartners] = useState<ConversationPartner[]>([]);
  // Não-lidos por playerId (mestre) ou total (jogador via playerId=0)
  const [unread, setUnread] = useState<Record<number, number>>({});

  // Qual conversa está aberta agora (para não incrementar não-lido)
  const openPlayerIdRef = useRef<number | null>(null);

  function addMessage(msg: ChatMessage) {
    // Para o mestre, identifica o parceiro pelo playerId
    // Para o jogador, o "parceiro" é sempre o mestre — usamos senderId/targetUserId do lado não-eu
    const partnerId = isMaster
      ? (msg.isMasterSender ? msg.targetUserId! : msg.senderId)
      : 0; // jogador: chave fixa 0

    setMessagesByPlayer((prev) => ({
      ...prev,
      [partnerId]: [...(prev[partnerId] ?? []), msg],
    }));

    // Unread: só conta se a conversa desse parceiro não está aberta
    if (openPlayerIdRef.current !== partnerId) {
      setUnread((prev) => ({ ...prev, [partnerId]: (prev[partnerId] ?? 0) + 1 }));
    }

    // Atualiza last message na lista de conversas (mestre)
    if (isMaster) {
      setConversationPartners((prev) => {
        const existing = prev.find((c) => c.userId === partnerId);
        if (existing) {
          return prev.map((c) =>
            c.userId === partnerId
              ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
              : c,
          );
        }
        // Nova conversa: adiciona com o nome disponível
        const name = msg.isMasterSender
          ? (msg.targetUserName ?? "Jogador")
          : msg.senderName;
        return [
          ...prev,
          { userId: partnerId, userName: name, lastMessage: msg.content, lastMessageAt: msg.createdAt },
        ];
      });
    }
  }

  function setOpenPlayer(playerId: number | null) {
    openPlayerIdRef.current = playerId;
    if (playerId !== null) {
      setUnread((prev) => ({ ...prev, [playerId]: 0 }));
    }
  }

  useEffect(() => {
    if (!token) {
      // Usuário deslogou — limpa estado
      setMessagesByPlayer({});
      setOnlineUsers([]);
      setConversationPartners([]);
      setUnread({});
      return;
    }
    const socket = getChatSocket(token);

    socket.on("chat:myHistory", (history: ChatMessage[]) => {
      setMessagesByPlayer({ 0: history });
    });

    socket.on("chat:conversation", ({ playerId, messages }: { playerId: number; messages: ChatMessage[] }) => {
      setMessagesByPlayer((prev) => ({ ...prev, [playerId]: messages }));
    });

    socket.on("chat:conversations", (partners: ConversationPartner[]) => {
      setConversationPartners(partners);
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      addMessage(msg);
    });

    socket.on("chat:onlineUsers", (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    socket.on("chat:userConnected", (user: OnlineUser) => {
      setOnlineUsers((prev) =>
        prev.some((u) => u.userId === user.userId) ? prev : [...prev, user],
      );
    });

    socket.on("chat:userDisconnected", ({ userId }: { userId: number }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    function onConnect() {
      socket.emit("chat:getOnlineUsers");
      if (isMaster) {
        socket.emit("chat:getConversations");
      } else {
        socket.emit("chat:getMyHistory");
      }
    }

    if (socket.connected) onConnect();
    else socket.on("connect", onConnect);

    return () => {
      socket.off("chat:myHistory");
      socket.off("chat:conversation");
      socket.off("chat:conversations");
      socket.off("chat:message");
      socket.off("chat:onlineUsers");
      socket.off("chat:userConnected");
      socket.off("chat:userDisconnected");
      socket.off("connect", onConnect);
      // Desconecta ao trocar de conta (token muda) ou deslogar
      disconnectChatSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isMaster]);

  const sendMessage = useCallback(
    (content: string, targetUserId?: number) => {
      if (!token) return;
      const socket = getChatSocket(token);
      socket.emit("chat:send", { content, targetUserId });
    },
    [token],
  );

  const loadConversation = useCallback(
    (playerId: number) => {
      if (!token) return;
      const socket = getChatSocket(token);
      socket.emit("chat:getConversation", { playerId });
    },
    [token],
  );

  const disconnect = useCallback(() => {
    disconnectChatSocket();
    setMessagesByPlayer({});
    setOnlineUsers([]);
    setConversationPartners([]);
    setUnread({});
  }, []);

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return {
    messagesByPlayer,
    onlineUsers,
    conversationPartners,
    unread,
    totalUnread,
    sendMessage,
    loadConversation,
    setOpenPlayer,
    disconnect,
  };
}
