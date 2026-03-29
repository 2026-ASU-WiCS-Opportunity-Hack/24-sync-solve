export function AILoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Main animated orb */}
        <div className="relative h-24 w-24">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-purple-400 border-r-purple-300" />

          {/* Middle pulsing ring */}
          <div className="absolute inset-2 animate-pulse rounded-full border-2 border-purple-500/20" />

          {/* Inner glowing sparkles */}
          <div className="absolute inset-4 animate-pulse rounded-full bg-gradient-to-br from-purple-400 to-blue-400 opacity-40" />

          {/* Center core */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50" />

          {/* Floating particles */}
          <div className="absolute -inset-1 rounded-full">
            {[0, 90, 180, 270].map((angle) => (
              <div
                key={angle}
                className="absolute h-2 w-2 rounded-full bg-purple-400"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${angle}deg) translateY(-16px)`,
                  animation: `orbit 3s linear infinite`,
                  animationDelay: `${(angle / 360) * 3}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="mb-2 font-semibold text-white">Finding Perfect Matches...</p>
          <p className="text-sm text-purple-200">AI is analyzing your request</p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-purple-400"
              style={{
                animation: `bounce 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateY(-16px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateY(-16px) rotate(-360deg);
          }
        }

        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
