// Quick test for online LaTeX compiler
const { checkOnlineLatexService, createOverleafProjectUrl } = require('./utils/latexOnlineCompiler.js');

async function quickTest() {
  console.log('=== QUICK LATEX COMPILER TEST ===\n');
  
  const testLatex = `\\documentclass{article}
\\begin{document}
Hello World Test!
\\end{document}`;

  console.log('1. Testing service availability...');
  try {
    const isAvailable = await checkOnlineLatexService();
    console.log('✅ Service check result:', isAvailable);
  } catch (error) {
    console.log('❌ Service check failed:', error.message);
  }

  console.log('\n2. Testing URL generation...');
  try {
    const url = createOverleafProjectUrl(testLatex);
    console.log('✅ Overleaf URL generated:', url ? 'Success' : 'Failed');
    if (url) {
      console.log('URL preview:', url.substring(0, 80) + '...');
    }
  } catch (error) {
    console.log('❌ URL generation failed:', error.message);
  }

  console.log('\n=== TEST COMPLETED ===');
}

quickTest().catch(console.error);
