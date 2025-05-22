// Aiken-specific functionality for the GitHub MCP Server

import axios from 'axios';
import { Octokit } from 'octokit';

// Default Aiken repositories for documentation and examples
const AIKEN_REPO = 'aiken-lang/aiken';
const AIKEN_STDLIB_REPO = 'aiken-lang/stdlib';
const AIKEN_EXAMPLES_REPO = 'aiken-lang/examples';

// Documentation sections
export const AIKEN_DOCS_SECTIONS = [
  'installation',
  'language-tour',
  'stdlib',
  'type-system',
  'pattern-matching',
  'validation',
  'compiler',
  'deployment',
  'testing'
];

// Helper function to get Aiken documentation file content
export async function getAikenDocumentation(section: string, token?: string): Promise<string> {
  try {
    const octokit = token ? new Octokit({ auth: token }) : new Octokit();

    // Normalize the section name
    const normalizedSection = section.toLowerCase().replace(/\s+/g, '-');

    // Try to find the relevant documentation file
    let path = `docs/getting-started/${normalizedSection}.md`;

    // For stdlib, look in a different location
    if (normalizedSection === 'stdlib') {
      path = 'docs/stdlib.md';
    }

    try {
      const response = await octokit.rest.repos.getContent({
        owner: 'aiken-lang',
        repo: 'aiken',
        path: path,
      });

      if ('content' in response.data && response.data.encoding === 'base64') {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
    } catch (err) {
      // Try alternative paths if first attempt fails
      const alternatives = [
        `docs/${normalizedSection}.md`,
        `docs/language/${normalizedSection}.md`,
        `docs/reference/${normalizedSection}.md`
      ];

      for (const altPath of alternatives) {
        try {
          const response = await octokit.rest.repos.getContent({
            owner: 'aiken-lang',
            repo: 'aiken',
            path: altPath,
          });

          if ('content' in response.data && response.data.encoding === 'base64') {
            return Buffer.from(response.data.content, 'base64').toString('utf-8');
          }
        } catch (innerErr) {
          // Continue to next alternative
        }
      }
    }

    throw new Error(`Documentation section "${section}" not found.`);
  } catch (error) {
    console.error(`Error getting Aiken documentation for section "${section}":`, error);
    throw error;
  }
}

// Helper function to get Aiken examples
export async function getAikenExamples(category: string, token?: string): Promise<any[]> {
  try {
    const octokit = token ? new Octokit({ auth: token }) : new Octokit();

    // Try to find examples in the examples repo
    try {
      const response = await octokit.rest.repos.getContent({
        owner: 'aiken-lang',
        repo: 'examples',
        path: category ? category : '',
      });

      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      // If not found in examples, try to search for it
      const searchResponse = await octokit.rest.search.code({
        q: `repo:aiken-lang/examples ${category} extension:ak`,
        per_page: 10,
      });

      if (searchResponse.data.items.length > 0) {
        return searchResponse.data.items;
      }
    }

    return [];
  } catch (error) {
    console.error(`Error getting Aiken examples for category "${category}":`, error);
    throw error;
  }
}

// Helper function to format Aiken code with proper explanations
export function formatAikenCodeExplanation(code: string): string {
  // Identify key components of Aiken code
  const lines = code.split('\n');
  let result = '';

  // Check for module declarations
  const moduleMatch = code.match(/module\s+([^\s]+)/);
  if (moduleMatch) {
    result += `Module: ${moduleMatch[1]}\n\n`;
  }

  // Check for imports
  const imports = lines.filter(line => line.trim().startsWith('use '));
  if (imports.length > 0) {
    result += 'Imports:\n' + imports.map(imp => `- ${imp.trim()}`).join('\n') + '\n\n';
  }

  // Check for type definitions
  const types = lines.filter(line => line.trim().startsWith('type '));
  if (types.length > 0) {
    result += 'Type Definitions:\n' + types.map(t => `- ${t.trim()}`).join('\n') + '\n\n';
  }

  // Check for validator functions
  const validators = lines.filter(line => line.trim().startsWith('validator '));
  if (validators.length > 0) {
    result += 'Validators:\n' + validators.map(v => `- ${v.trim()}`).join('\n') + '\n\n';
  }

  // Check for other functions
  const functions = lines.filter(
    line => line.includes('fn ') && !line.trim().startsWith('validator ')
  );
  if (functions.length > 0) {
    result += 'Functions:\n' + functions.map(f => `- ${f.trim()}`).join('\n') + '\n\n';
  }

  // Add the full code
  result += 'Full Code:\n```aiken\n' + code + '\n```';

  return result;
}

// Helper function to check if a string is valid Aiken code
export function isValidAikenSyntax(code: string): { valid: boolean; errors?: string[] } {
  // This is a simplified check - in a real implementation, you would want to use the Aiken compiler
  const errors = [];

  // Check for basic Aiken syntax elements
  if (!code.includes('fn ') && !code.includes('type ') && !code.includes('validator ')) {
    errors.push('Code does not contain any functions, types, or validators');
  }

  // Check for common syntax issues
  if (code.includes(';')) {
    errors.push('Aiken does not use semicolons at the end of statements');
  }

  if (code.includes('function ')) {
    errors.push('Use "fn" instead of "function" for function definitions');
  }

  if (code.includes(' -> ') && !code.includes('fn ')) {
    errors.push('Arrow notation should be used in function signatures');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
