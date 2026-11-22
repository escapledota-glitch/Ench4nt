'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { SUB_LANGS, DEFAULT_SUB_MASK, DEFAULT_SUB_STYLE } from 'src/lib/subtitles';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { KinoVideo } from 'src/sections/drama/drama-video';
import { useCues, CoverMask, SubtitleText, usePictureBox, SubtitleLayers } from 'src/sections/drama/drama-subtitles';

import { errorText, previewVideo, listSubtitles, deleteSubtitle, uploadSubtitle, getSubtitleStyle, saveSubtitleStyle } from '../kino-api';

// ----------------------------------------------------------------------
// Хадмал: анги бүрт .srt/.vtt оруулах + харагдах байдлыг (X, Y, хэмжээ…) тохируулах.
// Үзэгчид өөрчлөх боломжгүй — энд тохируулсан байдлаар л харагдана.
// ----------------------------------------------------------------------

const COLORS = ['#ffffff', '#ffd400', '#7dd3fc', '#86efac', '#f9a8d4'];
const SAMPLE = 'Энэ бол хадмалын жишээ.\nХоёр дахь мөр ингэж харагдана.';

export function KinoSubtitlesCard({ seriesId, total, poster }) {
  const [subs, setSubs] = useState(null); // { [ep]: ['mn'] }
  const [style, setStyle] = useState(null);
  const [savedStyle, setSavedStyle] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    listSubtitles(seriesId)
      .then(setSubs)
      .catch((e) => {
        toast.error(errorText(e));
        setSubs({});
      });
  }, [seriesId]);

  useEffect(() => {
    load();
    getSubtitleStyle(seriesId)
      .then((s) => {
        setStyle(s);
        setSavedStyle(s);
      })
      .catch(() => {
        setStyle({ ...DEFAULT_SUB_STYLE });
        setSavedStyle({ ...DEFAULT_SUB_STYLE });
      });
  }, [seriesId, load]);

  const dirty = style && savedStyle && JSON.stringify(style) !== JSON.stringify(savedStyle);

  const save = async () => {
    setSaving(true);
    try {
      const s = await saveSubtitleStyle(seriesId, style);
      setStyle(s);
      setSavedStyle(s);
      toast.success('Хадмалын тохиргоо хадгалагдлаа');
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ p: 3, mt: 3 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <Iconify icon="solar:subtitles-bold-duotone" width={24} sx={{ color: 'primary.main' }} />
        <Typography variant="h6">Хадмал</Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Анги бүрт .srt эсвэл .vtt файл оруулна. Байрлал, хэмжээг та тохируулна — үзэгчид өөрчлөх боломжгүй.
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 300px' }, alignItems: 'start' }}>
        {/* Зүүн: файлууд + тохиргоо */}
        <Stack spacing={3}>
          <UploadRow seriesId={seriesId} total={total} onDone={load} />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Оруулсан хадмал
            </Typography>
            {subs === null ? (
              <LinearProgress />
            ) : Object.keys(subs).length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Одоогоор хадмал алга.
              </Typography>
            ) : (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(subs)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .flatMap(([ep, langs]) =>
                    langs.map((lang) => (
                      <Chip
                        key={`${ep}-${lang}`}
                        label={`${ep}-р анги · ${SUB_LANGS[lang]}`}
                        onDelete={async () => {
                          try {
                            await deleteSubtitle(seriesId, ep, lang);
                            toast.success('Устгалаа');
                            load();
                          } catch (e) {
                            toast.error(errorText(e));
                          }
                        }}
                      />
                    ))
                  )}
              </Stack>
            )}
          </Box>

          <Divider />

          {style && <StyleControls style={style} onChange={setStyle} />}

          <Stack direction="row" spacing={1}>
            <Button variant="contained" disabled={!dirty} loading={saving} onClick={save}>
              Тохиргоо хадгалах
            </Button>
            <Button color="inherit" onClick={() => setStyle({ ...DEFAULT_SUB_STYLE })}>
              Анхны байдал
            </Button>
          </Stack>
        </Stack>

        {/* Баруун: урьдчилан харах */}
        {style && <Preview seriesId={seriesId} subs={subs} style={style} poster={poster} onMove={setStyle} />}
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

function UploadRow({ seriesId, total, onDone }) {
  const input = useRef(null);
  const [ep, setEp] = useState(1);
  const [lang, setLang] = useState('mn');
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await uploadSubtitle(seriesId, ep, lang, file);
      toast.success(`${ep}-р ангийн хадмал (${SUB_LANGS[lang]}) хадгалагдлаа`);
      onDone();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField select size="small" label="Анги" value={ep} onChange={(e) => setEp(Number(e.target.value))} sx={{ minWidth: 110 }}>
        {Array.from({ length: Math.max(1, total) }, (_, i) => i + 1).map((n) => (
          <MenuItem key={n} value={n}>
            {n}-р анги
          </MenuItem>
        ))}
      </TextField>
      <TextField select size="small" label="Хэл" value={lang} onChange={(e) => setLang(e.target.value)} sx={{ minWidth: 130 }}>
        {Object.entries(SUB_LANGS).map(([k, v]) => (
          <MenuItem key={k} value={k}>
            {v}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="outlined" loading={busy} onClick={() => input.current?.click()} startIcon={<Iconify icon="solar:upload-bold" />}>
        .srt / .vtt оруулах
      </Button>
      <input ref={input} type="file" accept=".srt,.vtt,text/vtt,application/x-subrip" hidden onChange={pick} />
    </Stack>
  );
}

// ----------------------------------------------------------------------

function Row({ label, value, children }) {
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {value}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function ColorRow({ label, value, presets, onPick }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        {presets.map((c) => (
          <Box
            key={c}
            component="button"
            type="button"
            aria-label={c}
            onClick={() => onPick(c)}
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              bgcolor: c,
              cursor: 'pointer',
              border: value === c ? '3px solid' : '1px solid',
              borderColor: value === c ? 'primary.main' : 'divider',
            }}
          />
        ))}
        <Box
          component="input"
          type="color"
          value={value}
          onChange={(e) => onPick(e.target.value)}
          sx={{ width: 40, height: 32, border: 0, bgcolor: 'transparent', cursor: 'pointer' }}
        />
      </Stack>
    </Box>
  );
}

function Section({ title, icon, children, action }) {
  return (
    <Box sx={{ p: 2, borderRadius: 1.5, border: (t) => `1px solid ${t.vars.palette.divider}` }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Iconify icon={icon} width={20} sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle1">{title}</Typography>
        </Stack>
        {action}
      </Stack>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}

const BG_PRESETS = ['#000000', '#1d1529', '#0b2a4a', '#ffffff'];
const MASK_PRESETS = ['#000000', '#120d1b', '#1f2937', '#ffffff'];

function StyleControls({ style, onChange }) {
  const set = (k) => (_e, v) => onChange({ ...style, [k]: v });
  const mask = style.mask || DEFAULT_SUB_MASK;
  const setMask = (k) => (_e, v) => onChange({ ...style, mask: { ...mask, [k]: v } });

  return (
    <Stack spacing={2}>
      <Section title="Байрлал ба хэмжээ" icon="solar:move-to-folder-bold-duotone">
        <Row label="Хэвтээ байрлал (X)" value={`${style.x}%`}>
          <Slider value={style.x} min={0} max={100} onChange={set('x')} />
        </Row>
        <Row label="Босоо байрлал (Y)" value={`${style.y}% (0 = дээр, 100 = доор)`}>
          <Slider value={style.y} min={0} max={100} onChange={set('y')} />
        </Row>
        <Row label="Үсгийн хэмжээ" value={style.size}>
          <Slider value={style.size} min={10} max={48} onChange={set('size')} />
        </Row>
        <Row label="Мөрийн өргөн" value={`${style.width}%`}>
          <Slider value={style.width} min={40} max={100} onChange={set('width')} />
        </Row>
        <Row label="Хугацаа (эрт / хожуу)" value={`${style.delay > 0 ? '+' : ''}${style.delay} сек`}>
          <Slider value={style.delay} min={-10} max={10} step={0.1} onChange={set('delay')} />
        </Row>
      </Section>

      <Section title="Үсэг" icon="solar:text-bold-duotone">
        <ColorRow label="Үсгийн өнгө" value={style.color} presets={COLORS} onPick={(c) => onChange({ ...style, color: c })} />
        <FormControlLabel control={<Switch checked={style.bold} onChange={(e) => onChange({ ...style, bold: e.target.checked })} />} label="Тод" />
      </Section>

      <Section title="Арын фон" icon="solar:pallete-2-bold-duotone">
        <ToggleButtonGroup size="small" exclusive value={style.bg} onChange={(_e, v) => v && onChange({ ...style, bg: v })}>
          <ToggleButton value="none">Ардгүй</ToggleButton>
          <ToggleButton value="shadow">Сүүдэр</ToggleButton>
          <ToggleButton value="box">Хайрцаг</ToggleButton>
        </ToggleButtonGroup>
        {style.bg === 'box' && (
          <>
            <ColorRow label="Фоны өнгө" value={style.bgColor} presets={BG_PRESETS} onPick={(c) => onChange({ ...style, bgColor: c })} />
            <Row label="Тунгалаг байдал" value={`${style.bgOpacity}%`}>
              <Slider value={style.bgOpacity} min={0} max={100} onChange={set('bgOpacity')} />
            </Row>
            <Row label="Бүдгэрүүлэлт (blur)" value={style.bgBlur ? `${style.bgBlur}px` : 'Үгүй'}>
              <Slider value={style.bgBlur} min={0} max={30} onChange={set('bgBlur')} />
            </Row>
            <Row label="Хайрцгийн хэмжээ" value={`${style.bgPad}`}>
              <Slider value={style.bgPad} min={0.1} max={1.5} step={0.05} onChange={set('bgPad')} />
            </Row>
          </>
        )}
      </Section>

      <Section
        title="Хуучин хадмал нуух тууз"
        icon="solar:eye-closed-bold-duotone"
        action={<Switch checked={mask.on} onChange={(e) => onChange({ ...style, mask: { ...mask, on: e.target.checked } })} />}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Видеон дээр шатаагдсан хуучин хадмалын дээгүүр бүдэг/бараан тууз тавьж нууна. Урьдчилан харах видеог хуучин хадмал
          гарсан мөч рүү гүйлгээд туузыг яг дээр нь тааруулна уу.
        </Typography>
        {mask.on && (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Хэрхэн нуух
              </Typography>
              <ToggleButtonGroup size="small" exclusive value={mask.mode} onChange={(_e, v) => v && onChange({ ...style, mask: { ...mask, mode: v } })}>
                <ToggleButton value="band">Тууз (бүхэлд нь)</ToggleButton>
                <ToggleButton value="smart">Зөвхөн бичгийг бүдгэрүүлэх</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Хэзээ харуулах
              </Typography>
              <ToggleButtonGroup size="small" exclusive value={mask.timing} onChange={(_e, v) => v && onChange({ ...style, mask: { ...mask, timing: v } })}>
                <ToggleButton value="always">Үргэлж</ToggleButton>
                <ToggleButton value="subs">Манай хадмал гарах үед л</ToggleButton>
              </ToggleButtonGroup>
              {mask.timing === 'subs' && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'text.secondary' }}>
                  Хуучин хадмал манай хадмалтай бараг ижил мөчид гардаг тул тэр үед л нууна. Хадмал файл оруулаагүй ангид үргэлж харагдана.
                </Typography>
              )}
            </Box>
            {mask.timing === 'subs' && (
              <Row label="Хугацааны нөөц (өмнө/хойно)" value={`±${mask.pad} сек`}>
                <Slider value={mask.pad} min={0} max={3} step={0.1} onChange={setMask('pad')} />
              </Row>
            )}

            <Row label="Босоо байрлал" value={`${mask.y}%`}>
              <Slider value={mask.y} min={0} max={100} onChange={setMask('y')} />
            </Row>
            <Row label="Өндөр" value={`${mask.h}%`}>
              <Slider value={mask.h} min={2} max={60} onChange={setMask('h')} />
            </Row>
            <Row label="Өргөн" value={`${mask.w}%`}>
              <Slider value={mask.w} min={10} max={100} onChange={setMask('w')} />
            </Row>
            {mask.mode === 'smart' ? (
              <>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Туузны доторх зөвхөн цагаан үсгийг олж, эргэн тойрных нь зургаар бөглөнө — бусад хэсэг тод хэвээр.
                </Typography>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Хуучин хадмалын өнгө
                  </Typography>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={mask.textColor}
                    onChange={(_e, v) => v && onChange({ ...style, mask: { ...mask, textColor: v } })}
                  >
                    <ToggleButton value="white">Цагаан</ToggleButton>
                    <ToggleButton value="yellow">Шар</ToggleButton>
                    <ToggleButton value="bright">Ямар ч тод өнгө</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Row label="Мэдрэмж (хэр тод бол бичиг гэж үзэх)" value={mask.threshold >= 230 ? 'Зөвхөн цэвэр цагаан' : mask.threshold <= 160 ? 'Саарал ч орно' : 'Дунд'}>
                  <Slider value={mask.threshold} min={120} max={255} onChange={setMask('threshold')} />
                </Row>
                <Row label="Бүдгэрүүлэлтийн хүч" value={mask.strength}>
                  <Slider value={mask.strength} min={2} max={24} onChange={setMask('strength')} />
                </Row>
                <Row label="Үсгийн эргэн тойрон (хүрээ, сүүдэр)" value={`${mask.expand}px`}>
                  <Slider value={mask.expand} min={0} max={8} onChange={setMask('expand')} />
                </Row>
              </>
            ) : (
              <>
                <ColorRow label="Туузны өнгө" value={mask.color} presets={MASK_PRESETS} onPick={(c) => onChange({ ...style, mask: { ...mask, color: c } })} />
                <Row label="Тунгалаг байдал" value={`${mask.opacity}%`}>
                  <Slider value={mask.opacity} min={0} max={100} onChange={setMask('opacity')} />
                </Row>
                <Row label="Бүдгэрүүлэлт (blur)" value={mask.blur ? `${mask.blur}px` : 'Үгүй'}>
                  <Slider value={mask.blur} min={0} max={40} onChange={setMask('blur')} />
                </Row>
              </>
            )}
          </>
        )}
      </Section>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Урьдчилан харах: тухайн киноны жинхэнэ видео + хадмал + тууз (тоглуулагчтай яг ижил).
// Зураг дээр дарж чирээд хадмал эсвэл туузыг байрлуулна.

function Preview({ seriesId, subs, style, poster, onMove }) {
  const box = useRef(null);
  const videoRef = useRef(null);
  const [video, setVideo] = useState(null); // { url, ep }
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragWhat, setDragWhat] = useState('sub'); // 'sub' | 'mask'
  const pictureBox = usePictureBox(box, 9 / 16, true);

  useEffect(() => {
    previewVideo(seriesId)
      .then((v) => setVideo(v || null))
      .catch(() => setVideo(null));
  }, [seriesId]);

  const subEp = video?.ep ?? (subs ? Number(Object.keys(subs).sort((a, b) => a - b)[0]) : null);
  const subLang = subEp && subs?.[subEp]?.[0];
  const subUrl = subLang
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kino/subtitles/${seriesId}/${subEp}/${subLang}.vtt?t=${Math.floor(Date.now() / 60000)}`
    : null;
  const cues = useCues(subUrl);
  const sample = cues.find((c) => c.text.length > 8)?.text || SAMPLE;

  const drag = (e) => {
    const el = box.current;
    if (!el) return;
    const move = (ev) => {
      const p = ev.touches ? ev.touches[0] : ev;
      const r = el.getBoundingClientRect();
      const x = Math.round(Math.min(100, Math.max(0, ((p.clientX - r.left) / r.width) * 100)));
      const y = Math.round(Math.min(100, Math.max(0, ((p.clientY - r.top) / r.height) * 100)));
      onMove((s) => (dragWhat === 'mask' ? { ...s, mask: { ...(s.mask || DEFAULT_SUB_MASK), y } } : { ...s, x, y }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    move(e);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <Box sx={{ position: { md: 'sticky' }, top: { md: 90 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2">Урьдчилан харах</Typography>
        <ToggleButtonGroup size="small" exclusive value={dragWhat} onChange={(_e, v) => v && setDragWhat(v)}>
          <ToggleButton value="sub">Хадмал чирэх</ToggleButton>
          <ToggleButton value="mask" disabled={!style.mask?.on}>
            Тууз чирэх
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box
        ref={box}
        onPointerDown={drag}
        sx={{
          containerType: 'inline-size',
          position: 'relative',
          width: 1,
          maxWidth: 300,
          aspectRatio: '9 / 16',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#111',
          cursor: 'crosshair',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {video?.url ? (
          <KinoVideo
            ref={videoRef}
            src={video.url}
            poster={poster}
            crossOrigin="anonymous"
            muted
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            sx={{ width: 1, height: 1, objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
          />
        ) : (
          poster && <Box component="img" src={poster} alt="" draggable={false} sx={{ width: 1, height: 1, objectFit: 'cover', opacity: 0.85 }} />
        )}

        {video?.url ? (
          // Тоглуулагчтай яг ижил: хаалт (хадмалтай үед/үргэлж) + хадмал
          <SubtitleLayers videoRef={videoRef} url={subUrl} style={style} box={pictureBox} />
        ) : (
          <>
            <CoverMask style={style} box={pictureBox} />
            <SubtitleText text={sample} style={style} />
          </>
        )}
        {video?.url && subUrl && !time && (
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <SubtitleText text={sample} style={style} />
          </Box>
        )}
      </Box>

      {video?.url && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1, maxWidth: 300 }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => {
              const v = videoRef.current;
              if (v) (v.paused ? v.play() : v.pause()).catch?.(() => {});
            }}
            sx={{ minWidth: 40, px: 0 }}
          >
            <Iconify icon={playing ? 'solar:pause-bold' : 'solar:play-bold'} />
          </Button>
          <Slider
            size="small"
            value={time}
            min={0}
            max={duration || 1}
            step={0.5}
            onChange={(_e, v) => {
              if (videoRef.current) videoRef.current.currentTime = v;
              setTime(v);
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 72, textAlign: 'right' }}>
            {fmt(time)} / {fmt(duration)}
          </Typography>
        </Stack>
      )}
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', maxWidth: 300 }}>
        {video?.url
          ? `${video.ep}-р ангийн видео (дуугүй). Хуучин хадмал гарсан мөч рүү гүйлгэж туузыг тааруулна уу.`
          : 'Видео оруулаагүй тул постер харуулж байна.'}
      </Typography>
    </Box>
  );
}
