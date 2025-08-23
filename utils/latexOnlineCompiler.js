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
    
    // Option 1: LaTeX.Online API (POST method for large content)
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
    
    // Fallback: Try alternative service - QuickLaTeX
    try {
      console.log('Trying QuickLaTeX service...');
      
      const fallbackResponse = await fetch('https://quicklatex.com/latex3.f', {
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
      
      if (fallbackResponse.ok) {
        const responseText = await fallbackResponse.text();
        console.log('QuickLaTeX response:', responseText.substring(0, 100));
        
        // QuickLaTeX returns a URL to the generated image/PDF
        // Response format: "0\nhttps://quicklatex.com/cache3/..." where 0 = success
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
            } else {
              console.log('Failed to fetch QuickLaTeX image:', imageResponse.status);
            }
          } else {
            console.log('Invalid QuickLaTeX URL format:', imageUrl);
          }
        } else {
          console.log('QuickLaTeX returned error code:', lines[0]);
          if (lines.length > 1) {
            console.log('QuickLaTeX error details:', lines.slice(1).join(' '));
          }
        }
      }
    } catch (fallbackError) {
      console.error('QuickLaTeX also failed:', fallbackError.message);
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
      
      // Test with POST method
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
        
        // Try QuickLaTeX as fallback check
        try {
          const fallbackResponse = await fetch('https://quicklatex.com/latex3.f', {
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
          
          if (fallbackResponse.ok) {
            console.log('QuickLaTeX service is available as fallback');
            console.log('--- ONLINE LATEX SERVICE CHECK PASSED (QuickLaTeX) ---');
            resolve(true);
          } else {
            console.log('Both LaTeX services failed');
            resolve(false);
          }
        } catch (fallbackError) {
          console.log('Fallback service check failed:', fallbackError.message);
          resolve(false);
        }
      }
    } catch (error) {
      console.log('Online LaTeX service check failed:', error.message);
      console.log('--- ONLINE LATEX SERVICE CHECK FAILED ---');
      resolve(false);
    }
  });
}
