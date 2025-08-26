// Enhanced LaTeX compiler using Overleaf's recommended methods
async function compileLatexToPdfOnline(latexContent) {
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
    
    // Method 1: Overleaf Base64 Data URL (Recommended)
    console.log('Attempting Overleaf Base64 Data URL method...');
    try {
      const base64Content = Buffer.from(latexContent, 'utf8').toString('base64');
      const dataUrl = `data:application/x-tex;base64,${base64Content}`;
      
      const overleafResponse = await fetch('https://www.overleaf.com/docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          snip_uri: dataUrl,
          engine: 'pdflatex'
        })
      });
      
      if (overleafResponse.ok) {
        // Overleaf redirects to the project, we need to extract the project URL
        console.log('Overleaf response received, processing...',overleafResponse);
        const responseText = await overleafResponse.text();
        
        // Look for project URL in the response
        const projectMatch = responseText.match(/\/project\/([a-f0-9]+)/);
        if (projectMatch) {
          const projectId = projectMatch[1];
          console.log('Overleaf project created:', projectId);
          
          // Try to get the compiled PDF from the project
          const pdfUrl = `https://www.overleaf.com/project/${projectId}/output/output.pdf`;
          const pdfResponse = await fetch(pdfUrl);
          
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer();
            console.log('PDF downloaded from Overleaf, size:', pdfBuffer.byteLength, 'bytes');
            console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (Overleaf) ---');
            return Buffer.from(pdfBuffer);
          }
        }
      }
      
      console.log('Overleaf method failed, trying fallback methods...');
    } catch (overleafError) {
      console.log('Overleaf Base64 method failed:', overleafError.message);
    }
    
    // Method 2: LaTeX.Online API (Fallback)
    console.log('Attempting LaTeX.Online API...');
    try {
      const latexOnlineResponse = await fetch('https://latexonline.cc/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: latexContent,
          command: 'pdflatex'
        })
      });
      
      if (latexOnlineResponse.ok) {
        const pdfBuffer = await latexOnlineResponse.arrayBuffer();
        console.log('PDF buffer size:', pdfBuffer.byteLength, 'bytes');
        console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (LaTeX.Online) ---');
        return Buffer.from(pdfBuffer);
      } else {
        console.log('LaTeX.Online failed with status:', latexOnlineResponse.status);
      }
    } catch (latexOnlineError) {
      console.log('LaTeX.Online method failed:', latexOnlineError.message);
    }
    
    // Method 3: Overleaf Raw Snippet (Alternative Overleaf method)
    console.log('Attempting Overleaf raw snippet method...');
    try {
      const rawSnippetResponse = await fetch('https://www.overleaf.com/docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          snip: latexContent,
          engine: 'pdflatex'
        })
      });
      
      if (rawSnippetResponse.ok) {
        console.log('Overleaf raw snippet method initiated successfully');
        // This method creates a project but doesn't directly return PDF
        // For production use, you'd need to implement project polling
      }
    } catch (rawSnippetError) {
      console.log('Overleaf raw snippet method failed:', rawSnippetError.message);
    }
    
    // Method 4: QuickLaTeX (Final fallback)
    console.log('Attempting QuickLaTeX service...');
    const quickLatexResponse = await fetch('https://quicklatex.com/latex3.f', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        formula: latexContent,
        fsize: '17px',
        fcolor: '000000',
        mode: '0',
        out: '1',
        remhost: 'quicklatex.com'
      })
    });
    
    if (quickLatexResponse.ok) {
      const responseText = await quickLatexResponse.text();
      console.log('QuickLaTeX response:', responseText.substring(0, 100));
      
      // QuickLaTeX returns a URL to the generated image/PDF
      const lines = responseText.trim().split('\n');
      if (lines.length >= 2 && lines[0] === '0') {
        const imageUrl = lines[1];
        if (imageUrl.startsWith('http')) {
          console.log('QuickLaTeX generated image URL:', imageUrl);
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const fallbackBuffer = await imageResponse.arrayBuffer();
            console.log('QuickLaTeX compilation successful, buffer size:', fallbackBuffer.byteLength);
            console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (QuickLaTeX) ---');
            return Buffer.from(fallbackBuffer);
          }
        }
      } else {
        console.log('QuickLaTeX returned error code:', lines[0]);
        if (lines.length > 1) {
          console.log('QuickLaTeX error details:', lines.slice(1).join(' '));
        }
      }
    }
    
    throw new Error('All online LaTeX compilation methods failed');
    
  } catch (error) {
    console.error('--- ONLINE LATEX COMPILATION ERROR ---');
    console.error('Error:', error.message);
    throw new Error(`Online LaTeX compilation failed: ${error.message}`);
  }
}

// Enhanced service availability checker with multiple methods
function checkOnlineLatexService() {
  return new Promise(async (resolve) => {
    console.log('--- ONLINE LATEX SERVICE CHECK STARTED ---');
    
    const testLatex = `\\documentclass{article}
\\begin{document}
Test document
\\end{document}`;
    
    // Test Method 1: Overleaf Base64 Data URL
    try {
      console.log('Testing Overleaf Base64 method...');
      const base64Content = Buffer.from(testLatex, 'utf8').toString('base64');
      const dataUrl = `data:application/x-tex;base64,${base64Content}`;
      
      const overleafResponse = await fetch('https://www.overleaf.com/docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          snip_uri: dataUrl
        })
      });
      
      if (overleafResponse.ok || overleafResponse.status === 302) {
        console.log('Overleaf service is available');
        console.log('--- ONLINE LATEX SERVICE CHECK PASSED (Overleaf) ---');
        resolve(true);
        return;
      }
    } catch (overleafError) {
      console.log('Overleaf check failed:', overleafError.message);
    }
    
    // Test Method 2: LaTeX.Online API
    try {
      console.log('Testing LaTeX.Online API...');
      const latexOnlineResponse = await fetch('https://latexonline.cc/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: testLatex,
          command: 'pdflatex'
        })
      });
      
      if (latexOnlineResponse.ok) {
        console.log('LaTeX.Online service is available');
        console.log('--- ONLINE LATEX SERVICE CHECK PASSED (LaTeX.Online) ---');
        resolve(true);
        return;
      }
    } catch (latexOnlineError) {
      console.log('LaTeX.Online check failed:', latexOnlineError.message);
    }
    
    // Test Method 3: QuickLaTeX
    try {
      console.log('Testing QuickLaTeX service...');
      const quickLatexResponse = await fetch('https://quicklatex.com/latex3.f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          formula: testLatex,
          fsize: '17px',
          fcolor: '000000',
          mode: '0',
          out: '1',
          remhost: 'quicklatex.com'
        })
      });
      
      if (quickLatexResponse.ok) {
        const responseText = await quickLatexResponse.text();
        const lines = responseText.trim().split('\n');
        if (lines.length >= 2 && lines[0] === '0') {
          console.log('QuickLaTeX service is available');
          console.log('--- ONLINE LATEX SERVICE CHECK PASSED (QuickLaTeX) ---');
          resolve(true);
          return;
        }
      }
    } catch (quickLatexError) {
      console.log('QuickLaTeX check failed:', quickLatexError.message);
    }
    
    console.log('All online LaTeX services failed');
    console.log('--- ONLINE LATEX SERVICE CHECK FAILED ---');
    resolve(false);
  });
}

// Utility function to create Overleaf project URL for manual compilation
function createOverleafProjectUrl(latexContent) {
  try {
    const base64Content = Buffer.from(latexContent, 'utf8').toString('base64');
    const dataUrl = `data:application/x-tex;base64,${base64Content}`;
    const encodedDataUrl = encodeURIComponent(dataUrl);
    
    return `https://www.overleaf.com/docs?snip_uri=${encodedDataUrl}&engine=pdflatex`;
  } catch (error) {
    console.error('Failed to create Overleaf project URL:', error.message);
    return null;
  }
}

// Utility function to create Overleaf project with raw snippet
function createOverleafProjectWithSnippet(latexContent) {
  try {
    const encodedSnippet = encodeURIComponent(latexContent);
    return `https://www.overleaf.com/docs?snip=${encodedSnippet}&engine=pdflatex`;
  } catch (error) {
    console.error('Failed to create Overleaf project with snippet:', error.message);
    return null;
  }
}

// Export functions for CommonJS
module.exports = {
  compileLatexToPdfOnline,
  checkOnlineLatexService,
  createOverleafProjectUrl,
  createOverleafProjectWithSnippet
};
