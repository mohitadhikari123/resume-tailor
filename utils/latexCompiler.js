import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function compileLatexToPdf(latexContent) {
  const timestamp = Date.now();
  const tempDir = path.join(process.cwd(), 'temp');
  const texFilePath = path.join(tempDir, `resume_${timestamp}.tex`);
  const pdfFilePath = path.join(tempDir, `resume_${timestamp}.pdf`);

  console.log('--- LATEX COMPILATION STARTED ---');
  console.log('LaTeX content length:', latexContent.length, 'characters');
  console.log('Temp directory:', tempDir);
  console.log('TeX file path:', texFilePath);
  console.log('PDF file path:', pdfFilePath);

  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      console.log('Creating temp directory...');
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write LaTeX content to file
    console.log('Writing LaTeX content to file...');
    console.log('LaTeX content preview', latexContent);
    
    // Validate LaTeX content before writing
    if (!latexContent.includes('\\documentclass')) {
      throw new Error('Invalid LaTeX content: Missing \\documentclass declaration');
    }
    if (!latexContent.includes('\\end{document}')) {
      throw new Error('Invalid LaTeX content: Missing \\end{document}');
    }
    
    fs.writeFileSync(texFilePath, latexContent, 'utf8');
    console.log('LaTeX file written successfully');
    
    // Also save a debug copy for inspection
    const debugFilePath = path.join(tempDir, `debug_${timestamp}.tex`);
    fs.writeFileSync(debugFilePath, latexContent, 'utf8');
    console.log('Debug LaTeX file saved at:', debugFilePath);
    
    // Add MiKTeX and Perl paths to the environment for compilation
    console.log('Setting up environment paths...');
    const env = { ...process.env };
    env.PATH = env.PATH || '';
    const mikTexPath = 'C:\\Users\\Digital Guru\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64';
    const perlPath = 'C:\\Strawberry\\perl\\bin';
    
    // Add paths to the environment PATH if they're not already there
    if (!env.PATH.includes(mikTexPath)) {
      env.PATH = `${env.PATH};${mikTexPath}`;
      console.log('Added MiKTeX path to environment');
    }
    if (!env.PATH.includes(perlPath)) {
      env.PATH = `${env.PATH};${perlPath}`;
      console.log('Added Perl path to environment');
    }
    console.log('Environment PATH configured');
    
    // Compile LaTeX to PDF using pdflatex
    // Run twice to ensure proper cross-references and formatting
    const pdflatexCommand = `pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${texFilePath}"`;
    console.log('Running pdflatex command:', pdflatexCommand);
    
    try {
      console.log('First pdflatex run...');
      await execAsync(pdflatexCommand, { env });
      console.log('First pdflatex run completed');
      
      // Run second time for proper formatting
      console.log('Second pdflatex run...');
      await execAsync(pdflatexCommand, { env });
      console.log('Second pdflatex run completed');
    } catch (execError) {
      console.log('pdflatex failed, analyzing error...');
      console.log('pdflatex stderr:', execError.stderr);
      console.log('pdflatex stdout:', execError.stdout);
      
      // Check for log file to get more detailed error information
      const logFilePath = path.join(tempDir, `resume_${timestamp}.log`);
      if (fs.existsSync(logFilePath)) {
        const logContent = fs.readFileSync(logFilePath, 'utf8');
        console.log('LaTeX log file content (last 1000 chars):', logContent.slice(-1000));
      }
      
      // Try with latexmk as fallback
      console.log('Trying latexmk fallback...');
      try {
        const latexmkCommand = `latexmk -pdf -interaction=nonstopmode -output-directory="${tempDir}" "${texFilePath}"`;
        console.log('Running latexmk command:', latexmkCommand);
        await execAsync(latexmkCommand, { env });
        console.log('latexmk compilation completed');
      } catch (latexmkError) {
        console.error('Both pdflatex and latexmk failed');
        console.error('latexmk error:', latexmkError.message);
        console.error('latexmk stderr:', latexmkError.stderr);
        throw new Error(`LaTeX compilation failed: ${execError.message}. Fallback also failed: ${latexmkError.message}`);
      }
    }
    
    // Check if PDF was created
    console.log('Checking if PDF was created...');
    if (!fs.existsSync(pdfFilePath)) {
      console.log('ERROR: PDF file not found at:', pdfFilePath);
      throw new Error('PDF compilation failed - output file not found');
    }
    console.log('PDF file created successfully');
    
    // Read PDF file as buffer
    console.log('Reading PDF file as buffer...');
    const pdfBuffer = fs.readFileSync(pdfFilePath);
    console.log('PDF buffer size:', pdfBuffer.length, 'bytes');
    
    // Clean up temporary files
    console.log('Cleaning up temporary files...');
    const fileName = `resume_${timestamp}`;
    cleanupTempFiles(tempDir, fileName);
    console.log('--- LATEX COMPILATION COMPLETED SUCCESSFULLY ---');
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('--- LATEX COMPILATION ERROR ---');
    console.error('LaTeX compilation error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Clean up temporary files even on error
    try {
      const fileName = `resume_${timestamp}`;
      cleanupTempFiles(tempDir, fileName);
      console.log('Temporary files cleaned up after error');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    throw new Error(`LaTeX compilation failed: ${error.message}`);
  }
}

function cleanupTempFiles(tempDir, fileName) {
  const extensions = ['.tex', '.pdf', '.aux', '.log', '.fls', '.fdb_latexmk', '.synctex.gz'];
  
  extensions.forEach(ext => {
    const filePath = path.join(tempDir, `${fileName}${ext}`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.warn(`Failed to delete ${filePath}:`, error.message);
      }
    }
  });
}

export function checkLatexInstallation() {
  return new Promise((resolve) => {
    console.log('--- LATEX INSTALLATION CHECK STARTED ---');
    
    // Add MiKTeX and Perl paths to the environment for this check
    const env = { ...process.env };
    env.PATH = env.PATH || '';
    const mikTexPath = 'C:\\Users\\Digital Guru\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64';
    const perlPath = 'C:\\Strawberry\\perl\\bin';
    
    console.log('Setting up environment for LaTeX check...');
    console.log('MiKTeX path:', mikTexPath);
    console.log('Perl path:', perlPath);
    
    // Add paths to the environment PATH if they're not already there
    if (!env.PATH.includes(mikTexPath)) {
      env.PATH = `${env.PATH};${mikTexPath}`;
      console.log('Added MiKTeX path to environment for check');
    }
    if (!env.PATH.includes(perlPath)) {
      env.PATH = `${env.PATH};${perlPath}`;
      console.log('Added Perl path to environment for check');
    }
    
    console.log('Checking pdflatex availability...');
    exec('pdflatex --version', { env }, (error, stdout, stderr) => {
      if (error) {
        console.log('pdflatex not found, error:', error.message);
        console.log('Trying latexmk as fallback...');
        exec('latexmk --version', { env }, (latexmkError, latexmkStdout, latexmkStderr) => {
          if (latexmkError) {
            console.log('latexmk also not found, error:', latexmkError.message);
            console.log('--- LATEX INSTALLATION CHECK FAILED ---');
            resolve(false);
          } else {
            console.log('latexmk found successfully');
            console.log('latexmk version output:', latexmkStdout.substring(0, 100) + '...');
            console.log('--- LATEX INSTALLATION CHECK PASSED (latexmk) ---');
            resolve(true);
          }
        });
      } else {
        console.log('pdflatex found successfully');
        console.log('pdflatex version output:', stdout.substring(0, 100) + '...');
        console.log('--- LATEX INSTALLATION CHECK PASSED (pdflatex) ---');
        resolve(true);
      }
    });
  });
}