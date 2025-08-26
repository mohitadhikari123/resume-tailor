// Test script for the enhanced LaTeX online compiler
const { compileLatexToPdfOnline, checkOnlineLatexService, createOverleafProjectUrl, createOverleafProjectWithSnippet } = require('./utils/latexOnlineCompiler.js');

async function testLatexCompiler() {
  console.log('=== TESTING ENHANCED LATEX ONLINE COMPILER ===\n');
  
  // Test LaTeX content
  const testLatex = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\begin{document}

\\title{Test Resume}
\\author{John Doe}
\\date{\\today}
\\maketitle

\\section{Experience}
\\textbf{Software Engineer} \\hfill 2020 - Present \\\\
Tech Company Inc. \\\\
\\begin{itemize}
    \\item Developed web applications using React and Node.js
    \\item Collaborated with cross-functional teams
    \\item Implemented CI/CD pipelines
\\end{itemize}

\\section{Education}
\\textbf{Bachelor of Science in Computer Science} \\hfill 2016 - 2020 \\\\
University of Technology

\\section{Skills}
JavaScript, Python, React, Node.js, Git, Docker

\\end{document}`;

  console.log('LaTeX content length:', testLatex.length, 'characters\n');
  
  // Test 1: Check service availability
  console.log('1. Testing service availability...');
  const isAvailable = await checkOnlineLatexService();
  console.log('Service available:', isAvailable, '\n');
  
  // Test 2: Generate Overleaf project URLs
  console.log('2. Generating Overleaf project URLs...');
  const base64Url = createOverleafProjectUrl(testLatex);
  const snippetUrl = createOverleafProjectWithSnippet(testLatex);
  
  console.log('Base64 Data URL method:');
  console.log(base64Url ? base64Url.substring(0, 100) + '...' : 'Failed to generate URL');
  console.log('\nRaw Snippet method:');
  console.log(snippetUrl ? snippetUrl.substring(0, 100) + '...' : 'Failed to generate URL');
  console.log('');
  
  // Test 3: Attempt compilation (this might take a while)
  if (isAvailable) {
    console.log('3. Attempting LaTeX compilation...');
    try {
      const pdfBuffer = await compileLatexToPdfOnline(testLatex);
      console.log('✅ Compilation successful!');
      console.log('PDF buffer size:', pdfBuffer.length, 'bytes');
      
      // Save the PDF for inspection
      const fs = require('fs');
      const outputPath = './test-output.pdf';
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log('PDF saved to:', outputPath);
      
    } catch (error) {
      console.log('❌ Compilation failed:', error.message);
    }
  } else {
    console.log('3. Skipping compilation test - no services available');
  }
  
  console.log('\n=== TEST COMPLETED ===');
}

// Run the test
testLatexCompiler().catch(error => {
  console.error('Test failed:', error);
});
