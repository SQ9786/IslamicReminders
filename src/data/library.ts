import type { Kind, Piece, Topic } from "../types";

export const topics: { id: Topic; label: string }[] = [
  { id: "mercy", label: "Mercy" },
  { id: "patience", label: "Patience" },
  { id: "prayer", label: "Prayer" },
  { id: "trust", label: "Trust" },
  { id: "character", label: "Character" },
  { id: "gratitude", label: "Gratitude" },
  { id: "hope", label: "Hope" },
  { id: "time", label: "Time" },
  { id: "forgiveness", label: "Forgiveness" },
  { id: "knowledge", label: "Knowledge" },
  { id: "speech", label: "Speech" },
  { id: "sincerity", label: "Sincerity" },
  { id: "family", label: "Family" },
  { id: "hereafter", label: "Hereafter" },
];

export const kinds: { id: Kind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ayah", label: "Ayah" },
  { id: "hadith", label: "Hadith" },
  { id: "reminder", label: "Reminder" },
];

export const library: Piece[] = [
  {
    id: "sharh-94-6",
    kind: "ayah",
    topic: "patience",
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    english: "With hardship comes ease.",
    source: "Ash-Sharh 94:6",
    hook: "Hold this for the hard hour.",
  },
  {
    id: "baqarah-2-153",
    kind: "ayah",
    topic: "patience",
    arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    english: "Allah is with those who are patient.",
    source: "Al-Baqarah 2:153",
    hook: "You are not waiting alone.",
  },
  {
    id: "baqarah-2-286",
    kind: "ayah",
    topic: "patience",
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    english: "Allah does not burden a soul beyond what it can bear.",
    source: "Al-Baqarah 2:286",
    hook: "This load was measured.",
  },
  {
    id: "baqarah-2-45",
    kind: "ayah",
    topic: "prayer",
    arabic: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    english: "Seek help through patience and prayer.",
    source: "Al-Baqarah 2:45",
    hook: "Start with the prayer.",
  },
  {
    id: "baqarah-2-152",
    kind: "ayah",
    topic: "prayer",
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
    english: "Remember Me, and I will remember you.",
    source: "Al-Baqarah 2:152",
    hook: "A reminder, then a reply.",
  },
  {
    id: "baqarah-2-186",
    kind: "ayah",
    topic: "hope",
    arabic: "فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
    english: "I am near. I answer the call of whoever calls on Me.",
    source: "Al-Baqarah 2:186",
    hook: "Make the dua.",
  },
  {
    id: "rad-13-28",
    kind: "ayah",
    topic: "prayer",
    arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    english: "In the remembrance of Allah, hearts find rest.",
    source: "Ar-Ra'd 13:28",
    hook: "If the heart is loud, remember Him.",
  },
  {
    id: "zumar-39-53",
    kind: "ayah",
    topic: "mercy",
    arabic: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
    english: "Do not despair of the mercy of Allah.",
    source: "Az-Zumar 39:53",
    hook: "Mercy is wider than the mistake.",
  },
  {
    id: "araf-7-156",
    kind: "ayah",
    topic: "mercy",
    arabic: "وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ",
    english: "My mercy encompasses all things.",
    source: "Al-A'raf 7:156",
    hook: "There is room for you in it.",
  },
  {
    id: "ghafir-40-60",
    kind: "ayah",
    topic: "prayer",
    arabic: "ادْعُونِي أَسْتَجِبْ لَكُمْ",
    english: "Call upon Me; I will answer you.",
    source: "Ghafir 40:60",
    hook: "The invitation is already spoken.",
  },
  {
    id: "talaq-65-3",
    kind: "ayah",
    topic: "trust",
    arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    english: "Whoever trusts in Allah, He is enough for him.",
    source: "At-Talaq 65:3",
    hook: "Do what you can. He is enough.",
  },
  {
    id: "hadid-57-4",
    kind: "ayah",
    topic: "trust",
    arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
    english: "He is with you wherever you are.",
    source: "Al-Hadid 57:4",
    hook: "You did not arrive here alone.",
  },
  {
    id: "duha-93-7",
    kind: "ayah",
    topic: "hope",
    arabic: "وَوَجَدَكَ ضَالًّا فَهَدَىٰ",
    english: "He found you lost and guided you.",
    source: "Ad-Duha 93:7",
    hook: "Guidance already reached you once.",
  },
  {
    id: "ibrahim-14-7",
    kind: "ayah",
    topic: "gratitude",
    arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    english: "If you are grateful, I will give you more.",
    source: "Ibrahim 14:7",
    hook: "Begin with thanks.",
  },
  {
    id: "hujurat-49-13",
    kind: "ayah",
    topic: "character",
    arabic: "إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ",
    english: "The most honored of you before Allah is the most mindful of you.",
    source: "Al-Hujurat 49:13",
    hook: "Rank is not what people clap for.",
  },
  {
    id: "rahman-55-13",
    kind: "ayah",
    topic: "gratitude",
    arabic: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
    english: "Which of your Lord's favors will you two deny?",
    source: "Ar-Rahman 55:13",
    hook: "Count one favor before the scroll.",
  },
  {
    id: "asr-103",
    kind: "ayah",
    topic: "time",
    arabic:
      "وَالْعَصْرِ\nإِنَّ الْإِنسَانَ لَفِي خُسْرٍ\nإِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
    english:
      "By time. People are in loss, except those who believe, do good, and urge one another to truth and to patience.",
    source: "Al-Asr 103",
    hook: "The whole surah fits in one breath.",
  },
  {
    id: "bukhari-character",
    kind: "hadith",
    topic: "character",
    arabic: "خَيْرُكُمْ أَحْسَنُكُمْ أَخْلَاقًا",
    english: "The best of you are those with the best character.",
    source: "Sahih al-Bukhari",
    hook: "Character is the public proof.",
  },
  {
    id: "bukhari-muslim-brother",
    kind: "hadith",
    topic: "character",
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    english:
      "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Bukhari and Muslim",
    hook: "Faith shows up in what you want for others.",
  },
  {
    id: "bukhari-ease",
    kind: "hadith",
    topic: "mercy",
    arabic: "يَسِّرُوا وَلَا تُعَسِّرُوا وَبَشِّرُوا وَلَا تُنَفِّرُوا",
    english:
      "Make things easy, and do not make them hard. Give glad news, and do not drive people away.",
    source: "Sahih al-Bukhari",
    hook: "Ease is part of the teaching.",
  },
  {
    id: "tirmidhi-camel",
    kind: "hadith",
    topic: "trust",
    arabic: "اعْقِلْهَا وَتَوَكَّلْ",
    english: "Tie it, and trust in Allah.",
    source: "Jami' at-Tirmidhi",
    hook: "Do the work, then trust.",
  },
  {
    id: "muslim-strong",
    kind: "hadith",
    topic: "hope",
    arabic:
      "الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ وَفِي كُلٍّ خَيْرٌ",
    english:
      "The strong believer is better and more loved by Allah than the weak believer, and there is good in both.",
    source: "Sahih Muslim",
    hook: "Strength and gentleness can share a chest.",
  },
  {
    id: "bukhari-muslim-speech",
    kind: "hadith",
    topic: "speech",
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    english:
      "Whoever believes in Allah and the Last Day, let him speak good or stay silent.",
    source: "Bukhari and Muslim",
    hook: "Silence is a complete sentence.",
  },
  {
    id: "tirmidhi-smile",
    kind: "hadith",
    topic: "character",
    arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    english: "Your smile toward your brother is charity.",
    source: "Jami' at-Tirmidhi",
    hook: "Charity can be this small.",
  },
  {
    id: "bukhari-muslim-intent",
    kind: "hadith",
    topic: "sincerity",
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
    english: "Actions are judged by intentions.",
    source: "Bukhari and Muslim",
    hook: "Begin with the intention.",
  },
  {
    id: "muslim-beauty",
    kind: "hadith",
    topic: "gratitude",
    arabic: "إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ",
    english: "Allah is beautiful, and He loves beauty.",
    source: "Sahih Muslim",
    hook: "Beauty is not a side topic.",
  },
  {
    id: "bukhari-muslim-steady",
    kind: "hadith",
    topic: "time",
    arabic: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
    english:
      "The deeds most loved by Allah are those done steadily, even if they are small.",
    source: "Bukhari and Muslim",
    hook: "Small and steady outlasts a burst.",
  },
  {
    id: "tirmidhi-concern",
    kind: "hadith",
    topic: "character",
    arabic: "مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ",
    english:
      "From the beauty of a person's Islam is leaving what does not concern him.",
    source: "Jami' at-Tirmidhi",
    hook: "Leave what is not yours.",
  },
  {
    id: "tirmidhi-taqwa",
    kind: "hadith",
    topic: "trust",
    arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ",
    english: "Be mindful of Allah wherever you are.",
    source: "Jami' at-Tirmidhi",
    hook: "The same mindfulness, every room.",
  },
  {
    id: "rem-salah",
    kind: "reminder",
    topic: "prayer",
    arabic: "",
    english: "Pray this salah on time. The rest of the day can wait its turn.",
    source: "A reminder",
    hook: "Put the prayer in its place.",
  },
  {
    id: "rem-dua",
    kind: "reminder",
    topic: "prayer",
    arabic: "",
    english: "The dua you rush past is often the one you needed.",
    source: "A reminder",
    hook: "Stay for one more sentence.",
  },
  {
    id: "rem-speech",
    kind: "reminder",
    topic: "speech",
    arabic: "",
    english: "Speak if it helps. If it does not, leave it unsaid.",
    source: "A reminder",
    hook: "Not every thought needs a voice.",
  },
  {
    id: "rem-thanks",
    kind: "reminder",
    topic: "gratitude",
    arabic: "",
    english: "Name one blessing before you ask for another.",
    source: "A reminder",
    hook: "Thanks first.",
  },
  {
    id: "rem-quran",
    kind: "reminder",
    topic: "knowledge",
    arabic: "",
    english: "Five minutes of Qur'an will do more than an hour of worry.",
    source: "A reminder",
    hook: "Open it before you open the feed.",
  },
  {
    id: "rem-return",
    kind: "reminder",
    topic: "hope",
    arabic: "",
    english: "Come back. The door was never locked.",
    source: "A reminder",
    hook: "Return is always available.",
  },
  {
    id: "rem-plan",
    kind: "reminder",
    topic: "trust",
    arabic: "",
    english: "Make the plan. Then leave the outcome with Allah.",
    source: "A reminder",
    hook: "Your part has an edge. His does not.",
  },
  {
    id: "rem-delay",
    kind: "reminder",
    topic: "patience",
    arabic: "",
    english: "A delayed answer is still an answer in the making.",
    source: "A reminder",
    hook: "Wait without inventing the ending.",
  },
  {
    id: "rem-repent",
    kind: "reminder",
    topic: "forgiveness",
    arabic: "",
    english: "Repent before you rehearse the excuse.",
    source: "A reminder",
    hook: "A short return is enough to start.",
  },
  {
    id: "rem-gaze",
    kind: "reminder",
    topic: "character",
    arabic: "",
    english: "Lower your gaze. The heart follows the eyes.",
    source: "A reminder",
    hook: "Guard the glance.",
  },
  {
    id: "rem-learn",
    kind: "reminder",
    topic: "knowledge",
    arabic: "",
    english: "Learn one thing you can live today. Leave the rest for tomorrow.",
    source: "A reminder",
    hook: "One lesson, then practice.",
  },
  {
    id: "rem-forgive",
    kind: "reminder",
    topic: "forgiveness",
    arabic: "",
    english: "Ask to be forgiven before you explain yourself.",
    source: "A reminder",
    hook: "Return first.",
  },
  {
    id: "rem-intention",
    kind: "reminder",
    topic: "sincerity",
    arabic: "",
    english: "Check the reason before the action. A good deed with a crooked aim still misses.",
    source: "A reminder",
    hook: "The aim is part of the deed.",
  },
  {
    id: "rem-family",
    kind: "reminder",
    topic: "family",
    arabic: "",
    english: "The people in your house are the first place your character shows.",
    source: "A reminder",
    hook: "Start the kindness at home.",
  },
  {
    id: "rem-parents",
    kind: "reminder",
    topic: "family",
    arabic: "",
    english: "A soft word to a parent is a deed you can do today.",
    source: "A reminder",
    hook: "Call them before the day ends.",
  },
  {
    id: "rem-hereafter",
    kind: "reminder",
    topic: "hereafter",
    arabic: "",
    english: "This day is short. The next life is the long one.",
    source: "A reminder",
    hook: "Live the hour you have.",
  },
  {
    id: "rem-account",
    kind: "reminder",
    topic: "hereafter",
    arabic: "",
    english: "What you hide from people is still written.",
    source: "A reminder",
    hook: "The private deed counts.",
  },
];

const quranNote =
  "The English on the poster is a short rendering for Tadhkeer, not a published translation. Quran.com shows the Arabic and published translations.";
const bukhariNote =
  "The English on the poster is a short rendering, not Dr. Muhsin Khan’s translation. Sunnah.com shows Khan’s English beside the Arabic.";
const muslimNote =
  "The English on the poster is a short rendering, not Abdul Hamid Siddiqui’s translation. Sunnah.com shows that English beside the Arabic.";
const bothNote =
  "The English on the poster is a short rendering. Sunnah.com shows Dr. Muhsin Khan’s Bukhari translation and Abdul Hamid Siddiqui’s Muslim translation.";
const tirmidhiNote =
  "The English on the poster is a short rendering of part of a longer hadith. Read the published translation on Sunnah.com.";
const reminderNote =
  "An original reminder written for Tadhkeer. Do not attribute it to the Qur’an or the Prophet, peace be upon him.";

const verified: Record<string, { source?: string; sourceUrl?: string; attribution: string }> = {
  "sharh-94-6": { sourceUrl: "https://quran.com/94/6", attribution: quranNote },
  "baqarah-2-153": { sourceUrl: "https://quran.com/2/153", attribution: quranNote },
  "baqarah-2-286": { sourceUrl: "https://quran.com/2/286", attribution: quranNote },
  "baqarah-2-45": { sourceUrl: "https://quran.com/2/45", attribution: quranNote },
  "baqarah-2-152": { sourceUrl: "https://quran.com/2/152", attribution: quranNote },
  "baqarah-2-186": { sourceUrl: "https://quran.com/2/186", attribution: quranNote },
  "rad-13-28": { sourceUrl: "https://quran.com/13/28", attribution: quranNote },
  "zumar-39-53": { sourceUrl: "https://quran.com/39/53", attribution: quranNote },
  "araf-7-156": { sourceUrl: "https://quran.com/7/156", attribution: quranNote },
  "ghafir-40-60": { sourceUrl: "https://quran.com/40/60", attribution: quranNote },
  "talaq-65-3": { sourceUrl: "https://quran.com/65/3", attribution: quranNote },
  "hadid-57-4": { sourceUrl: "https://quran.com/57/4", attribution: quranNote },
  "duha-93-7": { sourceUrl: "https://quran.com/93/7", attribution: quranNote },
  "ibrahim-14-7": { sourceUrl: "https://quran.com/14/7", attribution: quranNote },
  "hujurat-49-13": { sourceUrl: "https://quran.com/49/13", attribution: quranNote },
  "rahman-55-13": { sourceUrl: "https://quran.com/55/13", attribution: quranNote },
  "asr-103": { sourceUrl: "https://quran.com/103", attribution: quranNote },
  "bukhari-character": {
    source: "Sahih al-Bukhari 6035",
    sourceUrl: "https://sunnah.com/bukhari:6035",
    attribution: bukhariNote,
  },
  "bukhari-muslim-brother": {
    source: "Bukhari 13 · Muslim 45",
    sourceUrl: "https://sunnah.com/bukhari:13",
    attribution: bothNote,
  },
  "bukhari-ease": {
    source: "Sahih al-Bukhari 69",
    sourceUrl: "https://sunnah.com/bukhari:69",
    attribution: bukhariNote,
  },
  "tirmidhi-camel": {
    source: "Jami' at-Tirmidhi 2517",
    sourceUrl: "https://sunnah.com/tirmidhi:2517",
    attribution:
      "The English on the poster is a short rendering. Tirmidhi called this narration gharib, and one of its narrators called it munkar. Read the entry on Sunnah.com before you share it as established.",
  },
  "muslim-strong": {
    source: "Sahih Muslim 2664",
    sourceUrl: "https://sunnah.com/muslim:2664",
    attribution: muslimNote,
  },
  "bukhari-muslim-speech": {
    source: "Bukhari 6018 · Muslim 47",
    sourceUrl: "https://sunnah.com/bukhari:6018",
    attribution: bothNote,
  },
  "tirmidhi-smile": {
    source: "Jami' at-Tirmidhi 1956",
    sourceUrl: "https://sunnah.com/tirmidhi:1956",
    attribution: tirmidhiNote,
  },
  "bukhari-muslim-intent": {
    source: "Bukhari 1 · Muslim 1907",
    sourceUrl: "https://sunnah.com/bukhari:1",
    attribution: bothNote,
  },
  "muslim-beauty": {
    source: "Sahih Muslim 91",
    sourceUrl: "https://sunnah.com/muslim:91",
    attribution:
      "The English on the poster is one line from a longer hadith about pride and beauty, not Abdul Hamid Siddiqui’s full translation. Read the whole entry on Sunnah.com.",
  },
  "bukhari-muslim-steady": {
    source: "Bukhari 6464 · Muslim 782",
    sourceUrl: "https://sunnah.com/bukhari:6464",
    attribution: bothNote,
  },
  "tirmidhi-concern": {
    source: "Jami' at-Tirmidhi 2317",
    sourceUrl: "https://sunnah.com/tirmidhi:2317",
    attribution: tirmidhiNote,
  },
  "tirmidhi-taqwa": {
    source: "Jami' at-Tirmidhi 1987",
    sourceUrl: "https://sunnah.com/tirmidhi:1987",
    attribution: tirmidhiNote,
  },
};

for (const piece of library) {
  const extra = verified[piece.id];
  if (extra) {
    if (extra.source) piece.source = extra.source;
    piece.sourceUrl = extra.sourceUrl;
    piece.attribution = extra.attribution;
  } else if (piece.kind === "reminder") {
    piece.attribution = reminderNote;
  }
}

export function kickerFor(kind: Kind): string {
  if (kind === "ayah") return "QUR'AN";
  if (kind === "hadith") return "HADITH";
  return "REMINDER";
}

export function filterLibrary(
  kind: Kind | "all",
  topic: Topic | "all",
  query = "",
  savedIds: readonly string[] = [],
  savedOnly = false,
  postedIds: readonly string[] = [],
  freshOnly = false,
): Piece[] {
  const needle = query.trim().toLowerCase();
  const arabicNeedle = query.trim();
  const saved = new Set(savedIds);
  const posted = new Set(postedIds);
  return library.filter((piece) => {
    if (kind !== "all" && piece.kind !== kind) return false;
    if (topic !== "all" && piece.topic !== topic) return false;
    if (savedOnly && !saved.has(piece.id)) return false;
    if (freshOnly && posted.has(piece.id)) return false;
    if (!needle) return true;
    return (
      piece.english.toLowerCase().includes(needle) ||
      piece.source.toLowerCase().includes(needle) ||
      piece.hook.toLowerCase().includes(needle) ||
      (arabicNeedle.length > 0 && piece.arabic.includes(arabicNeedle))
    );
  });
}

const topicTag: Record<Topic, string> = {
  mercy: "#rahma",
  patience: "#sabr",
  prayer: "#salah",
  trust: "#tawakkul",
  character: "#akhlaq",
  gratitude: "#shukr",
  hope: "#yaqeen",
  time: "#deen",
  forgiveness: "#tawbah",
  knowledge: "#ilm",
  speech: "#speech",
  sincerity: "#niyyah",
  family: "#family",
  hereafter: "#akhirah",
};

export function buildCaption(piece: Piece): string {
  const body = piece.arabic ? `${piece.arabic}\n\n${piece.english}` : piece.english;
  const sourceLine =
    piece.kind === "ayah"
      ? `Qur'an · ${piece.source}`
      : piece.kind === "hadith"
        ? `Hadith · ${piece.source}`
        : "Reminder";
  return `${body}\n\n${sourceLine}\n\n#islam #muslim ${topicTag[piece.topic]}`;
}
