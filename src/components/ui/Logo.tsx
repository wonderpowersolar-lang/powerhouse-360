import Image from "next/image";

/**
 * Brand lockup for the launch site's off-black ground: the official stacked
 * mark + a typeset wordmark (warm white / gold). The original full-color
 * lockup asset carries dark navy type that disappears on the noir ground,
 * so the wordmark is set live in the brand font instead.
 */
export function LogoLockup({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/brand/logo-icon.svg"
        alt=""
        width={64}
        height={64}
        priority={priority}
        unoptimized
        className="h-full w-auto drop-shadow-[0_2px_10px_rgba(43,182,176,0.25)]"
        aria-hidden
      />
      <span className="whitespace-nowrap text-lg font-bold leading-none tracking-tight text-ink sm:text-xl">
        POWERHOUSE
        <span className="brand-gradient-text"> 360</span>
      </span>
    </span>
  );
}

export function LogoMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/logo-icon.svg"
      alt="POWERHOUSE 360"
      width={size}
      height={size}
      unoptimized
      className={className}
    />
  );
}
