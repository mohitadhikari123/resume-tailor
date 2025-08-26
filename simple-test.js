// Simple test for LaTeX compiler
const { createOverleafProjectUrl, createOverleafProjectWithSnippet } = require('./utils/latexOnlineCompiler.js');

console.log('=== TESTING OVERLEAF URL GENERATION ===');

const testLatex = `\\documentclass{article}
\\begin{document}
Hello World!
\\end{document}`;

console.log('Test LaTeX content:', testLatex);
console.log('');

// Test URL generation
const base64Url = createOverleafProjectUrl(testLatex);
const snippetUrl = createOverleafProjectWithSnippet(testLatex);

console.log('Base64 Data URL method:');
console.log(base64Url || 'Failed to generate URL');
console.log('');

console.log('Raw Snippet method:');
console.log(snippetUrl || 'Failed to generate URL');
console.log('');

console.log('=== TEST COMPLETED ===');
