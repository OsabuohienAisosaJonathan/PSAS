import {
  AttackRatesConfig,
  BreachStatusResult,
  PasswordAnalysisResult,
  ScoringWeightsConfig
} from '../types/index.js';
import { EntropyAnalyzer } from './EntropyAnalyzer.js';
import { PatternMatcher } from './PatternMatcher.js';
import { DictionaryMatcher } from './DictionaryMatcher.js';
import { CrackTimeEstimator } from './CrackTimeEstimator.js';
import { ScoreAggregator } from './ScoreAggregator.js';
import { FeedbackGenerator } from './FeedbackGenerator.js';

export interface AnalyzerOptions {
  breachStatus?: BreachStatusResult;
  scoringWeights?: Partial<ScoringWeightsConfig>;
  attackRates?: Partial<AttackRatesConfig>;
}

export class PasswordAnalyzer {
  /**
   * Primary entry point to conduct multi-dimensional analysis on candidate password.
   */
  public static analyze(
    password: string,
    options: AnalyzerOptions = {}
  ): PasswordAnalysisResult {
    const startTime = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();

    const length = password ? password.length : 0;

    // 1. Character class analysis
    const characterAnalysis = EntropyAnalyzer.analyzeCharacterClasses(password || '');

    // 2. Shannon and Effective Entropy analysis
    const entropy = EntropyAnalyzer.calculateTheoreticalEntropy(password || '');

    // 3. Pattern Recognition (Keyboard, Sequences, Repetitions, Dates, Suffixes/Prefixes)
    const patterns = PatternMatcher.detectAllPatterns(password || '');

    // 4. Dictionary Word and Leet-Speak Recognition
    const dictMatches = DictionaryMatcher.findDictionaryMatches(password || '');
    patterns.push(...dictMatches);

    // 5. Breach status resolution
    const breachStatus: BreachStatusResult = options.breachStatus || {
      checked: false,
      breached: false,
      message: 'Local breach corpus check not performed.',
      riskLevel: 'NONE'
    };

    // 6. Multi-model Crack-time estimation
    const crackTime = CrackTimeEstimator.estimate(
      entropy,
      patterns,
      breachStatus.breached,
      options.attackRates
    );

    // 7. Composite score aggregation
    const compositeScore = ScoreAggregator.calculate(
      characterAnalysis,
      entropy,
      patterns,
      crackTime,
      breachStatus.breached,
      options.scoringWeights
    );

    // 8. Human-centered feedback generation
    const { actionableFeedback, recommendations } = FeedbackGenerator.generateFeedback(
      characterAnalysis,
      entropy,
      patterns,
      breachStatus.breached,
      compositeScore
    );

    const endTime = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();

    const latencyMs = Number((endTime - startTime).toFixed(2));

    return {
      timestamp: new Date().toISOString(),
      length,
      characterAnalysis,
      entropy,
      patterns,
      breachStatus,
      crackTime,
      compositeScore,
      actionableFeedback,
      recommendations,
      latencyMs
    };
  }
}
