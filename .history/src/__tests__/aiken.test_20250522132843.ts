import { describe, it, expect } from '@jest/globals';
import { isValidAikenSyntax, formatAikenCodeExplanation } from '../aiken.js';

describe('Aiken Utils', () => {
  describe('isValidAikenSyntax', () => {
    it('should return valid for correct Aiken code', () => {
      const validCode = `
validator {
  fn spend(datum: Data, redeemer: Data, context: Data) -> Bool {
    true
  }
}`;
      const result = isValidAikenSyntax(validCode);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should detect syntax errors in Aiken code', () => {
      const invalidCode = `
function spend(datum, redeemer, context) {
  return true;
}`;
      const result = isValidAikenSyntax(invalidCode);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('formatAikenCodeExplanation', () => {
    it('should format Aiken code with proper explanations', () => {
      const aikenCode = `
module Example

use aiken/hash
use aiken/list
use aiken/transaction/value

type Datum {
  owner: ByteArray,
}

validator {
  fn spend(datum: Datum, _redeemer: Data, ctx: ScriptContext) -> Bool {
    let Datum { owner } = datum
    owner == ctx.transaction.inputs[0].output.address.payment_credential
  }
}`;
      const result = formatAikenCodeExplanation(aikenCode);
      expect(result).toContain('Module:');
      expect(result).toContain('Imports:');
      expect(result).toContain('Type Definitions:');
      expect(result).toContain('Validators:');
      expect(result).toContain('Full Code:');
    });
  });
});
