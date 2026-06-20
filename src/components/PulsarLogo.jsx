export default function PulsarLogo({ className = "w-6 h-6", classNameInner = "" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" className={classNameInner} />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10l2.1 2.1M4.9 19.1l2.1-2.1m10-10l2.1-2.1" opacity="0.4"/>
      <circle cx="12" cy="12" r="8" strokeDasharray="4 4" className="animate-[spin_15s_linear_infinite]" />
      <circle cx="12" cy="12" r="11" opacity="0.1" />
    </svg>
  );
}
