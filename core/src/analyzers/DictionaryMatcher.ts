import { PatternMatch } from '../types/index.js';

// Curated high-frequency password dictionary words (sourced from research corpora: RockYou, SecLists, top common passwords)
export const COMMON_DICTIONARY_WORDS: string[] = [
  'password', 'admin', 'administrator', 'welcome', 'login', 'secret', 'default',
  'system', 'security', 'football', 'baseball', 'basketball', 'soccer', 'hockey',
  'computer', 'internet', 'network', 'master', 'shadow', 'dragon', 'monkey',
  'superman', 'batman', 'pokemon', 'matrix', 'hunter', 'ranger', 'warrior',
  'knight', 'wizard', 'angel', 'princess', 'summer', 'winter', 'autumn',
  'spring', 'january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december', 'monday', 'friday',
  'sunday', 'orange', 'purple', 'yellow', 'silver', 'golden', 'diamond',
  'coffee', 'chocolate', 'cookie', 'sunset', 'sunshine', 'starwars', 'trustno1',
  'access', 'account', 'manage', 'server', 'service', 'database', 'testing',
  'student', 'teacher', 'school', 'college', 'university', 'freedom', 'justice',
  'family', 'friend', 'love', 'happy', 'forever', 'together', 'heaven',
  'michael', 'daniel', 'jessica', 'ashley', 'jennifer', 'matthew', 'anthony',
  'elizabeth', 'william', 'david', 'richard', 'charles', 'thomas', 'christopher',
  'qwerty', 'letmein', 'mustang', 'chevy', 'dodge', 'corvette', 'ferrari',
  'camaro', 'harley', 'yamaha', 'suzuki', 'kawasaki', 'honda', 'toyota',
  'nissan', 'london', 'paris', 'tokyo', 'berlin', 'madrid', 'chicago', 'boston',
  'austin', 'seattle', 'denver', 'miami', 'phoenix', 'dallas', 'atlanta'
];

export class DictionaryMatcher {
  private static dictionarySet: Set<string> = new Set(COMMON_DICTIONARY_WORDS);

  /**
   * Reverse leet-speak character substitutions to uncover underlying root words.
   */
  public static normalizeLeetSpeak(input: string): string {
    return input
      .toLowerCase()
      .replace(/@/g, 'a')
      .replace(/4/g, 'a')
      .replace(/8/g, 'b')
      .replace(/3/g, 'e')
      .replace(/1/g, 'i')
      .replace(/!/g, 'i')
      .replace(/0/g, 'o')
      .replace(/\$/g, 's')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/\+/g, 't');
  }

  /**
   * Identifies exact or sub-string dictionary words within candidate input.
   */
  public static findDictionaryMatches(input: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    if (!input || input.length < 3) return matches;

    const lower = input.toLowerCase();
    const normalized = this.normalizeLeetSpeak(input);

    for (const word of this.dictionarySet) {
      if (word.length < 3) continue;

      // Check direct lowercase match
      let index = lower.indexOf(word);
      while (index !== -1) {
        const isExactMatch = lower === word;
        matches.push({
          id: `dict-${word}-${index}`,
          type: 'dictionary',
          patternName: `Dictionary Word: "${word}"`,
          matchedSubstring: input.slice(index, index + word.length),
          startIndex: index,
          length: word.length,
          explanation: `Contains common dictionary term "${word}". Automated dictionary and hybrid masking attacks test common lexicon words first.`,
          penalty: isExactMatch ? 35 : Math.min(25, word.length * 3),
          riskLevel: isExactMatch ? 'critical' : (word.length >= 6 ? 'high' : 'medium')
        });
        index = lower.indexOf(word, index + 1);
      }

      // Check leet-normalized match if different from lowercase match
      if (normalized !== lower) {
        let normIndex = normalized.indexOf(word);
        while (normIndex !== -1) {
          const matchedOriginal = input.slice(normIndex, normIndex + word.length);
          // Only add if not already captured verbatim
          const alreadyCaptured = matches.some(
            m => m.startIndex === normIndex && m.length === word.length
          );

          if (!alreadyCaptured) {
            matches.push({
              id: `dict-leet-${word}-${normIndex}`,
              type: 'substitution',
              patternName: `Obfuscated Dictionary Word: "${matchedOriginal}" (${word})`,
              matchedSubstring: matchedOriginal,
              startIndex: normIndex,
              length: word.length,
              explanation: `Predictable leet-speak substitution detected for dictionary word "${word}". Modern cracking rule engines (e.g. Hashcat, John the Ripper) easily reverse these mappings.`,
              penalty: 28,
              riskLevel: 'high'
            });
          }
          normIndex = normalized.indexOf(word, normIndex + 1);
        }
      }
    }

    return matches;
  }
}
