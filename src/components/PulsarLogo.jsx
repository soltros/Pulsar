export default function PulsarLogo({ className = "w-6 h-6" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Outer Diamond */}
      <polygon points="12,2 22,11 12,22 2,11" />
      {/* Inner 3D Facets */}
      <polygon points="12,2 17,11 12,22 7,11" />
      {/* Vertical Core Line */}
      <line x1="12" y1="2" x2="12" y2="22" />
      {/* Horizontal Horizon Line (Retrofuture Grid aesthetic) */}
      <line x1="2" y1="11" x2="22" y2="11" opacity="0.3" />
    </svg>
  );
}
