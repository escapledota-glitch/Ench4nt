'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { BuyButton } from '../drama-buy';
import { useDramaAuth } from '../drama-auth';
import { useCatalog } from '../drama-catalog';
import { useDramaStore } from '../use-drama-store';
import { freeLabel, isFreeEpisode } from '../drama-data';
import { C , Icon, Badge, HScroll, cardWidth, PosterCard, SectionTitle, NotFoundState } from '../drama-ui';

// ----------------------------------------------------------------------

const RANGE = 30;

export function DramaSeriesView({ id }) {
  const { series: SERIES, loading, getSeries } = useCatalog();
  const series = getSeries(id);
  const { history, saved, toggleSaved } = useDramaStore();
  const { canWatch } = useDramaAuth();
  const [range, setRange] = useState(0);

  if (!series) return loading ? null : <NotFoundState />;
  // Үзэх эрх: багцтай эсвэл худалдаж авсан
  const isSubscribed = canWatch(series.id);

  const lastEp = history[series.id]?.ep;
  const isSaved = saved.includes(series.id);
  const ranges = Array.from({ length: Math.ceil(series.episodes / RANGE) }, (_, i) => i);
  const from = range * RANGE + 1;
  const to = Math.min(series.episodes, from + RANGE - 1);
  const related = SERIES.filter((s) => s.id !== series.id && s.genres.some((g) => series.genres.includes(g))).slice(0, 8);

  return (
    <Box>
      {/* Бүтэн өргөнтэй арын зураг */}
      <Box sx={{ position: 'relative', overflow: 'hidden', mt: { xs: '-56px', md: '-64px' }, minHeight: { xs: 560, md: 640 }, display: 'flex', alignItems: 'flex-end' }}>
        <picture>
          <source media="(min-width: 600px)" srcSet={series.backdrop} />
          <Box
            component="img"
            src={series.poster}
            alt=""
            sx={{
              position: 'absolute',
              inset: 0,
              width: 1,
              height: 1,
              objectFit: 'cover',
              animation: 'seriesZoom 14s ease-out both',
              '@keyframes seriesZoom': { from: { transform: 'scale(1.15)' }, to: { transform: 'scale(1)' } },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          />
        </picture>
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.bg} 0%, rgba(11,10,9,0.88) 22%, rgba(11,10,9,0.35) 60%, rgba(11,10,9,0.6) 100%)` }} />
        <Box sx={{ position: 'absolute', inset: 0, display: { xs: 'none', md: 'block' }, background: 'linear-gradient(90deg, rgba(11,10,9,0.95) 0%, rgba(11,10,9,0.6) 40%, transparent 70%)' }} />

        <Box
          sx={{
            position: 'relative',
            width: 1,
            maxWidth: 1240,
            mx: 'auto',
            px: { xs: 2.5, md: 4 },
            pt: 14,
            pb: { xs: 3, md: 6 },
            display: 'flex',
            gap: 5,
            alignItems: 'flex-end',
            '& > *': { animation: 'seriesIn 800ms cubic-bezier(.2,.8,.2,1) both' },
            '@keyframes seriesIn': { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'none' } },
          }}
        >
          <Box
            component="img"
            src={series.poster}
            alt={series.title}
            sx={{ display: { xs: 'none', md: 'block' }, width: 240, aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 3, flexShrink: 0, boxShadow: C.glow }}
          />
          <Box sx={{ minWidth: 0, flex: 1, maxWidth: 680 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              {series.badge && <Badge>{series.badge}</Badge>}
              <Box sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>{series.episodes === 1 ? 'Кино' : 'Цуврал'}</Box>
            </Box>
            <Box component="h1" sx={{ m: 0, mt: 1.25, fontSize: { xs: 'clamp(34px, 10vw, 48px)', md: 64 }, fontWeight: 900, lineHeight: 0.98, letterSpacing: { xs: -1, md: -2 }, textWrap: 'balance', textShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
              {series.title}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25, fontSize: 14, fontWeight: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: C.gold }}>
                <Icon name="star" size={15} /> {series.rating}
              </Box>
              <Box component="span" sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.45)' }} />
              <span>{series.episodes === 1 ? 'Кино' : `${series.episodes} анги`}</span>
              <Box component="span" sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.45)' }} />
              <span>{series.views} үзэлт</span>
            </Box>
            <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {series.genres.map((g) => (
                <Box
                  key={g}
                  component={RouterLink}
                  href={`/drama/browse?genre=${encodeURIComponent(g)}`}
                  sx={{ px: 1.4, py: 0.5, borderRadius: 5, fontSize: 12, fontWeight: 600, color: C.text, textDecoration: 'none', bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                  {g}
                </Box>
              ))}
            </Box>
            <Box component="p" sx={{ mt: 2, mb: 0, color: 'rgba(246,242,251,0.82)', lineHeight: 1.7, fontSize: { xs: 14, md: 16 } }}>
              {series.description}
            </Box>
            <Box sx={{ display: 'flex', mt: 3, gap: 1.2 }}>
              <PlayButton series={series} lastEp={lastEp} />
              <SaveButton saved={isSaved} onClick={() => toggleSaved(series.id)} />
            </Box>
            {/* Энэ киног тусдаа худалдаж авах (багцгүй, аваагүй үед л) */}
            <BuyButton series={series} sx={{ mt: 1.5, width: { xs: 1, sm: 'auto' } }} />
            {isSubscribed && !isFreeEpisode(series.episodes, series) && (
              <Box sx={{ mt: 1.5, fontSize: 13, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Icon name="check" size={16} /> Та үзэх эрхтэй
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2, md: 4 }, pb: 6 }}>
        {/* Ангиуд (нэг ангитай кинонд харуулахгүй) */}
        {series.episodes > 1 && (
        <Box sx={{ mt: { xs: 4, md: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
            <Box component="h2" sx={{ m: 0, fontSize: 18, fontWeight: 800 }}>
              Ангиуд
            </Box>
            <Box sx={{ fontSize: 12, color: C.muted }}>{isSubscribed ? 'Бүх анги нээлттэй' : freeLabel(series)}</Box>
          </Box>

          {ranges.length > 1 && (
            <HScroll>
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
                      px: 2,
                      py: 0.8,
                      borderRadius: 5,
                      border: 0,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      color: range === r ? C.ink : C.muted,
                      background: range === r ? C.grad : C.surface,
                    }}
                  >
                    {a}–{b}
                  </Box>
                );
              })}
            </HScroll>
          )}

          <Box
            sx={{
              mt: 1.5,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(5, 1fr)', sm: 'repeat(8, 1fr)', md: 'repeat(10, 1fr)' },
              gap: 1,
            }}
          >
            {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((ep) => {
              const locked = !isFreeEpisode(ep, series) && !isSubscribed;
              const current = ep === lastEp;
              return (
                <Box
                  key={ep}
                  component={RouterLink}
                  href={`/drama/${series.id}/${ep}`}
                  sx={{
                    position: 'relative',
                    height: 48,
                    borderRadius: 1.5,
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                    color: current ? C.ink : C.text,
                    background: current ? C.grad : C.surface,
                    border: `1px solid ${current ? 'transparent' : C.line}`,
                    '&:hover': { borderColor: C.accent },
                  }}
                >
                  {ep}
                  {locked && (
                    <Icon name="lock" size={12} sx={{ position: 'absolute', top: 4, right: 4, color: C.gold }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
        )}

        {related.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <SectionTitle title="Танд таалагдаж магадгүй" />
            <HScroll>
              {related.map((s) => (
                <PosterCard key={s.id} series={s} width={cardWidth} />
              ))}
            </HScroll>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

function PlayButton({ series, lastEp }) {
  return (
    <Box
      component={RouterLink}
      href={`/drama/${series.id}/${lastEp ?? 1}`}
      sx={{
        flex: { xs: 1, md: 'none' },
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        px: 3.5,
        height: 50,
        borderRadius: 1.5,
        background: C.grad,
        color: C.ink,
        fontWeight: 700,
        fontSize: 15,
        textDecoration: 'none',
        boxShadow: '0 8px 24px -6px rgba(212,175,106,0.6)',
      }}
    >
      <Icon name="play" size={20} />
      {series.episodes === 1 ? 'Кино үзэх' : lastEp ? `${lastEp}-р ангиас үргэлжлүүлэх` : '1-р ангиас эхлэх'}
    </Box>
  );
}

function SaveButton({ saved, onClick }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'Жагсаалтаас хасах' : 'Жагсаалтад нэмэх'}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.8,
        px: { xs: 0, md: 2.5 },
        width: { xs: 50, md: 'auto' },
        height: 50,
        borderRadius: 1.5,
        border: `1px solid ${C.line}`,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 600,
        fontSize: 15,
        color: saved ? C.accent2 : C.text,
        bgcolor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Icon name="heart" size={22} />
      <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
        {saved ? 'Хадгалсан' : 'Хадгалах'}
      </Box>
    </Box>
  );
}
