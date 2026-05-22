type Props = { size?: 'sm' | 'md' | 'lg'; dark?: boolean; showTagline?: boolean }

export default function PetCodeLogo({ size = 'md', dark = false, showTagline = false }: Props) {
  const h = size === 'sm' ? 26 : size === 'lg' ? 42 : 34
  const navy = dark ? '#ffffff' : '#0B1F3B'
  const teal = '#19B6B2'

  return (
    <div className="flex items-center gap-2.5">
      <svg height={h} viewBox="0 0 52 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dog body — navy */}
        <path
          d="M5 40 L5 25 C5 17 10 11 17 10 L18 6 L21 10 L23 7 C24 12 22 17 21 21 L21 40"
          stroke={navy} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Dog ear */}
        <path d="M13 11 C9 10 7 14 9 18" stroke={navy} strokeWidth="2" strokeLinecap="round" />
        {/* Cat body — teal */}
        <path
          d="M24 40 L24 21 C24 17 23 12 24 7 L27 11 L30 6 L32 11 C39 11 44 17 44 25 L44 40"
          stroke={teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* QR tag pendant */}
        <rect x="18" y="27" width="12" height="12" rx="2.5" stroke={navy} strokeWidth="1.6" fill="white" />
        <rect x="20" y="29" width="3.5" height="3.5" rx="0.6" fill={navy} />
        <rect x="24.5" y="29" width="3.5" height="3.5" rx="0.6" fill={navy} />
        <rect x="20" y="33.5" width="3.5" height="3.5" rx="0.6" fill={navy} />
        <rect x="24.5" y="33.5" width="1.5" height="1.5" fill={teal} />
        <rect x="26.5" y="33.5" width="1.5" height="1.5" fill={teal} />
        <rect x="24.5" y="35.5" width="1.5" height="1.5" fill={teal} />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className="font-extrabold tracking-tight"
          style={{ color: navy, fontSize: h * 0.6 }}
        >
          pet<span style={{ color: teal }}>code</span>
        </span>
        {showTagline && (
          <span
            className="font-medium tracking-widest uppercase"
            style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(11,31,59,0.35)', fontSize: h * 0.22 }}
          >
            Digitalni identitet
          </span>
        )}
      </div>
    </div>
  )
}
