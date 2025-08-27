// Enhanced LaTeX compiler using Overleaf's recommended methods
async function compileLatexToPdfOnline(latexContent) {
  console.log('--- ONLINE LATEX COMPILATION STARTED ---');
  console.log('LaTeX content length:', latexContent.length, 'characters');
  
  try {
    // Method 1: YtoTech LaTeX build API (Primary)
    console.log('Attempting YtoTech LaTeX build API...');
    try {
      const ytoTechResponse = await fetch('https://latex.ytotech.com/builds/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          compiler: 'lualatex',
          resources: [
            {
              main: true,
              content: latexContent
            }
          ]
        })
      });
      
      console.log('YtoTech response status:', ytoTechResponse.status);
      console.log('YtoTech response headers:', Object.fromEntries(ytoTechResponse.headers.entries()));
      
      if (ytoTechResponse.ok) {
        const contentType = (ytoTechResponse.headers.get('content-type') || '').toLowerCase();
        const contentDisposition = ytoTechResponse.headers.get('content-disposition') || '';
        
        // Case 1: Service returns raw PDF bytes
        if (contentType.includes('application/pdf') || /filename=.*\.pdf/i.test(contentDisposition)) {
          const pdfBuffer = await ytoTechResponse.arrayBuffer();
          console.log('PDF buffer size:', pdfBuffer.byteLength, 'bytes');
          console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (YtoTech - raw PDF) ---');
          return Buffer.from(pdfBuffer);
        }

        // Case 2: JSON payload (base64 PDF)
        let result = null;
        try {
          result = await ytoTechResponse.json();
        } catch (e) {
          console.log('YtoTech JSON parse failed but response was OK; content-type:', contentType);
        }
        console.log('YtoTech result keys:', Object.keys(result || {}));

        // Try multiple known shapes to extract base64 PDF
        let pdfBase64 = null;
        if (result && result.result && typeof result.result.output === 'string') {
          pdfBase64 = result.result.output;
        }
        if (!pdfBase64 && Array.isArray(result?.outputFiles)) {
          const pdfFile = result.outputFiles.find(f => (f.type === 'pdf') || (f.path && f.path.toLowerCase().endsWith('.pdf')));
          if (pdfFile && typeof pdfFile.content === 'string') {
            pdfBase64 = pdfFile.content;
          }
        }
        if (!pdfBase64 && result && typeof result.pdf === 'string') {
          pdfBase64 = result.pdf;
        }
        if (!pdfBase64 && result && result.result && Array.isArray(result.result.files)) {
          const f = result.result.files.find(x => x.name && x.name.toLowerCase().endsWith('.pdf'));
          if (f && typeof f.content === 'string') {
            pdfBase64 = f.content;
          }
        }

        if (pdfBase64) {
          const pdfBuffer = Buffer.from(pdfBase64, 'base64');
          console.log('PDF buffer size:', pdfBuffer.byteLength, 'bytes');
          console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (YtoTech - JSON) ---');
          return pdfBuffer;
        } else {
          console.log('YtoTech response did not include a PDF payload in expected fields');
        }
      } else {
        const errorText = await ytoTechResponse.text();
        console.log('YtoTech failed with status:', ytoTechResponse.status, 'Body:', errorText);
      }
    } catch (ytoTechError) {
      console.log('YtoTech method failed:', ytoTechError.message);
    }

    // Method 2: Overleaf Base64 Data URL (Secondary method)
    console.log('Attempting Overleaf Base64 Data URL method...');
    try {
      const base64Content = Buffer.from(latexContent).toString('base64');
      const dataUrl = `data:application/x-tex;base64,${base64Content}`;
      
      console.log('Base64 content length:', base64Content.length);
      console.log('Data URL length:', dataUrl.length);
      
      const overleafResponse = await fetch('https://www.overleaf.com/docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        body: JSON.stringify({
          url: dataUrl,
          engine: 'pdflatex'
        })
      });
      
      console.log('Overleaf response status:', overleafResponse.status);
      console.log('Overleaf response headers:', Object.fromEntries(overleafResponse.headers.entries()));
      
      if (overleafResponse.ok) {
        const contentType = overleafResponse.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        if (contentType && contentType.includes('application/pdf')) {
          const pdfBuffer = await overleafResponse.arrayBuffer();
          console.log('PDF buffer size:', pdfBuffer.byteLength, 'bytes');
          console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (Overleaf Base64) ---');
          return Buffer.from(pdfBuffer);
        } else {
          console.log('Response is not a PDF, content type:', contentType);
        }
      } else {
        console.log('Overleaf request failed with status:', overleafResponse.status);
      }
      
      console.log('Overleaf method failed, trying fallback methods...');
    } catch (overleafError) {
      console.log('Overleaf Base64 method failed:', overleafError.message);
    }
    
    // Method 2: LaTeX.Online API (Alternative endpoint)
    console.log('Attempting LaTeX.Online API with alternative endpoint...');
    try {
      const latexOnlineResponse = await fetch('https://latex.ytotech.com/builds/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compiler: 'pdflatex',
          resources: [{
            file: 'main.tex',
            content: latexContent
          }]
        })
      });
      
      console.log('LaTeX.Online (YtoTech) response status:', latexOnlineResponse.status);
      console.log('LaTeX.Online (YtoTech) response headers:', Object.fromEntries(latexOnlineResponse.headers.entries()));
      
      if (latexOnlineResponse.ok) {
        const result = await latexOnlineResponse.json();
        console.log('LaTeX.Online (YtoTech) result:', result);
        
        if (result.result && result.result.output) {
          // The service returns base64 encoded PDF
          const pdfBase64 = result.result.output;
          const pdfBuffer = Buffer.from(pdfBase64, 'base64');
          console.log('PDF buffer size:', pdfBuffer.byteLength, 'bytes');
          console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (LaTeX.Online YtoTech) ---');
          return pdfBuffer;
        } else {
          console.log('LaTeX.Online (YtoTech) - No PDF output in result');
        }
      } else {
        console.log('LaTeX.Online (YtoTech) failed with status:', latexOnlineResponse.status);
        const errorText = await latexOnlineResponse.text();
        console.log('LaTeX.Online (YtoTech) error response:', errorText.substring(0, 200));
      }
    } catch (latexOnlineError) {
      console.log('LaTeX.Online (YtoTech) method failed:', latexOnlineError.message);
    }
    
    // Method 3: LaTeX.Online API (Original endpoint - try different approach)
    console.log('Attempting LaTeX.Online API with GET method...');
    try {
      const encodedLatex = encodeURIComponent(latexContent);
      const getUrl = `https://latexonline.cc/compile?text=${encodedLatex}&command=pdflatex`;
      
      const latexOnlineGetResponse = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        }
      });
      
      console.log('LaTeX.Online GET response status:', latexOnlineGetResponse.status);
      
      if (latexOnlineGetResponse.ok) {
        const pdfBuffer = await latexOnlineGetResponse.arrayBuffer();
        console.log('PDF buffer size:', pdfBuffer.byteLength, 'bytes');
        console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (LaTeX.Online GET) ---');
        return Buffer.from(pdfBuffer);
      } else {
        console.log('LaTeX.Online GET failed with status:', latexOnlineGetResponse.status);
      }
    } catch (latexOnlineGetError) {
      console.log('LaTeX.Online GET method failed:', latexOnlineGetError.message);
    }
    
    // Method 4: LaTeX-Online.com API (Different service)
    console.log('Attempting LaTeX-Online.com API...');
    try {
      const latexOnlineComResponse = await fetch('https://latex-online.com/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latex: latexContent,
          format: 'pdf'
        })
      });
      
      console.log('LaTeX-Online.com response status:', latexOnlineComResponse.status);
      
      if (latexOnlineComResponse.ok) {
        const pdfBuffer = await latexOnlineComResponse.arrayBuffer();
        console.log('PDF buffer size:', pdfBuffer.byteLength, 'bytes');
        console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (LaTeX-Online.com) ---');
        return Buffer.from(pdfBuffer);
      } else {
        console.log('LaTeX-Online.com failed with status:', latexOnlineComResponse.status);
      }
    } catch (latexOnlineComError) {
      console.log('LaTeX-Online.com method failed:', latexOnlineComError.message);
    }
    
    // Method 5: Overleaf Raw Snippet (Alternative Overleaf method)
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
      
      console.log('Overleaf raw snippet response status:', rawSnippetResponse.status);
      if (rawSnippetResponse.ok) {
        console.log('Overleaf raw snippet method initiated successfully');
        // This method creates a project but doesn't directly return PDF
        // For production use, you'd need to implement project polling
      }
    } catch (rawSnippetError) {
      console.log('Overleaf raw snippet method failed:', rawSnippetError.message);
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
