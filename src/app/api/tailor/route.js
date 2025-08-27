import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { tailorResumeWithGemini, tailorResumeWithGeminiKeywords } from '../../../../utils/gemini.js';
import { compileLatexToPdf } from '../../../../utils/latexCompiler.js';

export async function POST(request) {
  try {
    console.log('=== RESUME TAILOR API STARTED ===');
    
    // Parse the request body
    const body = await request.json();
    const { jobDescription } = body || {};
    const keywordsRaw = body?.keywords; // can be array or comma-separated string
    const keywords = Array.isArray(keywordsRaw)
      ? keywordsRaw.filter(Boolean).map(x => String(x).trim()).filter(Boolean)
      : (typeof keywordsRaw === 'string' ? keywordsRaw.split(',').map(s => s.trim()).filter(Boolean) : []);
    
    if (keywords.length > 0) {
      console.log('Keywords received:', keywords.join(', '));
    } else {
      console.log('Job description received:', jobDescription?.substring(0, 100) + '...');
    }
    
    if ((!keywords || keywords.length === 0) && (!jobDescription || jobDescription.trim() === '')) {
      console.log('ERROR: Neither keywords nor job description provided');
      return NextResponse.json(
        { error: 'Provide either keywords (array or comma-separated string) or a jobDescription.' },
        { status: 400 }
      );
    }
    
    // Check if Gemini API key is configured
    console.log('Checking Gemini API key configuration...');
    if (!process.env.GEMINI_API_KEY) {
      console.log('ERROR: Gemini API key not configured');
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY in .env.local' },
        { status: 500 }
      );
    }
    console.log('Gemini API key is configured ✓');
    
    
    // Read the original LaTeX resume template
    console.log('Reading resume template...');
    const resumeTemplatePath = path.join(process.cwd(), 'resume-template', 'resume.tex');
    
    if (!fs.existsSync(resumeTemplatePath)) {
      console.log('ERROR: Resume template not found at:', resumeTemplatePath);
      return NextResponse.json(
        { error: 'Resume template not found. Please ensure resume-template/resume.tex exists.' },
        { status: 500 }
      );
    }
    
    const originalResume = fs.readFileSync(resumeTemplatePath, 'utf8');
    console.log('Resume template loaded, length:', originalResume.length, 'characters');
    
    // Call Gemini API to tailor the resume
    console.log('Calling Gemini API to tailor resume...');
    const tailoredLatex = keywords.length > 0
      ? await tailorResumeWithGeminiKeywords(keywords, originalResume)
      : await tailorResumeWithGemini(jobDescription, originalResume);
    console.log('Gemini API response received, tailored LaTeX length:', tailoredLatex.length, 'characters');
    
    // Compile the tailored LaTeX to PDF
    console.log('Compiling LaTeX to PDF...');
    const pdfBuffer = await compileLatexToPdf(tailoredLatex);
    console.log('PDF compilation successful, buffer size:', pdfBuffer.length, 'bytes');
    
    // Generate filename with current date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB').replace(/\//g, '');
    
    // Detect file type based on buffer content
    const isPNG = pdfBuffer[0] === 0x89 && pdfBuffer[1] === 0x50 && pdfBuffer[2] === 0x4E && pdfBuffer[3] === 0x47;
    const contentType = isPNG ? 'image/png' : 'application/pdf';
    const fileExtension = isPNG ? 'png' : 'pdf';
    const filename = `Mohit_Adhikari_Resume_${formattedDate}.${fileExtension}`;
    
    console.log('File type detected:', contentType);
    console.log('=== RESUME TAILOR API COMPLETED SUCCESSFULLY ===');
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Latex-Content': encodeURIComponent(tailoredLatex),
      },
    });
    
  } catch (error) {
    console.error('Error in tailor API route:', error);
    
    // Handle specific error types
    if (error.message.includes('503') || 
        error.message.includes('429') || 
        error.message.includes('overloaded') ||
        error.message.includes('Service Unavailable') ||
        error.message.includes('Too Many Requests')) {
      return NextResponse.json(
        { 
          error: 'AI service is temporarily overloaded. Please try again in a few minutes.',
          retryAfter: 60,
          type: 'rate_limit'
        },
        { status: 503 }
      );
    }
    
    if (error.message.includes('Gemini API')) {
      return NextResponse.json(
        { error: 'Failed to process resume with AI. Please check your API key and try again.' },
        { status: 500 }
      );
    }
    
    if (error.message.includes('LaTeX compilation')) {
      return NextResponse.json(
        { 
          error: 'Failed to compile PDF using online LaTeX service.',
          details: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle GET requests to check API status
export async function GET() {
  try {
    const geminiConfigured = !!process.env.GEMINI_API_KEY;
    const resumeTemplateExists = fs.existsSync(
      path.join(process.cwd(), 'resume-template', 'resume.tex')
    );
    
    return NextResponse.json({
      status: 'Resume Tailor API is running',
      configuration: {
        onlineLatexEnabled: true,
        geminiConfigured,
        resumeTemplateExists,
        ready: geminiConfigured && resumeTemplateExists
      }
    });
  } catch (err) {
    console.error('API status check error:', err);
    return NextResponse.json(
      { error: 'Failed to check API status' },
      { status: 500 }
    );
  }
}