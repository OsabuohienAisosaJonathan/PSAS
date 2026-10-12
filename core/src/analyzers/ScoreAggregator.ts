import {
  CharacterClassAnalysis,
  CompositeScoreResult,
  CrackTimeEstimate,
  PatternMatch,
  ScoreComponentBreakdown,
  ScoringWeightsConfig,
  StrengthCategory,
  TheoreticalEntropyResult
} from '../types/index.js';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeightsConfig = {
  entropyWeight: 35,
  lengthBonusWeight: 25,
  varietyWeight: 15,
  patternPenaltyMultiplier: 1.0,
  dictionaryPenaltyMultiplier: 1.0,
  breachPenaltyFixed: 60,
  thresholdVeryWeak: 30,
  thresholdWeak: 50,
  thresholdFair: 70,
  thresholdStrong: 85
};

export class ScoreAggregator {
  /**
   * Transparently calculates the composite score based on information theory,
   * structural heuristics, and empirical compromise indicators.
   */
  public static calculate(
    charAnalysis: CharacterClassAnalysis,
    entropy: TheoreticalEntropyResult,
    patterns: PatternMatch[],
    crackTime: CrackTimeEstimate,
    isBreached: boolean,
    customWeights: Partial<ScoringWeightsConfig> = {}
  ): CompositeScoreResult {
    const weights: ScoringWeightsConfig = {
      ...DEFAULT_SCORING_WEIGHTS,
      ...customWeights
    };

    const rationale: string[] = [];

    if (entropy.length === 0) {
      return {
        score: 0,
        category: 'Very Weak',
        components: {
          entropyScore: 0,
          lengthBonus: 0,
          characterVarietyScore: 0,
          patternPenalty: 0,
          dictionaryPenalty: 0,
          breachPenalty: 0,
          finalRawScore: 0
        },
        rationale: ['No input provided.']
      };
    }

    // 1. Entropy Component (0 - 35 points)
    // 60 effective bits provides strong modern resistance against dictionary search
    const entropyRatio = Math.min(1.0, entropy.effectiveBits / 65.0);
    const entropyScore = Math.round(entropyRatio * weights.entropyWeight);
    rationale.push(`Information entropy (${entropy.effectiveBits} effective bits): +${entropyScore} pts`);

    // 2. Length Component (0 - 25 points)
    // Modern NIST/BSI guidelines recommend 12-16+ characters
    let lengthBonus = 0;
    if (entropy.length < 8) {
      lengthBonus = Math.round((entropy.length / 8) * 6);
    } else if (entropy.length < 12) {
      lengthBonus = 6 + Math.round(((entropy.length - 8) / 4) * 8); // 6 - 14
    } else if (entropy.length < 16) {
      lengthBonus = 14 + Math.round(((entropy.length - 12) / 4) * 7); // 14 - 21
    } else {
      lengthBonus = weights.lengthBonusWeight; // 25
    }
    rationale.push(`Password length (${entropy.length} chars): +${lengthBonus} pts`);

    // 3. Character Class Variety (0 - 15 points)
    let activeClasses = 0;
    if (charAnalysis.hasLowercase) activeClasses++;
    if (charAnalysis.hasUppercase) activeClasses++;
    if (charAnalysis.hasNumber) activeClasses++;
    if (charAnalysis.hasSymbol) activeClasses++;
    const characterVarietyScore = Math.round((activeClasses / 4) * weights.varietyWeight);
    rationale.push(`Character diversity (${activeClasses}/4 classes active): +${characterVarietyScore} pts`);

    // 4. Guess Resistance Scaling (0 - 25 points)
    // Scale by log10 of guess resistance (e.g. 10^14 guesses maxes out)
    const guessRatio = Math.min(1.0, crackTime.log10Guesses / 16.0);
    const guessScore = Math.round(guessRatio * 25);
    rationale.push(`Combinatorial guess resistance (~10^${crackTime.log10Guesses} attempts): +${guessScore} pts`);

    const positiveTotal = entropyScore + lengthBonus + characterVarietyScore + guessScore;

    // 5. Penalties
    let patternPenalty = 0;
    let dictionaryPenalty = 0;

    for (const p of patterns) {
      if (p.type === 'dictionary') {
        dictionaryPenalty += p.penalty * weights.dictionaryPenaltyMultiplier;
        rationale.push(`Penalty for dictionary word "${p.matchedSubstring}": -${p.penalty} pts`);
      } else {
        patternPenalty += p.penalty * weights.patternPenaltyMultiplier;
        rationale.push(`Penalty for ${p.type} pattern "${p.matchedSubstring}": -${p.penalty} pts`);
      }
    }

    // Cap penalties to prevent extreme negative compounding
    patternPenalty = Math.min(50, Math.round(patternPenalty));
    dictionaryPenalty = Math.min(45, Math.round(dictionaryPenalty));

    // 6. Breach Penalty
    let breachPenalty = 0;
    if (isBreached) {
      breachPenalty = weights.breachPenaltyFixed;
      rationale.push(`CRITICAL: Compromised in known breach corpus: -${breachPenalty} pts`);
    }

    // Compute raw composite
    let finalRawScore = positiveTotal - patternPenalty - dictionaryPenalty - breachPenalty;

    // Hard ceiling for compromised or short passwords
    if (isBreached) {
      finalRawScore = Math.min(finalRawScore, 20); // Breached passwords can NEVER exceed Very Weak
      rationale.push('Hard ceiling imposed: Breached passwords cannot exceed score of 20.');
    } else if (entropy.length < 8) {
      finalRawScore = Math.min(finalRawScore, 35); // Under 8 characters cannot exceed Weak
    }

    const finalScore = Math.max(0, Math.min(100, finalRawScore));

    // Determine Strength Category
    let category: StrengthCategory = 'Very Weak';
    if (finalScore < weights.thresholdVeryWeak) {
      category = 'Very Weak';
    } else if (finalScore < weights.thresholdWeak) {
      category = 'Weak';
    } else if (finalScore < weights.thresholdFair) {
      category = 'Fair';
    } else if (finalScore < weights.thresholdStrong) {
      category = 'Strong';
    } else {
      category = 'Very Strong';
    }

    const components: ScoreComponentBreakdown = {
      entropyScore,
      lengthBonus,
      characterVarietyScore,
      patternPenalty,
      dictionaryPenalty,
      breachPenalty,
      finalRawScore: finalScore
    };

    return {
      score: finalScore,
      category,
      components,
      rationale
    };
  }
}
