import { PatternMatch } from '../types/index.js';

export class PatternMatcher {
  private static KEYBOARD_PATTERNS = [
    // Standard QWERTY rows
    'qwertyuiop', 'poiuytrewq',
    'asdfghjkl', 'lkjhgfdsa',
    'zxcvbnm', 'mnbvcxz',
    // Number row
    '1234567890', '0987654321',
    // Diagonals
    'qazwsxedcrfvtgbyhnujmikol',
    'qaz', 'zaq', 'wsx', 'xsw', 'edc', 'cde',
    'rfv', 'vfr', 'tgb', 'bgt', 'yhn', 'nhy',
    'ujm', 'mju', 'ikm', 'mki',
    // Keypad patterns
    '789456123', '321654987', '147258369', '963852741'
  ];

  /**
   * Scans candidate password for all structural, spatial, repeating, and date patterns.
   */
  public static detectAllPatterns(password: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    if (!password || password.length < 2) return matches;

    const lower = password.toLowerCase();

    // 1. Detect Keyboard walks
    matches.push(...this.detectKeyboardWalks(lower, password));

    // 2. Detect Sequential characters (alphabetical & numeric)
    matches.push(...this.detectSequentialCharacters(password));

    // 3. Detect Repeated characters (e.g. "aaaa", "111111")
    matches.push(...this.detectRepeatedCharacters(password));

    // 4. Detect Repeated sequences / words (e.g. "johnjohn", "adminadmin", "ababab")
    matches.push(...this.detectRepeatedSequences(password));

    // 5. Detect Dates (e.g. "1999", "2000", "01012000", "12/05/2001")
    matches.push(...this.detectDates(password));

    // 6. Detect Common Prefixes & Suffixes (e.g. "password123", "admin2026")
    matches.push(...this.detectAffixes(password));

    // Remove duplicates or heavily overlapping matches with lower penalty
    return this.deduplicateMatches(matches);
  }

  private static detectKeyboardWalks(lower: string, original: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const minLen = 3;

    for (const kb of this.KEYBOARD_PATTERNS) {
      for (let len = Math.min(kb.length, lower.length); len >= minLen; len--) {
        for (let i = 0; i <= kb.length - len; i++) {
          const sub = kb.slice(i, i + len);
          let idx = lower.indexOf(sub);
          while (idx !== -1) {
            matches.push({
              id: `kb-${idx}-${len}`,
              type: 'keyboard',
              patternName: `Keyboard Pattern: "${original.slice(idx, idx + len)}"`,
              matchedSubstring: original.slice(idx, idx + len),
              startIndex: idx,
              length: len,
              explanation: `Adjacent keyboard walk detected ("${sub}"). Attackers use Markov chain spatial dictionaries to crack keyboard sweeps rapidly.`,
              penalty: Math.min(30, len * 5),
              riskLevel: len >= 5 ? 'high' : 'medium'
            });
            idx = lower.indexOf(sub, idx + 1);
          }
        }
      }
    }

    return matches;
  }

  private static detectSequentialCharacters(password: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    if (password.length < 3) return matches;

    let seqStart = 0;
    let seqLen = 1;
    let seqDir = 0; // +1 ascending, -1 descending

    for (let i = 1; i < password.length; i++) {
      const prevCode = password.charCodeAt(i - 1);
      const currCode = password.charCodeAt(i);
      const diff = currCode - prevCode;

      if (diff === 1 || diff === -1) {
        if (seqLen === 1) {
          seqDir = diff;
          seqLen = 2;
        } else if (diff === seqDir) {
          seqLen++;
        } else {
          if (seqLen >= 3) {
            const sub = password.slice(seqStart, seqStart + seqLen);
            matches.push({
              id: `seq-${seqStart}-${seqLen}`,
              type: 'sequential',
              patternName: `Sequential Sequence: "${sub}"`,
              matchedSubstring: sub,
              startIndex: seqStart,
              length: seqLen,
              explanation: `Sequential ${seqDir > 0 ? 'ascending' : 'descending'} character run found ("${sub}"). Such sequences add minimal entropy against brute-force attacks.`,
              penalty: Math.min(25, seqLen * 4),
              riskLevel: seqLen >= 5 ? 'high' : 'medium'
            });
          }
          seqStart = i - 1;
          seqLen = 2;
          seqDir = diff;
        }
      } else {
        if (seqLen >= 3) {
          const sub = password.slice(seqStart, seqStart + seqLen);
          matches.push({
            id: `seq-${seqStart}-${seqLen}`,
            type: 'sequential',
            patternName: `Sequential Sequence: "${sub}"`,
            matchedSubstring: sub,
            startIndex: seqStart,
            length: seqLen,
            explanation: `Sequential character sequence "${sub}" detected. Attackers prioritize consecutive runs in mask and hybrid attacks.`,
            penalty: Math.min(25, seqLen * 4),
            riskLevel: seqLen >= 5 ? 'high' : 'medium'
          });
        }
        seqStart = i;
        seqLen = 1;
        seqDir = 0;
      }
    }

    if (seqLen >= 3) {
      const sub = password.slice(seqStart, seqStart + seqLen);
      matches.push({
        id: `seq-${seqStart}-${seqLen}`,
        type: 'sequential',
        patternName: `Sequential Sequence: "${sub}"`,
        matchedSubstring: sub,
        startIndex: seqStart,
        length: seqLen,
        explanation: `Sequential sequence "${sub}" detected.`,
        penalty: Math.min(25, seqLen * 4),
        riskLevel: seqLen >= 5 ? 'high' : 'medium'
      });
    }

    return matches;
  }

  private static detectRepeatedCharacters(password: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const repeatRegex = /(.)\1{2,}/g;
    let match: RegExpExecArray | null;

    while ((match = repeatRegex.exec(password)) !== null) {
      const sub = match[0];
      matches.push({
        id: `rep-char-${match.index}-${sub.length}`,
        type: 'repeated_char',
        patternName: `Repeated Character: "${sub}"`,
        matchedSubstring: sub,
        startIndex: match.index,
        length: sub.length,
        explanation: `Character '${match[1]}' repeated ${sub.length} consecutive times. Repeated characters artificially inflate length without adding structural diversity.`,
        penalty: Math.min(30, sub.length * 5),
        riskLevel: sub.length >= 4 ? 'high' : 'medium'
      });
    }

    return matches;
  }

  private static detectRepeatedSequences(password: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lower = password.toLowerCase();

    // Check for 2+ char substrings repeated back-to-back (e.g. johnjohn, ababab, 1212)
    for (let subLen = 2; subLen <= Math.floor(lower.length / 2); subLen++) {
      for (let i = 0; i <= lower.length - subLen * 2; i++) {
        const sub = lower.slice(i, i + subLen);
        const nextSub = lower.slice(i + subLen, i + subLen * 2);

        if (sub === nextSub) {
          const matchedOriginal = password.slice(i, i + subLen * 2);
          matches.push({
            id: `rep-seq-${i}-${subLen * 2}`,
            type: 'repeated_sequence',
            patternName: `Duplicated Pattern: "${matchedOriginal}"`,
            matchedSubstring: matchedOriginal,
            startIndex: i,
            length: subLen * 2,
            explanation: `Symmetrical repetition of token "${password.slice(i, i + subLen)}" detected. Duplicate tokens collapse the effective combinatorial search space.`,
            penalty: Math.min(30, subLen * 6),
            riskLevel: subLen >= 3 ? 'high' : 'medium'
          });
        }
      }
    }

    return matches;
  }

  private static detectDates(password: string): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // 4-digit years (1900 - 2099)
    const yearRegex = /(?:19|20)\d{2}/g;
    let match: RegExpExecArray | null;
    while ((match = yearRegex.exec(password)) !== null) {
      matches.push({
        id: `date-year-${match.index}`,
        type: 'date',
        patternName: `Calendar Year: "${match[0]}"`,
        matchedSubstring: match[0],
        startIndex: match.index,
        length: 4,
        explanation: `Likely birth or calendar year (${match[0]}) detected. Date and year masks are universally tested in brute-force dictionary attacks.`,
        penalty: 20,
        riskLevel: 'high'
      });
    }

    // Common date formats: DDMMYYYY or MMDDYYYY (8 digits), DD/MM/YYYY or YYYY-MM-DD
    const fullDateRegex = /(?:\d{2}[-/. ]\d{2}[-/. ]\d{4})|(?:\d{4}[-/. ]\d{2}[-/. ]\d{2})|(?:\d{8})/g;
    while ((match = fullDateRegex.exec(password)) !== null) {
      if (!matches.some(m => m.startIndex === match!.index)) {
        matches.push({
          id: `date-full-${match.index}`,
          type: 'date',
          patternName: `Formatted Date: "${match[0]}"`,
          matchedSubstring: match[0],
          startIndex: match.index,
          length: match[0].length,
          explanation: `Specific date pattern "${match[0]}" detected. Personal dates (birthdays, anniversaries) are high-probability targets.`,
          penalty: 28,
          riskLevel: 'critical'
        });
      }
    }

    return matches;
  }

  private static detectAffixes(password: string): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Common numeric/symbol suffixes (e.g. 123, 1, 2024, 2026, !, @, #)
    const suffixRegex = /(?:[0-9]{1,4}|[!@#$%^&*+=?]{1,2})$/;
    const suffixMatch = suffixRegex.exec(password);
    if (suffixMatch && suffixMatch.index > 0 && password.length >= 6) {
      matches.push({
        id: `affix-suf-${suffixMatch.index}`,
        type: 'common_suffix_prefix',
        patternName: `Predictable Suffix: "${suffixMatch[0]}"`,
        matchedSubstring: suffixMatch[0],
        startIndex: suffixMatch.index,
        length: suffixMatch[0].length,
        explanation: `Appends predictable suffix "${suffixMatch[0]}". Attackers use rule-based hybrid attacks to append numbers and symbols to base words.`,
        penalty: 14,
        riskLevel: 'medium'
      });
    }

    // Common prefixes (e.g. admin, user, pass, root)
    const prefixRegex = /^(?:admin|user|pass|root|super)[_.\-@#$]?/i;
    const prefixMatch = prefixRegex.exec(password);
    if (prefixMatch && password.length > prefixMatch[0].length) {
      matches.push({
        id: `affix-pre-0`,
        type: 'common_suffix_prefix',
        patternName: `Predictable Prefix: "${prefixMatch[0]}"`,
        matchedSubstring: prefixMatch[0],
        startIndex: 0,
        length: prefixMatch[0].length,
        explanation: `Begins with common administrative prefix "${prefixMatch[0]}".`,
        penalty: 16,
        riskLevel: 'medium'
      });
    }

    return matches;
  }

  private static deduplicateMatches(matches: PatternMatch[]): PatternMatch[] {
    const result: PatternMatch[] = [];
    for (const match of matches) {
      const existing = result.find(r =>
        r.startIndex === match.startIndex &&
        r.length === match.length &&
        r.type === match.type
      );
      if (!existing) {
        result.push(match);
      }
    }
    return result;
  }
}
