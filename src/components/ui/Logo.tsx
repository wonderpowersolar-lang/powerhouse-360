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
      /* Sizing comes from the caller's classes (e.g. h-7 w-auto). NEVER set an
         inline height/width style here — inline styles beat the Tailwind
         classes and the logo renders at its natural ~192px height, blowing the
         nav up to >200px and occluding the station headlines. */
      className={className}
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
