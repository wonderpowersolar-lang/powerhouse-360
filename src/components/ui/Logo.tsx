import Image from "next/image";

/**
 * Brand logo lockup (mark + wordmark). Uses the official asset; never
 * recolored or reproportioned.
 */
export function LogoLockup({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo-lockup.png"
      alt="POWERHOUSE 360"
      width={300}
      height={70}
      priority={priority}
      className={className}
      style={{ height: "auto", width: "auto" }}
    />
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
      src="/brand/logo-mark.png"
      alt="POWERHOUSE 360"
      width={size}
      height={size}
      className={className}
    />
  );
}
