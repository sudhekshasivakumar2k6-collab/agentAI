import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({ url }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (url && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [url]);

  if (!url) return null;

  const toggle = () => isPlaying ? audioRef.current.pause() : audioRef.current.play();

  return (
    <div className="audio-player">
      <button className={`audio-btn ${isPlaying ? "playing" : ""}`} onClick={toggle} title={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        <span>{isPlaying ? "Pause" : "Play Voice"}</span>
      </button>

      {error && <span className="audio-error">Audio unavailable</span>}

      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError(true)}
        style={{ display: "none" }}
      />
    </div>
  );
}
