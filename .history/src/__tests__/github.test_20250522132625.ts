import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Octokit } from 'octokit';

// Mock Octokit
jest.mock('octokit', () => {
  const mockOctokit = {
    rest: {
      users: {
        getAuthenticated: jest.fn(),
      },
      search: {
        repos: jest.fn(),
      },
      issues: {
        listForRepo: jest.fn(),
      },
      repos: {
        getContent: jest.fn(),
      },
    },
  };
  
  return { Octokit: jest.fn().mockImplementation(() => mockOctokit) };
});

// Import functions that will use the mocked Octokit
import { validateGitHubToken, formatRepoInfo, formatIssue } from '../index.js';

describe('GitHub Utils', () => {
  let mockOctokit: any;
  
  beforeEach(() => {
    mockOctokit = new Octokit();
    jest.clearAllMocks();
  });

  describe('validateGitHubToken', () => {
    it('should return true for valid token', async () => {
      mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
        data: { login: 'testuser' }
      });
      
      const result = await validateGitHubToken('valid_token');
      expect(result).toBe(true);
      expect(Octokit).toHaveBeenCalledWith({ auth: 'valid_token' });
    });
    
    it('should return false for invalid token', async () => {
      mockOctokit.rest.users.getAuthenticated.mockRejectedValue(
        new Error('Invalid token')
      );
      
      const result = await validateGitHubToken('invalid_token');
      expect(result).toBe(false);
    });
  });

  describe('formatRepoInfo', () => {
    it('should format repository information correctly', () => {
      const repo = {
        full_name: 'user/repo',
        description: 'Test repository',
        language: 'TypeScript',
        stargazers_count: 100,
        forks_count: 50,
        open_issues_count: 10,
        created_at: '2022-01-01T00:00:00Z',
        updated_at: '2022-06-01T00:00:00Z',
        clone_url: 'https://github.com/user/repo.git'
      };
      
      const result = formatRepoInfo(repo);
      
      expect(result).toContain('Repository: user/repo');
      expect(result).toContain('Description: Test repository');
      expect(result).toContain('Language: TypeScript');
      expect(result).toContain('Stars: 100');
      expect(result).toContain('Forks: 50');
      expect(result).toContain('Open Issues: 10');
      expect(result).toContain('Clone URL: https://github.com/user/repo.git');
    });

    it('should handle missing optional repository information', () => {
      const repo = {
        full_name: 'user/repo',
        description: null,
        language: null,
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        created_at: '2022-01-01T00:00:00Z',
        updated_at: '2022-01-01T00:00:00Z',
        clone_url: 'https://github.com/user/repo.git'
      };
      
      const result = formatRepoInfo(repo);
      
      expect(result).toContain('Repository: user/repo');
      expect(result).toContain('Description: No description provided');
      expect(result).toContain('Language: Not specified');
      expect(result).toContain('Stars: 0');
      expect(result).toContain('Forks: 0');
      expect(result).toContain('Open Issues: 0');
    });
  });

  describe('formatIssue', () => {
    it('should format issue information correctly with body', () => {
      const issue = {
        number: 123,
        title: 'Test issue',
        state: 'open',
        created_at: '2022-01-01T00:00:00Z',
        user: { login: 'testuser' },
        comments: 5,
        body: 'This is a test issue description'
      };
      
      const result = formatIssue(issue);
      
      expect(result).toContain('Issue #123: Test issue');
      expect(result).toContain('State: open');
      expect(result).toContain('by testuser');
      expect(result).toContain('Comments: 5');
      expect(result).toContain('Description:\nThis is a test issue description');
    });

    it('should format issue information correctly without body', () => {
      const issue = {
        number: 456,
        title: 'Another issue',
        state: 'closed',
        created_at: '2022-02-01T00:00:00Z',
        user: { login: 'anotheruser' },
        comments: 0,
        body: null
      };
      
      const result = formatIssue(issue);
      
      expect(result).toContain('Issue #456: Another issue');
      expect(result).toContain('State: closed');
      expect(result).toContain('by anotheruser');
      expect(result).toContain('Comments: 0');
      expect(result).not.toContain('Description:');
    });
  });
});
