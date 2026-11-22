// ----------------------------------------------------------------------
// Богино цувралын жишээ өгөгдөл.
// Жинхэнэ контент нэмэхдээ энд засна: poster, backdrop, videos[] (анги бүрийн mp4 холбоос).
// videos хоосон бол туршилтын видео тоглуулна.
// ----------------------------------------------------------------------

const IMG = '/assets/images/mock';

export const BRAND = '444 Кино';

export const FREE_EPISODES = 10;

// Кино тус бүрийн үндсэн үнэ (₮). Админд кино бүрээр өөрчилнө; 0 = тусдаа зарахгүй
export const DEFAULT_PRICE = 5900;

// Захиалгын багцууд. id нь supabase/schema.sql доторх нэртэй таарах ёстой.
export const PLANS = [
  { id: 'week', name: '7 хоног', price: 3900, period: '7 хоног', note: 'Туршиж үзэхэд' },
  { id: 'month', name: '1 сар', price: 9900, period: 'сар', note: 'Хамгийн их сонгодог', popular: true },
  { id: 'year', name: '1 жил', price: 79000, period: 'жил', note: '33% хэмнэлт' },
];

export const PLAN_BENEFITS = [
  'Бүх цувралын бүх анги',
  'Шинэ анги хамгийн түрүүнд',
  'Сурталчилгаагүй',
  'Утас, компьютер дээр үзэх',
];

export const planName = (id) => PLANS.find((p) => p.id === id)?.name ?? id;

export const formatPrice = (n) => `${n.toLocaleString('en-US')}₮`;

export const GENRES = [
  'Бүгд',
  'Романс',
  'Өшөө авалт',
  'Уран зөгнөл',
  'Гэр бүл',
  'Триллер',
  'Инээдэм',
  'Түүхэн',
];

const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
];

export const SERIES = [
  {
    id: 'terbumtnii-nuuts-ekhner',
    title: 'Тэрбумтны нууц эхнэр',
    genres: ['Романс', 'Гэр бүл'],
    episodes: 1, // ТЕСТ: нэг ангитай кино
    freeEpisodes: 0, // ТЕСТ: багцгүй хүн
    freeMinutes: 5, // эхний 5 минутыг үзнэ
    views: '4.8 сая',
    rating: 4.9,
    badge: 'Онцлох',
    poster: 'https://vz-b8a3df14-5cc.b-cdn.net/f48cd052-4eac-49bc-bd2b-e22b0e178d70/thumbnail_818bbd3a.jpg', // ТЕСТ: Bunny-гийн зураг
    backdrop: 'https://vz-b8a3df14-5cc.b-cdn.net/f48cd052-4eac-49bc-bd2b-e22b0e178d70/thumbnail_818bbd3a.jpg',
    description:
      'Энгийн кофе шопын ажилтан Сараа нэгэн шөнө танихгүй залуутай гэрээгээр гэрлэнэ. Маргааш нь тэр залуу хотын хамгийн баян компанийн захирал болох нь илэрнэ…',
    // ТЕСТ: Bunny Stream-ийн видео (1-р анги)
    videos: ['https://vz-b8a3df14-5cc.b-cdn.net/f48cd052-4eac-49bc-bd2b-e22b0e178d70/playlist.m3u8'],
  },
  {
    id: 'khaan-shireenii-uv',
    title: 'Хаан ширээний өв залгамжлагч',
    genres: ['Түүхэн', 'Өшөө авалт'],
    episodes: 60,
    views: '3.1 сая',
    rating: 4.8,
    badge: 'Шинэ',
    poster: `${IMG}/portrait/portrait-2.webp`,
    backdrop: `${IMG}/cover/cover-2.webp`,
    description:
      'Хаант улсаас хөөгдсөн ханхүү жирийн малчны дүрд нуугдан амьдарна. Арван жилийн дараа тэрээр өв залгамжлалаа эргүүлэн авахаар ордонд буцаж ирнэ.',
    videos: [],
  },
  {
    id: 'ushee-avaltiin-khatan',
    title: 'Өшөө авалтын хатан',
    genres: ['Өшөө авалт', 'Романс'],
    episodes: 80,
    views: '6.2 сая',
    rating: 4.9,
    badge: 'Топ',
    poster: `${IMG}/portrait/portrait-3.webp`,
    backdrop: `${IMG}/cover/cover-3.webp`,
    description:
      'Нөхөр болон хамгийн дотны найздаа урвагдсан Номин бүх зүйлээ алдана. Гэвч тэр шинэ нэр, шинэ дүр төрхтэй эргэн ирж, нэг нэгээр нь хариуг нь өгнө.',
    videos: [],
  },
  {
    id: 'khoyor-dakhi-amidral',
    title: 'Хоёр дахь амьдрал',
    genres: ['Уран зөгнөл', 'Гэр бүл'],
    episodes: 54,
    views: '2.7 сая',
    rating: 4.7,
    badge: 'Шинэ',
    poster: `${IMG}/portrait/portrait-4.webp`,
    backdrop: `${IMG}/cover/cover-4.webp`,
    description:
      'Нас барсан Ану арван жилийн өмнөх өөрийн биед сэрнэ. Энэ удаад тэр гэр бүлээ аврах, хорон санаатнуудыг илчлэх боломжоо алдахгүй.',
    videos: [],
  },
  {
    id: 'chonon-saran',
    title: 'Чонон сарны тангараг',
    genres: ['Уран зөгнөл', 'Романс'],
    episodes: 66,
    views: '3.9 сая',
    rating: 4.8,
    poster: `${IMG}/portrait/portrait-5.webp`,
    backdrop: `${IMG}/cover/cover-5.webp`,
    description:
      'Чонон овгийн удирдагч тэргэл сарны шөнө нууцлаг охинтой тааралдана. Тэдний хувь заяа эртний тангарагаар холбогдсон байжээ.',
    videos: [],
  },
  {
    id: 'gereet-gerlelt',
    title: 'Гэрээт гэрлэлт',
    genres: ['Романс', 'Инээдэм'],
    episodes: 48,
    views: '1.9 сая',
    rating: 4.6,
    poster: `${IMG}/portrait/portrait-6.webp`,
    backdrop: `${IMG}/cover/cover-6.webp`,
    description:
      'Нэг жилийн гэрээ, хоёр зөрүүд хүн, нэг дээвэр. Хэн нь түрүүлж дурлах вэ? Инээдтэй, халуун дулаан хайрын түүх.',
    videos: [],
  },
  {
    id: 'nuuts-darga',
    title: 'Нууц дарга',
    genres: ['Романс', 'Инээдэм'],
    episodes: 50,
    views: '2.2 сая',
    rating: 4.7,
    poster: `${IMG}/portrait/portrait-7.webp`,
    backdrop: `${IMG}/cover/cover-7.webp`,
    description:
      'Шинэ ажилтан Тэмүүлэн өөрийгөө байнга зовоодог хамт олны залуу нь үнэндээ компанийн эзэн гэдгийг мэдэхгүй байлаа.',
    videos: [],
  },
  {
    id: 'shuniin-murduguch',
    title: 'Шөнийн мөрдөгч',
    genres: ['Триллер'],
    episodes: 40,
    views: '1.4 сая',
    rating: 4.6,
    badge: 'Шинэ',
    poster: `${IMG}/portrait/portrait-8.webp`,
    backdrop: `${IMG}/cover/cover-8.webp`,
    description:
      'Улаанбаатарын шөнийн гудамжинд учир битүүлэг хэрэг дараалан гарна. Залуу мөрдөгч Билгүүн цорын ганц сэжүүрийг мөрдөж эхэлнэ.',
    videos: [],
  },
  {
    id: 'martagdsan-okhin',
    title: 'Мартагдсан охин',
    genres: ['Гэр бүл', 'Өшөө авалт'],
    episodes: 58,
    views: '2.5 сая',
    rating: 4.8,
    poster: `${IMG}/cover/cover-9.webp`,
    backdrop: `${IMG}/cover/cover-9.webp`,
    description:
      'Төрөхдөө солигдсон охин хорин жилийн дараа жинхэнэ гэр бүлээ олно. Гэвч түүний оронд өссөн охин байраа амархан тавьж өгөхгүй.',
    videos: [],
  },
  {
    id: 'taliin-zurkh',
    title: 'Талын зүрх',
    genres: ['Романс', 'Гэр бүл'],
    episodes: 45,
    views: '1.7 сая',
    rating: 4.7,
    poster: `${IMG}/cover/cover-10.webp`,
    backdrop: `${IMG}/cover/cover-10.webp`,
    description:
      'Хотын амжилттай архитектор эмээгийнхээ хөдөөх гэрт зун өнгөрүүлэхээр очиж, тэнд нэгэн малчин залуутай танилцана.',
    videos: [],
  },
  {
    id: 'khuurmach-suit-busgui',
    title: 'Хуурамч сүйт бүсгүй',
    genres: ['Инээдэм', 'Романс'],
    episodes: 42,
    views: '1.2 сая',
    rating: 4.5,
    poster: `${IMG}/cover/cover-11.webp`,
    backdrop: `${IMG}/cover/cover-11.webp`,
    description:
      'Ээжийнхээ шахалтаас мултрахын тулд Мишээл танихгүй залууг сүйт залуугийн дүрд тоглуулахаар хөлсөлнө. Төлөвлөгөө бүрэн замбараагүй болно.',
    videos: [],
  },
  {
    id: 'munkhiin-khair',
    title: 'Мөнхийн хайр',
    genres: ['Романс', 'Уран зөгнөл'],
    episodes: 64,
    views: '3.4 сая',
    rating: 4.8,
    badge: 'Топ',
    poster: `${IMG}/cover/cover-12.webp`,
    backdrop: `${IMG}/cover/cover-12.webp`,
    description:
      'Зуун жилийн турш дахин дахин төрж, бие биенээ хайх хоёр сүнс. Энэ амьдралд тэд эцэст нь хамт байж чадах уу?',
    videos: [],
  },
];

// ----------------------------------------------------------------------

// Өгөгдлийн сангийн мөрийг сайтын хэлбэрт оруулна
export function fromDb(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    genres: row.genres ?? [],
    poster: row.poster,
    backdrop: row.backdrop || row.poster,
    badge: row.badge || undefined,
    rating: Number(row.rating ?? 0),
    views: row.views ?? '0',
    episodes: row.episodes ?? 1,
    freeEpisodes: row.free_episodes ?? FREE_EPISODES,
    freeMinutes: row.free_minutes ?? 0,
    price: row.price ?? DEFAULT_PRICE,
    published: row.published ?? true,
    videos: [],
  };
}

export function getSeries(id, list = SERIES) {
  return list.find((s) => s.id === id) ?? null;
}

// videos: анги → холбоос (объект эсвэл массив). Байхгүй бол туршилтын видео.
export function getEpisodeVideo(series, ep, videos) {
  const url = videos?.[ep] ?? series.videos?.[ep - 1];
  return url || SAMPLE_VIDEOS[(ep - 1) % SAMPLE_VIDEOS.length];
}

export function isFreeEpisode(ep, series) {
  return ep <= (series?.freeEpisodes ?? FREE_EPISODES);
}

// Багцгүй хэрэглэгч түгжээтэй ангийг хэдэн секунд үзэх (0 = огт үгүй)
export function previewSeconds(series) {
  return Math.max(0, Number(series?.freeMinutes) || 0) * 60;
}

// "Эхний 5 минут үнэгүй" гэх мэт тайлбар
export function freeLabel(series) {
  const eps = series?.freeEpisodes ?? FREE_EPISODES;
  const mins = Number(series?.freeMinutes) || 0;
  const total = series?.episodes ?? 1;
  if (eps >= total) return 'Бүтэн үнэгүй';
  if (total === 1) return mins > 0 ? `Эхний ${mins} минут үнэгүй` : 'Зөвхөн багцтай';
  if (eps > 0) return mins > 0 ? `Эхний ${eps} анги үнэгүй · бусад нь ${mins} мин` : `Эхний ${eps} анги үнэгүй`;
  return mins > 0 ? `Анги бүрийн эхний ${mins} минут үнэгүй` : 'Зөвхөн багцтай';
}

export const featuredSeries = (list = SERIES) => {
  const f = list.filter((s) => s.badge === 'Онцлох' || s.badge === 'Топ');
  return f.length ? f : list.slice(0, 4);
};

export const topSeries = (list = SERIES) =>
  [...list].sort((a, b) => parseFloat(b.views) - parseFloat(a.views)).slice(0, 10);

export const newSeries = (list = SERIES) => list.filter((s) => s.badge === 'Шинэ');

export const seriesByGenre = (genre, list = SERIES) =>
  genre === 'Бүгд' ? list : list.filter((s) => s.genres.includes(genre));

// Тусдаа зарагдах уу: үнэтэй, бүтэн үнэгүй биш
export const isForSale = (series) =>
  !!series && (series.price ?? DEFAULT_PRICE) > 0 && (series.freeEpisodes ?? FREE_EPISODES) < (series.episodes ?? 1);

export const priceOf = (series) => series?.price ?? DEFAULT_PRICE;
