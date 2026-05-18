interface StatItemProps {
  label: string;
  value: number;
  onClick?: () => void;
}

function StatItem({ label, value, onClick }: StatItemProps) {
  const isClickable = !!onClick;
  return (
    <button type="button" onClick={onClick} disabled={!isClickable} className="flex flex-col items-center gap-0.5 disabled:cursor-default">
      <span className="text-sm font-bold">{(value ?? 0).toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

interface ProfileStatsProps {
  posts: number;
  followers: number;
  following: number;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
}

export default function ProfileStats({ posts, followers, following, onFollowersClick, onFollowingClick }: ProfileStatsProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <StatItem label="Posts" value={posts} />
      <StatItem label="Followers" value={followers} onClick={onFollowersClick} />
      <StatItem label="Following" value={following} onClick={onFollowingClick} />
    </div>
  );
}
