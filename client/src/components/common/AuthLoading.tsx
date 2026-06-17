export default function AuthLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <div className="space-y-1">
          <p className="text-[13px] font-medium tracking-[0.25em] text-muted-foreground uppercase">Sistem Monitoring</p>
          <h1 className="text-[32px] font-bold tracking-tight text-foreground">
            Pantau <span className="text-accent">Inspeksi</span>
          </h1>
        </div>

        <div className="flex items-end justify-center gap-[5px] h-6">
          {[0, 120, 240, 360, 480].map((delay, i) => (
            <span
              key={i}
              className="w-[5px] rounded-full bg-accent animate-[barPulse_1.2s_ease-in-out_infinite]"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase">Memuat aplikasi...</p>
      </div>
    </div>
  );
}
