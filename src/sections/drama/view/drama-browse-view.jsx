'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';

import { useCatalog } from '../drama-catalog';
import { GENRES, seriesByGenre } from '../drama-data';
import { C, Icon, HScroll, PosterCard } from '../drama-ui';

// ----------------------------------------------------------------------

export function DramaBrowseView() {
  const params = useSearchParams();
  const initial = params.get('genre');
  const [genre, setGenre] = useState(GENRES.includes(initial) ? initial : 'Бүгд');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('popular');

  const { series: catalog } = useCatalog();
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = seriesByGenre(genre, catalog).filter(
      (s) => !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
    if (sort === 'popular') return [...items].sort((a, b) => parseFloat(b.views) - parseFloat(a.views));
    if (sort === 'rating') return [...items].sort((a, b) => b.rating - a.rating);
    return [...items].sort((a, b) => (b.badge === 'Шинэ') - (a.badge === 'Шинэ'));
  }, [genre, query, sort, catalog]);

  const pickGenre = (g) => {
    setGenre(g);
    const url = g === 'Бүгд' ? '/drama/browse/' : `/drama/browse/?genre=${encodeURIComponent(g)}`;
    window.history.replaceState(null, '', url);
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 6 }}>
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          height: 48,
          borderRadius: 6,
          bgcolor: C.surface,
          border: `1px solid ${C.line}`,
          color: C.muted,
          '&:focus-within': { borderColor: C.accent },
        }}
      >
        <Icon name="search" size={20} />
        <Box
          component="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Кино, цувралын нэрээр хайх…"
          enterKeyHint="search"
          sx={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 0,
            bgcolor: 'transparent',
            color: C.text,
            fontFamily: 'inherit',
            fontSize: 16, // iOS дээр томруулахгүй байхын тулд 16px
          }}
        />
        {query && (
          <Box component="button" onClick={() => setQuery('')} aria-label="Цэвэрлэх" sx={{ border: 0, bgcolor: 'transparent', color: C.muted, p: 0.5, cursor: 'pointer' }}>
            <Icon name="close" size={18} />
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        <HScroll>
          {GENRES.map((g) => (
            <Box
              key={g}
              component="button"
              onClick={() => pickGenre(g)}
              sx={{
                flexShrink: 0,
                px: 2,
                py: 1,
                border: 0,
                borderRadius: 5,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                color: genre === g ? '#fff' : C.muted,
                background: genre === g ? C.grad : C.surface,
              }}
            >
              {g}
            </Box>
          ))}
        </HScroll>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ fontSize: 13, color: C.muted }}>{list.length} цуврал</Box>
        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: C.surface, borderRadius: 5, p: 0.4 }}>
          {[
            ['popular', 'Алдартай'],
            ['rating', 'Үнэлгээ'],
            ['new', 'Шинэ'],
          ].map(([key, label]) => (
            <Box
              key={key}
              component="button"
              onClick={() => setSort(key)}
              sx={{
                px: 1.5,
                py: 0.6,
                border: 0,
                borderRadius: 5,
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                color: sort === key ? C.text : C.muted,
                bgcolor: sort === key ? C.surface2 : 'transparent',
              }}
            >
              {label}
            </Box>
          ))}
        </Box>
      </Box>

      {list.length ? (
        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' },
            gap: { xs: 1.25, md: 2 },
            rowGap: { xs: 2.5, md: 3 },
          }}
        >
          {list.map((s) => (
            <PosterCard key={s.id} series={s} />
          ))}
        </Box>
      ) : (
        <Box sx={{ py: 10, textAlign: 'center', color: C.muted }}>
          <Icon name="search" size={40} sx={{ mx: 'auto', mb: 1.5, opacity: 0.5 }} />
          “{query}” гэсэн цуврал олдсонгүй
        </Box>
      )}
    </Box>
  );
}
