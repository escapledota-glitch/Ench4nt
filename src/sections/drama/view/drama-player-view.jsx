'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';

import { RouterLink } from 'src/routes/components';

import { useDramaAuth } from '../drama-auth';
import { isHls, KinoVideo } from '../drama-video';
import { useDramaStore } from '../use-drama-store';
import { SubtitleOverlay } from '../drama-subtitles';
import { C, Icon , NotFoundState } from '../drama-ui';
import { useCatalog, useStreamUrl } from '../drama-catalog';
import { freeLabel, isFreeEpisode, previewSeconds, getEpisodeVideo } from '../drama-data';

// ----------------------------------------------------------------------
// Босоо бүтэн дэлгэцийн тоглуулагч.
// Утсан дээр: дээш шудрах = дараагийн анги, доош = өмнөх, дарах = зогсоох/тоглуулах.
// Компьютер дээр: ↑ ↓ товч, хулганы дугуй, Space.
// ----------------------------------------------------------------------

export function DramaPlayerView({ id, initialEp }) {
  const { getSeries, loading: catalogLoading } = useCatalog();
  const series = getSeries(id);
  const { saved, toggleSaved, recordWatch } = useDramaStore();
  const { user, isSubscribed, loading: authLoading } = useDramaAuth();

  const videoRef = useRef(null);
  const touch = useRef(null);
  const wheelLock = useRef(0);

  const [ep, setEp] = useState(initialEp);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [levels, setLevels] = useState([]);
  const [autoP, setAutoP] = useState(null);
  const [prefs, setPrefs] = usePlayerPrefs();
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const [isFs, setIsFs] = useState(false);
  const rootRef = useRef(null);
  const hideTimer = useRef(null);

  const total = series?.episodes ?? 1;
  const isMovie = total === 1;
  // Үнэгүй ангиас хойш захиалга шаардлагатай.
  // Админ "үнэгүй үзэх хугацаа" тохируулсан бол багцгүй хүн тэр хэдэн минутыг үзнэ.
  const paidEp = series ? !isFreeEpisode(ep, series) : false;
  const freeSecs = previewSeconds(series);
  const previewLimit = paidEp && !isSubscribed && freeSecs > 0 ? freeSecs : 0;
  const locked = paidEp && (authLoading || !isSubscribed) && freeSecs === 0;
  const [previewEnded, setPreviewEnded] = useState(false);
  const showPaywall = locked || (previewEnded && previewLimit > 0);

  // Анги солигдох эсвэл багц авахад урьдчилан үзэх төлөв шинэчлэгдэнэ
  useEffect(() => {
    setPreviewEnded(false);
  }, [ep, previewLimit]);
  // Серверээс гарын үсэгтэй, хугацаатай холбоос (багц авсны дараа дахин авна)
  // Гарын үсэгтэй холбоос дуусахаас 5 минутын өмнө шинээр авна (урт кино тасрахгүй)
  const [renewNonce, setRenewNonce] = useState(0);
  const stream = useStreamUrl(series?.id, ep, `${isSubscribed}-${renewNonce}`);
  const signedExpires = stream.url?.includes('bcdn_token=') ? stream.expires || 0 : 0;

  useEffect(() => {
    if (!signedExpires) return undefined;
    const ms = Math.max(30_000, (signedExpires - 300) * 1000 - Date.now());
    const t = setTimeout(() => setRenewNonce((n) => n + 1), ms);
    return () => clearTimeout(t);
  }, [signedExpires]);

  const freshSrc =
    !series || stream.loading
      ? ''
      : stream.url || (stream.mode === 'fallback' || stream.mode === 'none' ? getEpisodeVideo(series, ep) : '');

  // Тоглож буй ангийн холбоосыг тогтвортой барина — дахин шалгахад видео эхнээс
  // нь эхлэхгүй. Зөвхөн (1) өөр анги, (2) урьдчилан үзэхээс бүтэн эрх рүү шилжих,
  // (3) хугацаа дуусах гэж байгаа үед солино — тэгэхдээ үзэж байсан секундээс үргэлжилнэ.
  const [active, setActive] = useState({ key: '', src: '', mode: null, expires: 0 });
  const resumeAt = useRef(0);
  const activeKey = `${series?.id}:${ep}`;

  useEffect(() => {
    if (!freshSrc) return;
    setActive((prev) => {
      const sameEp = prev.key === activeKey && prev.src;
      const upgraded = prev.mode === 'preview' && stream.mode === 'full';
      const expiring = prev.expires && Date.now() / 1000 > prev.expires - 120;
      if (sameEp && !upgraded && !expiring) return prev;
      if (sameEp) resumeAt.current = videoRef.current?.currentTime || 0;
      return { key: activeKey, src: freshSrc, mode: stream.mode, expires: signedExpires };
    });
  }, [activeKey, freshSrc, stream.mode, signedExpires]);

  const videoSrc = active.key === activeKey ? active.src : '';
  const seriesId = series?.id;

  const goTo = useCallback(
    (next) => {
      if (next < 1 || next > total) return;
      setDir(next > ep ? 1 : -1);
      setEp(next);
      setProgress(0);
      setTime(0);
      setDuration(0);
      setListOpen(false);
    },
    [ep, total]
  );

  // URL болон үзсэн түүхийг шинэчлэх
  useEffect(() => {
    if (!series) return;
    window.history.replaceState(null, '', `/drama/${series.id}/${ep}/`);
    recordWatch(series.id, ep);
  }, [series, ep, recordWatch]);

  // Анги солигдоход автоматаар тоглуулах (дуутай болохгүй бол дуугүй)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || locked) return undefined;
    const attempt = () =>
      v
        .play()
        .then(() => setPaused(false))
        .catch(() => {
          v.muted = true;
          setMuted(true);
          v.play()
            .then(() => setPaused(false))
            .catch(() => setPaused(true));
        });
    // Bunny (HLS) видео hls.js-ээр ачаалагдаж дуустал хүлээнэ
    if (isHls(videoSrc)) {
      v.addEventListener('kino-ready', attempt, { once: true });
      return () => v.removeEventListener('kino-ready', attempt);
    }
    attempt();
    return undefined;
  }, [ep, locked, seriesId, videoSrc]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || locked || previewEnded) return;
    if (v.paused) {
      v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }, [locked, previewEnded]);

  // ---------- Товчнуудыг автоматаар нуух ----------
  const showUi = useCallback(() => {
    setUiVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (paused) {
      clearTimeout(hideTimer.current);
      setUiVisible(true);
    } else showUi();
    return () => clearTimeout(hideTimer.current);
  }, [paused, showUi]);

  // Дэлгэц дээр дарахад: товчнууд харагдаж байвал нууна, үгүй бол гаргана
  const onScreenTap = useCallback(() => {
    if (uiVisible && !paused) {
      clearTimeout(hideTimer.current);
      setUiVisible(false);
    } else showUi();
  }, [uiVisible, paused, showUi]);

  // ---------- Гүйлгэх (±10 сек) ----------
  const seek = useCallback(
    (delta) => {
      const v = videoRef.current;
      if (!v || !v.duration) return;
      const max = previewLimit ? Math.min(previewLimit, v.duration - 0.2) : v.duration - 0.2;
      v.currentTime = Math.min(Math.max(0, v.currentTime + delta), max);
      showUi();
    },
    [showUi, previewLimit]
  );

  // ---------- Бүтэн дэлгэц ----------
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    // iPhone нь вэб хуудсанд бүтэн дэлгэц зөвшөөрдөггүй.
    if (!rootRef.current?.requestFullscreen) {
      const v = videoRef.current;
      const installedApp =
        window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
      // Хөтөч дээр: Apple-ийн жинхэнэ бүтэн дэлгэц (хадмалыг <track>-аар дамжуулна)
      if (!installedApp && v?.webkitEnterFullscreen) {
        try {
          v.webkitEnterFullscreen();
        } catch {
          // зөвшөөрөөгүй
        }
        return;
      }
      // Нүүр дэлгэцэнд суулгасан апп аль хэдийн бүтэн дэлгэцтэй — товчнуудыг нууна
      setIsFs((on) => {
        if (!on) {
          clearTimeout(hideTimer.current);
          setUiVisible(false);
        }
        return !on;
      });
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      // хөтөч зөвшөөрөөгүй
    }
    showUi();
  }, [showUi]);

  // iPhone-ийн жинхэнэ бүтэн дэлгэц: хадмалын <track>-ыг зөвхөн тэр үед асаана
  // (энгийн үед манай өөрийн хадмалын давхарга харагдана — давхардахгүй).
  const subDelay = Number(stream.subtitleStyle?.delay) || 0;
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;

    const setTracks = (mode) => {
      Array.from(v.textTracks || []).forEach((t, i) => {
        t.mode = i === 0 ? mode : 'disabled';
      });
    };

    // Админы "эрт/хожуу" тохиргоог Apple-ийн хадмалд ч хэрэглэнэ
    const shifted = new WeakSet();
    const applyDelay = () => {
      if (!subDelay) return;
      Array.from(v.textTracks || []).forEach((t) => {
        Array.from(t.cues || []).forEach((c) => {
          if (shifted.has(c)) return;
          c.startTime = Math.max(0, c.startTime + subDelay);
          c.endTime = Math.max(0, c.endTime + subDelay);
          shifted.add(c);
        });
      });
    };

    const onBegin = () => {
      setTracks('showing');
      setTimeout(applyDelay, 300);
      setIsFs(true);
    };
    const onEnd = () => {
      setTracks('disabled');
      setIsFs(false);
      showUi();
    };

    setTracks('disabled');
    v.addEventListener('webkitbeginfullscreen', onBegin);
    v.addEventListener('webkitendfullscreen', onEnd);
    return () => {
      v.removeEventListener('webkitbeginfullscreen', onBegin);
      v.removeEventListener('webkitendfullscreen', onEnd);
    };
  }, [videoSrc, stream.subtitles, subDelay, showUi]);

  // Гарын товч
  useEffect(() => {
    const onKey = (e) => {
      if (listOpen || settingsOpen) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(ep + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(ep - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seek(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seek(-10);
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ep, goTo, togglePlay, listOpen, settingsOpen, seek, toggleFullscreen]);

  // Хуудас гүйлгэхийг түгжих
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!series || initialEp > series.episodes) return catalogLoading ? null : <NotFoundState />;

  const onTouchStart = (e) => {
    touch.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dy = e.changedTouches[0].clientY - touch.current;
    touch.current = null;
    if (Math.abs(dy) > 60) goTo(dy < 0 ? ep + 1 : ep - 1);
  };
  const onWheel = (e) => {
    const now = Date.now();
    if (now - wheelLock.current < 700 || Math.abs(e.deltaY) < 30) return;
    wheelLock.current = now;
    goTo(e.deltaY > 0 ? ep + 1 : ep - 1);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: series.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast('Холбоос хуулагдлаа');
      }
    } catch {
      // хэрэглэгч цуцалсан
    }
  };

  const backHere = encodeURIComponent(`/drama/${series.id}/${ep}`);

  const isSaved = saved.includes(series.id);

  // Товчнууд харагдах эсэх (зогссон, түгжээтэй үед үргэлж харагдана)
  const ui = uiVisible || paused || locked;
  const fade = { transition: 'opacity 350ms ease', opacity: ui ? 1 : 0, pointerEvents: ui ? 'auto' : 'none' };

  return (
    <Box
      ref={rootRef}
      onMouseMove={showUi}
      onContextMenu={(e) => e.preventDefault()}
      sx={{
        cursor: ui ? 'auto' : 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        bgcolor: '#000',
        color: '#fff',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Том дэлгэц дээрх бүдэг арын зураг */}
      <Box
        component="img"
        src={series.poster}
        alt=""
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          inset: 0,
          width: 1,
          height: 1,
          objectFit: 'cover',
          filter: 'blur(40px) brightness(0.45)',
          transform: 'scale(1.2)',
        }}
      />

      <Box
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        sx={{
          containerType: 'inline-size', // хадмалын хэмжээ дэлгэцийн өргөнд пропорциональ
          position: 'relative',
          height: '100dvh',
          width: { xs: '100%', md: 'auto' },
          aspectRatio: { md: '9 / 16' },
          mx: 'auto',
          bgcolor: '#000',
          overflow: 'hidden',
          boxShadow: { md: '0 0 80px rgba(0,0,0,0.6)' },
        }}
      >
        <Box
          key={ep}
          sx={{
            position: 'absolute',
            inset: 0,
            animation: `${dir > 0 ? 'epUp' : 'epDown'} 380ms cubic-bezier(.2,.8,.2,1)`,
            '@keyframes epUp': { from: { transform: 'translateY(18%)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
            '@keyframes epDown': { from: { transform: 'translateY(-18%)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
          }}
        >
          {locked ? (
            <Box component="img" src={series.poster} alt="" sx={{ width: 1, height: 1, objectFit: 'cover', filter: 'blur(16px) brightness(0.5)' }} />
          ) : (
            <KinoVideo
              ref={videoRef}
              src={videoSrc}
              poster={series.poster}
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              disableRemotePlayback
              playsInline
              muted={muted}
              preload="auto"
              quality={prefs.quality}
              onLevels={setLevels}
              onLevelSwitched={setAutoP}
              onLoadedMetadata={(e) => {
                e.currentTarget.playbackRate = prefs.speed;
                setDuration(e.currentTarget.duration || 0);
                // Холбоос солигдсон бол үзэж байсан газраасаа үргэлжлүүлнэ
                if (resumeAt.current > 0) {
                  e.currentTarget.currentTime = resumeAt.current;
                  resumeAt.current = 0;
                }
              }}
              onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              onClick={onScreenTap}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                // Үнэгүй хугацаа дуусвал зогсооно (iPhone-ий бүтэн дэлгэцээс гаргаж багц санал болгоно)
                if (previewLimit && v.currentTime >= previewLimit) {
                  v.pause();
                  v.currentTime = previewLimit;
                  setPreviewEnded(true);
                  if (v.webkitDisplayingFullscreen) v.webkitExitFullscreen?.();
                }
                setTime(v.currentTime);
                if (v.duration) setProgress(v.currentTime / v.duration);
              }}
              onSeeking={(e) => {
                const v = e.currentTarget;
                if (previewLimit && v.currentTime > previewLimit) v.currentTime = previewLimit;
              }}
              onEnded={() => (isMovie ? setPaused(true) : goTo(ep + 1))}
              sx={{ width: 1, height: 1, objectFit: 'cover', display: 'block' }}
              // Хадмалыг <track>-аар ч өгнө: iPhone-ийн бүтэн дэлгэцэнд (манай давхарга
              // харагдахгүй үед) Apple өөрөө харуулна. Энгийн үед унтраалттай.
              crossOrigin="anonymous"
            >
              {stream.subtitles?.map((s) => (
                <track key={s.lang} kind="subtitles" src={s.url} srcLang={s.lang} label={s.label} />
              ))}
            </KinoVideo>
          )}
        </Box>

        {/* Хөдөлгөөнт усан тэмдэг — дэлгэц бичлэг хийвэл хэн болохыг харуулна */}
        {!locked && <Watermark text={user?.email || '444ulaanbaatar.com'} />}

        {/* Хадмал — байрлал, хэмжээг админ тохируулна */}
        {!showPaywall && stream.subtitles?.length > 0 && (
          <SubtitleOverlay videoRef={videoRef} url={stream.subtitles[0].url} style={stream.subtitleStyle} />
        )}

        {/* Дээд, доод сүүдэр */}
        <Box sx={{ ...fade, pointerEvents: 'none', position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 62%, rgba(0,0,0,0.8) 100%)' }} />

        {/* Дээд мөр */}
        <Box
          sx={{
            ...fade,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            pt: 'calc(env(safe-area-inset-top, 0px) + 10px)',
            px: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            component={RouterLink}
            href={`/drama/${series.id}`}
            aria-label="Буцах"
            sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center', color: '#fff' }}
          >
            <Icon name="back" size={24} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {series.title}
            </Box>
            <Box sx={{ fontSize: 12, opacity: 0.75 }}>
              {isMovie ? 'Кино' : `${ep}-р анги / ${total}`}
              {prefs.speed !== 1 && ` · ${prefs.speed}x`}
            </Box>
          </Box>
        </Box>

        {/* Голын товчнууд: -10 сек, тоглуулах/зогсоох, +10 сек */}
        {!locked && (
          <Box
            sx={{
              ...fade,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 4, sm: 5 },
            }}
          >
            <CenterButton label="10 секунд буцаах" onClick={() => seek(-10)} size={56}>
              <SkipIcon back />
            </CenterButton>
            <CenterButton
              label={paused ? 'Тоглуулах' : 'Зогсоох'}
              onClick={() => {
                togglePlay();
                showUi();
              }}
              size={76}
            >
              <Icon name={paused ? 'play' : 'pause'} size={38} sx={{ ml: paused ? 0.5 : 0 }} />
            </CenterButton>
            <CenterButton label="10 секунд урагшлуулах" onClick={() => seek(10)} size={56}>
              <SkipIcon />
            </CenterButton>
          </Box>
        )}

        {muted && !locked && (
          <Box
            component="button"
            onClick={() => {
              setMuted(false);
              if (videoRef.current) videoRef.current.muted = false;
            }}
            sx={{
              ...fade,
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
              left: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              px: 1.5,
              py: 0.8,
              border: 0,
              borderRadius: 5,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              bgcolor: 'rgba(0,0,0,0.55)',
              cursor: 'pointer',
            }}
          >
            <Icon name="volumeOff" size={18} /> Дуу асаах
          </Box>
        )}

        {/* Урьдчилан үзэх: үлдсэн үнэгүй хугацаа */}
        {previewLimit > 0 && !previewEnded && (
          <Box
            sx={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 62px)',
              right: 12,
              px: 1.4,
              py: 0.6,
              borderRadius: 5,
              bgcolor: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(251,191,36,0.45)',
              color: C.gold,
              fontSize: 12,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
            }}
          >
            <Icon name="crown" size={14} />
            Үнэгүй: {formatTime(Math.max(0, previewLimit - time))} үлдлээ
          </Box>
        )}

        {/* Түгжээтэй анги / үнэгүй хугацаа дууссан */}
        {showPaywall && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              bgcolor: previewEnded ? 'rgba(7,5,11,0.78)' : 'transparent',
              backdropFilter: previewEnded ? 'blur(14px)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 4,
              gap: 1.5,
            }}
          >
            {authLoading ? null : (
              <>
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: C.grad, display: 'grid', placeItems: 'center' }}>
                  <Icon name="crown" size={30} />
                </Box>
                <Box sx={{ fontSize: 20, fontWeight: 800 }}>
                  {previewEnded
                    ? `Үнэгүй ${Math.round(previewLimit / 60)} минут дууслаа`
                    : isMovie
                      ? 'Энэ кино захиалгатай'
                      : `${ep}-р ангиас эхлэн захиалгатай`}
                </Box>
                <Box sx={{ fontSize: 14, opacity: 0.8, maxWidth: 290, lineHeight: 1.6 }}>
                  {previewEnded
                    ? 'Үргэлжлүүлэн үзэхийн тулд 444 Кино-гийн багц авна уу — бүх кино, цуврал бүтэн нээгдэнэ.'
                    : `${freeLabel(series)}. Үргэлжлүүлэн үзэхийн тулд 444 Кино-гийн багц авна уу — бүх кино, цуврал нээгдэнэ.`}
                </Box>
                <Box
                  component={RouterLink}
                  href={`/drama/plans?next=${backHere}`}
                  sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3.5,
                    height: 50,
                    borderRadius: 6,
                    background: C.grad,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                  }}
                >
                  <Icon name="crown" size={20} /> Багц сонгох
                </Box>
                {!user && (
                  <Box
                    component={RouterLink}
                    href={`/drama/login?next=${backHere}`}
                    sx={{ color: C.gold, fontSize: 14, fontWeight: 600 }}
                  >
                    Багцтай юу? Нэвтрэх
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Баруун талын товчнууд */}
        <Box
          sx={{
            ...fade,
            position: 'absolute',
            right: 8,
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <RailButton icon="heart" label={isSaved ? 'Хадгалсан' : 'Хадгалах'} active={isSaved} onClick={() => toggleSaved(series.id)} />
          {!isMovie && <RailButton icon="list" label="Ангиуд" onClick={() => setListOpen(true)} />}
          <RailButton icon="settings" label="Тохиргоо" onClick={() => setSettingsOpen(true)} />
          <RailButton icon="share" label="Хуваалцах" onClick={share} />
        </Box>

        {/* Том дэлгэц дээрх өмнөх/дараах */}
        <Box sx={{ ...fade, display: { xs: 'none', md: isMovie || isFs ? 'none' : 'flex' }, position: 'absolute', right: -64, top: '50%', transform: 'translateY(-50%)', flexDirection: 'column', gap: 1.5 }}>
          <NavArrow up disabled={ep <= 1} onClick={() => goTo(ep - 1)} />
          <NavArrow disabled={ep >= total} onClick={() => goTo(ep + 1)} />
        </Box>

        {/* Доод хэсэг */}
        <Box
          sx={{
            ...fade,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            px: 2,
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
          }}
        >
          <Box sx={{ pr: 7, mb: 1.5 }}>
            <Box sx={{ fontWeight: 800, fontSize: 16 }}>
              {isMovie ? series.title : `${series.title} · ${ep}-р анги`}
            </Box>
            <Box
              sx={{
                mt: 0.5,
                fontSize: 13,
                opacity: 0.8,
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {series.description}
            </Box>
          </Box>

          <Box
            component="input"
            type="range"
            aria-label="Явц"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            disabled={locked}
            onChange={(e) => {
              const v = videoRef.current;
              const p = Number(e.target.value) / 1000;
              setProgress(p);
              if (v?.duration) v.currentTime = previewLimit ? Math.min(p * v.duration, previewLimit) : p * v.duration;
              showUi();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            sx={{
              width: 1,
              m: 0,
              height: 24,
              appearance: 'none',
              background: 'transparent',
              cursor: 'pointer',
              '&::-webkit-slider-runnable-track': {
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${C.accent2} ${progress * 100}%, rgba(255,255,255,0.3) ${progress * 100}%)`,
              },
              '&::-webkit-slider-thumb': { appearance: 'none', width: 12, height: 12, mt: '-4.5px', borderRadius: '50%', bgcolor: '#fff' },
              '&::-moz-range-track': { height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.3)' },
              '&::-moz-range-progress': { height: 3, borderRadius: 2, bgcolor: C.accent2 },
              '&::-moz-range-thumb': { width: 12, height: 12, border: 0, borderRadius: '50%', bgcolor: '#fff' },
            }}
          />

          {/* Хугацаа ба бүтэн дэлгэц */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -0.25 }}>
            <Box sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', opacity: 0.9 }}>
              {formatTime(time)} <Box component="span" sx={{ opacity: 0.6 }}>/ {duration ? formatTime(duration) : '--:--'}</Box>
            </Box>
            <Box
              component="button"
              onClick={toggleFullscreen}
              aria-label={isFs ? 'Бүтэн дэлгэцээс гарах' : 'Бүтэн дэлгэц'}
              title={isFs ? 'Бүтэн дэлгэцээс гарах (F)' : 'Бүтэн дэлгэц (F)'}
              sx={{ width: 40, height: 40, mr: -1, border: 0, bgcolor: 'transparent', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              <Icon name={isFs ? 'fullscreenExit' : 'fullscreen'} size={24} />
            </Box>
          </Box>

          <Box
            component="button"
            onClick={() => setListOpen(true)}
            sx={{
              display: isMovie ? 'none' : 'flex',
              mt: 0.5,
              width: 1,
              height: 44,
              px: 1.5,
              alignItems: 'center',
              justifyContent: 'space-between',
              border: 0,
              borderRadius: 2,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              bgcolor: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon name="list" size={18} /> Бүх анги ({total})
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.75, fontSize: 12 }}>
              Дээш шудраад дараагийн анги <Icon name="chevronRight" size={14} sx={{ transform: 'rotate(-90deg)' }} />
            </Box>
          </Box>
        </Box>

        {toast && (
          <Box
            role="status"
            sx={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translateX(-50%)',
              px: 2.5,
              py: 1.2,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.75)',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {toast}
          </Box>
        )}
      </Box>

      <EpisodeSheet
        open={listOpen}
        onClose={() => setListOpen(false)}
        series={series}
        current={ep}
        isSubscribed={isSubscribed}
        onPick={goTo}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        levels={levels}
        autoP={autoP}
        prefs={prefs}
        onChange={(next) => {
          setPrefs(next);
          if (videoRef.current) videoRef.current.playbackRate = next.speed;
        }}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

// Үзэгчийн имэйлийг бүдэг, 25 секунд тутам байрлал сольж харуулна
const WM_SPOTS = [
  { top: '18%', left: '8%' },
  { top: '42%', left: '52%' },
  { top: '68%', left: '12%' },
  { top: '30%', left: '30%' },
  { top: '78%', left: '48%' },
  { top: '55%', left: '6%' },
];

function Watermark({ text }) {
  const [spot, setSpot] = useState(() => Math.floor(Math.random() * WM_SPOTS.length));

  useEffect(() => {
    const t = setInterval(() => setSpot((s) => (s + 1 + Math.floor(Math.random() * 3)) % WM_SPOTS.length), 25000);
    return () => clearInterval(t);
  }, []);

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        ...WM_SPOTS[spot],
        zIndex: 1,
        pointerEvents: 'none',
        userSelect: 'none',
        fontSize: { xs: 11, md: 13 },
        fontWeight: 600,
        letterSpacing: 0.3,
        color: 'rgba(255,255,255,0.22)',
        textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        transform: 'rotate(-12deg)',
        transition: 'top 1.2s ease, left 1.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {text} · 444 Кино
    </Box>
  );
}

// 75 → "1:15", 3725 → "1:02:05"
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

function CenterButton({ children, label, onClick, size }) {
  return (
    <Box
      component="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: 0,
        color: '#fff',
        bgcolor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        transition: 'transform 150ms ease, background-color 150ms ease',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
        '&:active': { transform: 'scale(0.9)' },
      }}
    >
      {children}
    </Box>
  );
}

// Дугуй сум + "10"
function SkipIcon({ back }) {
  return (
    <Box sx={{ position: 'relative', width: 30, height: 30 }}>
      <Box component="svg" viewBox="0 0 24 24" sx={{ width: 30, height: 30, transform: back ? 'none' : 'scaleX(-1)' }}>
        <path fill="currentColor" d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
      </Box>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pt: '3px', fontSize: 9, fontWeight: 800 }}>10</Box>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Чанар, хурдны тохиргоо (энэ төхөөрөмж дээр хадгалагдана)

const PREFS_KEY = 'kino444-player';
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function usePlayerPrefs() {
  const [prefs, setPrefs] = useState({ quality: -1, speed: 1 });

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}');
      setPrefs((p) => ({ ...p, ...saved }));
    } catch {
      // ignore
    }
  }, []);

  const update = useCallback((next) => {
    setPrefs(next);
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  return [prefs, update];
}

function SettingsSheet({ open, onClose, levels, autoP, prefs, onChange }) {
  const chip = (active) => ({
    minWidth: 64,
    height: 40,
    px: 1.5,
    border: 0,
    borderRadius: 2,
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    color: active ? '#fff' : C.text,
    background: active ? C.grad : C.surface2,
  });

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            bgcolor: C.surface,
            color: C.text,
            backgroundImage: 'none',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxWidth: 560,
            mx: 'auto',
            px: 2.5,
            pt: 1.2,
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          },
        },
      }}
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.25)', mx: 'auto', mb: 2 }} />

      <Box sx={{ fontWeight: 800, fontSize: 15, mb: 1.2 }}>Чанар</Box>
      {levels.length ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Box component="button" onClick={() => onChange({ ...prefs, quality: -1 })} sx={chip(prefs.quality === -1)}>
            Авто{prefs.quality === -1 && autoP ? ` (${autoP}p)` : ''}
          </Box>
          {levels.map((l) => (
            <Box key={l.index} component="button" onClick={() => onChange({ ...prefs, quality: l.p })} sx={chip(prefs.quality === l.p)}>
              {l.p}p{l.p >= 1080 ? ' HD' : ''}
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          Интернэтийн хурдаас хамааран чанар автоматаар тохирно.
        </Box>
      )}

      <Box sx={{ fontWeight: 800, fontSize: 15, mt: 3, mb: 1.2 }}>Тоглуулах хурд</Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {SPEEDS.map((s) => (
          <Box key={s} component="button" onClick={() => onChange({ ...prefs, speed: s })} sx={chip(prefs.speed === s)}>
            {s === 1 ? 'Хэвийн' : `${s}x`}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}

// ----------------------------------------------------------------------

function RailButton({ icon, label, onClick, active }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      onTouchEnd={(e) => e.stopPropagation()}
      sx={{
        p: 0,
        border: 0,
        bgcolor: 'transparent',
        color: active ? C.accent2 : '#fff',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.4,
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 600,
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
      }}
    >
      <Box sx={{ width: 46, height: 46, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center' }}>
        <Icon name={icon} size={24} />
      </Box>
      <Box component="span" sx={{ color: '#fff' }}>
        {label}
      </Box>
    </Box>
  );
}

function NavArrow({ up, disabled, onClick }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={up ? 'Өмнөх анги' : 'Дараагийн анги'}
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 0,
        bgcolor: 'rgba(255,255,255,0.14)',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        '&:disabled': { opacity: 0.3, cursor: 'default' },
        '&:hover:not(:disabled)': { bgcolor: 'rgba(255,255,255,0.25)' },
      }}
    >
      <Icon name="chevronRight" size={22} sx={{ transform: up ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
    </Box>
  );
}

// ----------------------------------------------------------------------

const RANGE = 30;

function EpisodeSheet({ open, onClose, series, current, isSubscribed, onPick }) {
  const [range, setRange] = useState(Math.floor((current - 1) / RANGE));

  useEffect(() => {
    if (open) setRange(Math.floor((current - 1) / RANGE));
  }, [open, current]);

  const ranges = Array.from({ length: Math.ceil(series.episodes / RANGE) }, (_, i) => i);
  const from = range * RANGE + 1;
  const to = Math.min(series.episodes, from + RANGE - 1);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            bgcolor: C.surface,
            color: C.text,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70dvh',
            maxWidth: 560,
            mx: 'auto',
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            backgroundImage: 'none',
          },
        },
      }}
      sx={{ zIndex: 1300 }}
    >
      <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.25)', mx: 'auto', mt: 1.2 }} />
      <Box sx={{ px: 2, pt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ fontWeight: 800, fontSize: 16 }}>{series.title}</Box>
          <Box sx={{ fontSize: 12, color: C.muted }}>Нийт {series.episodes} анги</Box>
        </Box>
        <Box
          component="button"
          onClick={onClose}
          aria-label="Хаах"
          sx={{ width: 40, height: 40, border: 0, borderRadius: '50%', bgcolor: C.surface2, color: C.text, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
        >
          <Icon name="close" size={20} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, px: 2, mt: 1.5, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {ranges.map((r) => {
          const a = r * RANGE + 1;
          const b = Math.min(series.episodes, a + RANGE - 1);
          return (
            <Box
              key={r}
              component="button"
              onClick={() => setRange(r)}
              sx={{
                flexShrink: 0,
                px: 1.8,
                py: 0.7,
                border: 0,
                borderRadius: 5,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                color: range === r ? '#fff' : C.muted,
                background: range === r ? C.grad : C.surface2,
              }}
            >
              {a}–{b}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ px: 2, mt: 1.5, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
        {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => {
          const locked = !isFreeEpisode(n, series) && !isSubscribed;
          const active = n === current;
          return (
            <Box
              key={n}
              component="button"
              onClick={() => onPick(n)}
              sx={{
                position: 'relative',
                height: 46,
                border: 0,
                borderRadius: 1.5,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                color: active ? '#fff' : C.text,
                background: active ? C.grad : C.surface2,
              }}
            >
              {n}
              {locked && <Icon name="lock" size={11} sx={{ position: 'absolute', top: 4, right: 4, color: C.gold }} />}
            </Box>
          );
        })}
      </Box>
    </Drawer>
  );
}
