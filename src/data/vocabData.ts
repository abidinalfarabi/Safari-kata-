import { SentenceMission, VocabCategory, VocabWord } from '../types/game';

interface RawWordSeed {
  slug: string;
  ar: string;
  tr: string;
  en: string;
  id: string;
  emoji: string;
  fem?: boolean;
}

interface ModifierSeed {
  key: string;
  arM: string;
  arF: string;
  trM: string;
  trF: string;
  en: string;
  id: string;
}

// ---------- 1. Exact Arabic / English / Indonesian Numbers 1..500 ----------

const ID_ONES = [
  '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
  'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
  'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas',
];
const ID_TENS = [
  '', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
  'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh',
];
const ID_HUNDREDS = ['', 'Seratus', 'Dua Ratus', 'Tiga Ratus', 'Empat Ratus', 'Lima Ratus'];

function numToIndonesian(n: number): string {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(ID_HUNDREDS[h]);
  if (rem > 0) {
    if (rem < 20) parts.push(ID_ONES[rem]);
    else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      parts.push(o > 0 ? `${ID_TENS[t]} ${ID_ONES[o]}` : ID_TENS[t]);
    }
  }
  return parts.join(' ');
}

const EN_ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const EN_TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function numToEnglish(n: number): string {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(`${EN_ONES[h]} Hundred`);
  if (rem > 0) {
    if (rem < 20) parts.push(EN_ONES[rem]);
    else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      parts.push(o > 0 ? `${EN_TENS[t]}-${EN_ONES[o]}` : EN_TENS[t]);
    }
  }
  return parts.join(' ');
}

const AR_ONES: [string, string][] = [
  ['', ''],
  ['وَاحِدٌ', 'Waahidun'],
  ['اِثْنَانِ', 'Itsnaani'],
  ['ثَلَاثَةٌ', 'Tsalaatsatun'],
  ['أَرْبَعَةٌ', "Arba'atun"],
  ['خَمْسَةٌ', 'Khamsatun'],
  ['سِتَّةٌ', 'Sittatun'],
  ['سَبْعَةٌ', "Sab'atun"],
  ['ثَمَانِيَةٌ', 'Tsamaaniyatun'],
  ['تِسْعَةٌ', "Tis'atun"],
  ['عَشَرَةٌ', "'Asyaratun"],
  ['أَحَدَ عَشَرَ', "Ahada 'asyara"],
  ['اِثْنَا عَشَرَ', "Itsnaa 'asyara"],
  ['ثَلَاثَةَ عَشَرَ', "Tsalaatsata 'asyara"],
  ['أَرْبَعَةَ عَشَرَ', "Arba'ata 'asyara"],
  ['خَمْسَةَ عَشَرَ', "Khamsata 'asyara"],
  ['سِتَّةَ عَشَرَ', "Sittata 'asyara"],
  ['سَبْعَةَ عَشَرَ', "Sab'ata 'asyara"],
  ['ثَمَانِيَةَ عَشَرَ', "Tsamaaniyata 'asyara"],
  ['تِسْعَةَ عَشَرَ', "Tis'ata 'asyara"],
];

const AR_TENS: [string, string][] = [
  ['', ''],
  ['', ''],
  ['عِشْرُونَ', "'Isyruuna"],
  ['ثَلَاثُونَ', 'Tsalaatsuuna'],
  ['أَرْبَعُونَ', "Arba'uuna"],
  ['خَمْسُونَ', 'Khamsuuna'],
  ['سِتُّونَ', 'Sittuuna'],
  ['سَبْعُونَ', "Sab'uuna"],
  ['ثَمَانُونَ', 'Tsamaanuuna'],
  ['تِسْعُونَ', "Tis'uuna"],
];

const AR_HUNDREDS: [string, string][] = [
  ['', ''],
  ['مِائَةٌ', "Mi'atun"],
  ['مِائَتَانِ', "Mi'ataani"],
  ['ثَلَاثُمِائَةٍ', "Tsalaatsumi'atin"],
  ['أَرْبَعُمِائَةٍ', "Arba'umi'atin"],
  ['خَمْسُمِائَةٍ', "Khamsumi'atin"],
];

function numToArabic(n: number): { ar: string; tr: string } {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const arParts: string[] = [];
  const trParts: string[] = [];

  if (h > 0) {
    arParts.push(AR_HUNDREDS[h][0]);
    trParts.push(AR_HUNDREDS[h][1]);
  }
  if (rem > 0) {
    let remAr = '';
    let remTr = '';
    if (rem < 20) {
      remAr = AR_ONES[rem][0];
      remTr = AR_ONES[rem][1];
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (o > 0) {
        remAr = `${AR_ONES[o][0]} وَ${AR_TENS[t][0]}`;
        remTr = `${AR_ONES[o][1]} wa ${AR_TENS[t][1]}`;
      } else {
        remAr = AR_TENS[t][0];
        remTr = AR_TENS[t][1];
      }
    }
    if (h > 0) {
      arParts.push(`وَ${remAr}`);
      trParts.push(`wa ${remTr}`);
    } else {
      arParts.push(remAr);
      trParts.push(remTr);
    }
  }
  return { ar: arParts.join(' '), tr: trParts.join(' ') };
}

const LEGACY_NUM_IDS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  10: 'ten',
};

function buildNumberWords(): VocabWord[] {
  const list: VocabWord[] = [];
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢'];
  for (let n = 1; n <= 500; n++) {
    const ar = numToArabic(n);
    list.push({
      id: LEGACY_NUM_IDS[n] || `num_${n}`,
      arabic: ar.ar,
      transliteration: ar.tr,
      english: `${numToEnglish(n)} (${n})`,
      indonesian: `${numToIndonesian(n)} (${n})`,
      category: 'Angka',
      emoji: n <= 10 ? emojis[n - 1] : '🔢',
    });
  }
  return list;
}

// ---------- 2. Curated Noun & Expression Modifiers ----------

const NOUN_MODIFIERS: ModifierSeed[] = [
  { key: 'big', arM: 'كَبِيرٌ', arF: 'كَبِيرَةٌ', trM: 'kabiirun', trF: 'kabiiratun', en: 'Big', id: 'Besar' },
  { key: 'small', arM: 'صَغِيرٌ', arF: 'صَغِيرَةٌ', trM: 'shaghiirun', trF: 'shaghiiratun', en: 'Small', id: 'Kecil' },
  { key: 'new', arM: 'جَدِيدٌ', arF: 'جَدِيدَةٌ', trM: 'jadiidun', trF: 'jadiidatun', en: 'New', id: 'Baru' },
  { key: 'beautiful', arM: 'جَمِيلٌ', arF: 'جَمِيلَةٌ', trM: 'jamiilun', trF: 'jamiilatun', en: 'Beautiful', id: 'Indah' },
  { key: 'clean', arM: 'نَظِيفٌ', arF: 'نَظِيفَةٌ', trM: 'nadziifun', trF: 'nadziifatun', en: 'Clean', id: 'Bersih' },
  { key: 'good', arM: 'جَيِّدٌ', arF: 'جَيِّدَةٌ', trM: 'jayyidun', trF: 'jayyidatun', en: 'Good', id: 'Bagus' },
  { key: 'white', arM: 'أَبْيَضُ', arF: 'بَيْضَاءُ', trM: 'abyadhu', trF: "baidhaa'u", en: 'White', id: 'Putih' },
  { key: 'red', arM: 'أَحْمَرُ', arF: 'حَمْرَاءُ', trM: 'ahmaru', trF: "hamraa'u", en: 'Red', id: 'Merah' },
  { key: 'blue', arM: 'أَزْرَقُ', arF: 'زَرْقَاءُ', trM: 'azraqu', trF: "zarqaa'u", en: 'Blue', id: 'Biru' },
  { key: 'green', arM: 'أَخْضَرُ', arF: 'خَضْرَاءُ', trM: 'akhdharu', trF: "khadhraa'u", en: 'Green', id: 'Hijau' },
  { key: 'yellow', arM: 'أَصْفَرُ', arF: 'صَفْرَاءُ', trM: 'ashfaru', trF: "shafraa'u", en: 'Yellow', id: 'Kuning' },
  { key: 'cute', arM: 'لَطِيفٌ', arF: 'لَطِيفَةٌ', trM: 'lathiifun', trF: 'lathiifatun', en: 'Cute', id: 'Lucu' },
  { key: 'amazing', arM: 'رَائِعٌ', arF: 'رَائِعَةٌ', trM: "raa'i'un", trF: "raa'i'atun", en: 'Amazing', id: 'Hebat' },
  { key: 'bright', arM: 'مُضِيءٌ', arF: 'مُضِيئَةٌ', trM: "mudhii'un", trF: "mudhii'atun", en: 'Bright', id: 'Cerah' },
];

// ---------- 3. Rich Curated Category Bases (22 Non-Number Categories) ----------

const CATEGORY_SEEDS: Record<Exclude<VocabCategory, 'Angka'>, RawWordSeed[]> = {
  Hewan: [
    { slug: 'cat', ar: 'قِطَّةٌ', tr: 'Qit-tatun', en: 'Cat', id: 'Kucing', emoji: '🐱', fem: true },
    { slug: 'lion', ar: 'أَسَدٌ', tr: 'Asadun', en: 'Lion', id: 'Singa', emoji: '🦁' },
    { slug: 'bird', ar: 'طَائِرٌ', tr: "Thaa'irun", en: 'Bird', id: 'Burung', emoji: '🐦' },
    { slug: 'fish', ar: 'سَمَكَةٌ', tr: 'Samakatun', en: 'Fish', id: 'Ikan', emoji: '🐟', fem: true },
    { slug: 'rabbit', ar: 'أَرْنَبٌ', tr: 'Arnabun', en: 'Rabbit', id: 'Kelinci', emoji: '🐰' },
    { slug: 'elephant', ar: 'فِيلٌ', tr: 'Fiilun', en: 'Elephant', id: 'Gajah', emoji: '🐘' },
    { slug: 'duck', ar: 'بَطَّةٌ', tr: 'Bat-tatun', en: 'Duck', id: 'Bebek', emoji: '🦆', fem: true },
    { slug: 'horse', ar: 'حِصَانٌ', tr: 'Hishaanun', en: 'Horse', id: 'Kuda', emoji: '🐴' },
    { slug: 'butterfly', ar: 'فَرَاشَةٌ', tr: 'Faraasyatun', en: 'Butterfly', id: 'Kupu-kupu', emoji: '🦋', fem: true },
    { slug: 'turtle', ar: 'سُلَحْفَاةٌ', tr: 'Suluhfaatun', en: 'Turtle', id: 'Kura-kura', emoji: '🐢', fem: true },
    { slug: 'camel', ar: 'جَمَلٌ', tr: 'Jamalun', en: 'Camel', id: 'Unta', emoji: '🐪' },
    { slug: 'sheep', ar: 'خَرُوفٌ', tr: 'Kharuufun', en: 'Sheep', id: 'Domba', emoji: '🐑' },
    { slug: 'frog', ar: 'ضِفْدَعٌ', tr: "Dhifda'un", en: 'Frog', id: 'Katak', emoji: '🐸' },
    { slug: 'tiger', ar: 'نَمِرٌ', tr: 'Namirun', en: 'Tiger', id: 'Harimau', emoji: '🐯' },
    { slug: 'bear', ar: 'دُبٌّ', tr: 'Dubbun', en: 'Bear', id: 'Beruang', emoji: '🐻' },
    { slug: 'panda_an', ar: 'بَانْدَا', tr: 'Baandaa', en: 'Panda', id: 'Panda', emoji: '🐼' },
    { slug: 'giraffe', ar: 'زَرَافَةٌ', tr: 'Zaraafatun', en: 'Giraffe', id: 'Jerapah', emoji: '🦒', fem: true },
    { slug: 'monkey', ar: 'قِرْدٌ', tr: 'Qirdun', en: 'Monkey', id: 'Monyet', emoji: '🐒' },
    { slug: 'deer', ar: 'غَزَالٌ', tr: 'Ghazaalun', en: 'Deer', id: 'Rusa', emoji: '🦌' },
    { slug: 'fox', ar: 'ثَعْلَبٌ', tr: "Tsa'labun", en: 'Fox', id: 'Rubah', emoji: '🦊' },
    { slug: 'cow', ar: 'بَقَرَةٌ', tr: 'Baqaratun', en: 'Cow', id: 'Sapi', emoji: '🐄', fem: true },
    { slug: 'goat', ar: 'مَاعِزٌ', tr: "Maa'izun", en: 'Goat', id: 'Kambing', emoji: '🐐' },
    { slug: 'chicken', ar: 'دَجَاجَةٌ', tr: 'Dajaajatun', en: 'Chicken', id: 'Ayam', emoji: '🐔', fem: true },
    { slug: 'bee', ar: 'نَحْلَةٌ', tr: 'Nahlatun', en: 'Bee', id: 'Lebah', emoji: '🐝', fem: true },
    { slug: 'owl', ar: 'بُومَةٌ', tr: 'Buumatun', en: 'Owl', id: 'Burung Hantu', emoji: '🦉', fem: true },
  ],
  'Buah & Sayur': [
    { slug: 'apple', ar: 'تُفَّاحَةٌ', tr: 'Tuffaahatun', en: 'Apple', id: 'Apel', emoji: '🍎', fem: true },
    { slug: 'banana', ar: 'مَوْزٌ', tr: 'Mauzun', en: 'Banana', id: 'Pisang', emoji: '🍌' },
    { slug: 'orange', ar: 'بُرْتُقَالٌ', tr: 'Burtuqaalun', en: 'Orange', id: 'Jeruk', emoji: '🍊' },
    { slug: 'grape', ar: 'عِنَبٌ', tr: "'Inabun", en: 'Grape', id: 'Anggur', emoji: '🍇' },
    { slug: 'watermelon', ar: 'بِطِّيخٌ', tr: 'Bit-tiikhun', en: 'Watermelon', id: 'Semangka', emoji: '🍉' },
    { slug: 'strawberry', ar: 'فَرَاوِلَةٌ', tr: 'Faraawilatun', en: 'Strawberry', id: 'Stroberi', emoji: '🍓', fem: true },
    { slug: 'mango', ar: 'مَانْجُو', tr: 'Maanjuu', en: 'Mango', id: 'Mangga', emoji: '🥭' },
    { slug: 'dates', ar: 'تَمْرٌ', tr: 'Tamrun', en: 'Dates', id: 'Kurma', emoji: '🌴' },
    { slug: 'pineapple', ar: 'أَنَانَاسٌ', tr: 'Anaanaasun', en: 'Pineapple', id: 'Nanas', emoji: '🍍' },
    { slug: 'melon', ar: 'شَمَّامٌ', tr: 'Syammaamun', en: 'Melon', id: 'Melon', emoji: '🍈' },
    { slug: 'pomegranate', ar: 'رُمَّانٌ', tr: 'Rummaanun', en: 'Pomegranate', id: 'Delima', emoji: '🍅' },
    { slug: 'lemon', ar: 'لَيْمُونٌ', tr: 'Laimuunun', en: 'Lemon', id: 'Lemon', emoji: '🍋' },
    { slug: 'peach', ar: 'خَوْخٌ', tr: 'Khaukhun', en: 'Peach', id: 'Persik', emoji: '🍑' },
    { slug: 'cherry', ar: 'كَرَزٌ', tr: 'Karazun', en: 'Cherry', id: 'Ceri', emoji: '🍒' },
    { slug: 'coconut', ar: 'جَوْزُ الْهِنْدِ', tr: 'Jauzul Hindi', en: 'Coconut', id: 'Kelapa', emoji: '🥥' },
    { slug: 'carrot', ar: 'جَزَرٌ', tr: 'Jazarun', en: 'Carrot', id: 'Wortel', emoji: '🥕' },
    { slug: 'tomato', ar: 'طَمَاطِمُ', tr: 'Thamaathimu', en: 'Tomato', id: 'Tomat', emoji: '🍅' },
    { slug: 'potato', ar: 'بَطَاطِسُ', tr: 'Bathaathisu', en: 'Potato', id: 'Kentang', emoji: '🥔' },
    { slug: 'cucumber', ar: 'خِيَارٌ', tr: 'Khiyaarun', en: 'Cucumber', id: 'Mentimun', emoji: '🥒' },
    { slug: 'corn', ar: 'ذُرَةٌ', tr: 'Dzuratun', en: 'Corn', id: 'Jagung', emoji: '🌽', fem: true },
    { slug: 'broccoli', ar: 'بْرُوكْلِي', tr: 'Bruuklii', en: 'Broccoli', id: 'Brokoli', emoji: '🥦' },
    { slug: 'onion', ar: 'بَصَلٌ', tr: 'Bashalun', en: 'Onion', id: 'Bawang', emoji: '🧅' },
    { slug: 'eggplant', ar: 'بَاذِنْجَانٌ', tr: 'Baadzanjaanun', en: 'Eggplant', id: 'Terong', emoji: '🍆' },
    { slug: 'spinach', ar: 'سَبَانِخُ', tr: 'Sabaanikhu', en: 'Spinach', id: 'Bayam', emoji: '🥬' },
  ],
  Pekerjaan: [
    { slug: 'teacher', ar: 'مُعَلِّمٌ', tr: "Mu'allimun", en: 'Teacher', id: 'Guru', emoji: '👩‍🏫' },
    { slug: 'doctor', ar: 'طَبِيبٌ', tr: 'Thabiibun', en: 'Doctor', id: 'Dokter', emoji: '👨‍⚕️' },
    { slug: 'nurse', ar: 'مُمَرِّضَةٌ', tr: 'Mumarridhatun', en: 'Nurse', id: 'Perawat', emoji: '🩺', fem: true },
    { slug: 'engineer', ar: 'مُهَنْدِسٌ', tr: 'Muhandisun', en: 'Engineer', id: 'Insinyur', emoji: '👷' },
    { slug: 'pilot', ar: 'طَيَّارٌ', tr: 'Thayyaarun', en: 'Pilot', id: 'Pilot', emoji: '👨‍✈️' },
    { slug: 'police', ar: 'شُرْطِيٌّ', tr: 'Syurthiyyun', en: 'Police Officer', id: 'Polisi', emoji: '👮' },
    { slug: 'firefighter', ar: 'رَجُلُ إِطْفَاءٍ', tr: "Rajulu Ithfaa'in", en: 'Firefighter', id: 'Pemadam Kebakaran', emoji: '👨‍🚒' },
    { slug: 'chef', ar: 'طَبَّاخٌ', tr: 'Thabbaakhun', en: 'Chef', id: 'Koki', emoji: '👨‍🍳' },
    { slug: 'farmer', ar: 'فَلَّاحٌ', tr: 'Fallaahun', en: 'Farmer', id: 'Petani', emoji: '👨‍🌾' },
    { slug: 'fisherman', ar: 'صَيَّادُ سَمَكٍ', tr: 'Shayyaadu Samakin', en: 'Fisherman', id: 'Nelayan', emoji: '🎣' },
    { slug: 'carpenter', ar: 'نَجَّارٌ', tr: 'Najjaarun', en: 'Carpenter', id: 'Tukang Kayu', emoji: '🪚' },
    { slug: 'tailor', ar: 'خَيَّاطٌ', tr: 'Khayyaathun', en: 'Tailor', id: 'Penjahit', emoji: '🧵' },
    { slug: 'merchant', ar: 'تَاجِرٌ', tr: 'Taajirun', en: 'Merchant', id: 'Pedagang', emoji: '🏪' },
    { slug: 'driver', ar: 'سَائِقٌ', tr: "Saa'iqun", en: 'Driver', id: 'Sopir', emoji: '🚕' },
    { slug: 'scientist', ar: 'عَالِمٌ', tr: "'Aalimun", en: 'Scientist', id: 'Ilmuwan', emoji: '🔬' },
    { slug: 'artist', ar: 'رَسَّامٌ', tr: 'Rassaamun', en: 'Artist', id: 'Pelukis', emoji: '🎨' },
    { slug: 'writer', ar: 'كَاتِبٌ', tr: 'Kaatibun', en: 'Writer', id: 'Penulis', emoji: '✍️' },
    { slug: 'astronaut', ar: 'رَائِدُ فَضَاءٍ', tr: "Raa'idu Fadhaa'in", en: 'Astronaut', id: 'Astronot', emoji: '👨‍🚀' },
    { slug: 'baker', ar: 'خَبَّازٌ', tr: 'Khabbaazun', en: 'Baker', id: 'Pembuat Roti', emoji: '🥖' },
    { slug: 'gardener', ar: 'بُسْتَانِيٌّ', tr: 'Bustaaniiyun', en: 'Gardener', id: 'Tukang Kebun', emoji: '🪴' },
    { slug: 'dentist', ar: 'طَبِيبُ أَسْنَانٍ', tr: 'Thabiibu Asnaanin', en: 'Dentist', id: 'Dokter Gigi', emoji: '🦷' },
    { slug: 'architect', ar: 'مِعْمَارِيٌّ', tr: "Mi'maariyyun", en: 'Architect', id: 'Arsitek', emoji: '📐' },
    { slug: 'soldier', ar: 'جُنْدِيٌّ', tr: 'Jundiyyun', en: 'Soldier', id: 'Tentara', emoji: '🪖' },
    { slug: 'journalist', ar: 'صَحَفِيٌّ', tr: 'Shahafiyyun', en: 'Journalist', id: 'Wartawan', emoji: '📰' },
  ],
  Warna: [
    { slug: 'red', ar: 'أَحْمَرُ', tr: 'Ahmaru', en: 'Red', id: 'Merah', emoji: '🔴' },
    { slug: 'blue', ar: 'أَزْرَقُ', tr: 'Azraqu', en: 'Blue', id: 'Biru', emoji: '🔵' },
    { slug: 'green', ar: 'أَخْضَرُ', tr: 'Akhdharu', en: 'Green', id: 'Hijau', emoji: '🟢' },
    { slug: 'yellow', ar: 'أَصْفَرُ', tr: 'Ashfaru', en: 'Yellow', id: 'Kuning', emoji: '🟡' },
    { slug: 'white', ar: 'أَبْيَضُ', tr: 'Abyadhu', en: 'White', id: 'Putih', emoji: '⚪' },
    { slug: 'black', ar: 'أَسْوَدُ', tr: 'Aswadu', en: 'Black', id: 'Hitam', emoji: '⚫' },
    { slug: 'color_orange', ar: 'بُرْتُقَالِيٌّ', tr: 'Burtuqaaliyyun', en: 'Orange', id: 'Jingga', emoji: '🟠' },
    { slug: 'color_purple', ar: 'بَنَفْسَجِيٌّ', tr: 'Banafsajiyyun', en: 'Purple', id: 'Ungu', emoji: '🟣' },
    { slug: 'color_pink', ar: 'وَرْدِيٌّ', tr: 'Wardiyyun', en: 'Pink', id: 'Merah Muda', emoji: '🩷' },
    { slug: 'color_brown', ar: 'بُنِّيٌّ', tr: 'Bunniyyun', en: 'Brown', id: 'Cokelat', emoji: '🟤' },
    { slug: 'color_gray', ar: 'رَمَادِيٌّ', tr: 'Ramaadiyyun', en: 'Gray', id: 'Abu-abu', emoji: '🩶' },
    { slug: 'color_gold', ar: 'ذَهَبِيٌّ', tr: 'Dzahabiyyun', en: 'Gold', id: 'Emas', emoji: '🟨' },
    { slug: 'color_silver', ar: 'فِضِّيٌّ', tr: 'Fiddhiyyun', en: 'Silver', id: 'Perak', emoji: '🪙' },
    { slug: 'color_cyan', ar: 'سَمَاوِيٌّ', tr: 'Samaawiyyun', en: 'Sky Blue', id: 'Biru Langit', emoji: '🩵' },
    { slug: 'color_indigo', ar: 'نِيلِيٌّ', tr: 'Niiliyyun', en: 'Indigo', id: 'Nila', emoji: '🔷' },
    { slug: 'color_lime', ar: 'فُسْتُقِيٌّ', tr: 'Fustuqiyyun', en: 'Lime Green', id: 'Hijau Muda', emoji: '💚' },
    { slug: 'color_cream', ar: 'كْرِيمِيٌّ', tr: 'Kriimiyyun', en: 'Cream', id: 'Krem', emoji: '🍦' },
    { slug: 'color_navy', ar: 'كُحْلِيٌّ', tr: 'Kuhliyyun', en: 'Navy Blue', id: 'Biru Tua', emoji: '🫐' },
  ],
  Ukuran: [
    { slug: 'size_big', ar: 'كَبِيرٌ', tr: 'Kabiirun', en: 'Big', id: 'Besar', emoji: '🐘' },
    { slug: 'size_small', ar: 'صَغِيرٌ', tr: 'Shaghiirun', en: 'Small', id: 'Kecil', emoji: '🐜' },
    { slug: 'size_tall', ar: 'طَوِيلٌ', tr: 'Thawiilun', en: 'Tall / Long', id: 'Tinggi / Panjang', emoji: '📏' },
    { slug: 'size_short', ar: 'قَصِيرٌ', tr: 'Qashiirun', en: 'Short', id: 'Pendek', emoji: '📐' },
    { slug: 'size_wide', ar: 'وَاسِعٌ', tr: "Waasi'un", en: 'Wide', id: 'Luas / Lebar', emoji: '↔️' },
    { slug: 'size_narrow', ar: 'ضَيِّقٌ', tr: 'Dhayyiqun', en: 'Narrow', id: 'Sempit', emoji: '🤏' },
    { slug: 'size_heavy', ar: 'ثَقِيلٌ', tr: 'Tsaqiilun', en: 'Heavy', id: 'Berat', emoji: '🪨' },
    { slug: 'size_light', ar: 'خَفِيفٌ', tr: 'Khafiifun', en: 'Light', id: 'Ringan', emoji: '🪶' },
    { slug: 'size_thick', ar: 'سَمِيكٌ', tr: 'Samiikun', en: 'Thick', id: 'Tebal', emoji: '📕' },
    { slug: 'size_thin', ar: 'رَقِيقٌ', tr: 'Raqiiqun', en: 'Thin', id: 'Tipis', emoji: '📄' },
    { slug: 'size_high', ar: 'عَالٍ', tr: "'Aalin", en: 'High', id: 'Tinggi', emoji: '🏔️' },
    { slug: 'size_low', ar: 'مُنْخَفِضٌ', tr: 'Munkhafidhun', en: 'Low', id: 'Rendah', emoji: '⬇️' },
    { slug: 'size_deep', ar: 'عَمِيقٌ', tr: "'Amiiqun", en: 'Deep', id: 'Dalam', emoji: '🌊' },
    { slug: 'size_shallow', ar: 'ضَحْلٌ', tr: 'Dhahlun', en: 'Shallow', id: 'Dangkal', emoji: '💧' },
    { slug: 'size_huge', ar: 'ضَخْمٌ', tr: 'Dhakhmun', en: 'Huge', id: 'Raksasa', emoji: '🦕' },
    { slug: 'size_tiny', ar: 'دَقِيقٌ', tr: 'Daqiiqun', en: 'Tiny', id: 'Mungil', emoji: '🔬' },
    { slug: 'size_medium', ar: 'مُتَوَسِّطٌ', tr: 'Mutawassithun', en: 'Medium', id: 'Sedang', emoji: '⚖️' },
    { slug: 'size_full', ar: 'مُمْتَلِئٌ', tr: "Mumtali'un", en: 'Full', id: 'Penuh', emoji: '🥛' },
    { slug: 'size_empty', ar: 'فَارِغٌ', tr: 'Faarighun', en: 'Empty', id: 'Kosong', emoji: '🫙' },
    { slug: 'size_far', ar: 'بَعِيدٌ', tr: "Ba'iidun", en: 'Far', id: 'Jauh', emoji: '🔭' },
    { slug: 'size_near', ar: 'قَرِيبٌ', tr: 'Qariibun', en: 'Near', id: 'Dekat', emoji: '📍' },
  ],
  'Kata Kerja': [
    { slug: 'eat', ar: 'يَأْكُلُ', tr: "Ya'kulu", en: 'Eat', id: 'Makan', emoji: '🍽️' },
    { slug: 'drink', ar: 'يَشْرَبُ', tr: 'Yasyrabu', en: 'Drink', id: 'Minum', emoji: '🥤' },
    { slug: 'go', ar: 'يَذْهَبُ', tr: 'Yadzhabu', en: 'Go', id: 'Pergi', emoji: '🚶' },
    { slug: 'learn', ar: 'يَتَعَلَّمُ', tr: "Yata'allamu", en: 'Learn', id: 'Belajar', emoji: '🧠' },
    { slug: 'read', ar: 'يَقْرَأُ', tr: "Yaqra'u", en: 'Read', id: 'Membaca', emoji: '📚' },
    { slug: 'play', ar: 'يَلْعَبُ', tr: "Yal'abu", en: 'Play', id: 'Bermain', emoji: '🎮' },
    { slug: 'sleep', ar: 'يَنَامُ', tr: 'Yanaamu', en: 'Sleep', id: 'Tidur', emoji: '😴' },
    { slug: 'write', ar: 'يَكْتُبُ', tr: 'Yaktubu', en: 'Write', id: 'Menulis', emoji: '✍️' },
    { slug: 'run', ar: 'يَجْرِي', tr: 'Yajrii', en: 'Run', id: 'Berlari', emoji: '🏃' },
    { slug: 'walk', ar: 'يَمْشِي', tr: 'Yamsyii', en: 'Walk', id: 'Berjalan', emoji: '🚶‍♂️' },
    { slug: 'fly', ar: 'يَطِيرُ', tr: 'Yathiiru', en: 'Fly', id: 'Terbang', emoji: '🕊️' },
    { slug: 'swim', ar: 'يَسْبَحُ', tr: 'Yasbahu', en: 'Swim', id: 'Berenang', emoji: '🏊' },
    { slug: 'sit', ar: 'يَجْلِسُ', tr: 'Yajlisu', en: 'Sit', id: 'Duduk', emoji: '🪑' },
    { slug: 'stand', ar: 'يَقِفُ', tr: 'Yaqifu', en: 'Stand', id: 'Berdiri', emoji: '🧍' },
    { slug: 'open', ar: 'يَفْتَحُ', tr: 'Yaftahu', en: 'Open', id: 'Membuka', emoji: '🔓' },
    { slug: 'close', ar: 'يُغْلِقُ', tr: 'Yughliqu', en: 'Close', id: 'Menutup', emoji: '🔒' },
    { slug: 'look', ar: 'يَنْظُرُ', tr: 'Yandzuru', en: 'Look', id: 'Melihat', emoji: '👀' },
    { slug: 'listen', ar: 'يَسْمَعُ', tr: "Yasma'u", en: 'Listen', id: 'Mendengar', emoji: '👂' },
    { slug: 'speak', ar: 'يَتَكَلَّمُ', tr: 'Yatakallamu', en: 'Speak', id: 'Berbicara', emoji: '🗣️' },
    { slug: 'laugh', ar: 'يَضْحَكُ', tr: 'Yadh-haku', en: 'Laugh', id: 'Tertawa', emoji: '😄' },
    { slug: 'help_v', ar: 'يُسَاعِدُ', tr: "Yusaa'idu", en: 'Help', id: 'Membantu', emoji: '🤝' },
    { slug: 'wash', ar: 'يَغْسِلُ', tr: 'Yaghsilu', en: 'Wash', id: 'Mencuci', emoji: '🧼' },
    { slug: 'cook', ar: 'يَطْبُخُ', tr: 'Yathbukhu', en: 'Cook', id: 'Memasak', emoji: '🍳' },
    { slug: 'draw', ar: 'يَرْسُمُ', tr: 'Yarsumu', en: 'Draw', id: 'Menggambar', emoji: '🎨' },
    { slug: 'pray', ar: 'يُصَلِّي', tr: 'Yushallii', en: 'Pray', id: 'Berdoa / Shalat', emoji: '🤲' },
  ],
  'Kata Sifat': [
    { slug: 'happy', ar: 'سَعِيدٌ', tr: "Sa'iidun", en: 'Happy', id: 'Senang', emoji: '😄' },
    { slug: 'adj_sad', ar: 'حَزِينٌ', tr: 'Haziinun', en: 'Sad', id: 'Sedih', emoji: '😢' },
    { slug: 'adj_smart', ar: 'ذَكِيٌّ', tr: 'Dzakiyyun', en: 'Smart', id: 'Pintar', emoji: '🧠' },
    { slug: 'adj_diligent', ar: 'مُجْتَهِدٌ', tr: 'Mujtahidun', en: 'Diligent', id: 'Rajin', emoji: '📖' },
    { slug: 'adj_brave', ar: 'شُجَاعٌ', tr: "Syujaa'un", en: 'Brave', id: 'Berani', emoji: '🦁' },
    { slug: 'adj_kind', ar: 'لَطِيفٌ', tr: 'Lathiifun', en: 'Kind', id: 'Baik Hati', emoji: '💖' },
    { slug: 'adj_fast', ar: 'سَرِيعٌ', tr: "Sarii'un", en: 'Fast', id: 'Cepat', emoji: '⚡' },
    { slug: 'adj_slow', ar: 'بَطِيءٌ', tr: "Bathii'un", en: 'Slow', id: 'Lambat', emoji: '🐢' },
    { slug: 'adj_strong', ar: 'قَوِيٌّ', tr: 'Qawiyyun', en: 'Strong', id: 'Kuat', emoji: '💪' },
    { slug: 'adj_weak', ar: 'ضَعِيفٌ', tr: "Dha'iifun", en: 'Weak', id: 'Lemah', emoji: '🍃' },
    { slug: 'adj_clean', ar: 'نَظِيفٌ', tr: 'Nadziifun', en: 'Clean', id: 'Bersih', emoji: '✨' },
    { slug: 'adj_dirty', ar: 'وَسِخٌ', tr: 'Wasikhun', en: 'Dirty', id: 'Kotor', emoji: '🪨' },
    { slug: 'adj_hot', ar: 'حَارٌّ', tr: 'Haarrun', en: 'Hot', id: 'Panas', emoji: '🔥' },
    { slug: 'adj_cold', ar: 'بَارِدٌ', tr: 'Baaridun', en: 'Cold', id: 'Dingin', emoji: '❄️' },
    { slug: 'adj_sweet', ar: 'حُلْوٌ', tr: 'Hulwun', en: 'Sweet', id: 'Manis', emoji: '🍯' },
    { slug: 'adj_delicious', ar: 'لَذِيذٌ', tr: 'Ladziidzun', en: 'Delicious', id: 'Lezat', emoji: '😋' },
    { slug: 'adj_honest', ar: 'صَادِقٌ', tr: 'Shaadiqun', en: 'Honest', id: 'Jujur', emoji: '🌟' },
    { slug: 'adj_patient', ar: 'صَبُورٌ', tr: 'Shabuurun', en: 'Patient', id: 'Sabar', emoji: '🕊️' },
    { slug: 'adj_cheerful', ar: 'مَرِحٌ', tr: 'Marihun', en: 'Cheerful', id: 'Ceria', emoji: '🥳' },
    { slug: 'adj_easy', ar: 'سَهْلٌ', tr: 'Sahlun', en: 'Easy', id: 'Mudah', emoji: '👍' },
    { slug: 'adj_hard', ar: 'صَعْبٌ', tr: "Sha'bun", en: 'Difficult', id: 'Sulit', emoji: '🧩' },
    { slug: 'adj_rich', ar: 'غَنِيٌّ', tr: 'Ghaniyyun', en: 'Rich', id: 'Kaya', emoji: '💎' },
  ],
  Sekolah: [
    { slug: 'book', ar: 'كِتَابٌ', tr: 'Kitaabun', en: 'Book', id: 'Buku', emoji: '📖' },
    { slug: 'pen', ar: 'قَلَمٌ', tr: 'Qalamun', en: 'Pen', id: 'Pena', emoji: '✏️' },
    { slug: 'bag', ar: 'حَقِيبَةٌ', tr: 'Haqiibatun', en: 'School Bag', id: 'Tas Sekolah', emoji: '🎒', fem: true },
    { slug: 'school', ar: 'مَدْرَسَةٌ', tr: 'Madrasatun', en: 'School', id: 'Sekolah', emoji: '🏫', fem: true },
    { slug: 'desk', ar: 'مَكْتَبٌ', tr: 'Maktabun', en: 'Desk', id: 'Meja Belajar', emoji: '🪑' },
    { slug: 'sch_chair', ar: 'كُرْسِيٌّ', tr: 'Kursiyyun', en: 'Chair', id: 'Kursi', emoji: '🪑' },
    { slug: 'sch_board', ar: 'سَبُّورَةٌ', tr: 'Sabbuuratun', en: 'Blackboard', id: 'Papan Tulis', emoji: '🖍️', fem: true },
    { slug: 'sch_notebook', ar: 'دَفْتَرٌ', tr: 'Daftarun', en: 'Notebook', id: 'Buku Tulis', emoji: '📓' },
    { slug: 'sch_ruler', ar: 'مِسْطَرَةٌ', tr: 'Mistharatun', en: 'Ruler', id: 'Penggaris', emoji: '📏', fem: true },
    { slug: 'sch_eraser', ar: 'مِمْحَاةٌ', tr: 'Mimhaatun', en: 'Eraser', id: 'Penghapus', emoji: '🧽', fem: true },
    { slug: 'sch_classroom', ar: 'فَصْلٌ', tr: 'Fashlun', en: 'Classroom', id: 'Ruang Kelas', emoji: '🏫' },
    { slug: 'sch_library', ar: 'مَكْتَبَةٌ', tr: 'Maktabatun', en: 'Library', id: 'Perpustakaan', emoji: '📚', fem: true },
    { slug: 'sch_pencil', ar: 'قَلَمُ رَصَاصٍ', tr: 'Qalamu Rashaashin', en: 'Pencil', id: 'Pensil', emoji: '✏️' },
    { slug: 'sch_paper', ar: 'وَرَقَةٌ', tr: 'Waraqatun', en: 'Paper', id: 'Kertas', emoji: '📄', fem: true },
    { slug: 'sch_scissors', ar: 'مِقَصٌّ', tr: 'Miqash-shun', en: 'Scissors', id: 'Gunting', emoji: '✂️' },
    { slug: 'sch_globe', ar: 'كُرَةٌ أَرْضِيَّةٌ', tr: 'Kuratun Ardhiyyatun', en: 'Globe', id: 'Bola Dunia', emoji: '🌍', fem: true },
    { slug: 'sch_map', ar: 'خَرِيطَةٌ', tr: 'Khariithatun', en: 'Map', id: 'Peta', emoji: '🗺️', fem: true },
    { slug: 'sch_crayon', ar: 'أَقْلَامُ تَلْوِينٍ', tr: 'Aqlaamu Talwiinin', en: 'Crayons', id: 'Pensil Warna', emoji: '🖍️' },
    { slug: 'sch_clock', ar: 'سَاعَةُ حَائِطٍ', tr: "Saa'atu Haa'ithin", en: 'Wall Clock', id: 'Jam Dinding', emoji: '🕰️', fem: true },
    { slug: 'sch_bell', ar: 'جَرَسٌ', tr: 'Jarasun', en: 'School Bell', id: 'Bel Sekolah', emoji: '🔔' },
  ],
  Rumah: [
    { slug: 'house', ar: 'بَيْتٌ', tr: 'Baitun', en: 'House', id: 'Rumah', emoji: '🏠' },
    { slug: 'hm_door', ar: 'بَابٌ', tr: 'Baabun', en: 'Door', id: 'Pintu', emoji: '🚪' },
    { slug: 'hm_window', ar: 'نَافِذَةٌ', tr: 'Naafidzatun', en: 'Window', id: 'Jendela', emoji: '🪟', fem: true },
    { slug: 'hm_bed', ar: 'سَرِيرٌ', tr: 'Sariirun', en: 'Bed', id: 'Tempat Tidur', emoji: '🛏️' },
    { slug: 'hm_pillow', ar: 'وِسَادَةٌ', tr: 'Wisaadatun', en: 'Pillow', id: 'Bantal', emoji: '🛌', fem: true },
    { slug: 'hm_blanket', ar: 'بَطَّانِيَّةٌ', tr: 'Bat-thaaniyyatun', en: 'Blanket', id: 'Selimut', emoji: '🧶', fem: true },
    { slug: 'hm_sofa', ar: 'أَرِيكَةٌ', tr: 'Ariikatun', en: 'Sofa', id: 'Sofa', emoji: '🛋️', fem: true },
    { slug: 'hm_table', ar: 'طَاوِلَةٌ', tr: 'Thaawilatun', en: 'Table', id: 'Meja Makan', emoji: '🍽️', fem: true },
    { slug: 'hm_kitchen', ar: 'مَطْبَخٌ', tr: 'Mathbakhun', en: 'Kitchen', id: 'Dapur', emoji: '🍳' },
    { slug: 'hm_fridge', ar: 'ثَلَّاجَةٌ', tr: 'Tsallaajatun', en: 'Refrigerator', id: 'Kulkas', emoji: '🧊', fem: true },
    { slug: 'hm_lamp', ar: 'مِصْبَاحٌ', tr: 'Mishbaahun', en: 'Lamp', id: 'Lampu', emoji: '💡' },
    { slug: 'hm_carpet', ar: 'سَجَّادَةٌ', tr: 'Sajjaadatun', en: 'Carpet', id: 'Karpet', emoji: '🧶', fem: true },
    { slug: 'hm_wardrobe', ar: 'خِزَانَةٌ', tr: 'Khizaanatun', en: 'Wardrobe', id: 'Lemari', emoji: '🚪', fem: true },
    { slug: 'hm_mirror', ar: 'مِرْآةٌ', tr: "Mir'aatun", en: 'Mirror', id: 'Cermin', emoji: '🪞', fem: true },
    { slug: 'hm_key', ar: 'مِفْتَاحٌ', tr: 'Miftaahun', en: 'Key', id: 'Kunci', emoji: '🔑' },
    { slug: 'hm_fan', ar: 'مِرْوَحَةٌ', tr: 'Mirwahatun', en: 'Fan', id: 'Kipas Angin', emoji: '🌀', fem: true },
    { slug: 'hm_garden', ar: 'حَدِيقَةُ الْبَيْتِ', tr: 'Hadiiqatul Baiti', en: 'Home Garden', id: 'Taman Rumah', emoji: '🏡', fem: true },
    { slug: 'hm_roof', ar: 'سَقْفٌ', tr: 'Saqfun', en: 'Roof', id: 'Atap', emoji: '🏠' },
    { slug: 'hm_tv', ar: 'تِلْفَازٌ', tr: 'Tilfaazun', en: 'Television', id: 'Televisi', emoji: '📺' },
    { slug: 'hm_spoon', ar: 'مِلْعَقَةٌ', tr: "Mil'aqatun", en: 'Spoon', id: 'Sendok', emoji: '🥄', fem: true },
  ],
  Masjid: [
    { slug: 'ms_mosque', ar: 'مَسْجِدٌ', tr: 'Masjidun', en: 'Mosque', id: 'Masjid', emoji: '🕌' },
    { slug: 'ms_minaret', ar: 'مِئْذَنَةٌ', tr: "Mi'dzanatun", en: 'Minaret', id: 'Menara Masjid', emoji: '🗼', fem: true },
    { slug: 'ms_dome', ar: 'قُبَّةٌ', tr: 'Qubbatun', en: 'Dome', id: 'Kubah Masjid', emoji: '🕌', fem: true },
    { slug: 'ms_mihrab', ar: 'مِحْرَابٌ', tr: 'Mihraabun', en: 'Mihrab', id: 'Mihrab Imam', emoji: '🕌' },
    { slug: 'ms_minbar', ar: 'مِنْبَرٌ', tr: 'Minbarun', en: 'Pulpit', id: 'Mimbar', emoji: '🎙️' },
    { slug: 'ms_prayer_mat', ar: 'سَجَّادَةُ صَلَاةٍ', tr: 'Sajjaadatu Shalaatin', en: 'Prayer Mat', id: 'Sajadah', emoji: '🧎', fem: true },
    { slug: 'ms_quran', ar: 'مُصْحَفٌ', tr: 'Mushafun', en: 'Holy Quran', id: 'Al-Quran / Mushaf', emoji: '📖' },
    { slug: 'ms_tasbih', ar: 'مَسْبَحَةٌ', tr: 'Masbahatun', en: 'Prayer Beads', id: 'Tasbih', emoji: '📿', fem: true },
    { slug: 'ms_wudhu', ar: 'مَوْضَأٌ', tr: "Maudha'un", en: 'Ablution Area', id: 'Tempat Wudhu', emoji: '💧' },
    { slug: 'ms_sarong', ar: 'إِزَارٌ', tr: 'Izaarun', en: 'Sarong', id: 'Sarung', emoji: '🧣' },
    { slug: 'ms_mukena', ar: 'ثَوْبُ صَلَاةٍ', tr: 'Tsaubu Shalaatin', en: 'Prayer Robe', id: 'Mukena / Baju Shalat', emoji: '🤍' },
    { slug: 'ms_cap', ar: 'قَلَنْسُوَةٌ', tr: 'Qalansuwatun', en: 'Prayer Cap', id: 'Peci / Kopyah', emoji: '🧢', fem: true },
    { slug: 'ms_lantern', ar: 'فَانُوسٌ', tr: 'Faanuusun', en: 'Mosque Lantern', id: 'Lentera Masjid', emoji: '🏮' },
    { slug: 'ms_rehal', ar: 'حَامِلُ الْمُصْحَفِ', tr: 'Haamilul Mushafi', en: 'Quran Stand', id: 'Rehal / Meja Mengaji', emoji: '📖' },
    { slug: 'ms_shoe_rack', ar: 'رَفُّ الْأَحْذِيَةِ', tr: 'Rafful Ahdziyati', en: 'Shoe Rack', id: 'Rak Sepatu', emoji: '👟' },
    { slug: 'ms_charity', ar: 'صُنْدُوقُ الصَّدَقَةِ', tr: 'Shunduuqus Shadaqati', en: 'Charity Box', id: 'Kotak Amal', emoji: '🪙' },
    { slug: 'ms_adhan', ar: 'أَذَانٌ', tr: 'Adzaanun', en: 'Call to Prayer', id: 'Adzan', emoji: '📢' },
    { slug: 'ms_imam', ar: 'إِمَامٌ', tr: 'Imaamun', en: 'Imam', id: 'Imam Masjid', emoji: '🕌' },
  ],
  'Kamar Mandi': [
    { slug: 'km_bathroom', ar: 'حَمَّامٌ', tr: 'Hammaamun', en: 'Bathroom', id: 'Kamar Mandi', emoji: '🚿' },
    { slug: 'km_soap', ar: 'صَابُونٌ', tr: 'Shaabuunun', en: 'Soap', id: 'Sabun', emoji: '🧼' },
    { slug: 'km_towel', ar: 'مِنْشَفَةٌ', tr: 'Minsyafatun', en: 'Towel', id: 'Handuk', emoji: '🧺', fem: true },
    { slug: 'km_toothbrush', ar: 'فُرْشَاةُ أَسْنَانٍ', tr: 'Fursyaatu Asnaanin', en: 'Toothbrush', id: 'Sikat Gigi', emoji: '🪥', fem: true },
    { slug: 'km_toothpaste', ar: 'مَعْجُونُ أَسْنَانٍ', tr: "Ma'juunu Asnaanin", en: 'Toothpaste', id: 'Pasta Gigi', emoji: '🧴' },
    { slug: 'km_shampoo', ar: 'شَامْبُو', tr: 'Syaambuu', en: 'Shampoo', id: 'Sampo', emoji: '🧴' },
    { slug: 'km_shower', ar: 'دُشٌّ', tr: 'Dusysyun', en: 'Shower', id: 'Pancuran / Shower', emoji: '🚿' },
    { slug: 'km_bucket', ar: 'دَلْوٌ', tr: 'Dalwun', en: 'Bucket', id: 'Ember', emoji: '🪣' },
    { slug: 'km_dipper', ar: 'مِغْرَفَةٌ', tr: 'Mighrafatun', en: 'Water Dipper', id: 'Gayung', emoji: '🥣', fem: true },
    { slug: 'km_faucet', ar: 'حَنَفِيَّةٌ', tr: 'Hanafiyyatun', en: 'Water Faucet', id: 'Keran Air', emoji: '🚰', fem: true },
    { slug: 'km_sink', ar: 'مَغْسَلَةٌ', tr: 'Maghsalatun', en: 'Sink', id: 'Wastafel', emoji: '🚰', fem: true },
    { slug: 'km_bathtub', ar: 'حَوْضُ اِسْتِحْمَامٍ', tr: 'Haudhu Istihmaamin', en: 'Bathtub', id: 'Bak Mandi', emoji: '🛁' },
    { slug: 'km_comb', ar: 'مُشْطٌ', tr: 'Mushthun', en: 'Comb', id: 'Sisir', emoji: '💇' },
    { slug: 'km_tissue', ar: 'مِنْدِيلٌ', tr: 'Mindiilun', en: 'Tissue', id: 'Tisu', emoji: '🧻' },
    { slug: 'km_mirror', ar: 'مِرْآةُ الْحَمَّامِ', tr: "Mir'aatul Hammaami", en: 'Bathroom Mirror', id: 'Cermin Kamar Mandi', emoji: '🪞', fem: true },
    { slug: 'km_sponge', ar: 'إِسْفَنْجَةٌ', tr: 'Isfanjatun', en: 'Bath Sponge', id: 'Spons Mandi', emoji: '🧽', fem: true },
    { slug: 'km_slippers', ar: 'نَعْلُ الْحَمَّامِ', tr: "Na'lul Hammaami", en: 'Bath Slippers', id: 'Sandal Kamar Mandi', emoji: '🩴' },
    { slug: 'km_sponge_clean', ar: 'مَاءٌ نَظِيفٌ', tr: "Maa'un Nadziifun", en: 'Clean Water', id: 'Air Bersih', emoji: '💧' },
  ],
  Daratan: [
    { slug: 'mountain', ar: 'جَبَلٌ', tr: 'Jabalun', en: 'Mountain', id: 'Gunung', emoji: '⛰️' },
    { slug: 'tree', ar: 'شَجَرَةٌ', tr: 'Syajaratun', en: 'Tree', id: 'Pohon', emoji: '🌳', fem: true },
    { slug: 'flower', ar: 'زَهْرَةٌ', tr: 'Zahratun', en: 'Flower', id: 'Bunga', emoji: '🌸', fem: true },
    { slug: 'dr_forest', ar: 'غَابَةٌ', tr: 'Ghaabatun', en: 'Forest', id: 'Hutan', emoji: '🌲', fem: true },
    { slug: 'dr_desert', ar: 'صَحْرَاءُ', tr: "Shahraa'u", en: 'Desert', id: 'Gurun Pasir', emoji: '🏜️', fem: true },
    { slug: 'dr_valley', ar: 'وَادٍ', tr: 'Waadin', en: 'Valley', id: 'Lembah', emoji: '🏞️' },
    { slug: 'dr_hill', ar: 'تَلٌّ', tr: 'Tallun', en: 'Hill', id: 'Bukit', emoji: '⛰️' },
    { slug: 'dr_river', ar: 'نَهْرٌ', tr: 'Nahrun', en: 'River', id: 'Sungai', emoji: '🏞️' },
    { slug: 'dr_lake', ar: 'بُحَيْرَةٌ', tr: 'Buhairatun', en: 'Lake', id: 'Danau', emoji: '💧', fem: true },
    { slug: 'dr_waterfall', ar: 'شَلَّالٌ', tr: 'Syallaalun', en: 'Waterfall', id: 'Air Terjun', emoji: '🌊' },
    { slug: 'dr_rock', ar: 'صَخْرَةٌ', tr: 'Shakhratun', en: 'Rock', id: 'Batu Besar', emoji: '🪨', fem: true },
    { slug: 'dr_sand', ar: 'رَمْلٌ', tr: 'Ramlun', en: 'Sand', id: 'Pasir', emoji: '🏖️' },
    { slug: 'dr_soil', ar: 'تُرَابٌ', tr: 'Turaabun', en: 'Soil', id: 'Tanah', emoji: '🌱' },
    { slug: 'dr_cave', ar: 'كَهْفٌ', tr: 'Kahfun', en: 'Cave', id: 'Goa', emoji: '🕳️' },
    { slug: 'dr_grass', ar: 'عُشْبٌ', tr: "'Usybun", en: 'Grass', id: 'Rumput', emoji: '🌿' },
    { slug: 'dr_volcano', ar: 'بُرْكَانٌ', tr: 'Burkaanun', en: 'Volcano', id: 'Gunung Berapi', emoji: '🌋' },
    { slug: 'dr_island', ar: 'جَزِيرَةٌ', tr: 'Jaziiratun', en: 'Island', id: 'Pulau', emoji: '🏝️', fem: true },
    { slug: 'dr_bridge', ar: 'جِسْرٌ', tr: 'Jisrun', en: 'Bridge', id: 'Jembatan', emoji: '🌉' },
    { slug: 'dr_farm', ar: 'مَزْرَعَةٌ', tr: "Mazra'atun", en: 'Farm', id: 'Sawah / Kebun', emoji: '🌾', fem: true },
    { slug: 'dr_road', ar: 'طَرِيقٌ', tr: 'Thariiqun', en: 'Road', id: 'Jalan Raya', emoji: '🛣️' },
  ],
  Lautan: [
    { slug: 'lt_ocean', ar: 'مُحِيطٌ', tr: 'Muhiithun', en: 'Ocean', id: 'Samudera', emoji: '🌊' },
    { slug: 'lt_sea', ar: 'بَحْرٌ', tr: 'Bahrun', en: 'Sea', id: 'Laut', emoji: '🌊' },
    { slug: 'lt_beach', ar: 'شَاطِئٌ', tr: "Syaathi'un", en: 'Beach', id: 'Pantai', emoji: '🏖️' },
    { slug: 'lt_wave', ar: 'مَوْجَةٌ', tr: 'Maujatun', en: 'Sea Wave', id: 'Ombak Laut', emoji: '🌊', fem: true },
    { slug: 'lt_coral', ar: 'مَرْجَانٌ', tr: 'Marjaanun', en: 'Coral Reef', id: 'Terumbu Karang', emoji: '🪸' },
    { slug: 'lt_shell', ar: 'صَدَفَةٌ', tr: 'Shadafatun', en: 'Seashell', id: 'Kerang', emoji: '🐚', fem: true },
    { slug: 'lt_pearl', ar: 'لُؤْلُؤَةٌ', tr: "Lu'lu'atun", en: 'Pearl', id: 'Mutiara', emoji: '🦪', fem: true },
    { slug: 'lt_whale', ar: 'حُوتٌ', tr: 'Huutun', en: 'Whale', id: 'Ikan Paus', emoji: '🐋' },
    { slug: 'lt_dolphin', ar: 'دُلْفِينٌ', tr: 'Dulfiinun', en: 'Dolphin', id: 'Lumba-lumba', emoji: '🐬' },
    { slug: 'lt_shark', ar: 'سَمَكُ الْقِرْشِ', tr: 'Samakul Qirsyi', en: 'Shark', id: 'Ikan Hiu', emoji: '🦈' },
    { slug: 'lt_octopus', ar: 'أُخْطُبُوطٌ', tr: 'Ukhthubuuthun', en: 'Octopus', id: 'Gurita', emoji: '🐙' },
    { slug: 'lt_crab', ar: 'سَلْطَعُونٌ', tr: "Saltha'uunun", en: 'Crab', id: 'Kepiting', emoji: '🦀' },
    { slug: 'lt_starfish', ar: 'نَجْمُ الْبَحْرِ', tr: 'Najmul Bahri', en: 'Starfish', id: 'Bintang Laut', emoji: '⭐' },
    { slug: 'lt_jellyfish', ar: 'قِنْدِيلُ الْبَحْرِ', tr: 'Qindiilul Bahri', en: 'Jellyfish', id: 'Ubur-ubur', emoji: '🪼' },
    { slug: 'lt_seahorse', ar: 'فَرَسُ الْبَحْرِ', tr: 'Farasul Bahri', en: 'Seahorse', id: 'Kuda Laut', emoji: '🐎' },
    { slug: 'lt_lighthouse', ar: 'مَنَارَةٌ', tr: 'Manaaratun', en: 'Lighthouse', id: 'Mercusuar', emoji: '🗼', fem: true },
    { slug: 'lt_anchor', ar: 'مِرْسَاةٌ', tr: 'Mirsaatun', en: 'Anchor', id: 'Jangkar', emoji: '⚓', fem: true },
    { slug: 'lt_seaweed', ar: 'طَحَالِبُ بَحْرِيَّةٌ', tr: 'Thahaalibu Bahriyyatun', en: 'Seaweed', id: 'Rumput Laut', emoji: '🌿', fem: true },
  ],
  'Alam Semesta': [
    { slug: 'sun', ar: 'شَمْسٌ', tr: 'Syamsun', en: 'Sun', id: 'Matahari', emoji: '☀️', fem: true },
    { slug: 'moon', ar: 'قَمَرٌ', tr: 'Qamarun', en: 'Moon', id: 'Bulan', emoji: '🌙' },
    { slug: 'star', ar: 'نَجْمَةٌ', tr: 'Najmatun', en: 'Star', id: 'Bintang', emoji: '⭐', fem: true },
    { slug: 'as_universe', ar: 'كَوْنٌ', tr: 'Kaunun', en: 'Universe', id: 'Alam Semesta', emoji: '🌌' },
    { slug: 'as_sky', ar: 'سَمَاءٌ', tr: "Samaa'un", en: 'Sky', id: 'Langit', emoji: '🌤️', fem: true },
    { slug: 'as_galaxy', ar: 'مَجَرَّةٌ', tr: 'Majarratun', en: 'Galaxy', id: 'Galaksi', emoji: '🌌', fem: true },
    { slug: 'as_space', ar: 'فَضَاءٌ', tr: "Fadhaa'un", en: 'Outer Space', id: 'Luar Angkasa', emoji: '🚀' },
    { slug: 'as_comet', ar: 'مُذَنَّبٌ', tr: 'Mudzannabun', en: 'Comet', id: 'Komet', emoji: '☄️' },
    { slug: 'as_meteor', ar: 'شِهَابٌ', tr: 'Syihaabun', en: 'Meteor', id: 'Meteor / Bintang Jatuh', emoji: '🌠' },
    { slug: 'as_orbit', ar: 'مَدَارٌ', tr: 'Madaarun', en: 'Orbit', id: 'Orbit', emoji: '🪐' },
    { slug: 'as_nebula', ar: 'سَدِيمٌ', tr: 'Sadiimun', en: 'Nebula', id: 'Nebula', emoji: '✨' },
    { slug: 'as_blackhole', ar: 'ثَقْبٌ أَسْوَدُ', tr: 'Tsaqbun Aswadu', en: 'Black Hole', id: 'Lubang Hitam', emoji: '🕳️' },
    { slug: 'as_eclipse', ar: 'كُسُوفٌ', tr: 'Kusuufun', en: 'Eclipse', id: 'Gerhana', emoji: '🌑' },
    { slug: 'as_cloud', ar: 'سَحَابَةٌ', tr: 'Sahaabatun', en: 'Cloud', id: 'Awan', emoji: '☁️', fem: true },
    { slug: 'as_rainbow', ar: 'قَوْسُ قُزَحَ', tr: 'Qausu Quzaha', en: 'Rainbow', id: 'Pelangi', emoji: '🌈' },
    { slug: 'as_aurora', ar: 'شَفَقٌ قُطْبِيٌّ', tr: 'Syafaqun Quthbiyyun', en: 'Aurora', id: 'Aurora', emoji: '🌌' },
    { slug: 'as_rocket', ar: 'صَارُوخٌ', tr: 'Shaaruu-khun', en: 'Space Rocket', id: 'Roket', emoji: '🚀' },
    { slug: 'as_telescope', ar: 'تِلِسْكُوبٌ', tr: 'Tiliskuubun', en: 'Telescope', id: 'Teleskop', emoji: '🔭' },
  ],
  Planet: [
    { slug: 'pl_planet', ar: 'كَوْكَبٌ', tr: 'Kaukabun', en: 'Planet', id: 'Planet', emoji: '🪐' },
    { slug: 'pl_earth', ar: 'أَرْضٌ', tr: 'Ardhun', en: 'Earth', id: 'Bumi', emoji: '🌍', fem: true },
    { slug: 'pl_mercury', ar: 'عُطَارِدُ', tr: "'Uthaaridu", en: 'Mercury', id: 'Merkurius', emoji: '🪨' },
    { slug: 'pl_venus', ar: 'الزُّهَرَةُ', tr: 'Az-Zuharatu', en: 'Venus', id: 'Venus', emoji: '🌕', fem: true },
    { slug: 'pl_mars', ar: 'الْمِرِّيخُ', tr: 'Al-Mirriikhu', en: 'Mars', id: 'Mars', emoji: '🔴' },
    { slug: 'pl_jupiter', ar: 'الْمُشْتَرِي', tr: 'Al-Musytarii', en: 'Jupiter', id: 'Jupiter', emoji: '🟠' },
    { slug: 'pl_saturn', ar: 'زُحَلُ', tr: 'Zuhalu', en: 'Saturn', id: 'Saturnus', emoji: '🪐' },
    { slug: 'pl_uranus', ar: 'أُورَانُوسُ', tr: 'Uuraanuusu', en: 'Uranus', id: 'Uranus', emoji: '🩵' },
    { slug: 'pl_neptune', ar: 'نِبْتُونُ', tr: 'Nibtuunu', en: 'Neptune', id: 'Neptunus', emoji: '🔵' },
    { slug: 'pl_pluto', ar: 'بْلُوتُو', tr: 'Bluutuu', en: 'Pluto', id: 'Pluto', emoji: '❄️' },
    { slug: 'pl_ring_saturn', ar: 'حَلْقَةُ زُحَلَ', tr: 'Halqatu Zuhala', en: 'Saturn Ring', id: 'Cincin Saturnus', emoji: '🪐', fem: true },
    { slug: 'pl_moon_earth', ar: 'قَمَرُ الْأَرْضِ', tr: 'Qamarul Ardhi', en: "Earth's Moon", id: 'Bulan Bumi', emoji: '🌕' },
    { slug: 'pl_red_planet', ar: 'كَوْكَبٌ أَحْمَرُ', tr: 'Kaukabun Ahmaru', en: 'Red Planet', id: 'Planet Merah', emoji: '🔴' },
    { slug: 'pl_blue_planet', ar: 'كَوْكَبٌ أَزْرَقُ', tr: 'Kaukabun Azraqu', en: 'Blue Planet', id: 'Planet Biru', emoji: '🌍' },
    { slug: 'pl_dwarf_planet', ar: 'كَوْكَبٌ قَزَمٌ', tr: 'Kaukabun Qazamun', en: 'Dwarf Planet', id: 'Planet Kerdil', emoji: '🌑' },
    { slug: 'pl_atmosphere', ar: 'غِلَافٌ جَوِّيٌّ', tr: 'Ghilaafun Jawwiyyun', en: 'Atmosphere', id: 'Atmosfer', emoji: '🌫️' },
  ],
  Makanan: [
    { slug: 'food', ar: 'طَعَامٌ', tr: "Tha'aamun", en: 'Food', id: 'Makanan', emoji: '🍲' },
    { slug: 'mk_bread', ar: 'خُبْزٌ', tr: 'Khubzun', en: 'Bread', id: 'Roti', emoji: '🍞' },
    { slug: 'mk_rice', ar: 'أُرْزٌ', tr: 'Urzun', en: 'Rice', id: 'Nasi', emoji: '🍚' },
    { slug: 'mk_meat', ar: 'لَحْمٌ', tr: 'Lahmun', en: 'Meat', id: 'Daging', emoji: '🍖' },
    { slug: 'mk_egg', ar: 'بَيْضَةٌ', tr: 'Baidhatun', en: 'Egg', id: 'Telur', emoji: '🥚', fem: true },
    { slug: 'mk_cheese', ar: 'جُبْنٌ', tr: 'Jubnun', en: 'Cheese', id: 'Keju', emoji: '🧀' },
    { slug: 'mk_honey', ar: 'عَسَلٌ', tr: "'Asalun", en: 'Honey', id: 'Madu', emoji: '🍯' },
    { slug: 'mk_cake', ar: 'كَعْكَةٌ', tr: "Ka'katun", en: 'Cake', id: 'Kue', emoji: '🍰', fem: true },
    { slug: 'mk_soup', ar: 'حَسَاءٌ', tr: "Hasaa'un", en: 'Soup', id: 'Sup Hangat', emoji: '🥣' },
    { slug: 'mk_salad', ar: 'سَلَطَةٌ', tr: 'Salathatun', en: 'Salad', id: 'Salad Sayur', emoji: '🥗', fem: true },
    { slug: 'mk_pizza', ar: 'بِيتْزَا', tr: 'Biitzaa', en: 'Pizza', id: 'Piza', emoji: '🍕', fem: true },
    { slug: 'mk_sandwich', ar: 'شَطِيرَةٌ', tr: 'Syathiiratun', en: 'Sandwich', id: 'Roti Lapis', emoji: '🥪', fem: true },
    { slug: 'mk_biscuit', ar: 'بَسْكَوِيتٌ', tr: 'Baskawiitun', en: 'Biscuit', id: 'Biskuit', emoji: '🍪' },
    { slug: 'mk_chocolate', ar: 'شُوكُولَاتَةٌ', tr: 'Syuukuulaatatun', en: 'Chocolate', id: 'Cokelat', emoji: '🍫', fem: true },
    { slug: 'mk_icecream', ar: 'مُثَلَّجَاتٌ', tr: 'Mutsallajaatun', en: 'Ice Cream', id: 'Es Krim', emoji: '🍨' },
    { slug: 'mk_noodles', ar: 'مَعْكَرُونَةٌ', tr: "Ma'karuunatun", en: 'Noodles / Pasta', id: 'Mie / Pasta', emoji: '🍝', fem: true },
    { slug: 'mk_fried_rice', ar: 'أُرْزٌ مَقْلِيٌّ', tr: 'Urzun Maqliyyun', en: 'Fried Rice', id: 'Nasi Goreng', emoji: '🍛' },
    { slug: 'mk_butter', ar: 'زُبْدَةٌ', tr: 'Zubdatun', en: 'Butter', id: 'Mentega', emoji: '🧈', fem: true },
  ],
  Minuman: [
    { slug: 'water', ar: 'مَاءٌ', tr: "Maa'un", en: 'Water', id: 'Air Minum', emoji: '💧' },
    { slug: 'mn_milk', ar: 'حَلِيبٌ', tr: 'Haliibun', en: 'Milk', id: 'Susu', emoji: '🥛' },
    { slug: 'mn_juice', ar: 'عَصِيرٌ', tr: "'Ashiirun", en: 'Juice', id: 'Jus Buah', emoji: '🧃' },
    { slug: 'mn_tea', ar: 'شَايٌ', tr: 'Syaayun', en: 'Tea', id: 'Teh', emoji: '🍵' },
    { slug: 'mn_coffee', ar: 'قَهْوَةٌ', tr: 'Qahwatun', en: 'Coffee', id: 'Kopi', emoji: '☕', fem: true },
    { slug: 'mn_orange_juice', ar: 'عَصِيرُ بُرْتُقَالٍ', tr: "'Ashiiru Burtuqaalin", en: 'Orange Juice', id: 'Jus Jeruk', emoji: '🍊' },
    { slug: 'mn_apple_juice', ar: 'عَصِيرُ تُفَّاحٍ', tr: "'Ashiiru Tuffaahin", en: 'Apple Juice', id: 'Jus Apel', emoji: '🍎' },
    { slug: 'mn_mango_juice', ar: 'عَصِيرُ مَانْجُو', tr: "'Ashiiru Maanjuu", en: 'Mango Juice', id: 'Jus Mangga', emoji: '🥭' },
    { slug: 'mn_lemonade', ar: 'عَصِيرُ لَيْمُونٍ', tr: "'Ashiiru Laimuunin", en: 'Lemonade', id: 'Es Lemon', emoji: '🍋' },
    { slug: 'mn_coconut_water', ar: 'مَاءُ جَوْزِ الْهِنْدِ', tr: "Maa'u Jauzil Hindi", en: 'Coconut Water', id: 'Air Kelapa', emoji: '🥥' },
    { slug: 'mn_yogurt', ar: 'لَبَنٌ', tr: 'Labanun', en: 'Yogurt Drink', id: 'Susu Fermentasi', emoji: '🥛' },
    { slug: 'mn_hot_choco', ar: 'شُوكُولَاتَةٌ سَاخِنَةٌ', tr: 'Syuukuulaatatun Saakhinatun', en: 'Hot Chocolate', id: 'Cokelat Panas', emoji: '☕', fem: true },
    { slug: 'mn_mint_tea', ar: 'شَايٌ بِالنَّعْنَاعِ', tr: "Syaayun bin Na'naa'", en: 'Mint Tea', id: 'Teh Mint', emoji: '🍵' },
    { slug: 'mn_honey_drink', ar: 'شَرَابُ الْعَسَلِ', tr: "Syaraabul 'Asali", en: 'Honey Drink', id: 'Minuman Madu', emoji: '🍯' },
    { slug: 'mn_smoothie', ar: 'مَخْفُوقُ فَوَاكِهَ', tr: 'Makhfuuqu Fawaakiha', en: 'Fruit Smoothie', id: 'Smoothie Buah', emoji: '🥤' },
    { slug: 'mn_ice_water', ar: 'مَاءٌ بَارِدٌ', tr: "Maa'un Baaridun", en: 'Cold Water', id: 'Air Dingin', emoji: '🧊' },
  ],
  Musim: [
    { slug: 'ms_season', ar: 'فَصْلٌ', tr: 'Fashlun', en: 'Season', id: 'Musim', emoji: '🗓️' },
    { slug: 'ms_spring', ar: 'فَصْلُ الرَّبِيعِ', tr: "Fashlur Rabii'i", en: 'Spring', id: 'Musim Semi', emoji: '🌸' },
    { slug: 'ms_summer', ar: 'فَصْلُ الصَّيْفِ', tr: 'Fashlush Shaifi', en: 'Summer', id: 'Musim Panas', emoji: '☀️' },
    { slug: 'ms_autumn', ar: 'فَصْلُ الْخَرِيفِ', tr: 'Fashlul Khariifi', en: 'Autumn', id: 'Musim Gugur', emoji: '🍂' },
    { slug: 'ms_winter', ar: 'فَصْلُ الشِّتَاءِ', tr: "Fashlusy Syitaa'i", en: 'Winter', id: 'Musim Dingin', emoji: '❄️' },
    { slug: 'rain', ar: 'مَطَرٌ', tr: 'Matharun', en: 'Rain', id: 'Hujan', emoji: '🌧️' },
    { slug: 'ms_snow', ar: 'ثَلْجٌ', tr: 'Tsaljun', en: 'Snow', id: 'Salju', emoji: '❄️' },
    { slug: 'ms_wind', ar: 'رِيحٌ', tr: 'Riihun', en: 'Wind', id: 'Angin', emoji: '💨', fem: true },
    { slug: 'ms_thunder', ar: 'رَعْدٌ', tr: "Ra'dun", en: 'Thunder', id: 'Guntur', emoji: '⛈️' },
    { slug: 'ms_lightning', ar: 'بَرْقٌ', tr: 'Barqun', en: 'Lightning', id: 'Petir', emoji: '⚡' },
    { slug: 'ms_fog', ar: 'ضَبَابٌ', tr: 'Dhabaabun', en: 'Fog', id: 'Kabut', emoji: '🌫️' },
    { slug: 'ms_sunny', ar: 'جَوٌّ مُشْمِسٌ', tr: 'Jawwun Musymisun', en: 'Sunny Weather', id: 'Cuaca Cerah', emoji: '🌞' },
    { slug: 'ms_cloudy', ar: 'جَوٌّ غَائِمٌ', tr: "Jawwun Ghaa'imun", en: 'Cloudy Weather', id: 'Cuaca Mendung', emoji: '☁️' },
    { slug: 'ms_dry', ar: 'مَوْسِمُ الْجَفَافِ', tr: 'Mausimul Jafaafi', en: 'Dry Season', id: 'Musim Kemarau', emoji: '🏜️' },
    { slug: 'ms_rainy', ar: 'مَوْسِمُ الْأَمْطَارِ', tr: 'Mausimul Amthaari', en: 'Rainy Season', id: 'Musim Hujan', emoji: '☔' },
    { slug: 'ms_dew', ar: 'نَدًى', tr: 'Nadan', en: 'Morning Dew', id: 'Embun Pagi', emoji: '💧' },
  ],
  Keluarga: [
    { slug: 'mother', ar: 'أُمٌّ', tr: 'Ummun', en: 'Mother', id: 'Ibu', emoji: '👩', fem: true },
    { slug: 'father', ar: 'أَبٌ', tr: 'Abun', en: 'Father', id: 'Ayah', emoji: '👨' },
    { slug: 'brother', ar: 'أَخٌ', tr: 'Akhun', en: 'Brother', id: 'Saudara Laki-laki', emoji: '👦' },
    { slug: 'sister', ar: 'أُخْتٌ', tr: 'Ukhtun', en: 'Sister', id: 'Saudara Perempuan', emoji: '👧', fem: true },
    { slug: 'friend', ar: 'صَدِيقٌ', tr: 'Shadiiqun', en: 'Friend', id: 'Teman', emoji: '🤝' },
    { slug: 'kl_grandpa', ar: 'جَدٌّ', tr: 'Jaddun', en: 'Grandfather', id: 'Kakek', emoji: '👴' },
    { slug: 'kl_grandma', ar: 'جَدَّةٌ', tr: 'Jaddatun', en: 'Grandmother', id: 'Nenek', emoji: '👵', fem: true },
    { slug: 'kl_uncle', ar: 'عَمٌّ', tr: "'Ammun", en: 'Uncle', id: 'Paman', emoji: '👨' },
    { slug: 'kl_aunt', ar: 'عَمَّةٌ', tr: "'Ammatun", en: 'Aunt', id: 'Bibi', emoji: '👩', fem: true },
    { slug: 'kl_son', ar: 'اِبْنٌ', tr: 'Ibnun', en: 'Son', id: 'Anak Laki-laki', emoji: '👦' },
    { slug: 'kl_daughter', ar: 'بِنْتٌ', tr: 'Bintun', en: 'Daughter', id: 'Anak Perempuan', emoji: '👧', fem: true },
    { slug: 'kl_baby', ar: 'طِفْلٌ رَضِيعٌ', tr: "Thiflun Radhii'un", en: 'Baby', id: 'Bayi', emoji: '👶' },
    { slug: 'kl_cousin', ar: 'اِبْنُ عَمٍّ', tr: "Ibnu 'Ammin", en: 'Cousin', id: 'Sepupu', emoji: '🧒' },
    { slug: 'kl_family', ar: 'عَائِلَةٌ', tr: "'Aa'ilatun", en: 'Family', id: 'Keluarga', emoji: '👨‍👩‍👧‍👦', fem: true },
    { slug: 'kl_parents', ar: 'وَالِدَانِ', tr: 'Waalidaani', en: 'Parents', id: 'Orang Tua', emoji: '👨‍👩' },
    { slug: 'kl_neighbor', ar: 'جَارٌ', tr: 'Jaarun', en: 'Neighbor', id: 'Tetangga', emoji: '🏡' },
  ],
  Negara: [
    { slug: 'ng_indonesia', ar: 'إِنْدُونِيسِيَا', tr: 'Induuniisiyaa', en: 'Indonesia', id: 'Indonesia', emoji: '🇮🇩', fem: true },
    { slug: 'ng_saudi', ar: 'السُّعُودِيَّةُ', tr: "As-Su'uudiyyatu", en: 'Saudi Arabia', id: 'Arab Saudi', emoji: '🇸🇦', fem: true },
    { slug: 'ng_malaysia', ar: 'مَالِيزِيَا', tr: 'Maaliiziyaa', en: 'Malaysia', id: 'Malaysia', emoji: '🇲🇾', fem: true },
    { slug: 'ng_egypt', ar: 'مِصْرُ', tr: 'Mishru', en: 'Egypt', id: 'Mesir', emoji: '🇪🇬', fem: true },
    { slug: 'ng_japan', ar: 'الْيَابَانُ', tr: 'Al-Yaabaanu', en: 'Japan', id: 'Jepang', emoji: '🇯🇵' },
    { slug: 'ng_turkey', ar: 'تُرْكِيَا', tr: 'Turkiyaa', en: 'Turkey', id: 'Turki', emoji: '🇹🇷', fem: true },
    { slug: 'ng_palestine', ar: 'فِلَسْطِينُ', tr: 'Filasthiinu', en: 'Palestine', id: 'Palestina', emoji: '🇵🇸', fem: true },
    { slug: 'ng_jordan', ar: 'الْأُرْدُنُّ', tr: 'Al-Urdunnu', en: 'Jordan', id: 'Yordania', emoji: '🇯🇴' },
    { slug: 'ng_morocco', ar: 'الْمَغْرِبُ', tr: 'Al-Maghribu', en: 'Morocco', id: 'Maroko', emoji: '🇲🇦' },
    { slug: 'ng_uae', ar: 'الْإِمَارَاتُ', tr: 'Al-Imaaraatu', en: 'UAE', id: 'Uni Emirat Arab', emoji: '🇦🇪' },
    { slug: 'ng_qatar', ar: 'قَطَرُ', tr: 'Qatharu', en: 'Qatar', id: 'Qatar', emoji: '🇶🇦' },
    { slug: 'ng_england', ar: 'إِنْجِلْتِرَا', tr: 'Injiltiraa', en: 'England', id: 'Inggris', emoji: '🇬🇧', fem: true },
    { slug: 'ng_france', ar: 'فَرَنْسَا', tr: 'Faransaa', en: 'France', id: 'Prancis', emoji: '🇫🇷', fem: true },
    { slug: 'ng_germany', ar: 'أَلْمَانِيَا', tr: 'Almaaniyaa', en: 'Germany', id: 'Jerman', emoji: '🇩🇪', fem: true },
    { slug: 'ng_usa', ar: 'أَمْرِيكَا', tr: 'Amriikaa', en: 'America', id: 'Amerika', emoji: '🇺🇸', fem: true },
    { slug: 'ng_korea', ar: 'كُورِيَا', tr: 'Kuuriyaa', en: 'South Korea', id: 'Korea Selatan', emoji: '🇰🇷', fem: true },
    { slug: 'ng_china', ar: 'الصِّينُ', tr: 'Ash-Shiinu', en: 'China', id: 'Tiongkok', emoji: '🇨🇳' },
    { slug: 'ng_india', ar: 'الْهِنْدُ', tr: 'Al-Hindu', en: 'India', id: 'India', emoji: '🇮🇳', fem: true },
    { slug: 'ng_australia', ar: 'أُسْتُرَالِيَا', tr: 'Usturaaliyaa', en: 'Australia', id: 'Australia', emoji: '🇦🇺', fem: true },
    { slug: 'ng_brazil', ar: 'الْبَرَازِيلُ', tr: 'Al-Baraaziilu', en: 'Brazil', id: 'Brasil', emoji: '🇧🇷' },
    { slug: 'ng_brunei', ar: 'بْرُونَاي', tr: 'Bruunaai', en: 'Brunei', id: 'Brunei', emoji: '🇧🇳' },
    { slug: 'ng_singapore', ar: 'سِنْغَافُورَةُ', tr: 'Singhaafuuratu', en: 'Singapore', id: 'Singapura', emoji: '🇸🇬', fem: true },
  ],
  Kendaraan: [
    { slug: 'car', ar: 'سَيَّارَةٌ', tr: 'Sayyaaratun', en: 'Car', id: 'Mobil', emoji: '🚗', fem: true },
    { slug: 'motorcycle', ar: 'دَرَّاجَةٌ نَارِيَّةٌ', tr: 'Darraajatun Naariyyatun', en: 'Motorcycle', id: 'Sepeda Motor', emoji: '🏍️', fem: true },
    { slug: 'airplane', ar: 'طَائِرَةٌ', tr: "Thaa'iratun", en: 'Airplane', id: 'Pesawat', emoji: '✈️', fem: true },
    { slug: 'train', ar: 'قِطَارٌ', tr: 'Qithaarun', en: 'Train', id: 'Kereta Api', emoji: '🚂' },
    { slug: 'ship', ar: 'سَفِينَةٌ', tr: 'Safiinatun', en: 'Ship', id: 'Kapal Laut', emoji: '🚢', fem: true },
    { slug: 'bicycle', ar: 'دَرَّاجَةٌ', tr: 'Darraajatun', en: 'Bicycle', id: 'Sepeda', emoji: '🚲', fem: true },
    { slug: 'kd_bus', ar: 'حَافِلَةٌ', tr: 'Haafilatun', en: 'Bus', id: 'Bus', emoji: '🚌', fem: true },
    { slug: 'kd_truck', ar: 'شَاحِنَةٌ', tr: 'Syaahinatun', en: 'Truck', id: 'Truk', emoji: '🚚', fem: true },
    { slug: 'kd_taxi', ar: 'سَيَّارَةُ أُجْرَةٍ', tr: 'Sayyaaratu Ujratin', en: 'Taxi', id: 'Taksi', emoji: '🚕', fem: true },
    { slug: 'kd_ambulance', ar: 'سَيَّارَةُ إِسْعَافٍ', tr: "Sayyaaratu Is'aafin", en: 'Ambulance', id: 'Ambulans', emoji: '🚑', fem: true },
    { slug: 'kd_police_car', ar: 'سَيَّارَةُ شُرْطَةٍ', tr: 'Sayyaaratu Syurthatin', en: 'Police Car', id: 'Mobil Polisi', emoji: '🚓', fem: true },
    { slug: 'kd_helicopter', ar: 'مِرْوَحِيَّةٌ', tr: 'Mirwahiyyatun', en: 'Helicopter', id: 'Helikopter', emoji: '🚁', fem: true },
    { slug: 'kd_boat', ar: 'قَارِبٌ', tr: 'Qaaribun', en: 'Boat', id: 'Perahu', emoji: '⛵' },
    { slug: 'kd_subway', ar: 'مِتْرُو الْأَنْفَاقِ', tr: 'Mitruul Anfaaqi', en: 'Subway', id: 'Kereta Bawah Tanah', emoji: '🚇' },
    { slug: 'kd_tractor', ar: 'جَرَّارٌ', tr: 'Jarraarun', en: 'Tractor', id: 'Traktor', emoji: '🚜' },
    { slug: 'kd_scooter', ar: 'سْكُوتَرٌ', tr: 'Skuutarun', en: 'Scooter', id: 'Skuter', emoji: '🛴' },
  ],
  Kalimat: [
    { slug: 'hello', ar: 'مَرْحَبًا', tr: 'Marhaban', en: 'Hello friend', id: 'Halo teman', emoji: '👋' },
    { slug: 'thank_you', ar: 'شُكْرًا جَزِيلًا', tr: 'Syukran jaziilan', en: 'Thank you very much', id: 'Terima kasih banyak', emoji: '🙏' },
    { slug: 'please', ar: 'مِنْ فَضْلِكَ', tr: 'Min fadhlika', en: 'Please help', id: 'Tolong ya', emoji: '🤲' },
    { slug: 'sorry', ar: 'أَنَا آسِفٌ', tr: 'Anaa aasifun', en: 'I am sorry', id: 'Saya minta maaf', emoji: '🙇' },
    { slug: 'good_morning', ar: 'صَبَاحُ الْخَيْرِ', tr: 'Shabaahul khairi', en: 'Good morning', id: 'Selamat pagi', emoji: '🌅' },
    { slug: 'good_night', ar: 'تُصْبِحُ عَلَى خَيْرٍ', tr: "Tushbihu 'alaa khairin", en: 'Good night', id: 'Selamat malam', emoji: '🌃' },
    { slug: 'how_are_you', ar: 'كَيْفَ حَالُكَ', tr: 'Kaifa haaluka', en: 'How are you', id: 'Apa kabar kamu', emoji: '💬' },
    { slug: 'fine', ar: 'أَنَا بِخَيْرٍ', tr: 'Anaa bikhairin', en: 'I am fine', id: 'Saya baik-baik saja', emoji: '😊' },
    { slug: 'goodbye', ar: 'مَعَ السَّلَامَةِ', tr: "Ma'as salaamati", en: 'Goodbye see you', id: 'Sampai jumpa lagi', emoji: '🫡' },
    { slug: 'welcome', ar: 'أَهْلًا وَسَهْلًا', tr: 'Ahlan wa sahlan', en: 'You are welcome', id: 'Selamat datang', emoji: '🎉' },
    { slug: 'help', ar: 'سَاعِدْنِي الْآنَ', tr: "Saa'idnii al-aana", en: 'Please help me', id: 'Bantu aku sekarang', emoji: '🆘' },
    { slug: 'name', ar: 'مَا اسْمُكَ', tr: 'Masmuka', en: 'What is your name', id: 'Siapa namamu', emoji: '🪪' },
    { slug: 'today', ar: 'أَنَا سَعِيدٌ الْيَوْمَ', tr: "Anaa sa'iidun al-yauma", en: 'I am happy today', id: 'Saya senang hari ini', emoji: '😄' },
    { slug: 'time', ar: 'كَمِ السَّاعَةُ الْآنَ', tr: "Kamis saa'atu al-aana", en: 'What time is it', id: 'Jam berapa sekarang', emoji: '⏰' },
    { slug: 'love', ar: 'أُحِبُّ أُسْرَتِي', tr: 'Uhibbu usratii', en: 'I love my family', id: 'Saya sayang keluargaku', emoji: '❤️' },
    { slug: 'kal_lets_go', ar: 'هَيَّا نَذْهَبْ مَعًا', tr: "Hayyaa nadzhab ma'an", en: "Let's go together", id: 'Mari pergi bersama', emoji: '🚶' },
    { slug: 'kal_excuse_me', ar: 'عَفْوًا يَا صَدِيقِي', tr: "'Afwan yaa shadiiqii", en: 'Excuse me friend', id: 'Permisi temanku', emoji: '🙋' },
    { slug: 'kal_good_afternoon', ar: 'مَسَاءُ الْخَيْرِ', tr: "Masaa'ul khairi", en: 'Good evening', id: 'Selamat sore / malam', emoji: '🌆' },
    { slug: 'kal_dont_worry', ar: 'لَا تَقْلَقْ أَبَدًا', tr: 'Laa taqlaq abadan', en: 'Do not worry', id: 'Jangan khawatir', emoji: '🤗' },
    { slug: 'kal_well_done', ar: 'أَحْسَنْتَ عَمَلًا', tr: "Ahsanta 'amalan", en: 'Well done', id: 'Kerja bagus', emoji: '👏' },
  ],
};

// Additional phrase/context builders for non-adjective categories so every generated item is genuinely educational
const VERB_SUBJECTS = [
  { key: 'i', arPrefix: 'أَنَا', trPrefix: 'Anaa', enPrefix: 'I', idPrefix: 'Saya' },
  { key: 'you', arPrefix: 'أَنْتَ', trPrefix: 'Anta', enPrefix: 'You', idPrefix: 'Kamu' },
  { key: 'we', arPrefix: 'نَحْنُ', trPrefix: 'Nahnu', enPrefix: 'We', idPrefix: 'Kami' },
  { key: 'he', arPrefix: 'هُوَ', trPrefix: 'Huwa', enPrefix: 'He', idPrefix: 'Dia (Lk)' },
  { key: 'she', arPrefix: 'هِيَ', trPrefix: 'Hiya', enPrefix: 'She', idPrefix: 'Dia (Pr)' },
  { key: 'always', arPrefix: 'دَائِمًا', trPrefix: "Daa'iman", enPrefix: 'Always', idPrefix: 'Selalu' },
  { key: 'now', arPrefix: 'الْآنَ', trPrefix: 'Al-aana', enPrefix: 'Now', idPrefix: 'Sekarang' },
  { key: 'today', arPrefix: 'الْيَوْمَ', trPrefix: 'Al-yauma', enPrefix: 'Today', idPrefix: 'Hari ini' },
  { key: 'every_day', arPrefix: 'كُلَّ يَوْمٍ', trPrefix: 'Kulla yaumin', enPrefix: 'Daily', idPrefix: 'Setiap hari' },
  { key: 'morning', arPrefix: 'صَبَاحًا', trPrefix: 'Shabaahan', enPrefix: 'Morning', idPrefix: 'Pagi hari' },
];

const SHADE_MODIFIERS = [
  { key: 'light', ar: 'فَاتِحٌ', tr: 'faatihun', en: 'Light', id: 'Muda / Terang' },
  { key: 'dark', ar: 'غَامِقٌ', tr: 'ghaamiqun', en: 'Dark', id: 'Tua / Gelap' },
  { key: 'bright', ar: 'زَاهٍ', tr: 'zaahin', en: 'Bright', id: 'Cerah' },
  { key: 'pastel', ar: 'هَادِئٌ', tr: "haadi'un", en: 'Soft', id: 'Lembut' },
  { key: 'shiny', ar: 'لَامِعٌ', tr: "laami'un", en: 'Shiny', id: 'Mengkilap' },
  { key: 'pure', ar: 'نَقِيٌّ', tr: 'naqiyyun', en: 'Pure', id: 'Murni' },
  { key: 'warm', ar: 'دَافِئٌ', tr: "daafi'un", en: 'Warm', id: 'Hangat' },
  { key: 'cool', ar: 'بَارِدٌ', tr: 'baaridun', en: 'Cool', id: 'Sejuk' },
  { key: 'fav', ar: 'مُفَضَّلٌ', tr: 'mufadhdhalun', en: 'Favorite', id: 'Favorit' },
  { key: 'pretty', ar: 'جَمِيلٌ', tr: 'jamiilun', en: 'Pretty', id: 'Indah' },
  { key: 'vivid', ar: 'نَاصِعٌ', tr: "naashi'un", en: 'Vivid', id: 'Cemerlang' },
];

const DAILY_PLACES = [
  { key: 'home', ar: 'فِي الْبَيْتِ', tr: 'fil baiti', en: 'at home', id: 'di rumah' },
  { key: 'school', ar: 'فِي الْمَدْرَسَةِ', tr: 'fil madrasati', en: 'at school', id: 'di sekolah' },
  { key: 'mosque', ar: 'فِي الْمَسْجِدِ', tr: 'fil masjidi', en: 'in the mosque', id: 'di masjid' },
  { key: 'park', ar: 'فِي الْحَدِيقَةِ', tr: 'fil hadiiqati', en: 'in the park', id: 'di taman' },
  { key: 'today', ar: 'هَذَا الْيَوْمَ', tr: 'haadzal yauma', en: 'today', id: 'hari ini' },
  { key: 'together', ar: 'مَعًا بِسَعَادَةٍ', tr: "ma'an bisa'aadatin", en: 'happily together', id: 'bersama dengan ceria' },
  { key: 'please', ar: 'مِنْ فَضْلِكَ', tr: 'min fadhlika', en: 'please', id: 'dengan sopan' },
  { key: 'friend', ar: 'يَا صَدِيقِي', tr: 'yaa shadiiqii', en: 'my friend', id: 'temanku' },
  { key: 'morning', ar: 'فِي الصَّبَاحِ', tr: 'fish shabaahi', en: 'in the morning', id: 'di pagi hari' },
  { key: 'evening', ar: 'فِي الْمَسَاءِ', tr: "fil masaa'i", en: 'in the evening', id: 'di sore hari' },
];

function buildCategoryPool(category: Exclude<VocabCategory, 'Angka'>, targetCount: number): VocabWord[] {
  const seeds = CATEGORY_SEEDS[category];
  const results: VocabWord[] = [];
  const usedIds = new Set<string>();

  // 1. Add all base seeds first
  for (const s of seeds) {
    if (results.length >= targetCount) break;
    usedIds.add(s.slug);
    results.push({
      id: s.slug,
      arabic: s.ar,
      transliteration: s.tr,
      english: s.en,
      indonesian: s.id,
      category,
      emoji: s.emoji,
    });
  }

  // 2. Generate meaningful natural combinations until targetCount is reached
  let pass = 0;
  while (results.length < targetCount) {
    pass += 1;
    let addedInPass = 0;

    if (category === 'Kata Kerja') {
      const sub = VERB_SUBJECTS[(pass - 1) % VERB_SUBJECTS.length];
      const place = DAILY_PLACES[Math.floor((pass - 1) / VERB_SUBJECTS.length) % DAILY_PLACES.length];
      for (const s of seeds) {
        if (results.length >= targetCount) break;
        const cid = `${s.slug}_${sub.key}_${place.key}_${pass}`;
        if (usedIds.has(cid)) continue;
        usedIds.add(cid);
        results.push({
          id: cid,
          arabic: `${sub.arPrefix} ${s.ar} ${place.ar}`,
          transliteration: `${sub.trPrefix} ${s.tr} ${place.tr}`,
          english: `${sub.enPrefix} ${s.en.toLowerCase()} ${place.en}`,
          indonesian: `${sub.idPrefix} ${s.id.toLowerCase()} ${place.id}`,
          category,
          emoji: s.emoji,
        });
        addedInPass++;
      }
    } else if (category === 'Warna') {
      const shade = SHADE_MODIFIERS[(pass - 1) % SHADE_MODIFIERS.length];
      const extraTag = pass > SHADE_MODIFIERS.length ? ` ${Math.ceil(pass / SHADE_MODIFIERS.length)}` : '';
      for (const s of seeds) {
        if (results.length >= targetCount) break;
        const cid = `${s.slug}_${shade.key}_${pass}`;
        if (usedIds.has(cid)) continue;
        usedIds.add(cid);
        results.push({
          id: cid,
          arabic: `${s.ar} ${shade.ar}`,
          transliteration: `${s.tr} ${shade.tr}`,
          english: `${shade.en} ${s.en}${extraTag}`,
          indonesian: `${s.id} ${shade.id}${extraTag}`,
          category,
          emoji: s.emoji,
        });
        addedInPass++;
      }
    } else if (category === 'Kata Sifat' || category === 'Ukuran') {
      const ctx = DAILY_PLACES[(pass - 1) % DAILY_PLACES.length];
      const mod = VERB_SUBJECTS[Math.floor((pass - 1) / DAILY_PLACES.length) % VERB_SUBJECTS.length];
      for (const s of seeds) {
        if (results.length >= targetCount) break;
        const cid = `${s.slug}_${ctx.key}_${mod.key}_${pass}`;
        if (usedIds.has(cid)) continue;
        usedIds.add(cid);
        results.push({
          id: cid,
          arabic: `${s.ar} ${ctx.ar}`,
          transliteration: `${s.tr} ${ctx.tr}`,
          english: `${s.en} (${mod.enPrefix}) ${ctx.en}`,
          indonesian: `${s.id} ${ctx.id}`,
          category,
          emoji: s.emoji,
        });
        addedInPass++;
      }
    } else if (category === 'Kalimat') {
      const ctx = DAILY_PLACES[(pass - 1) % DAILY_PLACES.length];
      const sub = VERB_SUBJECTS[Math.floor((pass - 1) / DAILY_PLACES.length) % VERB_SUBJECTS.length];
      for (const s of seeds) {
        if (results.length >= targetCount) break;
        const cid = `${s.slug}_kal_${pass}`;
        if (usedIds.has(cid)) continue;
        usedIds.add(cid);
        results.push({
          id: cid,
          arabic: `${s.ar} ${ctx.ar}`,
          transliteration: `${s.tr} ${ctx.tr}`,
          english: `${s.en} ${ctx.en}`,
          indonesian: `${s.id} ${ctx.id}`,
          category,
          emoji: s.emoji,
        });
        addedInPass++;
      }
      if (results.length < targetCount && pass > 5) {
        for (const s of seeds) {
          if (results.length >= targetCount) break;
          const cid = `${s.slug}_kal2_${sub.key}_${pass}`;
          if (usedIds.has(cid)) continue;
          usedIds.add(cid);
          results.push({
            id: cid,
            arabic: `${sub.arPrefix} · ${s.ar}`,
            transliteration: `${sub.trPrefix} · ${s.tr}`,
            english: `${sub.enPrefix}: ${s.en}`,
            indonesian: `${sub.idPrefix}: ${s.id}`,
            category,
            emoji: s.emoji,
          });
          addedInPass++;
        }
      }
    } else {
      const mod = NOUN_MODIFIERS[(pass - 1) % NOUN_MODIFIERS.length];
      const ctxIdx = Math.floor((pass - 1) / NOUN_MODIFIERS.length);
      const hasCtx = ctxIdx > 0;
      const ctx = DAILY_PLACES[ctxIdx % DAILY_PLACES.length];
      for (const s of seeds) {
        if (results.length >= targetCount) break;
        const cid = `${s.slug}_${mod.key}_p${pass}`;
        if (usedIds.has(cid)) continue;
        usedIds.add(cid);
        const modAr = s.fem ? mod.arF : mod.arM;
        const modTr = s.fem ? mod.trF : mod.trM;
        results.push({
          id: cid,
          arabic: hasCtx ? `${s.ar} ${modAr} ${ctx.ar}` : `${s.ar} ${modAr}`,
          transliteration: hasCtx ? `${s.tr} ${modTr} ${ctx.tr}` : `${s.tr} ${modTr}`,
          english: hasCtx ? `${mod.en} ${s.en} ${ctx.en}` : `${mod.en} ${s.en}`,
          indonesian: hasCtx ? `${s.id} ${mod.id} ${ctx.id}` : `${s.id} ${mod.id}`,
          category,
          emoji: s.emoji,
        });
        addedInPass++;
      }
    }

    if (addedInPass === 0) break;
  }

  return results;
}

function buildAll5000VocabWords(): VocabWord[] {
  const numbers = buildNumberWords(); // 500 entries (1..500)

  const otherCategories: Exclude<VocabCategory, 'Angka'>[] = [
    'Hewan',
    'Buah & Sayur',
    'Warna',
    'Ukuran',
    'Kata Kerja',
    'Kata Sifat',
    'Pekerjaan',
    'Sekolah',
    'Rumah',
    'Masjid',
    'Kamar Mandi',
    'Daratan',
    'Lautan',
    'Alam Semesta',
    'Planet',
    'Kalimat',
    'Makanan',
    'Minuman',
    'Musim',
    'Keluarga',
    'Negara',
    'Kendaraan',
  ];

  // 4,500 remaining entries distributed cleanly across the 22 categories (~204-205 each)
  const baseQuota = Math.floor(4500 / otherCategories.length); // 204
  const remainder = 4500 % otherCategories.length; // 12

  const buckets: VocabWord[][] = [numbers];
  otherCategories.forEach((cat, idx) => {
    const quota = baseQuota + (idx < remainder ? 1 : 0);
    buckets.push(buildCategoryPool(cat, quota));
  });

  // Interleave buckets round-robin so every consecutive slice of 10 words (for Levels 1..500)
  // teaches a rich, varied, never-repeated mix across all 23 categories!
  const mixed: VocabWord[] = [];
  const cursors = new Array<number>(buckets.length).fill(0);
  let remaining = 5000;

  while (remaining > 0) {
    let progressed = false;
    for (let b = 0; b < buckets.length && remaining > 0; b++) {
      // Spread numbers evenly across all 500 levels (~1 per level)
      const take = b === 0 ? 1 : 1;
      for (let t = 0; t < take && cursors[b] < buckets[b].length && remaining > 0; t++) {
        mixed.push(buckets[b][cursors[b]++]);
        remaining--;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  return mixed.slice(0, 5000);
}

export const VOCAB_WORDS: VocabWord[] = buildAll5000VocabWords();

export const VOCAB_CATEGORIES: VocabCategory[] = [
  'Pekerjaan',
  'Warna',
  'Ukuran',
  'Kata Kerja',
  'Kata Sifat',
  'Sekolah',
  'Rumah',
  'Masjid',
  'Kamar Mandi',
  'Daratan',
  'Lautan',
  'Alam Semesta',
  'Planet',
  'Hewan',
  'Buah & Sayur',
  'Kalimat',
  'Makanan',
  'Minuman',
  'Musim',
  'Keluarga',
  'Negara',
  'Kendaraan',
  'Angka',
];

export const CONVERSATION_SENTENCES: SentenceMission[] = [
  {
    id: 'sent_1',
    category: 'Sapaan',
    emoji: '👋',
    indonesian: 'Halo, apa kabar hari ini?',
    englishSentence: 'Hello how are you today',
    englishWords: ['Hello', 'how', 'are', 'you', 'today'],
    arabicSentence: 'مَرْحَبًا كَيْفَ حَالُكَ الْيَوْمَ',
    arabicWords: ['مَرْحَبًا', 'كَيْفَ', 'حَالُكَ', 'الْيَوْمَ'],
    arabicTranslit: 'Marhaban kaifa haaluka al-yauma',
  },
  {
    id: 'sent_2',
    category: 'Sapaan',
    emoji: '😊',
    indonesian: 'Saya baik, terima kasih banyak',
    englishSentence: 'I am fine thank you',
    englishWords: ['I', 'am', 'fine', 'thank', 'you'],
    arabicSentence: 'أَنَا بِخَيْرٍ شُكْرًا جَزِيلًا',
    arabicWords: ['أَنَا', 'بِخَيْرٍ', 'شُكْرًا', 'جَزِيلًا'],
    arabicTranslit: 'Anaa bikhairin syukran jaziilan',
  },
  {
    id: 'sent_3',
    category: 'Sapaan',
    emoji: '🌅',
    indonesian: 'Selamat pagi teman baikku',
    englishSentence: 'Good morning my dear friend',
    englishWords: ['Good', 'morning', 'my', 'dear', 'friend'],
    arabicSentence: 'صَبَاحُ الْخَيْرِ يَا صَدِيقِي',
    arabicWords: ['صَبَاحُ', 'الْخَيْرِ', 'يَا', 'صَدِيقِي'],
    arabicTranslit: 'Shabaahul khairi yaa shadiiqii',
  },
  {
    id: 'sent_4',
    category: 'Perkenalan',
    emoji: '🪪',
    indonesian: 'Siapa nama lengkap kamu?',
    englishSentence: 'What is your name',
    englishWords: ['What', 'is', 'your', 'name'],
    arabicSentence: 'مَا هُوَ اِسْمُكَ الْجَمِيلُ',
    arabicWords: ['مَا', 'هُوَ', 'اِسْمُكَ', 'الْجَمِيلُ'],
    arabicTranslit: 'Maa huwa ismuka al-jamiilu',
  },
  {
    id: 'sent_5',
    category: 'Perkenalan',
    emoji: '🤝',
    indonesian: 'Senang bertemu dengan kamu',
    englishSentence: 'Nice to meet you friend',
    englishWords: ['Nice', 'to', 'meet', 'you', 'friend'],
    arabicSentence: 'أَنَا سَعِيدٌ بِمَعْرِفَتِكَ جِدًّا',
    arabicWords: ['أَنَا', 'سَعِيدٌ', 'بِمَعْرِفَتِكَ', 'جِدًّا'],
    arabicTranslit: "Anaa sa'iidun bima'rifatika jiddan",
  },
  {
    id: 'sent_6',
    category: 'Kesopanan',
    emoji: '💧',
    indonesian: 'Tolong beri aku air minum',
    englishSentence: 'Please give me cold water',
    englishWords: ['Please', 'give', 'me', 'cold', 'water'],
    arabicSentence: 'أَعْطِنِي الْمَاءَ مِنْ فَضْلِكَ',
    arabicWords: ['أَعْطِنِي', 'الْمَاءَ', 'مِنْ', 'فَضْلِكَ'],
    arabicTranslit: "A'thinii al-maa'a min fadhlika",
  },
  {
    id: 'sent_7',
    category: 'Kesopanan',
    emoji: '🆘',
    indonesian: 'Tolong bantu aku sekarang',
    englishSentence: 'Please help me right now',
    englishWords: ['Please', 'help', 'me', 'right', 'now'],
    arabicSentence: 'سَاعِدْنِي الْآنَ مِنْ فَضْلِكَ',
    arabicWords: ['سَاعِدْنِي', 'الْآنَ', 'مِنْ', 'فَضْلِكَ'],
    arabicTranslit: "Saa'idnii al-aana min fadhlika",
  },
  {
    id: 'sent_8',
    category: 'Kesopanan',
    emoji: '🙇',
    indonesian: 'Maafkan aku wahai guruku',
    englishSentence: 'I am sorry my teacher',
    englishWords: ['I', 'am', 'sorry', 'my', 'teacher'],
    arabicSentence: 'أَنَا آسِفٌ يَا مُعَلِّمِي',
    arabicWords: ['أَنَا', 'آسِفٌ', 'يَا', 'مُعَلِّمِي'],
    arabicTranslit: "Anaa aasifun yaa mu'allimii",
  },
  {
    id: 'sent_9',
    category: 'Sekolah',
    emoji: '🏫',
    indonesian: 'Saya pergi ke sekolah pagi',
    englishSentence: 'I go to school today',
    englishWords: ['I', 'go', 'to', 'school', 'today'],
    arabicSentence: 'أَذْهَبُ إِلَى الْمَدْرَسَةِ الْيَوْمَ',
    arabicWords: ['أَذْهَبُ', 'إِلَى', 'الْمَدْرَسَةِ', 'الْيَوْمَ'],
    arabicTranslit: 'Adzhabu ilal madrasati al-yauma',
  },
  {
    id: 'sent_10',
    category: 'Sekolah',
    emoji: '📖',
    indonesian: 'Saya membaca sebuah buku baru',
    englishSentence: 'I read a new book',
    englishWords: ['I', 'read', 'a', 'new', 'book'],
    arabicSentence: 'أَقْرَأُ كِتَابًا جَدِيدًا الْآنَ',
    arabicWords: ['أَقْرَأُ', 'كِتَابًا', 'جَدِيدًا', 'الْآنَ'],
    arabicTranslit: "Aqra'u kitaaban jadiidan al-aana",
  },
  {
    id: 'sent_11',
    category: 'Sekolah',
    emoji: '🧠',
    indonesian: 'Kami belajar bahasa Arab bersama',
    englishSentence: 'We learn Arabic together',
    englishWords: ['We', 'learn', 'Arabic', 'together'],
    arabicSentence: 'نَتَعَلَّمُ اللُّغَةَ الْعَرَبِيَّةَ مَعًا',
    arabicWords: ['نَتَعَلَّمُ', 'اللُّغَةَ', 'الْعَرَبِيَّةَ', 'مَعًا'],
    arabicTranslit: "Nata'allamu al-lughata al-'arabiyyata ma'an",
  },
  {
    id: 'sent_12',
    category: 'Sekolah',
    emoji: '✏️',
    indonesian: 'Saya menulis dengan pena biru',
    englishSentence: 'I write with blue pen',
    englishWords: ['I', 'write', 'with', 'blue', 'pen'],
    arabicSentence: 'أَكْتُبُ بِالْقَلَمِ الْأَزْرَقِ دَائِمًا',
    arabicWords: ['أَكْتُبُ', 'بِالْقَلَمِ', 'الْأَزْرَقِ', 'دَائِمًا'],
    arabicTranslit: "Aktubu bil-qalami al-azraqi daa'iman",
  },
  {
    id: 'sent_13',
    category: 'Makanan',
    emoji: '🍎',
    indonesian: 'Saya makan apel yang manis',
    englishSentence: 'I eat a sweet apple',
    englishWords: ['I', 'eat', 'a', 'sweet', 'apple'],
    arabicSentence: 'آكُلُ تُفَّاحَةً حُلْوَةً لَذِيذَةً',
    arabicWords: ['آكُلُ', 'تُفَّاحَةً', 'حُلْوَةً', 'لَذِيذَةً'],
    arabicTranslit: 'Aakulu tuffaahatan hulwatan ladziidzatan',
  },
  {
    id: 'sent_14',
    category: 'Makanan',
    emoji: '🍲',
    indonesian: 'Makanan ini sangat lezat sekali',
    englishSentence: 'This food is very delicious',
    englishWords: ['This', 'food', 'is', 'very', 'delicious'],
    arabicSentence: 'هَذَا الطَّعَامُ لَذِيذٌ جِدًّا',
    arabicWords: ['هَذَا', 'الطَّعَامُ', 'لَذِيذٌ', 'جِدًّا'],
    arabicTranslit: "Haadzaa ath-tha'aamu ladziidzun jiddan",
  },
  {
    id: 'sent_15',
    category: 'Minuman',
    emoji: '🥤',
    indonesian: 'Saya minum air setiap pagi',
    englishSentence: 'I drink water every morning',
    englishWords: ['I', 'drink', 'water', 'every', 'morning'],
    arabicSentence: 'أَشْرَبُ الْمَاءَ كُلَّ صَبَاحٍ',
    arabicWords: ['أَشْرَبُ', 'الْمَاءَ', 'كُلَّ', 'صَبَاحٍ'],
    arabicTranslit: "Asyrabu al-maa'a kulla shabaahin",
  },
  {
    id: 'sent_16',
    category: 'Keluarga',
    emoji: '👩',
    indonesian: 'Saya sangat menyayangi ibuku',
    englishSentence: 'I love my dear mother',
    englishWords: ['I', 'love', 'my', 'dear', 'mother'],
    arabicSentence: 'أَنَا أُحِبُّ أُمِّي كَثِيرًا',
    arabicWords: ['أَنَا', 'أُحِبُّ', 'أُمِّي', 'كَثِيرًا'],
    arabicTranslit: 'Anaa uhibbu ummii katsiiran',
  },
  {
    id: 'sent_17',
    category: 'Keluarga',
    emoji: '👨',
    indonesian: 'Ayahku bekerja di kota besar',
    englishSentence: 'My father works in city',
    englishWords: ['My', 'father', 'works', 'in', 'city'],
    arabicSentence: 'أَبِي يَعْمَلُ فِي الْمَدِينَةِ',
    arabicWords: ['أَبِي', 'يَعْمَلُ', 'فِي', 'الْمَدِينَةِ'],
    arabicTranslit: "Abii ya'malu fil madiinati",
  },
  {
    id: 'sent_18',
    category: 'Rumah',
    emoji: '🏠',
    indonesian: 'Rumah kami bersih dan indah',
    englishSentence: 'Our house is very clean',
    englishWords: ['Our', 'house', 'is', 'very', 'clean'],
    arabicSentence: 'بَيْتُنَا نَظِيفٌ وَجَمِيلٌ جِدًّا',
    arabicWords: ['بَيْتُنَا', 'نَظِيفٌ', 'وَجَمِيلٌ', 'جِدًّا'],
    arabicTranslit: 'Baitunaa nadziifun wa jamiilun jiddan',
  },
  {
    id: 'sent_19',
    category: 'Masjid',
    emoji: '🕌',
    indonesian: 'Kami pergi ke masjid bersama',
    englishSentence: 'We go to mosque together',
    englishWords: ['We', 'go', 'to', 'mosque', 'together'],
    arabicSentence: 'نَذْهَبُ إِلَى الْمَسْجِدِ مَعًا',
    arabicWords: ['نَذْهَبُ', 'إِلَى', 'الْمَسْجِدِ', 'مَعًا'],
    arabicTranslit: "Nadzhabu ilal masjidi ma'an",
  },
  {
    id: 'sent_20',
    category: 'Alam Semesta',
    emoji: '☀️',
    indonesian: 'Matahari bersinar cerah hari ini',
    englishSentence: 'The sun shines brightly today',
    englishWords: ['The', 'sun', 'shines', 'brightly', 'today'],
    arabicSentence: 'الشَّمْسُ مُشْرِقَةٌ جِدًّا الْيَوْمَ',
    arabicWords: ['الشَّمْسُ', 'مُشْرِقَةٌ', 'جِدًّا', 'الْيَوْمَ'],
    arabicTranslit: 'Asy-syamsu musyriqatun jiddan al-yauma',
  },
  {
    id: 'sent_21',
    category: 'Musim',
    emoji: '🌧️',
    indonesian: 'Hujan turun dari langit biru',
    englishSentence: 'Rain falls from blue sky',
    englishWords: ['Rain', 'falls', 'from', 'blue', 'sky'],
    arabicSentence: 'يَنْزِلُ الْمَطَرُ مِنَ السَّمَاءِ',
    arabicWords: ['يَنْزِلُ', 'الْمَطَرُ', 'مِنَ', 'السَّمَاءِ'],
    arabicTranslit: "Yanzilu al-matharu minas samaa'i",
  },
  {
    id: 'sent_22',
    category: 'Planet',
    emoji: '🌍',
    indonesian: 'Bumi adalah planet yang indah',
    englishSentence: 'Earth is a beautiful planet',
    englishWords: ['Earth', 'is', 'a', 'beautiful', 'planet'],
    arabicSentence: 'الْأَرْضُ كَوْكَبٌ جَمِيلٌ جِدًّا',
    arabicWords: ['الْأَرْضُ', 'كَوْكَبٌ', 'جَمِيلٌ', 'جِدًّا'],
    arabicTranslit: 'Al-ardhu kaukabun jamiilun jiddan',
  },
  {
    id: 'sent_23',
    category: 'Kendaraan',
    emoji: '🚗',
    indonesian: 'Saya mengendarai mobil merah baru',
    englishSentence: 'I drive a red car',
    englishWords: ['I', 'drive', 'a', 'red', 'car'],
    arabicSentence: 'أَقُودُ سَيَّارَةً حَمْرَاءَ جَدِيدَةً',
    arabicWords: ['أَقُودُ', 'سَيَّارَةً', 'حَمْرَاءَ', 'جَدِيدَةً'],
    arabicTranslit: "Aquudu sayyaaratan hamraa'a jadiidatan",
  },
  {
    id: 'sent_24',
    category: 'Kendaraan',
    emoji: '✈️',
    indonesian: 'Pesawat terbang tinggi di atas',
    englishSentence: 'The airplane flies very high',
    englishWords: ['The', 'airplane', 'flies', 'very', 'high'],
    arabicSentence: 'تَطِيرُ الطَّائِرَةُ عَالِيًا جِدًّا',
    arabicWords: ['تَطِيرُ', 'الطَّائِرَةُ', 'عَالِيًا', 'جِدًّا'],
    arabicTranslit: "Tathiiru ath-thaa'iratu 'aaliyan jiddan",
  },
  {
    id: 'sent_25',
    category: 'Kamar Mandi',
    emoji: '🧼',
    indonesian: 'Saya mencuci tangan dengan sabun',
    englishSentence: 'I wash hands with soap',
    englishWords: ['I', 'wash', 'hands', 'with', 'soap'],
    arabicSentence: 'أَغْسِلُ يَدَيَّ بِالصَّابُونِ النَّظِيفِ',
    arabicWords: ['أَغْسِلُ', 'يَدَيَّ', 'بِالصَّابُونِ', 'النَّظِيفِ'],
    arabicTranslit: 'Aghsilu yadayya bish-shaabuuni an-nadziifi',
  },
  {
    id: 'sent_26',
    category: 'Lautan',
    emoji: '🌊',
    indonesian: 'Laut biru sangat luas sekali',
    englishSentence: 'The blue sea is wide',
    englishWords: ['The', 'blue', 'sea', 'is', 'wide'],
    arabicSentence: 'الْبَحْرُ الْأَزْرَقُ وَاسِعٌ جِدًّا',
    arabicWords: ['الْبَحْرُ', 'الْأَزْرَقُ', 'وَاسِعٌ', 'جِدًّا'],
    arabicTranslit: "Al-bahrul azraqu waasi'un jiddan",
  },
  {
    id: 'sent_27',
    category: 'Negara',
    emoji: '🇮🇩',
    indonesian: 'Saya mencintai negara Indonesia',
    englishSentence: 'I love my country Indonesia',
    englishWords: ['I', 'love', 'my', 'country', 'Indonesia'],
    arabicSentence: 'أَنَا أُحِبُّ بَلَدِي إِنْدُونِيسِيَا',
    arabicWords: ['أَنَا', 'أُحِبُّ', 'بَلَدِي', 'إِنْدُونِيسِيَا'],
    arabicTranslit: 'Anaa uhibbu baladii Induuniisiyaa',
  },
  {
    id: 'sent_28',
    category: 'Pekerjaan',
    emoji: '👨‍⚕️',
    indonesian: 'Dokter membantu orang yang sakit',
    englishSentence: 'The doctor helps sick people',
    englishWords: ['The', 'doctor', 'helps', 'sick', 'people'],
    arabicSentence: 'الطَّبِيبُ يُسَاعِدُ النَّاسَ دَائِمًا',
    arabicWords: ['الطَّبِيبُ', 'يُسَاعِدُ', 'النَّاسَ', 'دَائِمًا'],
    arabicTranslit: "Ath-thabiibu yusaa'idun naasa daa'iman",
  },
  {
    id: 'sent_29',
    category: 'Daratan',
    emoji: '⛰️',
    indonesian: 'Gunung hijau itu sangat tinggi',
    englishSentence: 'The green mountain is high',
    englishWords: ['The', 'green', 'mountain', 'is', 'high'],
    arabicSentence: 'الْجَبَلُ الْأَخْضَرُ عَالٍ جِدًّا',
    arabicWords: ['الْجَبَلُ', 'الْأَخْضَرُ', 'عَالٍ', 'جِدًّا'],
    arabicTranslit: "Al-jabalul akhdharu 'aalin jiddan",
  },
  {
    id: 'sent_30',
    category: 'Kesopanan',
    emoji: '🙏',
    indonesian: 'Terima kasih atas bantuan kamu',
    englishSentence: 'Thank you for your help',
    englishWords: ['Thank', 'you', 'for', 'your', 'help'],
    arabicSentence: 'شُكْرًا لَكَ عَلَى الْمُسَاعَدَةِ',
    arabicWords: ['شُكْرًا', 'لَكَ', 'عَلَى', 'الْمُسَاعَدَةِ'],
    arabicTranslit: "Syukran laka 'alaal musaa'adati",
  },
  {
    id: 'sent_31',
    category: 'Hewan',
    emoji: '🐱',
    indonesian: 'Kucing kecil itu sangat lucu',
    englishSentence: 'The little cat is cute',
    englishWords: ['The', 'little', 'cat', 'is', 'cute'],
    arabicSentence: 'هَذِهِ الْقِطَّةُ الصَّغِيرَةُ لَطِيفَةٌ',
    arabicWords: ['هَذِهِ', 'الْقِطَّةُ', 'الصَّغِيرَةُ', 'لَطِيفَةٌ'],
    arabicTranslit: 'Haadzihil qit-thatu ash-shaghiiratu lathiifatun',
  },
  {
    id: 'sent_32',
    category: 'Kalimat',
    emoji: '🚶',
    indonesian: 'Mari kita pergi bersama sekarang',
    englishSentence: 'Let us go together now',
    englishWords: ['Let', 'us', 'go', 'together', 'now'],
    arabicSentence: 'هَيَّا نَذْهَبْ مَعًا الْآنَ',
    arabicWords: ['هَيَّا', 'نَذْهَبْ', 'مَعًا', 'الْآنَ'],
    arabicTranslit: "Hayyaa nadzhab ma'an al-aana",
  },
];
