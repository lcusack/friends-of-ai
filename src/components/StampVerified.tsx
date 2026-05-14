type Props = {
  size?: number;
  className?: string;
  number?: number;
};

export default function StampVerified({ size = 180, className = "", number }: Props) {
  const label = number ? `VERIFIED HUMAN · #${number.toString().padStart(6, "0")}` : "VERIFIED · FRIEND OF AI";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`${className} animate-pop`}
      aria-hidden="true"
      style={{ transform: "rotate(-8deg)", filter: "drop-shadow(0 2px 0 rgba(42,34,51,0.06))" }}
    >
      <defs>
        <path
          id="circlePath"
          d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"
        />
      </defs>
      <circle cx="100" cy="100" r="84" fill="none" stroke="#D14B6E" strokeWidth="3" opacity="0.85" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="#D14B6E" strokeWidth="1.5" opacity="0.6" />
      <circle cx="100" cy="100" r="42" fill="none" stroke="#D14B6E" strokeWidth="3" opacity="0.85" />
      <text fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="700" fill="#D14B6E" letterSpacing="2">
        <textPath href="#circlePath" startOffset="0">
          {label} · {label}
        </textPath>
      </text>
      <text
        x="100"
        y="96"
        textAnchor="middle"
        fontFamily="ui-rounded, system-ui"
        fontSize="22"
        fontWeight="800"
        fill="#D14B6E"
        letterSpacing="1"
      >
        FRIEND
      </text>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontFamily="ui-rounded, system-ui"
        fontSize="22"
        fontWeight="800"
        fill="#D14B6E"
        letterSpacing="1"
      >
        OF AI
      </text>
    </svg>
  );
}
