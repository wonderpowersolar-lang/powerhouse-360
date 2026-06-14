"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { SceneVideoSrc } from "@/config/scenes";

/**
 * SceneVideo — a scroll-SCRUBBED video layer (no autoplay).
 *
 * The single stage rAF loop (ImageStage) owns all motion; this component never
 * runs its own loop and never calls play(). It exposes an imperative `seek(p)`
 * that maps p∈[0,1] → `video.currentTime`, so the clip is driven entirely by
 * scroll progress. Until the first seek the element is `preload="none"` and
 * shows its poster (identical to the still beneath), so nothing downloads for
 * off-screen stations — lazy by construction. On the first seek it lazy-loads;
 * once `loadedmetadata` fires (Safari-safe) seeks take effect. On any media
 * error it hides itself and the still <Image> beneath remains the fallback.
 */

export interface SceneVideoHandle {
  /** Seek to p∈[0,1] of the clip. Lazy-loads the media on the first call. */
  seek: (p: number) => void;
}

interface Props {
  src: SceneVideoSrc;
  /** poster + visual fallback — pass the station's still image */
  poster: string;
  focal: { x: number; y: number };
  onReady?: () => void;
  onError?: () => void;
}

const SceneVideo = forwardRef<SceneVideoHandle, Props>(function SceneVideo(
  { src, poster, focal, onReady, onError },
  ref
) {
  const vref = useRef<HTMLVideoElement>(null);
  const loadStarted = useRef(false);
  const ready = useRef(false);
  const duration = useRef(0);
  const lastT = useRef(-1);

  useImperativeHandle(
    ref,
    () => ({
      seek(p: number) {
        const v = vref.current;
        if (!v) return;
        // lazy-load on first demand
        if (!loadStarted.current) {
          loadStarted.current = true;
          try {
            v.load();
          } catch {
            /* ignore */
          }
        }
        if (!ready.current || !duration.current) return;
        const t = Math.min(0.999, Math.max(0, p)) * duration.current;
        // skip sub-frame deltas so we don't thrash the decoder
        if (Math.abs(t - lastT.current) < 1 / 60) return;
        lastT.current = t;
        try {
          v.currentTime = t;
        } catch {
          /* ignore seek-before-ready races */
        }
      },
    }),
    []
  );

  useEffect(() => {
    const v = vref.current;
    if (!v) return;
    const onMeta = () => {
      ready.current = true;
      duration.current = Number.isFinite(v.duration) ? v.duration : 0;
      onReady?.();
    };
    const onErr = () => {
      v.style.display = "none";
      onError?.();
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onErr, true);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onErr, true);
    };
  }, [onReady, onError]);

  return (
    <video
      ref={vref}
      muted
      playsInline
      preload="none"
      poster={poster}
      aria-hidden
      tabIndex={-1}
      disablePictureInPicture
      className="absolute inset-0 h-full w-full object-cover"
      style={{
        objectPosition: `${(focal.x * 100).toFixed(1)}% ${(
          focal.y * 100
        ).toFixed(1)}%`,
      }}
    >
      {src.webm && <source src={src.webm} type="video/webm" />}
      <source src={src.mp4} type="video/mp4" />
    </video>
  );
});

export default SceneVideo;
