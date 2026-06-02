export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A"/>
          <stop offset="60%" stopColor="#1E3A8A"/>
          <stop offset="100%" stopColor="#2563EB"/>
        </linearGradient>
        <linearGradient id="logoText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD"/>
          <stop offset="100%" stopColor="#FFFFFF"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="110" fill="url(#logoBg)"/>
      <text x="75" y="370" fontFamily="Arial Black, Arial, sans-serif" fontSize="320" fontWeight="900" fill="url(#logoText)">D</text>
      <g transform="translate(310,90)">
        <path d="M55 0 A55 55 0 0 1 110 55" stroke="white" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.9"/>
        <path d="M55 110 A55 55 0 0 1 0 55" stroke="white" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.9"/>
        <polyline points="98,18 110,55 73,51" stroke="white" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        <polyline points="12,92 0,55 37,59" stroke="white" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
      </g>
    </svg>
  )
}
