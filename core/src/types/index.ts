export type StrengthCategory = 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';

export type AttackerModel = 'online_throttled' | 'offline_fast_hash' | 'offline_slow_hash';

export interface CharacterClassAnalysis {
  lowercaseCount: number;
  uppercaseCount: number;
  numberCount: number;
  symbolCount: number;
  poolSize: number;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export interface TheoreticalEntropyResult {
  length: number;
  poolSize: number;
  theoreticalBits: number;
  effectiveBits: number;
  entropyPerChar: number;
  explanation: string;
}

export type PatternType =
  | 'dictionary'
  | 'keyboard'
  | 'sequential'
  | 'repeated_char'
  | 'repeated_sequence'
  | 'date'
  | 'substitution'
  | 'common_suffix_prefix';

export type PatternRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PatternMatch {
  id: string;
  type: PatternType;
  patternName: string;
  matchedSubstring: string;
  startIndex: number;
  length: number;
  explanation: string;
  penalty: number;
  riskLevel: PatternRiskLevel;
}

export interface AttackerModelRate {
  name: string;
  ratePerSecond: number;
  seconds: number;
  formattedTime: string;
  description: string;
}

export interface CrackTimeEstimate {
  estimatedGuesses: number;
  formattedGuesses: string;
  log10Guesses: number;
  models: {
    online_throttled: AttackerModelRate;
    offline_fast_hash: AttackerModelRate;
    offline_slow_hash: AttackerModelRate;
  };
  tooltipNote: string;
}

export interface ScoreComponentBreakdown {
  entropyScore: number;         // 0 - 35
  lengthBonus: number;          // 0 - 20
  characterVarietyScore: number;// 0 - 15
  patternPenalty: number;       // deducted
  dictionaryPenalty: number;    // deducted
  breachPenalty: number;        // deducted
  finalRawScore: number;
}

export interface CompositeScoreResult {
  score: number; // 0 to 100
  category: StrengthCategory;
  components: ScoreComponentBreakdown;
  rationale: string[];
}

export interface BreachStatusResult {
  checked: boolean;
  breached: boolean;
  frequency?: number;
  source?: string;
  message: string;
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PasswordAnalysisResult {
  timestamp: string;
  length: number;
  characterAnalysis: CharacterClassAnalysis;
  entropy: TheoreticalEntropyResult;
  patterns: PatternMatch[];
  breachStatus: BreachStatusResult;
  crackTime: CrackTimeEstimate;
  compositeScore: CompositeScoreResult;
  actionableFeedback: string[];
  recommendations: string[];
  latencyMs: number;
}

export interface ConventionalMeterResult {
  length: number;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  score: number; // 0 - 100
  category: StrengthCategory;
  rulesSatisfied: number;
  totalRules: number;
  explanation: string;
}

export interface BenchmarkTestCase {
  testId: string;
  label: string;
  description: string;
  passwordCandidate: string; // Used only for automated testing
  expectedCategory: StrengthCategory;
  expectedRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  categoryType: 'Dictionary' | 'LeetSpeak' | 'Sequential' | 'Keyboard' | 'Dates' | 'Complex' | 'Passphrase' | 'Breached';
}

export interface ConfusionMatrix {
  truePositive: number;  // Weak/Very Weak correctly identified as Weak/Very Weak
  falsePositive: number; // Strong classified as Weak
  trueNegative: number;  // Strong/Very Strong correctly identified
  falseNegative: number; // Weak classified as Strong (Critical Security Risk!)
  total: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface BenchmarkComparisonSummary {
  totalEvaluated: number;
  proposedConfusionMatrix: ConfusionMatrix;
  conventionalConfusionMatrix: ConfusionMatrix;
  observations: string[];
}

export interface ScoringWeightsConfig {
  entropyWeight: number;
  lengthBonusWeight: number;
  varietyWeight: number;
  patternPenaltyMultiplier: number;
  dictionaryPenaltyMultiplier: number;
  breachPenaltyFixed: number;
  thresholdVeryWeak: number;
  thresholdWeak: number;
  thresholdFair: number;
  thresholdStrong: number;
}

export interface AttackRatesConfig {
  onlineThrottledRate: number; // e.g. 10 guesses/sec
  offlineFastHashRate: number; // e.g. 10^10 guesses/sec (10,000,000,000)
  offlineSlowHashRate: number; // e.g. 10^4 guesses/sec (10,000)
}
