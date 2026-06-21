import PulsarLogo from './PulsarLogo';

export default function PlaceholderArt({ className = "w-full h-full", iconClassName = "w-1/2 h-1/2" }) {
  return (
    <div className={`p-[1px] bg-gradient-to-br from-primary to-orange-400 ${className} rounded-[inherit]`}>
      <div className="w-full h-full bg-black rounded-[inherit] flex items-center justify-center">
        <PulsarLogo className={`${iconClassName} text-primary`} />
      </div>
    </div>
  );
}
