import Image from 'next/image'

type Props = { size?: 'sm' | 'md' | 'lg'; dark?: boolean; showTagline?: boolean }

export default function PetCodeLogo({ size = 'md', dark = false, showTagline = false }: Props) {
  const h = size === 'sm' ? 36 : size === 'lg' ? 52 : 44
  const textCls = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl'
  const navColor = dark ? '#ffffff' : '#0B1F3B'

  return (
    <div className="flex items-center gap-2">
      <Image src="/logo-icon.svg" alt="PetCode" width={h} height={Math.round(h * 295 / 400)} priority />
      <span className={`font-extrabold ${textCls} tracking-tight leading-none`}>
        <span style={{ color: navColor }}>pet</span>
        <span className="text-teal">code</span>
      </span>
      {showTagline && (
        <span
          className="font-medium tracking-widest uppercase ml-1"
          style={{ color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(11,31,59,0.35)', fontSize: h * 0.22 }}
        >
          Digitalni identitet
        </span>
      )}
    </div>
  )
}
