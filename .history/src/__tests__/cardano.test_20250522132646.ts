import { jest, describe, it, expect } from '@jest/globals';
import {
  formatAikenContract,
  formatBlockInfo,
  formatTransactionInfo,
  getNetworkStats,
  DEFAULT_CARDANO_CONFIG,
  CardanoNodeConfig
} from '../cardano.js';

describe('Cardano Utils', () => {
  describe('formatAikenContract', () => {
    it('should format Aiken contract information correctly', () => {
      const contractData = {
        name: 'TestContract',
        description: 'A test contract',
        version: '1.0.0',
        validators: [
          { name: 'spend' },
          { name: 'mint' }
        ],
        parameters: [
          { name: 'owner', type: 'ByteArray' },
          { name: 'amount', type: 'Int' }
        ]
      };
      
      const result = formatAikenContract(contractData);
      
      expect(result).toContain('Contract Name: TestContract');
      expect(result).toContain('Description: A test contract');
      expect(result).toContain('Version: 1.0.0');
      expect(result).toContain('Validation Functions: spend, mint');
      expect(result).toContain('Parameters: owner: ByteArray, amount: Int');
    });

    it('should handle missing contract information', () => {
      const contractData = {};
      
      const result = formatAikenContract(contractData);
      
      expect(result).toContain('Contract Name: Unnamed');
      expect(result).toContain('Description: No description provided');
      expect(result).toContain('Version: Not specified');
      expect(result).toContain('Validation Functions: None specified');
      expect(result).toContain('Parameters: None specified');
    });
  });

  describe('formatBlockInfo', () => {
    it('should format block info correctly with standard fields', () => {
      const blockData = {
        hash: '1234567890abcdef',
        height: 123456,
        slot: 42000000,
        epoch: 200,
        time: 1621234567,
        size: 4096,
        tx_count: 10
      };
      
      const result = formatBlockInfo(blockData);
      
      expect(result).toContain('Block: 1234567890abcdef');
      expect(result).toContain('Height: 123456');
      expect(result).toContain('Slot: 42000000');
      expect(result).toContain('Epoch: 200');
      expect(result).toContain('Size: 4096 bytes');
      expect(result).toContain('Transactions: 10');
    });

    it('should handle alternative field names', () => {
      const blockData = {
        id: 'abcdef1234567890',
        number: 654321,
        slot: 50000000,
        epoch_no: 300,
        forgedAt: '2022-01-01T12:00:00Z',
        size: 8192,
        transactionsCount: 20
      };
      
      const result = formatBlockInfo(blockData);
      
      expect(result).toContain('Block: abcdef1234567890');
      expect(result).toContain('Height: 654321');
      expect(result).toContain('Slot: 50000000');
      expect(result).toContain('Epoch: 300');
      expect(result).toContain('Size: 8192 bytes');
      expect(result).toContain('Transactions: 20');
    });
  });

  describe('DEFAULT_CARDANO_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CARDANO_CONFIG).toHaveProperty('network', 'mainnet');
      expect(DEFAULT_CARDANO_CONFIG).toHaveProperty('networkMagic', 764824073);
      expect(DEFAULT_CARDANO_CONFIG).toHaveProperty('cliPath', 'cardano-cli');
      expect(DEFAULT_CARDANO_CONFIG).toHaveProperty('era', 'conway');
    });
  });
});
