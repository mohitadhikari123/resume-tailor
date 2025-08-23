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
    
    // Option 1: Overleaf API (more reliable)
    try {
      console.log('Trying Overleaf Compile API...');
      const overleafResponse = await fetch('https://www.overleaf.com/docs/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compile: {
            options: {
              compiler: 'pdflatex',
              timeout: 60
            },
            rootResourcePath: 'main.tex',
            resources: [{
              path: 'main.tex',
              content: latexContent
            }]
          }
        })
      });
      
      if (overleafResponse.ok) {
        const result = await overleafResponse.json();
        if (result.compile && result.compile.status === 'success' && result.compile.outputFiles) {
          const pdfFile = result.compile.outputFiles.find(f => f.path === 'output.pdf');
          if (pdfFile && pdfFile.url) {
            const pdfResponse = await fetch(pdfFile.url);
            if (pdfResponse.ok) {
              const pdfBuffer = await pdfResponse.arrayBuffer();
              console.log('Overleaf compilation successful, PDF size:', pdfBuffer.byteLength);
              console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (Overleaf) ---');
              return Buffer.from(pdfBuffer);
            }
          }
        }
      }
    } catch (overleafError) {
      console.log('Overleaf failed:', overleafError.message);
    }
    
    // Option 2: LaTeX Base64 API
    try {
      console.log('Trying LaTeX Base64 service...');
      const base64Response = await fetch('https://latex.codecogs.com/pdf.download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          latex: latexContent
        })
      });
      
      if (base64Response.ok) {
        const pdfBuffer = await base64Response.arrayBuffer();
        if (pdfBuffer.byteLength > 1000) { // Valid PDF should be larger than 1KB
          console.log('LaTeX Base64 compilation successful, PDF size:', pdfBuffer.byteLength);
          console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (Base64) ---');
          return Buffer.from(pdfBuffer);
        }
      }
    } catch (base64Error) {
      console.log('LaTeX Base64 failed:', base64Error.message);
    }
    
    // Option 3: Simple LaTeX to PDF service
    try {
      console.log('Trying simple LaTeX service...');
      const simpleResponse = await fetch('https://api.latex2pdf.com/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latex: latexContent,
          engine: 'pdflatex'
        })
      });
      
      if (simpleResponse.ok) {
        const result = await simpleResponse.json();
        if (result.success && result.pdf_url) {
          const pdfResponse = await fetch(result.pdf_url);
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer();
            console.log('Simple LaTeX service successful, PDF size:', pdfBuffer.byteLength);
            console.log('--- ONLINE LATEX COMPILATION COMPLETED SUCCESSFULLY (Simple) ---');
            return Buffer.from(pdfBuffer);
          }
        }
      }
    } catch (simpleError) {
      console.log('Simple LaTeX service failed:', simpleError.message);
    }
    
    throw new Error('All LaTeX compilation services failed');
    
  } catch (error) {
    console.error('--- ONLINE LATEX COMPILATION ERROR ---');
    console.error('Error:', error.message);
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
      
      // Test LaTeX Base64 service (most likely to work)
      try {
        const base64Response = await fetch('https://latex.codecogs.com/pdf.download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            latex: testLatex
          })
        });
        
        if (base64Response.ok) {
          const testBuffer = await base64Response.arrayBuffer();
          if (testBuffer.byteLength > 500) {
            console.log('LaTeX Base64 service is available');
            console.log('--- ONLINE LATEX SERVICE CHECK PASSED (Base64) ---');
            resolve(true);
            return;
          }
        }
      } catch (base64Error) {
        console.log('Base64 service check failed:', base64Error.message);
      }
      
      // Test simple LaTeX service
      try {
        const simpleResponse = await fetch('https://api.latex2pdf.com/compile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latex: testLatex,
            engine: 'pdflatex'
          })
        });
        
        if (simpleResponse.ok) {
          console.log('Simple LaTeX service is available');
          console.log('--- ONLINE LATEX SERVICE CHECK PASSED (Simple) ---');
          resolve(true);
          return;
        }
      } catch (simpleError) {
        console.log('Simple service check failed:', simpleError.message);
      }
      
      console.log('All LaTeX services failed health check');
      console.log('--- ONLINE LATEX SERVICE CHECK FAILED ---');
      resolve(false);
      
    } catch (error) {
      console.log('Online LaTeX service check failed:', error.message);
      console.log('--- ONLINE LATEX SERVICE CHECK FAILED ---');
      resolve(false);
    }
  });
}
