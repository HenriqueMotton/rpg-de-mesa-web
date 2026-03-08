export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  isMasterSender: boolean;
  isPrivate: boolean;
  targetUserId: number | null;
  targetUserName: string | null;
  createdAt: string;
}

export interface OnlineUser {
  userId: number;
  userName: string;
  isMaster: boolean;
}

export interface ConversationPartner {
  userId: number;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
}
