import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useState, useRef, useEffect } from "react";
import { Loader2, Search, Users, X } from "lucide-react";
import { useSearchUsers } from "@/features/users/users.query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface SearchUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchUserDialog({ open, onOpenChange }: SearchUserDialogProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const { data: searchResults, isFetching: isSearching } = useSearchUsers({ search: debouncedSearch });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  function handleSelect(username: string) {
    navigate(`/profile/${username}`);
    handleClose();
  }

  function handleClose() {
    setSearchQuery("");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSearchQuery("");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent showCloseButton={false} className="h-90 w-full max-w-xl md:max-w-2xl rounded-2xl overflow-hidden">
        <DialogTitle className="sr-only">Search Users</DialogTitle>

        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <div className="flex items-center flex-1 gap-2 bg-muted/60 rounded-xl px-3 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input ref={inputRef} type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <button onClick={handleClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-1">
            Cancel
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {debouncedSearch.trim().length === 0 ? (
            <EmptyState icon="search" message="Type to search users" />
          ) : isSearching ? (
            <EmptyState icon="loader" message="Searching..." />
          ) : searchResults?.data?.length ? (
            <ul>
              {searchResults.data.map((u) => (
                <li key={u.id}>
                  <button onClick={() => handleSelect(u.username)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border/50 last:border-0">
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage src={u.avatar ?? undefined} />
                      <AvatarFallback className="text-xs font-medium">{u.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="users" message="No users found." />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  const icons: Record<string, React.ReactNode> = {
    search: <Search className="size-6 text-muted-foreground/50" />,
    loader: <Loader2 className="size-6 text-muted-foreground/50 animate-spin" />,
    users: <Users className="size-6 text-muted-foreground/50" />,
  };
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      {icons[icon]}
      <p className="text-sm">{message}</p>
    </div>
  );
}
