export default function AuthLoading() {
  return (
    <div className="min-h-screen  flex items-center justify-center">
      <div className="text-center">
        {/* App wordmark — swap with your actual logo */}
        <p className="text-[28px] tracking-[-0.5px] text-accent mb-12">Pixel.</p>

        {/* Animated bar equalizer */}
        <div className="flex items-end justify-center gap-1 h-7 mb-8">
          {[0, 150, 300, 450, 600].map((delay, i) => (
            <span key={i} className="w-[6px] rounded-sm bg-accent animate-[barPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>

        <p className="text-sm text-accent uppercase tracking-[0.1em]">Loading ...</p>
      </div>
    </div>
  );
}
