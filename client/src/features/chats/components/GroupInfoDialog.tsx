/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/chats/components/GroupInfoDialog.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/stores/auth.store";
import { formatInitials } from "@/utils/formatChat";
import { Textarea } from "@/components/ui/textarea";
import type { ChatDetail } from "@/schemas/chats.schema";
import { useSearchUsers } from "@/features/users/users.query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, MoreVertical, UserPlus, Shield, ShieldOff, UserMinus, Search, Loader2, Crown, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUpdateGroup, useAddMembers, useRemoveMember, usePromoteMember, useDemoteMember } from "@/features/chats/chats.query";

interface GroupInfoDialogProps {
  chat: ChatDetail;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function GroupInfoDialog({ chat, open, onOpenChange }: GroupInfoDialogProps) {
  const user = useAuthStore((s) => s.user);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(chat.name ?? "");
  const [groupDesc, setGroupDesc] = useState(chat.description ?? "");
  const [showAddMember, setShowAddMember] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const { mutate: updateGroup, isPending: updatingGroup } = useUpdateGroup(chat.id);
  const { mutate: addMembers, isPending: addingMember } = useAddMembers(chat.id);
  const { mutate: removeMember } = useRemoveMember(chat.id);
  const { mutate: promoteMember } = usePromoteMember(chat.id);
  const { mutate: demoteMember } = useDemoteMember(chat.id);

  const { data: searchData, isFetching } = useSearchUsers({ search: debouncedSearch });

  const myParticipant = chat.participants.find((p) => p.userId === user?.id);
  const isAdmin = myParticipant?.role === "ADMIN";

  const existingIds = new Set(chat.participants.map((p) => p.userId));
  const searchResults = (searchData?.data ?? []).filter((u: any) => !existingIds.has(u.id) && u.id !== user?.id);

  function handleSaveGroup() {
    if (!groupName.trim()) return;
    updateGroup({ name: groupName.trim(), description: groupDesc.trim() || undefined }, { onSuccess: () => setIsEditing(false) });
  }

  function handleAddMember(userId: string) {
    addMembers({ userIds: [userId] }, { onSuccess: () => setSearch("") });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-base">Group Info</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 flex flex-col gap-5">
          {/* Group info */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-border">
            <Avatar className="size-16">
              <AvatarImage src={chat.avatar ?? undefined} />
              <AvatarFallback className="text-xl font-bold bg-primary/15 text-primary">{formatInitials(chat.name ?? "G")}</AvatarFallback>
            </Avatar>

            {isEditing ? (
              <div className="w-full flex flex-col gap-2">
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group Name" className="h-9 text-sm text-center rounded-xl" />
                <Textarea value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} placeholder="Group Description (optional)" rows={2} className="text-sm rounded-xl resize-none" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="flex-1 rounded-xl">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveGroup} disabled={updatingGroup} className="flex-1 rounded-xl">
                    {updatingGroup && <Loader2 size={14} className="animate-spin mr-1" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <p className="font-semibold text-foreground">{chat.name}</p>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsEditing(true)}>
                      <Edit2 size={13} />
                    </Button>
                  )}
                </div>
                {chat.description && <p className="text-xs text-muted-foreground mt-0.5">{chat.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">{chat.participants.length} members</p>
              </div>
            )}
          </div>

          {/* Add member */}
          {isAdmin && (
            <div>
              {!showAddMember ? (
                <Button variant="outline" size="sm" onClick={() => setShowAddMember(true)} className="w-full rounded-xl gap-2">
                  <UserPlus size={14} />
                  Add Member
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-8 h-9 text-sm rounded-xl" autoFocus />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        setShowAddMember(false);
                        setSearch("");
                      }}
                    >
                      <X size={15} />
                    </Button>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-border">
                    {isFetching ? (
                      <div className="flex justify-center py-3">
                        <Loader2 size={15} className="animate-spin text-muted-foreground" />
                      </div>
                    ) : debouncedSearch && searchResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">No users found</p>
                    ) : (
                      <ul>
                        {searchResults.map((u: any) => (
                          <li key={u.id}>
                            <button onClick={() => handleAddMember(u.id)} disabled={addingMember} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left">
                              <Avatar className="size-7 shrink-0">
                                <AvatarImage src={u.avatar ?? undefined} />
                                <AvatarFallback className="text-[10px]">{u.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{u.name}</p>
                                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                              </div>
                              <UserPlus size={13} className="text-muted-foreground shrink-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members list */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Anggota</p>
            <ul className="flex flex-col gap-0.5">
              {chat.participants.map((participant) => {
                const isMe = participant.userId === user?.id;
                const isParticipantAdmin = participant.role === "ADMIN";
                const isCreatorUser = chat.createdById === participant.userId;

                return (
                  <li key={participant.id} className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/30 transition-colors">
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage src={participant.user.avatar ?? undefined} />
                      <AvatarFallback className="text-xs font-semibold">{formatInitials(participant.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{participant.user.name}</p>
                        {isCreatorUser && <Crown size={12} className="text-amber-500 shrink-0" />}
                        {isParticipantAdmin && !isCreatorUser && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full">
                            Admin
                          </Badge>
                        )}
                        {isMe && <span className="text-[11px] text-muted-foreground">(Kamu)</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">@{participant.user.username}</p>
                    </div>

                    {/* Actions (admin only, not self) */}
                    {isAdmin && !isMe && !isCreatorUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0">
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {isParticipantAdmin ? (
                            <DropdownMenuItem onClick={() => demoteMember({ userId: participant.userId })}>
                              <ShieldOff className="size-4 mr-2" />
                              Turunkan Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => promoteMember({ userId: participant.userId })}>
                              <Shield className="size-4 mr-2" />
                              Jadikan Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => removeMember({ userId: participant.userId })}>
                            <UserMinus className="size-4 mr-2" />
                            Hapus dari Grup
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
