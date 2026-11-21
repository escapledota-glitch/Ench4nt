'use client';

import { useRef, useEffect, forwardRef } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------
// <video> + Bunny Stream (HLS .m3u8) дэмжлэг.
// iPhone/Safari HLS-ийг шууд тоглуулна (чанарыг автоматаар сонгоно);
// Chrome, Android, компьютер дээр hls.js ашиглаж, чанар сонгох боломжтой.
// ----------------------------------------------------------------------

export const isHls = (url) => /\.m3u8(\?|$)/i.test(url ?? '');

// Босоо видеонд 1080x1920 → "1080p" (богино талаар нь)
const labelOf = (level) => Math.min(level.width || level.height, level.height || level.width);

/**
 * quality: -1 = автомат, эсвэл сонгосон өндөр (ж: 720)
 * onLevels([{ index, p }])   — боломжит чанарууд (hls.js үед л)
 * onLevelSwitched(p)          — автомат горимд одоо тоглож буй чанар
 */
export const KinoVideo = forwardRef(function KinoVideo({ src, quality = -1, onLevels, onLevelSwitched, ...other }, ref) {
  const hlsRef = useRef(null);
  const qualityRef = useRef(quality);
  qualityRef.current = quality;

  useEffect(() => {
    const video = ref?.current;
    if (!video || !src) return undefined;

    onLevels?.([]);

    if (!isHls(src)) {
      video.src = src;
      return undefined;
    }

    let cancelled = false;

    // hls.js-ийг боломжтой бол үргэлж ашиглана (чанар сонгох боломжтой болно).
    // Дэмжихгүй хөтөч (хуучин iPhone) дээр хөтчийн өөрийн HLS тоглуулагч.
    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        video.src = src;
        video.dispatchEvent(new Event('kino-ready'));
        return;
      }
      const hls = new Hls({ capLevelToPlayerSize: false, startLevel: -1, abrEwmaDefaultEstimate: 3_000_000 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels
          .map((l, index) => ({ index, p: labelOf(l) }))
          .filter((l) => l.p >= 300) // хэт бага чанарыг нуух
          .sort((a, b) => b.p - a.p);
        onLevels?.(levels);
        applyQuality(hls, qualityRef.current);
        if (other.autoPlay) video.play().catch(() => {});
        video.dispatchEvent(new Event('kino-ready'));
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        const l = hls.levels[data.level];
        if (l) onLevelSwitched?.(labelOf(l));
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else hls.destroy();
      });
    });

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Чанар солих
  useEffect(() => {
    if (hlsRef.current) applyQuality(hlsRef.current, quality);
  }, [quality]);

  return <Box component="video" ref={ref} {...other} />;
});

function applyQuality(hls, p) {
  if (!hls.levels?.length) return;
  if (p === -1) {
    hls.currentLevel = -1; // автомат
    return;
  }
  const idx = hls.levels.findIndex((l) => labelOf(l) === p);
  if (idx >= 0) hls.currentLevel = idx;
}
