import { 
  isCardanoNodeRunning,
  getNodeStatus,
  generateKeys,
  getTransactionInfo,
  getAddressInfo
} from '../cardano-node.js';
import * as childProcess from 'child_process';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('Cardano Node Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isCardanoNodeRunning', () => {
    it('should return true when node is running', async () => {
      // Mock successful execution
      (childProcess.exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'Cardano node status: running' });
      });

      const result = await isCardanoNodeRunning({ socketPath: '/tmp/node.socket' });
      expect(result).toBe(true);
    });

    it('should return false when node is not running', async () => {
      // Mock failed execution
      (childProcess.exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(new Error('Failed to connect'), null);
      });

      const result = await isCardanoNodeRunning({ socketPath: '/tmp/node.socket' });
      expect(result).toBe(false);
    });
  });

  describe('getNodeStatus', () => {
    it('should return node status when successful', async () => {
      const mockNodeStatus = {
        syncProgress: '99.8%',
        blockHeight: 123456,
        epoch: 200,
        slot: 42000000,
        networkName: 'testnet'
      };

      // Mock successful execution
      (childProcess.exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: JSON.stringify(mockNodeStatus) });
      });

      const result = await getNodeStatus({ 
        socketPath: '/tmp/node.socket',
        network: 'testnet' 
      });
      
      expect(result).toEqual(mockNodeStatus);
    });

    it('should handle errors gracefully', async () => {
      // Mock failed execution
      (childProcess.exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(new Error('Failed to get node status'), null);
      });

      const result = await getNodeStatus({ 
        socketPath: '/tmp/node.socket',
        network: 'testnet' 
      });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Failed to get node status');
    });
  });

  describe('generateKeys', () => {
    it('should generate payment keys when requested', async () => {
      const mockKeysOutput = {
        vkey: 'abc123',
        skey: 'def456',
        address: 'addr_test123'
      };

      // Mock successful execution
      (childProcess.exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: JSON.stringify(mockKeysOutput) });
      });

      const result = await generateKeys({ 
        type: 'payment',
        network: 'testnet' 
      });
      
      expect(result).toEqual(mockKeysOutput);
      expect(childProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('payment'),
        expect.any(Function)
      );
    });

    it('should generate stake keys when requested', async () => {
      const mockKeysOutput = {
        vkey: 'stake_abc123',
        skey: 'stake_def456',
        address: 'stake_addr_test123'
      };

      // Mock successful execution
      (childProcess.exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: JSON.stringify(mockKeysOutput) });
      });

      const result = await generateKeys({ 
        type: 'stake',
        network: 'testnet' 
      });
      
      expect(result).toEqual(mockKeysOutput);
      expect(childProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('stake'),
        expect.any(Function)
      );
    });
  });
});
