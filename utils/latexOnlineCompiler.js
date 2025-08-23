// Alternative LaTeX compiler using external service for Vercel deployment
export async function compileLatexToPdfOnline(latexContent) {
  console.log('--- ONLINE LATEX COMPILATION STARTED ---');
  console.log('LaTeX content length:', latexContent.length, 'characters');
  
  try {
    // Validate LaTeX content
    if (!latexContent.includes('\\documentclass')) {
      throw new Error('Invalid LaTeX content: Missing \\documentclass declaration');
    }
    if (!latexContent.includes('\\end{document}')) {
      throw new Error('Invalid LaTeX content: Missing \\end{document}');
    }
    
    // Option 1: LaTeX.Online API (Free)
    const response = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: latexContent,
        command: 'pdflatex'
      })
    });
    
    if (!response.ok) {
      throw new Error(`LaTeX compilation failed: ${response.status} ${response.statusText}`);
    }
    
    const pdfBuffer = await response.arrayBuffer();
    console.log('PDF buffer size:', pdfBuffer.byteLength, 'bytes');
    console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY ---');
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('--- ONLINE LATEX COMPILATION ERROR ---');
    console.error('Error:', error.message);
    
    // Fallback: Try alternative service
    try {
      console.log('Trying alternative LaTeX service...');
      
      // Option 2: Overleaf API alternative (if available)
      const fallbackResponse = await fetch('https://texlive.net/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: latexContent,
          format: 'pdf'
        })
      });
      
      if (fallbackResponse.ok) {
        const fallbackBuffer = await fallbackResponse.arrayBuffer();
        console.log('Fallback compilation successful');
        return Buffer.from(fallbackBuffer);
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError.message);
    }
    
    throw new Error(`Online LaTeX compilation failed: ${error.message}`);
  }
}

export function checkOnlineLatexService() {
  return new Promise(async (resolve) => {
    console.log('--- ONLINE LATEX SERVICE CHECK STARTED ---');
    
    try {
      const testLatex = `\\documentclass{article}
\\begin{document}
Test document
\\end{document}`;
      
      const response = await fetch('https://latexonline.cc/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: testLatex,
          command: 'pdflatex'
        })
      });
      
      if (response.ok) {
        console.log('Online LaTeX service is available');
        console.log('--- ONLINE LATEX SERVICE CHECK PASSED ---');
        resolve(true);
      } else {
        console.log('Online LaTeX service returned error:', response.status);
        resolve(false);
      }
    } catch (error) {
      console.log('Online LaTeX service check failed:', error.message);
      console.log('--- ONLINE LATEX SERVICE CHECK FAILED ---');
      resolve(false);
    }
  });
}
