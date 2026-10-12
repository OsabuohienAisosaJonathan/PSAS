import { AttackRatesConfig, CrackTimeEstimate, PatternMatch, TheoreticalEntropyResult } from '../types/index.js';

export const DEFAULT_ATTACK_RATES: AttackRatesConfig = {
  onlineThrottledRate: 10,              // 10 guesses/second (network rate limits, lockouts)
  offlineFastHashRate: 10_000_000_000, // 10^10 guesses/second (GPU cluster on MD5 / SHA-256)
  offlineSlowHashRate: 10_000          // 10^4 guesses/second (Bcrypt / Argon2id / Scrypt)
};

export class CrackTimeEstimator {
  /**
   * Formats seconds into clear, research-grade human readable units.
   */
  public static formatDuration(seconds: number): string {
    if (!isFinite(seconds) || seconds > 1e18) {
      return '> 100 billion years';
    }
    if (seconds < 1) {
      return '< 1 second (Instant)';
    }
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    }
    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${Math.round(minutes)} minutes`;
    }
    const hours = minutes / 60;
    if (hours < 24) {
      return `${Math.round(hours)} hours`;
    }
    const days = hours / 24;
    if (days < 365) {
      return `${Math.round(days)} days`;
    }
    const years = days / 365;
    if (years < 100) {
      return `${years.toFixed(1)} years`;
    }
    if (years < 10_000) {
      return `${Math.round(years).toLocaleString()} years`;
    }
    if (years < 1_000_000) {
      return `${(years / 1_000).toFixed(1)}k years`;
    }
    if (years < 1_000_000_000) {
      return `${(years / 1_000_000).toFixed(1)} million years`;
    }
    return `${(years / 1_000_000_000).toFixed(1)} billion years`;
  }

  /**
   * Formats scientific guess counts (e.g. 2.4 × 10^12).
   */
  public static formatGuesses(guesses: number): string {
    if (guesses <= 0) return '0';
    if (guesses < 1_000) return `${Math.round(guesses)}`;
    if (guesses < 1_000_000) return `${(guesses / 1000).toFixed(1)}k`;

    const log10 = Math.log10(guesses);
    const exponent = Math.floor(log10);
    const mantissa = guesses / Math.pow(10, exponent);

    return `${mantissa.toFixed(1)} × 10^${exponent}`;
  }

  /**
   * Estimates guess resistance and crack time across all three attacker models.
   */
  public static estimate(
    entropy: TheoreticalEntropyResult,
    patterns: PatternMatch[],
    isBreached: boolean,
    customRates: Partial<AttackRatesConfig> = {}
  ): CrackTimeEstimate {
    const rates: AttackRatesConfig = {
      ...DEFAULT_ATTACK_RATES,
      ...customRates
    };

    if (entropy.length === 0) {
      return {
        estimatedGuesses: 0,
        formattedGuesses: '0',
        log10Guesses: 0,
        models: {
          online_throttled: {
            name: 'Online Throttled',
            ratePerSecond: rates.onlineThrottledRate,
            seconds: 0,
            formattedTime: '0 seconds',
            description: 'Heavily rate-limited login interface (~10 attempts/s)'
          },
          offline_fast_hash: {
            name: 'Offline Fast Hash',
            ratePerSecond: rates.offlineFastHashRate,
            seconds: 0,
            formattedTime: '0 seconds',
            description: 'High-speed GPU rig cracking unsalted MD5 / SHA-256 (10B attempts/s)'
          },
          offline_slow_hash: {
            name: 'Offline Slow / Salted Hash',
            ratePerSecond: rates.offlineSlowHashRate,
            seconds: 0,
            formattedTime: '0 seconds',
            description: 'Modern salted password hashes using Argon2id / Bcrypt (10k attempts/s)'
          }
        },
        tooltipNote: 'Actual cracking time depends on attacker hardware, attack strategy, hashing algorithm, rate limits and other factors.'
      };
    }

    // Base guess count derived from effective Shannon entropy: 2^(effectiveBits)
    // Note: Average brute-force guesses to succeed is 2^(effectiveBits - 1)
    let guesses = Math.pow(2, Math.max(1, entropy.effectiveBits - 1));

    // Severe degradation if breached
    if (isBreached) {
      // If password is in breach corpus, attackers test it within first 1,000 guesses
      guesses = Math.min(guesses, 100);
    } else {
      // Pattern degradation: dictionary, keyboard walk, dates
      let totalPenaltyFactor = 1.0;
      for (const pattern of patterns) {
        if (pattern.type === 'dictionary') {
          totalPenaltyFactor *= 0.001; // Dictionary matches severely slash combinatorial space
        } else if (pattern.type === 'date') {
          totalPenaltyFactor *= 0.01;
        } else if (pattern.type === 'keyboard' || pattern.type === 'sequential') {
          totalPenaltyFactor *= 0.05;
        } else if (pattern.type === 'substitution') {
          totalPenaltyFactor *= 0.1;
        } else {
          totalPenaltyFactor *= 0.2;
        }
      }

      guesses = Math.max(10, guesses * Math.max(totalPenaltyFactor, 1e-12));
    }

    // Clamp safe finite numbers
    if (!isFinite(guesses)) {
      guesses = 1e24;
    }

    const onlineSeconds = guesses / rates.onlineThrottledRate;
    const fastHashSeconds = guesses / rates.offlineFastHashRate;
    const slowHashSeconds = guesses / rates.offlineSlowHashRate;

    const log10Guesses = Number(Math.log10(Math.max(1, guesses)).toFixed(2));

    return {
      estimatedGuesses: guesses,
      formattedGuesses: this.formatGuesses(guesses),
      log10Guesses,
      models: {
        online_throttled: {
          name: 'Online Throttled Attack',
          ratePerSecond: rates.onlineThrottledRate,
          seconds: onlineSeconds,
          formattedTime: this.formatDuration(onlineSeconds),
          description: `Rate-limited web login (${rates.onlineThrottledRate} guesses/sec)`
        },
        offline_fast_hash: {
          name: 'Offline Fast Hash Attack',
          ratePerSecond: rates.offlineFastHashRate,
          seconds: fastHashSeconds,
          formattedTime: this.formatDuration(fastHashSeconds),
          description: `Compromised database with MD5/SHA-family hashes (${(rates.offlineFastHashRate / 1e9).toFixed(0)}B guesses/sec)`
        },
        offline_slow_hash: {
          name: 'Offline Slow / Salted Hash Attack',
          ratePerSecond: rates.offlineSlowHashRate,
          seconds: slowHashSeconds,
          formattedTime: this.formatDuration(slowHashSeconds),
          description: `Key-stretched salted hashes like Argon2id / bcrypt (${rates.offlineSlowHashRate.toLocaleString()} guesses/sec)`
        }
      },
      tooltipNote: 'Actual cracking time depends on attacker hardware, attack strategy, hashing algorithm, rate limits and other factors.'
    };
  }
}
