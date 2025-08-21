export default function PlusBadge({ className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold text-xs shadow-md ml-2 animate-pulse " +
        className
      }
      title="Plus Member"
    >
      <svg className="w-4 h-4 mr-1" fill="gold" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" stroke="white" strokeWidth="2" fill="gold" />
        <text x="10" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fill="orange">★</text>
      </svg>
      PLUS
    </span>
  );
}
