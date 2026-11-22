'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { KinoVideo } from '../drama-video';
import { PromoPopup } from '../drama-promo';
import { InstallCard } from '../drama-extras';
import { useDramaStore } from '../use-drama-store';
import { useCatalog, useStreamUrl } from '../drama-catalog';
import { C, FONT, Icon, Badge, Reveal, HScroll, RankCard, cardWidth, PosterCard, SectionTitle } from '../drama-ui';
import { GENRES, freeLabel, topSeries, newSeries, seriesByGenre, featuredSeries, getEpisodeVideo } from '../drama-data';

// ----------------------------------------------------------------------

const HEADER_H = { xs: 56, md: 64 };
const SLIDE_MS = 9000;

export function DramaHomeView() {
  const { series: list, loading, getSeries } = useCatalog();
  const { continueList, saved, toggleSaved } = useDramaStore();

  if (loading) return <HomeSkeleton />;

  const watching = continueList.map((h) => ({ series: getSeries(h.id), ep: h.ep })).filter((h) => h.series);
  const featured = featuredSeries(list);
  const spotlight = [...list].filter((s) => !featured.includes(s)).sort((a, b) => b.rating - a.rating)[0] ?? list[0];
  const fresh = newSeries(list);
  const genres = GENRES.slice(1).filter((g) => seriesByGenre(g, list).length > 0);

  return (
    <Box sx={{ fontFamily: FONT }}>
      {featured.length > 0 && <Hero items={featured} saved={saved} onSave={toggleSaved} />}

      <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 1360, mx: 'auto', px: { xs: 2, md: 4 }, mt: { xs: -3, md: -8 }, pb: 8 }}>
        {watching.length > 0 && (
          <Row>
            <SectionTitle title="Үргэлжлүүлэн үзэх" href="/drama/my" />
            <HScroll>
              {watching.map(({ series, ep }) => (
                <PosterCard key={series.id} series={series} progressEp={ep} width={cardWidth} />
              ))}
            </HScroll>
          </Row>
        )}

        <Row>
          <SectionTitle title="Топ 10" subtitle="Энэ долоо хоногт хамгийн их үзсэн" icon="fire" />
          <HScroll gap={{ xs: 1, md: 2 }}>
            {topSeries(list).map((s, i) => (
              <RankCard key={s.id} series={s} rank={i + 1} />
            ))}
          </HScroll>
        </Row>

        <InstallCard compact />

        {/* Дундуур нь гүйлгэхэд гарах хямдралын цонх */}
        <PromoPopup />

        {genres.length > 0 && (
          <Row>
            <SectionTitle title="Төрлөөр үзэх" />
            <GenreTiles genres={genres} list={list} />
          </Row>
        )}

        {fresh.length > 0 && (
          <Row>
            <SectionTitle title="Шинээр нэмэгдсэн" href="/drama/browse" />
            <HScroll>
              {fresh.map((s) => (
                <PosterCard key={s.id} series={s} width={cardWidth} />
              ))}
            </HScroll>
          </Row>
        )}

        {spotlight && <Spotlight series={spotlight} />}

        {genres.map((g) => (
          <Row key={g}>
            <SectionTitle title={g} href={`/drama/browse?genre=${encodeURIComponent(g)}`} />
            <HScroll>
              {seriesByGenre(g, list).map((s) => (
                <PosterCard key={s.id} series={s} width={cardWidth} />
              ))}
            </HScroll>
          </Row>
        ))}
      </Box>
    </Box>
  );
}

function Row({ children }) {
  return (
    <Reveal sx={{ mt: { xs: 4, md: 6 } }}>
      <section>{children}</section>
    </Reveal>
  );
}

// ----------------------------------------------------------------------
// Бүтэн дэлгэцийн hero — арын зураг аажим томорч, дараа нь трейлер (дуугүй) эхэлнэ

function useMotionOk() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    setOk(!reduce && !saveData);
  }, []);
  return ok;
}

function Hero({ items, saved, onSave }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const videoRef = useRef(null);
  const motionOk = useMotionOk();

  const s = items[index % items.length];
  const go = useCallback((d) => setIndex((i) => (i + d + items.length) % items.length), [items.length]);

  // Трейлер: 1-р ангийн гарын үсэгтэй холбоос (эрхгүй бол зураг л харагдана)
  const trailer = useStreamUrl(motionOk ? s.id : null, 1);
  const trailerSrc = trailer.url || (trailer.mode === 'fallback' ? getEpisodeVideo(s, 1) : null);

  useEffect(() => {
    setVideoReady(false);
    if (paused) return undefined;
    const t = setTimeout(() => go(1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, go, paused]);

  // Утсан дээр автоматаар тоглуулахын тулд muted-ийг шууд тохируулна
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id, motionOk, trailerSrc]);

  // Таб нуугдсан үед зогсооно
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const isSaved = saved.includes(s.id);

  return (
    <Box
      component="section"
      aria-roledescription="carousel"
      aria-label="Онцлох цуврал"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
      sx={{
        position: 'relative',
        mt: { xs: `-${HEADER_H.xs}px`, md: `-${HEADER_H.md}px` },
        height: { xs: '86svh', md: '92vh' },
        minHeight: { xs: 560, md: 620 },
        maxHeight: 980,
        overflow: 'hidden',
        bgcolor: '#000',
      }}
    >
      {/* Арын зургууд */}
      {items.map((it, i) => (
        <Box
          key={it.id}
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: i === index ? 1 : 0,
            transition: 'opacity 1200ms ease',
          }}
        >
          <picture>
            <source media="(min-width: 600px)" srcSet={it.backdrop} />
            <Box
              component="img"
              src={it.poster}
              alt=""
              sx={{
                width: 1,
                height: 1,
                objectFit: 'cover',
                transformOrigin: i % 2 ? '30% 40%' : '70% 30%',
                animation: i === index && motionOk ? `kenburns ${SLIDE_MS + 2000}ms ease-out both` : 'none',
                '@keyframes kenburns': { from: { transform: 'scale(1.18)' }, to: { transform: 'scale(1.02)' } },
              }}
            />
          </picture>
        </Box>
      ))}

      {/* Трейлер (1-р анги) — дуугүй, давталттай */}
      {motionOk && trailerSrc && (
        <KinoVideo
          key={`v-${s.id}`}
          ref={videoRef}
          src={trailerSrc}
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          muted={muted}
          autoPlay
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => setTimeout(() => setVideoReady(true), 1400)}
          sx={{
            position: 'absolute',
            inset: 0,
            width: 1,
            height: 1,
            objectFit: 'cover',
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 1500ms ease',
          }}
        />
      )}

      {/* Сүүдэр, винетка, ширхэг */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(to top, ${C.bg} 0%, rgba(7,5,11,0.85) 18%, rgba(7,5,11,0.2) 48%, rgba(7,5,11,0.55) 100%)` }} />
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: { xs: 'none', md: 'block' }, background: 'linear-gradient(90deg, rgba(7,5,11,0.92) 0%, rgba(7,5,11,0.55) 38%, transparent 65%)' }} />
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.09,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Агуулга */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          maxWidth: 1360,
          mx: 'auto',
          px: { xs: 2.5, md: 4 },
          pb: { xs: 9, md: 16 },
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Box
          key={s.id}
          sx={{
            maxWidth: { xs: 1, md: 620 },
            '& > *': { animation: 'heroIn 900ms cubic-bezier(.2,.8,.2,1) both' },
            '& > *:nth-of-type(2)': { animationDelay: '80ms' },
            '& > *:nth-of-type(3)': { animationDelay: '160ms' },
            '& > *:nth-of-type(4)': { animationDelay: '240ms' },
            '& > *:nth-of-type(5)': { animationDelay: '320ms' },
            '@keyframes heroIn': { from: { opacity: 0, transform: 'translateY(24px)', filter: 'blur(6px)' }, to: { opacity: 1, transform: 'none', filter: 'none' } },
            '@media (prefers-reduced-motion: reduce)': { '& > *': { animation: 'none' } },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
            {s.badge && <Badge>{s.badge}</Badge>}
            <Box sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
              444 Кино · {s.episodes === 1 ? 'Кино' : 'Цуврал'}
            </Box>
          </Box>

          <Box
            component="h1"
            sx={{
              m: 0,
              fontSize: { xs: 'clamp(36px, 11vw, 54px)', md: 'clamp(56px, 5.6vw, 88px)' },
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: { xs: -1.2, md: -2.5 },
              textShadow: '0 10px 40px rgba(0,0,0,0.6)',
              textWrap: 'balance',
            }}
          >
            {s.title}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1, md: 1.5 }, fontSize: { xs: 13, md: 14 }, fontWeight: 600 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: C.gold }}>
              <Icon name="star" size={15} /> {s.rating}
            </Box>
            <Dot />
            <span>{s.episodes === 1 ? 'Кино' : `${s.episodes} анги`}</span>
            <Dot />
            <span>{s.views} үзэлт</span>
            <Dot />
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              {s.genres.join(' · ')}
            </Box>
          </Box>

          <Box
            component="p"
            sx={{
              mt: 1.75,
              mb: 0,
              color: 'rgba(246,242,251,0.82)',
              fontSize: { xs: 14, md: 16 },
              lineHeight: 1.65,
              display: '-webkit-box',
              WebkitLineClamp: { xs: 3, md: 3 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: 560,
            }}
          >
            {s.description}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 1.2, alignItems: 'center' }}>
            <Box
              component={RouterLink}
              href={`/drama/${s.id}/1`}
              sx={{
                flex: { xs: 1, sm: 'none' },
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                px: 3.5,
                height: 52,
                borderRadius: 1.5,
                bgcolor: '#fff',
                color: '#0b0712',
                fontWeight: 800,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                boxShadow: '0 10px 40px -10px rgba(255,255,255,0.5)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 16px 50px -10px rgba(255,255,255,0.6)' },
              }}
            >
              <Icon name="play" size={22} /> Одоо үзэх
            </Box>
            <Box
              component={RouterLink}
              href={`/drama/${s.id}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                px: { xs: 2, sm: 3 },
                height: 52,
                borderRadius: 1.5,
                bgcolor: 'rgba(255,255,255,0.16)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' },
              }}
            >
              <Icon name="info" size={20} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Дэлгэрэнгүй
              </Box>
            </Box>
            <RoundButton label={isSaved ? 'Жагсаалтаас хасах' : 'Миний жагсаалтад нэмэх'} active={isSaved} onClick={() => onSave(s.id)}>
              <Icon name={isSaved ? 'check' : 'plus'} size={22} />
            </RoundButton>
          </Box>
        </Box>
      </Box>

      {/* Дуу асаах, слайд заагч */}
      <Box sx={{ position: 'absolute', right: { xs: 16, md: 32 }, bottom: { xs: 48, md: 120 }, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        {motionOk && videoReady && (
          <RoundButton
            label={muted ? 'Дуу асаах' : 'Дуу хаах'}
            onClick={() => {
              setMuted((m) => !m);
              if (videoRef.current) videoRef.current.muted = !muted;
            }}
          >
            <Icon name={muted ? 'volumeOff' : 'volumeOn'} size={20} />
          </RoundButton>
        )}
        <Thumbs items={items} index={index} onPick={setIndex} />
      </Box>

      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: { xs: 22, md: 56 }, display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, maxWidth: 1360, mx: 'auto', px: { md: 4 } }}>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {items.map((it, i) => (
            <Box
              key={it.id}
              component="button"
              aria-label={`${i + 1}-р слайд: ${it.title}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              sx={{ p: 0, border: 0, cursor: 'pointer', width: { xs: 28, md: 44 }, height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}
            >
              <Box
                key={i === index ? `on-${index}` : 'off'}
                sx={{
                  height: 1,
                  bgcolor: '#fff',
                  width: i < index ? '100%' : '0%',
                  animation: i === index ? `heroBar ${SLIDE_MS}ms linear forwards` : 'none',
                  animationPlayState: paused ? 'paused' : 'running',
                  '@keyframes heroBar': { from: { width: '0%' }, to: { width: '100%' } },
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function Dot() {
  return <Box component="span" sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.45)' }} />;
}

function RoundButton({ children, label, onClick, active }) {
  return (
    <Box
      component="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      sx={{
        width: 52,
        height: 52,
        flexShrink: 0,
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.45)',
        bgcolor: active ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.2)' },
      }}
    >
      {children}
    </Box>
  );
}

// Том дэлгэц дээр дараагийн цувралуудын жижиг зураг
function Thumbs({ items, index, onPick }) {
  return (
    <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 1.25 }}>
      {items.map((it, i) => (
        <Box
          key={it.id}
          component="button"
          onClick={() => onPick(i)}
          aria-label={it.title}
          sx={{
            p: 0,
            width: 84,
            aspectRatio: '3 / 4',
            borderRadius: 1.5,
            overflow: 'hidden',
            cursor: 'pointer',
            border: i === index ? '2px solid #fff' : '2px solid transparent',
            opacity: i === index ? 1 : 0.55,
            transform: i === index ? 'translateY(-6px)' : 'none',
            transition: 'all 300ms ease',
            bgcolor: C.surface2,
            '&:hover': { opacity: 1 },
          }}
        >
          <Box component="img" src={it.poster} alt="" sx={{ width: 1, height: 1, objectFit: 'cover', display: 'block' }} />
        </Box>
      ))}
    </Box>
  );
}

// ----------------------------------------------------------------------

const GENRE_TINT = {
  Романс: ['#ec4899', '#be185d'],
  'Өшөө авалт': ['#ef4444', '#7f1d1d'],
  'Уран зөгнөл': ['#8b5cf6', '#312e81'],
  'Гэр бүл': ['#f59e0b', '#92400e'],
  Триллер: ['#0ea5e9', '#0c4a6e'],
  Инээдэм: ['#22c55e', '#14532d'],
  Түүхэн: ['#d4a373', '#5b3a1e'],
};

function GenreTiles({ genres, list }) {
  return (
    <Box sx={{ display: 'grid', gap: { xs: 1.25, md: 2 }, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' } }}>
      {genres.map((g) => {
        const sample = seriesByGenre(g, list)[0];
        const [a, b] = GENRE_TINT[g] ?? ['#a855f7', '#4c1d95'];
        return (
          <Box
            key={g}
            component={RouterLink}
            href={`/drama/browse?genre=${encodeURIComponent(g)}`}
            sx={{
              position: 'relative',
              height: { xs: 88, md: 120 },
              borderRadius: 2.5,
              overflow: 'hidden',
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'flex-end',
              p: 1.5,
              background: `linear-gradient(135deg, ${a}, ${b})`,
              transition: 'transform 350ms cubic-bezier(.2,.8,.2,1), box-shadow 350ms ease',
              '& img': { transition: 'transform 700ms cubic-bezier(.2,.8,.2,1)' },
              '@media (hover: hover)': {
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 16px 40px -12px ${a}` },
                '&:hover img': { transform: 'rotate(8deg) scale(1.08)' },
              },
            }}
          >
            {sample && (
              <Box
                component="img"
                src={sample.poster}
                alt=""
                loading="lazy"
                sx={{
                  position: 'absolute',
                  right: -10,
                  top: 10,
                  width: { xs: 56, md: 74 },
                  aspectRatio: '3 / 4',
                  objectFit: 'cover',
                  borderRadius: 1.5,
                  transform: 'rotate(12deg)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.45)',
                  opacity: 0.9,
                }}
              />
            )}
            <Box sx={{ position: 'relative', fontSize: { xs: 16, md: 18 }, fontWeight: 900, letterSpacing: -0.3, textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>{g}</Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ----------------------------------------------------------------------
// Хуудасны дунд талын өргөн баннер

function Spotlight({ series }) {
  return (
    <Reveal sx={{ mt: { xs: 5, md: 8 } }}>
      <Box
        sx={{
          position: 'relative',
          mx: { xs: -2, md: 0 },
          borderRadius: { xs: 0, md: 4 },
          overflow: 'hidden',
          minHeight: { xs: 460, md: 420 },
          display: 'flex',
          alignItems: 'flex-end',
          bgcolor: C.surface,
        }}
      >
        <Box component="img" src={series.backdrop} alt="" loading="lazy" sx={{ position: 'absolute', inset: 0, width: 1, height: 1, objectFit: 'cover' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: { xs: `linear-gradient(to top, ${C.bg} 10%, rgba(7,5,11,0.55) 60%, rgba(7,5,11,0.2))`, md: 'linear-gradient(90deg, rgba(7,5,11,0.95) 0%, rgba(7,5,11,0.6) 45%, transparent 80%)' } }} />
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 85%, rgba(168,85,247,0.35), transparent 50%)' }} />

        <Box sx={{ position: 'relative', p: { xs: 2.5, md: 6 }, maxWidth: 560, display: 'flex', gap: 3, alignItems: 'flex-end' }}>
          <Box
            component="img"
            src={series.poster}
            alt=""
            loading="lazy"
            sx={{ display: { xs: 'none', md: 'block' }, width: 150, aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 2, boxShadow: C.glow, flexShrink: 0 }}
          />
          <Box>
            <Box sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: C.gold, display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Icon name="star" size={14} /> Редакторын сонголт
            </Box>
            <Box component="h3" sx={{ m: 0, mt: 1, fontSize: { xs: 30, md: 40 }, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.02 }}>
              {series.title}
            </Box>
            <Box component="p" sx={{ mt: 1.5, mb: 2.5, color: 'rgba(246,242,251,0.8)', lineHeight: 1.65, fontSize: 15 }}>
              {series.description}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box
                component={RouterLink}
                href={`/drama/${series.id}/1`}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 3, height: 48, borderRadius: 1.5, background: C.grad, color: '#fff', fontWeight: 800, textDecoration: 'none', boxShadow: '0 12px 30px -10px rgba(236,72,153,0.7)' }}
              >
                <Icon name="play" size={20} /> 1-р анги үзэх
              </Box>
              <Box sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 700 }}>
                {freeLabel(series)}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Reveal>
  );
}

// ----------------------------------------------------------------------

function HomeSkeleton() {
  const pulse = {
    bgcolor: C.surface,
    animation: 'kinoPulse 1.4s ease-in-out infinite',
    '@keyframes kinoPulse': { '0%,100%': { opacity: 0.5 }, '50%': { opacity: 1 } },
  };
  return (
    <Box>
      <Box sx={{ ...pulse, mt: { xs: `-${HEADER_H.xs}px`, md: `-${HEADER_H.md}px` }, height: { xs: '86svh', md: '92vh' }, minHeight: 560, maxHeight: 980 }} />
      <Box sx={{ display: 'flex', gap: 1.5, mt: -4, px: { xs: 2, md: 4 }, overflow: 'hidden' }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ ...pulse, flexShrink: 0, width: cardWidth, aspectRatio: '3 / 4', borderRadius: 2.5 }} />
        ))}
      </Box>
    </Box>
  );
}
