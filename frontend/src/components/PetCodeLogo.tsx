import Image from 'next/image'

type Props = { size?: 'sm' | 'md' | 'lg'; dark?: boolean; showTagline?: boolean }

export default function PetCodeLogo({ size = 'md', dark = false, showTagline = false }: Props) {
  const h = size === 'sm' ? 44 : size === 'lg' ? 80 : 60

  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo-petcode.png"
        alt="PetCode"
        width={h}
        height={h}
        priority
        style={{ objectFit: 'contain' }}
      />
      {showTagline && (
        <span
          className="font-medium tracking-widest uppercase"
          style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(11,31,59,0.35)', fontSize: h * 0.2 }}
        >
          Digitalni identitet
        </span>
      )}
    </div>
  )
}
