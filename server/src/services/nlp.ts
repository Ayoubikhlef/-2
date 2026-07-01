const stopWords: Record<string, string[]> = {
  ar: [
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'كان', 'هذا', 'هذه', 'ذلك', 'تلك',
    'هل', 'ما', 'لم', 'لن', 'إن', 'أن', 'قد', 'لا', 'كل', 'بعض', 'هو', 'هي',
    'هم', 'هن', 'كانت', 'يكون', 'يكونون', 'ليس', 'لكن', 'أو', 'ثم', 'بعد',
    'قبل', 'عند', 'حتى', 'حول', 'بين', 'خلال', 'دون', 'فوق', 'تحت', 'أمام',
    'خلف', 'فقط', 'هناك', 'هنا', 'اذا', 'إذا', 'لقد', 'و', 'ال', 'ب', 'ك',
    'ف', 'س', 'وقد', 'ولا', 'فقد', 'حيث', 'أي', 'اي', 'نعم', 'لا',
    'ولم', 'ولن', 'وما', 'ومن', 'وفي', 'وعن', 'وعلى', 'إذ', 'اذ', 'بينما',
    'حسب', 'نحو', 'بسبب', 'رغم', 'لأن', 'لكيلا', 'كي', 'متى', 'أين', 'كيف',
    'كم', 'أيها', 'أيتها', 'اللذان', 'اللتان', 'الذين', 'اللواتي',
  ],
  fr: [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'ce', 'cet',
    'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
    'notre', 'votre', 'leur', 'nos', 'vos', 'leurs', 'je', 'tu', 'il', 'elle',
    'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se', 'lui', 'leur', 'eux',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'dont',
    'où', 'est', 'sont', 'suis', 'es', 'etes', 'sommes', 'ai', 'as',
    'a', 'avons', 'avez', 'ont', 'ete', 'etre', 'avoir', 'faire', 'fait',
    'pas', 'plus', 'tres', 'trop', 'peu', 'assez', 'si', 'ainsi', 'aussi',
    'non', 'oui', 'avec', 'sans', 'chez', 'dans', 'sur', 'sous', 'pour',
    'par', 'a', 'au', 'aux', 'en', 'vers', 'pendant', 'depuis', 'apres',
    'avant', 'entre', 'parmi', 'sauf', 'selon', 'comme', 'quand', 'puis',
    'alors', 'enfin', 'voici', 'voila', 'quel', 'quelle', 'quels', 'quelles',
    'tout', 'tous', 'toute', 'toutes', 'chaque', 'plusieurs', 'certains',
    'certaines', 'autre', 'autres', 'meme', 'tres', 'vraiment',
  ],
  en: [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'shall', 'can', 'need', 'dare', 'ought', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'its',
    'ours', 'theirs', 'this', 'that', 'these', 'those', 'what', 'which',
    'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'because', 'as', 'until', 'while', 'if', 'else', 'then', 'here', 'there',
    'one', 'two', 'also', 'well', 'much', 'many', 'any', 'really', 'quite',
  ],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z\u0600-\u06FF\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractKeywords(text: string, language: string): string[] {
  const normalized = normalize(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 1);
  const stopList = stopWords[language] || stopWords.en;
  return [...new Set(words.filter(w => !stopList.includes(w)))];
}

export function getLanguage(text: string): 'ar' | 'fr' | 'en' {
  const trimmed = text.trim();
  if (!trimmed) return 'en';
  if (/[\u0600-\u06FF]/.test(trimmed)) return 'ar';
  const lower = trimmed.toLowerCase();
  const frenchSignals = [
    'bonjour', 'salut', 'merci', 'svp', 's\'il vous', 'livraison',
    'paiement', 'garantie', 'bonsoir', 'coucou', 'prix',
  ];
  for (const w of frenchSignals) {
    if (lower.includes(w)) return 'fr';
  }
  return 'en';
}

export function similarity(a: string, b: string): number {
  const setA = new Set(normalize(a).split(/\s+/));
  const setB = new Set(normalize(b).split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}
