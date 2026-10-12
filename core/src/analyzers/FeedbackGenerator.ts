import {
  CharacterClassAnalysis,
  CompositeScoreResult,
  PatternMatch,
  TheoreticalEntropyResult
} from '../types/index.js';

export class FeedbackGenerator {
  /**
   * Synthesizes actionable, human-centered feedback explaining why the password
   * received its rating and concrete non-prescriptive steps to strengthen it.
   */
  public static generateFeedback(
    charAnalysis: CharacterClassAnalysis,
    entropy: TheoreticalEntropyResult,
    patterns: PatternMatch[],
    isBreached: boolean,
    scoreResult: CompositeScoreResult
  ): { actionableFeedback: string[]; recommendations: string[] } {
    const actionableFeedback: string[] = [];
    const recommendations: string[] = [];

    if (entropy.length === 0) {
      return {
        actionableFeedback: ['Please enter a password candidate to begin security evaluation.'],
        recommendations: [
          'Choose a password with at least 14-16 characters.',
          'Consider combining 4 or more random, memorable words.'
        ]
      };
    }

    // 1. Compromise & Breach status feedback
    if (isBreached) {
      actionableFeedback.push(
        'CRITICAL ALERT: This exact password appears in public compromised-password databases. Attackers test these credentials immediately in automated credential-stuffing attacks.'
      );
      recommendations.push('Do NOT use this password anywhere. Select a unique credential.');
    }

    // 2. Length feedback
    if (entropy.length < 8) {
      actionableFeedback.push(
        `Critical length deficiency: At only ${entropy.length} characters, modern GPU rigs can exhaust the entire search space in seconds.`
      );
      recommendations.push('Increase your password length to at least 12–16 characters.');
    } else if (entropy.length < 12) {
      actionableFeedback.push(
        `Moderate length (${entropy.length} characters): Acceptable for low-risk accounts, but vulnerable to dedicated offline GPU cracking.`
      );
      recommendations.push('Aim for 14 or more characters to withstand accelerated offline hashing attacks.');
    } else {
      actionableFeedback.push(
        `Good length (${entropy.length} characters): Provides a wide combinatorial baseline.`
      );
    }

    // 3. Pattern-specific feedback
    const dictMatches = patterns.filter(p => p.type === 'dictionary');
    if (dictMatches.length > 0) {
      const words = dictMatches.map(d => `"${d.matchedSubstring}"`).join(', ');
      actionableFeedback.push(
        `Dictionary vocabulary found (${words}): Attackers use specialized language dictionaries and rule lists that immediately try these words.`
      );
      recommendations.push('Avoid recognizable English words, slang, names, and sports teams.');
    }

    const leetMatches = patterns.filter(p => p.type === 'substitution');
    if (leetMatches.length > 0) {
      actionableFeedback.push(
        'Predictable symbol substitutions detected (e.g. @ for a, 0 for o): Automated cracking engines reverse these substitutions automatically.'
      );
      recommendations.push('Avoid simplistic letter-to-symbol substitutions; prioritize overall length instead.');
    }

    const kbMatches = patterns.filter(p => p.type === 'keyboard');
    if (kbMatches.length > 0) {
      actionableFeedback.push(
        'Keyboard walks detected: Adjacent keystrokes (like QWERTY or ASDF) are trivial to predict and crack.'
      );
      recommendations.push('Avoid sliding your fingers across adjacent keys on the keyboard.');
    }

    const seqMatches = patterns.filter(p => p.type === 'sequential');
    if (seqMatches.length > 0) {
      actionableFeedback.push(
        'Consecutive numerical or alphabetical sequences detected (e.g. 123456, abcdef).'
      );
      recommendations.push('Avoid linear number runs and sequential alphabetic characters.');
    }

    const repMatches = patterns.filter(p => p.type === 'repeated_char' || p.type === 'repeated_sequence');
    if (repMatches.length > 0) {
      actionableFeedback.push(
        'Repetitive characters or duplicate substrings detected: Repetition creates the illusion of length without adding real entropy.'
      );
      recommendations.push('Eliminate repeated characters or doubled phrases.');
    }

    const dateMatches = patterns.filter(p => p.type === 'date');
    if (dateMatches.length > 0) {
      actionableFeedback.push(
        'Predictable dates or calendar years detected: Birthdays and years are among the first patterns tested by credential attackers.'
      );
      recommendations.push('Avoid including calendar years, birth dates, or anniversary numbers.');
    }

    const affixMatches = patterns.filter(p => p.type === 'common_suffix_prefix');
    if (affixMatches.length > 0) {
      actionableFeedback.push(
        'Predictable prefixes or suffixes detected (e.g. appending "123" or "!"): Password cracking rules always append these common suffixes.'
      );
      recommendations.push('Do not simply append numbers or exclamation marks to the end of a word.');
    }

    // 4. Character diversity
    let missingClasses: string[] = [];
    if (!charAnalysis.hasUppercase) missingClasses.push('uppercase letters');
    if (!charAnalysis.hasLowercase) missingClasses.push('lowercase letters');
    if (!charAnalysis.hasNumber) missingClasses.push('numbers');
    if (!charAnalysis.hasSymbol) missingClasses.push('symbols');

    if (missingClasses.length > 1 && entropy.length < 16) {
      recommendations.push(`Incorporate characters from different sets: Consider adding ${missingClasses.join(' and ')}.`);
    }

    // 5. Positive reinforcement for strong passwords
    if (scoreResult.category === 'Strong' || scoreResult.category === 'Very Strong') {
      actionableFeedback.push(
        'Strong defense profile: Candidate exhibits high entropy and avoids common human predictability patterns.'
      );
      recommendations.push('Ensure you do not reuse this password on any other service.');
      recommendations.push('Store this credential in a trusted password manager.');
    } else {
      recommendations.push('Consider adopting a 4-word random passphrase (e.g. "correct-horse-battery-staple" model).');
    }

    return {
      actionableFeedback,
      recommendations: Array.from(new Set(recommendations))
    };
  }
}
