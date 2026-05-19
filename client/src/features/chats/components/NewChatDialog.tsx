/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/chats/components/NewChatDialog.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { Textarea } from "@/components/ui/textarea";
import { useSearchUsers } from "@/features/users/users.query";
import type { ChatParticipantUser } from "@/schemas/chats.schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, Users, MessageCircle, Loader2, ChevronRight } from "lucide-react";
import { useCreatePrivateChat, useCreateGroupChat } from "@/features/chats/chats.query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Mode = "select" | "private" | "group";

export default function NewChatDialog({ open, onOpenChange }: NewChatDialogProps) {
  const [mode, setMode] = useState<Mode>("select");
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<ChatParticipantUser[]>([]);

  const user = useAuthStore((s) => s.user);
  const { setActiveChatId } = useChatStore();
  const debouncedSearch = useDebounce(search, 350);

  const { data: searchData, isFetching } = useSearchUsers({ search: debouncedSearch });

  const { mutate: createPrivate, isPending: creatingPrivate } = useCreatePrivateChat();
  const { mutate: createGroup, isPending: creatingGroup } = useCreateGroupChat();

  const searchResults = (searchData?.data ?? []).filter((u: any) => u.id !== user?.id);

  function toggleUser(u: ChatParticipantUser) {
    setSelectedUsers((prev) => (prev.find((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]));
  }

  function handleCreatePrivate(targetUserId: string) {
    createPrivate(
      { targetUserId },
      {
        onSuccess: (res) => {
          setActiveChatId(res?.data?.id ?? null);
          onOpenChange(false);
        },
      },
    );
  }

  function handleCreateGroup() {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    createGroup(
      {
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        memberIds: selectedUsers.map((u) => u.id),
      },
      {
        onSuccess: (res) => {
          setActiveChatId(res?.data?.id ?? null);
          onOpenChange(false);
        },
      },
    );
  }

  function handleBack() {
    setMode("select");
    setSearch("");
    setSelectedUsers([]);
    setGroupName("");
    setGroupDesc("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2">
            {mode !== "select" && (
              <Button variant="ghost" size="icon" className="h-7 w-7 -ml-1" onClick={handleBack}>
                <ChevronRight size={16} className="rotate-180" />
              </Button>
            )}
            <DialogTitle className="text-base">{mode === "select" ? "New Message" : mode === "private" ? "Private Chat" : "Create Group"}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-5 pb-5 pt-4">
          {mode === "select" && (
            <div className="flex flex-col gap-3">
              <button onClick={() => setMode("private")} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Private Chat</p>
                  <p className="text-xs text-muted-foreground">Send a message to someone</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-muted-foreground" />
              </button>
              <button onClick={() => setMode("group")} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Create Group</p>
                  <p className="text-xs text-muted-foreground">Chat with multiple people</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-muted-foreground" />
              </button>
            </div>
          )}

          {(mode === "private" || mode === "group") && (
            <div className="flex flex-col gap-4">
              {/* Group fields */}
              {mode === "group" && (
                <div className="flex flex-col gap-2">
                  <Input placeholder="Group Name *" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="h-9 text-sm rounded-xl" />
                  <Textarea placeholder="Description (optional)" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} rows={2} className="text-sm rounded-xl resize-none" />
                </div>
              )}

              {/* Selected users (group) */}
              {mode === "group" && selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedUsers.map((u) => (
                    <Badge key={u.id} variant="secondary" className="gap-1 pl-2 pr-1 py-1 rounded-full">
                      {u.name}
                      <button onClick={() => toggleUser(u)} className="hover:text-destructive transition-colors">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-8 h-9 text-sm rounded-xl" />
              </div>

              {/* Results */}
              <div className="max-h-52 overflow-y-auto -mx-1 rounded-xl">
                {isFetching ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  </div>
                ) : debouncedSearch && searchResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
                ) : (
                  <ul>
                    {searchResults.map((u: any) => {
                      const isSelected = selectedUsers.some((x) => x.id === u.id);
                      return (
                        <li key={u.id}>
                          <button
                            onClick={() => {
                              if (mode === "private") {
                                handleCreatePrivate(u.id);
                              } else {
                                toggleUser(u);
                              }
                            }}
                            className={cn("w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left", isSelected ? "bg-primary/8" : "hover:bg-muted/50")}
                            disabled={creatingPrivate}
                          >
                            <Avatar className="size-8 shrink-0">
                              <AvatarImage src={u.avatar ?? undefined} />
                              <AvatarFallback className="text-xs">{u.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                            </div>
                            {mode === "group" && isSelected && (
                              <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <X size={10} className="text-primary-foreground" />
                              </div>
                            )}
                            {creatingPrivate && mode === "private" && <Loader2 size={14} className="animate-spin text-muted-foreground shrink-0" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Create group button */}
              {mode === "group" && (
                <Button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedUsers.length === 0 || creatingGroup} className="w-full rounded-xl">
                  {creatingGroup && <Loader2 size={14} className="animate-spin mr-2" />}
                  Create Group ({selectedUsers.length} members)
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
