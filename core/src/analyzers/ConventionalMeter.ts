import { ConventionalMeterResult, StrengthCategory } from '../types/index.js';

export class ConventionalMeter {
  /**
   * Implements a standard industry rule-based password strength meter
   * that evaluates strictly character composition and length criteria.
   *
   * Common baseline:
   * 1. Length >= 8
   * 2. Contains lowercase
   * 3. Contains uppercase
   * 4. Contains number
   * 5. Contains symbol
   */
  public static evaluate(password: string): ConventionalMeterResult {
    if (!password) {
      return {
        length: 0,
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
        hasSymbol: false,
        score: 0,
        category: 'Very Weak',
        rulesSatisfied: 0,
        totalRules: 5,
        explanation: 'No characters provided.'
      };
    }

    const length = password.length;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    let rulesSatisfied = 0;
    if (length >= 8) rulesSatisfied++;
    if (hasLowercase) rulesSatisfied++;
    if (hasUppercase) rulesSatisfied++;
    if (hasNumber) rulesSatisfied++;
    if (hasSymbol) rulesSatisfied++;

    // Conventional scoring formula:
    // Base points for length + 15 points per character class met
    let score = 0;
    if (length >= 16) score += 40;
    else if (length >= 12) score += 30;
    else if (length >= 8) score += 20;
    else score += length * 2;

    if (hasLowercase) score += 15;
    if (hasUppercase) score += 15;
    if (hasNumber) score += 15;
    if (hasSymbol) score += 15;

    score = Math.min(100, Math.max(0, score));

    let category: StrengthCategory = 'Very Weak';
    if (score < 30) {
      category = 'Very Weak';
    } else if (score < 50) {
      category = 'Weak';
    } else if (score < 70) {
      category = 'Fair';
    } else if (score < 85) {
      category = 'Strong';
    } else {
      category = 'Very Strong';
    }

    const explanation = `Conventional composition meter: ${rulesSatisfied}/5 rules met. Evaluates character sets and length without scanning for dictionary words, keyboard runs, or breach records.`;

    return {
      length,
      hasLowercase,
      hasUppercase,
      hasNumber,
      hasSymbol,
      score,
      category,
      rulesSatisfied,
      totalRules: 5,
      explanation
    };
  }
}
