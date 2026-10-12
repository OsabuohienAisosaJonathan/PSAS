import { CharacterClassAnalysis, TheoreticalEntropyResult } from '../types/index.js';

export class EntropyAnalyzer {
  /**
   * Evaluates character distribution and active character pools.
   */
  public static analyzeCharacterClasses(password: string): CharacterClassAnalysis {
    let lowercaseCount = 0;
    let uppercaseCount = 0;
    let numberCount = 0;
    let symbolCount = 0;

    for (let i = 0; i < password.length; i++) {
      const char = password[i];
      const code = char.charCodeAt(0);

      if (code >= 97 && code <= 122) {
        lowercaseCount++;
      } else if (code >= 65 && code <= 90) {
        uppercaseCount++;
      } else if (code >= 48 && code <= 57) {
        numberCount++;
      } else {
        // Standard ASCII punctuation / symbols or extended unicode
        symbolCount++;
      }
    }

    let poolSize = 0;
    if (lowercaseCount > 0) poolSize += 26;
    if (uppercaseCount > 0) poolSize += 26;
    if (numberCount > 0) poolSize += 10;
    if (symbolCount > 0) poolSize += 33;

    return {
      lowercaseCount,
      uppercaseCount,
      numberCount,
      symbolCount,
      poolSize: Math.max(poolSize, 0),
      hasLowercase: lowercaseCount > 0,
      hasUppercase: uppercaseCount > 0,
      hasNumber: numberCount > 0,
      hasSymbol: symbolCount > 0
    };
  }

  /**
   * Calculates Shannon theoretical information entropy:
   * H = L * log2(N)
   * where L = password length, N = character pool size
   */
  public static calculateTheoreticalEntropy(password: string): TheoreticalEntropyResult {
    const length = password.length;
    if (length === 0) {
      return {
        length: 0,
        poolSize: 0,
        theoreticalBits: 0,
        effectiveBits: 0,
        entropyPerChar: 0,
        explanation: 'Empty candidate input contains 0 bits of information entropy.'
      };
    }

    const charAnalysis = this.analyzeCharacterClasses(password);
    const poolSize = Math.max(charAnalysis.poolSize, 1);
    
    // Shannon theoretical entropy formula
    const theoreticalBits = length * (Math.log2(poolSize));
    const entropyPerChar = theoreticalBits / length;

    // Effective entropy estimation accounting for human cognitive biases
    // (e.g. capitalizing first letter, single digit at end, common character repetition)
    let humanBiasDiscount = 0;

    // First letter capitalized discount
    if (charAnalysis.uppercaseCount === 1 && /^[A-Z]/.test(password)) {
      humanBiasDiscount += 3.5;
    }

    // Trailing numbers discount
    if (charAnalysis.numberCount > 0 && /[0-9]+$/.test(password)) {
      humanBiasDiscount += 3.0;
    }

    // Single trailing symbol discount (e.g. "Password123!")
    if (charAnalysis.symbolCount === 1 && /[!@#$%^&*()_+=\-[\]{}|;:,.<>?]$/.test(password)) {
      humanBiasDiscount += 2.5;
    }

    // Repetition discount
    const uniqueChars = new Set(password).size;
    const uniquenessRatio = uniqueChars / length;
    if (uniquenessRatio < 0.6) {
      humanBiasDiscount += (1 - uniquenessRatio) * 15;
    }

    const effectiveBits = Math.max(0, Number((theoreticalBits - humanBiasDiscount).toFixed(2)));

    const explanation = `Calculated across ${length} characters drawn from a theoretical pool of ${poolSize} possible characters. ` +
      `Theoretical capacity is ${theoreticalBits.toFixed(1)} bits; however, human generation patterns typically reduce ` +
      `effective guess entropy to approximately ${effectiveBits.toFixed(1)} bits.`;

    return {
      length,
      poolSize,
      theoreticalBits: Number(theoreticalBits.toFixed(2)),
      effectiveBits,
      entropyPerChar: Number(entropyPerChar.toFixed(2)),
      explanation
    };
  }
}
