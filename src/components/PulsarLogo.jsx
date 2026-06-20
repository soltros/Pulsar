export default function PulsarLogo({ className = "w-6 h-6" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinejoin="miter" 
      className={className}
    >
      {/* Outer Minimal Diamond */}
      <polygon points="12,2 22,12 12,22 2,12" />
      {/* Inner Concentric Diamond */}
      <polygon points="12,7 17,12 12,17 7,12" opacity="0.5" />
      {/* Core Dot */}
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
