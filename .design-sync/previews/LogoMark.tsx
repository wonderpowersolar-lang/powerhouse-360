/**
 * LogoMark-Previews — das freistehende Markenzeichen in den zwei üblichen
 * Größen (64/40 px), auf dem Off-Black-Ground der Site (bg-navy-900).
 */
import { LogoMark } from "@ph360/website";

export function Standard() {
  return (
    <div className="inline-flex items-end gap-6 rounded-2xl bg-navy-900 p-8">
      <LogoMark size={64} />
      <LogoMark size={40} />
    </div>
  );
}
