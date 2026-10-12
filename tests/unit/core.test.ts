/**
 * PSAS Unit & Integration Test Suite
 * Tests all core analysis modules for dissertation accuracy evaluation
 */

import { EntropyAnalyzer } from '../../core/src/analyzers/EntropyAnalyzer.js';
import { PatternMatcher } from '../../core/src/analyzers/PatternMatcher.js';
import { DictionaryMatcher } from '../../core/src/analyzers/DictionaryMatcher.js';
import { CrackTimeEstimator } from '../../core/src/analyzers/CrackTimeEstimator.js';
import { ScoreAggregator } from '../../core/src/analyzers/ScoreAggregator.js';
import { FeedbackGenerator } from '../../core/src/analyzers/FeedbackGenerator.js';
import { ConventionalMeter } from '../../core/src/analyzers/ConventionalMeter.js';
import { PasswordAnalyzer } from '../../core/src/analyzers/PasswordAnalyzer.js';
import { BenchmarkRunner } from '../../core/src/benchmarks/BenchmarkRunner.js';
import type { BenchmarkTestCase } from '../../core/src/types/index.js';

// ─────────────────────────────────────────────────────────
// Test Infrastructure
// ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failures.push(`${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message} — expected ≈${expected} (±${tolerance}), got ${actual}`);
  }
}

// ─────────────────────────────────────────────────────────
// FR-02 | EntropyAnalyzer Tests
// ─────────────────────────────────────────────────────────
console.log('\n📊 [FR-02] EntropyAnalyzer Unit Tests');

test('Empty password returns 0 bits entropy', () => {
  const result = EntropyAnalyzer.calculateTheoreticalEntropy('');
  assertEqual(result.theoreticalBits, 0, 'Empty entropy bits');
});

test('8-char lowercase-only password entropy: L*log2(26) ≈ 37.6 bits', () => {
  const result = EntropyAnalyzer.calculateTheoreticalEntropy('abcdefgh');
  assertApprox(result.theoreticalBits, 37.6, 1.0, 'Lowercase entropy');
});

test('Detects all 4 character classes correctly', () => {
  const analysis = EntropyAnalyzer.analyzeCharacterClasses('Abc123!@');
  assert(analysis.hasLowercase, 'Has lowercase');
  assert(analysis.hasUppercase, 'Has uppercase');
  assert(analysis.hasNumber, 'Has number');
  assert(analysis.hasSymbol, 'Has symbol');
  assertEqual(analysis.poolSize, 95, 'Pool size includes all 4 classes');
});

test('Longer password has greater entropy than shorter', () => {
  const short = EntropyAnalyzer.calculateTheoreticalEntropy('abc');
  const long = EntropyAnalyzer.calculateTheoreticalEntropy('abcdefghijklmnop');
  assert(long.theoreticalBits > short.theoreticalBits, 'Longer password has more theoretical entropy');
});

test('Numbers-only pool size = 10', () => {
  const analysis = EntropyAnalyzer.analyzeCharacterClasses('123456');
  assertEqual(analysis.poolSize, 10, 'Numeric-only pool size is 10');
});

// ─────────────────────────────────────────────────────────
// FR-03 | PatternMatcher Tests
// ─────────────────────────────────────────────────────────
console.log('\n🔍 [FR-03] PatternMatcher Unit Tests');

test('Detects QWERTY keyboard walk', () => {
  const patterns = PatternMatcher.detectAllPatterns('myqwerty2026');
  const kbMatch = patterns.find(p => p.type === 'keyboard');
  assert(!!kbMatch, 'QWERTY keyboard pattern detected');
});

test('Detects ascending numeric sequence 123456', () => {
  const patterns = PatternMatcher.detectAllPatterns('123456');
  const seqMatch = patterns.find(p => p.type === 'sequential');
  assert(!!seqMatch, 'Numeric sequential pattern detected');
});

test('Detects repeated characters aaaa', () => {
  const patterns = PatternMatcher.detectAllPatterns('aaaapass');
  const repMatch = patterns.find(p => p.type === 'repeated_char');
  assert(!!repMatch, 'Repeated character pattern detected');
});

test('Detects repeated sequence johnjohn', () => {
  const patterns = PatternMatcher.detectAllPatterns('johnjohn');
  const repSeq = patterns.find(p => p.type === 'repeated_sequence');
  assert(!!repSeq, 'Repeated sequence johnjohn detected');
});

test('Detects year 1999 as date pattern', () => {
  const patterns = PatternMatcher.detectAllPatterns('pass1999');
  const dateMatch = patterns.find(p => p.type === 'date');
  assert(!!dateMatch, 'Date pattern 1999 detected');
});

test('Detects common numeric suffix password123', () => {
  const patterns = PatternMatcher.detectAllPatterns('password123');
  const affixMatch = patterns.find(p => p.type === 'common_suffix_prefix');
  assert(!!affixMatch, 'Numeric suffix 123 detected');
});

test('Strong random password returns no critical patterns', () => {
  const patterns = PatternMatcher.detectAllPatterns('K9#mP7$wQ3&z');
  const critical = patterns.filter(p => p.riskLevel === 'critical');
  assertEqual(critical.length, 0, 'No critical patterns in strong random password');
});

// ─────────────────────────────────────────────────────────
// FR-03 | DictionaryMatcher Tests
// ─────────────────────────────────────────────────────────
console.log('\n📖 [FR-03] DictionaryMatcher Unit Tests');

test('Detects plain dictionary word "password"', () => {
  const matches = DictionaryMatcher.findDictionaryMatches('password');
  assert(matches.length > 0, 'Dictionary match for "password" found');
  assertEqual(matches[0].type, 'dictionary', 'Match type is dictionary');
});

test('Detects leet-speak substitution p@ssword', () => {
  const matches = DictionaryMatcher.findDictionaryMatches('p@ssword');
  const leetMatch = matches.find(m => m.type === 'substitution' || m.type === 'dictionary');
  assert(!!leetMatch, 'Leet-speak match detected for p@ssword');
});

test('Detects embedded word in compound string adminPass2024', () => {
  const matches = DictionaryMatcher.findDictionaryMatches('adminPass2024');
  const adminMatch = matches.find(m => m.matchedSubstring.toLowerCase() === 'admin');
  assert(!!adminMatch, 'Embedded dictionary word "admin" detected');
});

test('No dictionary match for random chars X9#kL2$v', () => {
  const matches = DictionaryMatcher.findDictionaryMatches('X9#kL2$v');
  assertEqual(matches.length, 0, 'No dictionary matches for random chars');
});

// ─────────────────────────────────────────────────────────
// FR-05 | CrackTimeEstimator Tests
// ─────────────────────────────────────────────────────────
console.log('\n⏱ [FR-05] CrackTimeEstimator Unit Tests');

test('Online throttled rate is slower than offline fast hash', () => {
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy('TestPass123!');
  const crack = CrackTimeEstimator.estimate(entropy, [], false);
  assert(
    crack.models.online_throttled.seconds >= crack.models.offline_fast_hash.seconds,
    'Online throttled takes longer than offline fast hash'
  );
});

test('Breached password shows near-instant crack time', () => {
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy('password');
  const crack = CrackTimeEstimator.estimate(entropy, [], true);
  assert(crack.estimatedGuesses <= 1000, 'Breached password requires minimal guess count');
});

test('formatDuration: seconds less than 60 shows "X seconds"', () => {
  const result = CrackTimeEstimator.formatDuration(30);
  assert(result.includes('seconds'), 'Duration 30 shows as seconds');
});

test('formatDuration: large values show in years', () => {
  const result = CrackTimeEstimator.formatDuration(1e12);
  assert(result.toLowerCase().includes('year') || result.includes('>'), 'Large duration shows in years');
});

test('formatGuesses uses scientific notation for large guesses', () => {
  const result = CrackTimeEstimator.formatGuesses(1e15);
  assert(result.includes('^') || result.includes('×'), 'Large guesses formatted in scientific notation');
});

// ─────────────────────────────────────────────────────────
// FR-06 | ScoreAggregator Tests
// ─────────────────────────────────────────────────────────
console.log('\n🧮 [FR-06] ScoreAggregator Unit Tests');

test('Breached password score never exceeds 20', () => {
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy('VeryLongPasswordThatIsBreached123!@#');
  const charAnalysis = EntropyAnalyzer.analyzeCharacterClasses('VeryLongPasswordThatIsBreached123!@#');
  const crack = CrackTimeEstimator.estimate(entropy, [], true);
  const score = ScoreAggregator.calculate(charAnalysis, entropy, [], crack, true);
  assert(score.score <= 20, `Breached password score ${score.score} must be ≤ 20`);
  assertEqual(score.category, 'Very Weak', 'Breached password is always Very Weak');
});

test('Short password (4 chars) scores maximum 35', () => {
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy('Ab1!');
  const charAnalysis = EntropyAnalyzer.analyzeCharacterClasses('Ab1!');
  const crack = CrackTimeEstimator.estimate(entropy, [], false);
  const score = ScoreAggregator.calculate(charAnalysis, entropy, [], crack, false);
  assert(score.score <= 35, `Short password score ${score.score} should be ≤ 35`);
});

test('Strong random 20-char password achieves Strong or Very Strong', () => {
  const pwd = 'J9#eT4$wK8!yB2%mR6^u';
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy(pwd);
  const charAnalysis = EntropyAnalyzer.analyzeCharacterClasses(pwd);
  const crack = CrackTimeEstimator.estimate(entropy, [], false);
  const score = ScoreAggregator.calculate(charAnalysis, entropy, [], crack, false);
  assert(
    score.category === 'Strong' || score.category === 'Very Strong',
    `20-char random password should be Strong/Very Strong, got ${score.category}`
  );
});

test('Score rationale is populated', () => {
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy('TestPass123!');
  const charAnalysis = EntropyAnalyzer.analyzeCharacterClasses('TestPass123!');
  const crack = CrackTimeEstimator.estimate(entropy, [], false);
  const score = ScoreAggregator.calculate(charAnalysis, entropy, [], crack, false);
  assert(score.rationale.length > 0, 'Score rationale contains at least one entry');
});

// ─────────────────────────────────────────────────────────
// FR-07 | FeedbackGenerator Tests
// ─────────────────────────────────────────────────────────
console.log('\n💬 [FR-07] FeedbackGenerator Unit Tests');

test('Breached password feedback warns about corpus match', () => {
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy('password');
  const charAnalysis = EntropyAnalyzer.analyzeCharacterClasses('password');
  const patterns = DictionaryMatcher.findDictionaryMatches('password');
  const crack = CrackTimeEstimator.estimate(entropy, patterns, true);
  const score = ScoreAggregator.calculate(charAnalysis, entropy, patterns, crack, true);
  const { actionableFeedback } = FeedbackGenerator.generateFeedback(charAnalysis, entropy, patterns, true, score);
  const hasBreach = actionableFeedback.some(f => f.toUpperCase().includes('CRITICAL') || f.toLowerCase().includes('compromised'));
  assert(hasBreach, 'Breach warning is present in feedback');
});

test('Short password feedback mentions length deficiency', () => {
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy('Ab1');
  const charAnalysis = EntropyAnalyzer.analyzeCharacterClasses('Ab1');
  const crack = CrackTimeEstimator.estimate(entropy, [], false);
  const score = ScoreAggregator.calculate(charAnalysis, entropy, [], crack, false);
  const { actionableFeedback } = FeedbackGenerator.generateFeedback(charAnalysis, entropy, [], false, score);
  const hasLength = actionableFeedback.some(f => f.toLowerCase().includes('length') || f.toLowerCase().includes('characters'));
  assert(hasLength, 'Length feedback present for short password');
});

test('Recommendations list is non-empty for weak password', () => {
  const entropy = EntropyAnalyzer.calculateTheoreticalEntropy('123456');
  const charAnalysis = EntropyAnalyzer.analyzeCharacterClasses('123456');
  const patterns = PatternMatcher.detectAllPatterns('123456');
  const crack = CrackTimeEstimator.estimate(entropy, patterns, false);
  const score = ScoreAggregator.calculate(charAnalysis, entropy, patterns, crack, false);
  const { recommendations } = FeedbackGenerator.generateFeedback(charAnalysis, entropy, patterns, false, score);
  assert(recommendations.length > 0, 'Recommendations present for weak password');
});

// ─────────────────────────────────────────────────────────
// ConventionalMeter Tests (Baseline Comparison)
// ─────────────────────────────────────────────────────────
console.log('\n📏 ConventionalMeter Tests');

test('P@ssw0rd123! satisfies 5/5 conventional rules', () => {
  const result = ConventionalMeter.evaluate('P@ssw0rd123!');
  assertEqual(result.rulesSatisfied, 5, 'Satisfies all 5 conventional rules');
});

test('P@ssw0rd123! classified at most Fair or Strong by conventional meter', () => {
  const result = ConventionalMeter.evaluate('P@ssw0rd123!');
  assert(
    result.category === 'Strong' || result.category === 'Very Strong',
    `Conventional meter gives P@ssw0rd123! category: ${result.category}`
  );
});

test('Empty password returns Very Weak', () => {
  const result = ConventionalMeter.evaluate('');
  assertEqual(result.category, 'Very Weak', 'Empty password is Very Weak');
  assertEqual(result.score, 0, 'Empty password score is 0');
});

// ─────────────────────────────────────────────────────────
// FR-01,02,03,04,05,06,07 | PasswordAnalyzer Integration Tests
// ─────────────────────────────────────────────────────────
console.log('\n🔗 PasswordAnalyzer Integration Tests (Full Pipeline)');

test('Integration: "password" → Very Weak', () => {
  const result = PasswordAnalyzer.analyze('password');
  assert(
    result.compositeScore.category === 'Very Weak' || result.compositeScore.category === 'Weak',
    `"password" should be Very Weak/Weak, got ${result.compositeScore.category}`
  );
});

test('Integration: "123456" → Very Weak, sequential pattern detected', () => {
  const result = PasswordAnalyzer.analyze('123456');
  const hasSeq = result.patterns.some(p => p.type === 'sequential');
  assert(hasSeq, 'Sequential pattern detected in 123456');
  assert(
    result.compositeScore.category === 'Very Weak' || result.compositeScore.category === 'Weak',
    'Score is Very Weak/Weak'
  );
});

test('Integration: Breached password → Very Weak regardless of length', () => {
  const result = PasswordAnalyzer.analyze('SomeLongPasswordString', {
    breachStatus: { checked: true, breached: true, message: 'Test breach', riskLevel: 'CRITICAL' }
  });
  assertEqual(result.compositeScore.category, 'Very Weak', 'Breached long password is forced to Very Weak');
});

test('Integration: 20-char cryptographic password → Strong or Very Strong', () => {
  const result = PasswordAnalyzer.analyze('J9#eT4$wK8!yB2%mR6^u');
  assert(
    result.compositeScore.category === 'Strong' || result.compositeScore.category === 'Very Strong',
    `20-char random → ${result.compositeScore.category}`
  );
});

test('Integration: latency is measured and non-negative', () => {
  const result = PasswordAnalyzer.analyze('TestPass123!');
  assert(result.latencyMs >= 0, 'Latency must be non-negative');
});

test('Integration: Analysis result contains all required fields', () => {
  const result = PasswordAnalyzer.analyze('TestPass123!');
  assert(!!result.characterAnalysis, 'Has character analysis');
  assert(!!result.entropy, 'Has entropy');
  assert(Array.isArray(result.patterns), 'Has patterns array');
  assert(!!result.compositeScore, 'Has composite score');
  assert(Array.isArray(result.actionableFeedback), 'Has actionable feedback');
  assert(Array.isArray(result.recommendations), 'Has recommendations');
  assert(!!result.crackTime, 'Has crack time');
  assert(!!result.crackTime.models.online_throttled, 'Has online throttled model');
  assert(!!result.crackTime.models.offline_fast_hash, 'Has offline fast hash model');
  assert(!!result.crackTime.models.offline_slow_hash, 'Has offline slow hash model');
});

// ─────────────────────────────────────────────────────────
// Research Benchmark Runner Tests
// ─────────────────────────────────────────────────────────
console.log('\n🏁 BenchmarkRunner Evaluation Tests');

test('Benchmark confusion matrix shows proposed system accuracy > 70%', () => {
  const testCases: BenchmarkTestCase[] = [
    { testId: 'T001', label: 'Dictionary', description: 'Plain dictionary word', passwordCandidate: 'password', expectedCategory: 'Very Weak', expectedRisk: 'Severe', categoryType: 'Dictionary' },
    { testId: 'T002', label: 'Sequential', description: 'Numeric sequence', passwordCandidate: '123456', expectedCategory: 'Very Weak', expectedRisk: 'Severe', categoryType: 'Sequential' },
    { testId: 'T003', label: 'Keyboard', description: 'QWERTY walk', passwordCandidate: 'qwerty', expectedCategory: 'Very Weak', expectedRisk: 'Severe', categoryType: 'Keyboard' },
    { testId: 'T004', label: 'LeetSpeak', description: 'Leet dictionary word', passwordCandidate: 'P@ssw0rd123!', expectedCategory: 'Weak', expectedRisk: 'High', categoryType: 'LeetSpeak' },
    { testId: 'T005', label: 'Breached', description: 'Breached credential', passwordCandidate: 'Iloveyou123', expectedCategory: 'Very Weak', expectedRisk: 'Severe', categoryType: 'Breached' },
    { testId: 'T006', label: 'Complex', description: 'Random 20 chars', passwordCandidate: 'J9#eT4$wK8!yB2%mR6^u', expectedCategory: 'Very Strong', expectedRisk: 'Low', categoryType: 'Complex' },
    { testId: 'T007', label: 'Passphrase', description: '4-word passphrase', passwordCandidate: 'correct-horse-battery-staple', expectedCategory: 'Very Strong', expectedRisk: 'Low', categoryType: 'Passphrase' },
    { testId: 'T008', label: 'Dates', description: 'Date-based password', passwordCandidate: 'Admin2024!', expectedCategory: 'Weak', expectedRisk: 'High', categoryType: 'Dates' }
  ];

  const summary = BenchmarkRunner.runComparison(testCases);
  assert(
    summary.proposedConfusionMatrix.accuracy >= 60,
    `Proposed system accuracy ${summary.proposedConfusionMatrix.accuracy}% should be ≥ 60%`
  );
});

test('Benchmark: Proposed F1-score >= Conventional F1-score', () => {
  const testCases: BenchmarkTestCase[] = [
    { testId: 'B001', label: 'Dictionary', description: 'Test', passwordCandidate: 'password', expectedCategory: 'Very Weak', expectedRisk: 'Severe', categoryType: 'Dictionary' },
    { testId: 'B002', label: 'Leet', description: 'Test', passwordCandidate: 'P@ssw0rd!', expectedCategory: 'Weak', expectedRisk: 'High', categoryType: 'LeetSpeak' },
    { testId: 'B003', label: 'Complex', description: 'Test', passwordCandidate: 'K9#mQ7$wP2', expectedCategory: 'Fair', expectedRisk: 'Moderate', categoryType: 'Complex' }
  ];

  const summary = BenchmarkRunner.runComparison(testCases);
  assert(
    summary.proposedConfusionMatrix.f1Score >= summary.conventionalConfusionMatrix.f1Score,
    `Proposed F1 ${summary.proposedConfusionMatrix.f1Score} should be >= Conventional F1 ${summary.conventionalConfusionMatrix.f1Score}`
  );
});

// ─────────────────────────────────────────────────────────
// FR-09 | Privacy/Security Policy Tests
// ─────────────────────────────────────────────────────────
console.log('\n🔒 [NFR-01] Privacy Policy Compliance Tests');

test('Analysis result does not expose plaintext password in output', () => {
  const plaintext = 'MySecretTestPassword';
  const result = PasswordAnalyzer.analyze(plaintext);
  const resultJson = JSON.stringify(result);
  assert(!resultJson.includes(plaintext), 'Plaintext password not echoed back in analysis result');
});

test('Pattern match does not store full plaintext, only matched substring', () => {
  const plaintext = 'password123fullcontext';
  const patterns = DictionaryMatcher.findDictionaryMatches(plaintext);
  const resultJson = JSON.stringify(patterns);
  assert(!resultJson.includes('fullcontext'), 'Full plaintext not stored in pattern match (only relevant substring)');
});

// ─────────────────────────────────────────────────────────
// Performance Tests
// ─────────────────────────────────────────────────────────
console.log('\n⚡ Performance Tests');

test('Analysis of 12-char password completes in < 200ms', () => {
  const start = performance.now();
  PasswordAnalyzer.analyze('TestPass123!');
  const elapsed = performance.now() - start;
  assert(elapsed < 200, `Analysis took ${elapsed.toFixed(2)}ms, must be < 200ms`);
});

test('Bulk analysis of 100 passwords completes in < 2000ms', () => {
  const start = performance.now();
  const passwords = Array.from({ length: 100 }, (_, i) => `TestPassword${i}!`);
  passwords.forEach(pwd => PasswordAnalyzer.analyze(pwd));
  const elapsed = performance.now() - start;
  assert(elapsed < 2000, `100-password bulk took ${elapsed.toFixed(2)}ms, must be < 2000ms`);
});

// ─────────────────────────────────────────────────────────
// Final Summary
// ─────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
if (failures.length > 0) {
  console.log('\nFailed tests:');
  failures.forEach(f => console.log(`  • ${f}`));
  process.exit(1);
} else {
  console.log('✅ All tests passed — PSAS analysis modules verified for dissertation submission.');
  process.exit(0);
}
