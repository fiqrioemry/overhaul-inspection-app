import type { MessageType } from "@/schemas/chats.schema";

export function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("id-ID", { weekday: "short" });
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  }
}

export function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatLastMessage(text: string, type: MessageType, senderName?: string): string {
  const prefix = senderName ? `${senderName}: ` : "";

  switch (type) {
    case "image":
      return `${prefix}📷 Photo`;
    case "file":
      return `${prefix}📎 File`;
    case "audio":
      return `${prefix}🎵 Audio`;
    default:
      return `${prefix}${text}`;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/");
}

export function getMessageTypeFromFile(file: File): MessageType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

export function formatInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function groupMessagesByDate(messages: { createdAt: string }[]): string[] {
  const seen = new Set<string>();
  const dates: string[] = [];
  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!seen.has(dateKey)) {
      seen.add(dateKey);
      dates.push(msg.createdAt);
    }
  }
  return dates;
}
