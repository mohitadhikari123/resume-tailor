import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to clean Gemini response and extract pure LaTeX code
function cleanLatexResponse(response) {
  // Only fix }{} patterns that appear after \resumeProjectHeading commands
  // Use a non-greedy, multiline-capable match to cross line breaks inside the first argument
  // This prevents modifying legitimate LaTeX syntax in other parts
  let cleaned = response.replace(/(\\resumeProjectHeading[\s\S]*?)\}\s*\{\s*\}/g, '$1}}{}');
  return cleaned;
}

export async function tailorResumeWithGemini(jobDescription, resumeLatex) {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`--- GEMINI API CALL STARTED (Attempt ${attempt}/${maxRetries}) ---`);
      console.log('Job description length:', jobDescription.length, 'characters');
      console.log('Original resume length:', resumeLatex.length, 'characters');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      // const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      console.log('Gemini model initialized: gemini-2.0-flash');
      
      const prompt = `
You are an expert resume tailor and LaTeX specialist. Your task is to modify the provided LaTeX resume to better match the job description while maintaining perfect LaTeX formatting.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL LATEX RESUME:
${resumeLatex}

INSTRUCTIONS:
1. EXTRACT KEYWORDS: Thoroughly identify BOTH technical and non-technical elements from the job description:
   - Hard skills: technical skills, tools, frameworks, languages, platforms
   - Soft skills: leadership, communication, problem-solving, business acumen, strategic thinking
   - Domain knowledge: regulatory reporting, business requirements, data analytics
   - Methodologies: software development practices, automation, testing approaches

2. STRATEGIC PLACEMENT: Naturally integrate these keywords throughout the resume in these sections:
   - Professional Summary: Add relevant soft skills and key technical competencies
   - Experience: Enhance bullet points with relevant technologies and methodologies
   - Projects: Update project descriptions to highlight relevant technologies
   - Technical Skills: Add missing technical skills that match the job requirements

3. LATEX FORMATTING RULES:
   - NEVER break LaTeX syntax or commands
   - Maintain all existing LaTeX structure and formatting
   - Keep all \\, {}, [], and other LaTeX special characters intact
   - Preserve spacing, indentation, and line breaks
   - Do not modify document class, packages, or formatting commands
   - Only modify the CONTENT within LaTeX commands, not the commands themselves
   - CRITICAL: Never add empty braces {} after LaTeX commands like \\resumeProjectHeading
   - CRITICAL: Ensure all opening braces { have matching closing braces }
   - CRITICAL: Do not break multi-line LaTeX commands across incorrect line boundaries
   - CRITICAL: For \\resumeProjectHeading commands, ALWAYS use this exact format:
     \\resumeProjectHeading
     {First parameter content here}{}
   - CRITICAL: Never leave \\resumeProjectHeading commands with unclosed braces
   - CRITICAL: Always ensure \\resumeProjectHeading has exactly TWO parameters: {content}{}

4. CONTENT GUIDELINES:
   - Make changes feel natural and authentic
   - Don't oversaturate with keywords - maintain readability
   - Ensure all added content is relevant and realistic
   - Keep the same professional tone and style
   - Maintain factual consistency (don't change dates, company names, etc.)
   - NEVER add years of experience (like "0-2 years") - the candidate is a fresh graduate
   - NEVER add skills the candidate doesn't have (like C#, .NET)
   - NEVER add mobile development experience unless explicitly mentioned in the original resume

5. FOCUS AREAS:
   - If the job requires specific programming languages, ensure they're prominent in Technical Skills
   - If the job mentions specific frameworks/tools, incorporate them into relevant experience or projects
   - EMPHASIZE soft skills like business acumen, strategic thinking, and problem-solving throughout the resume
   - HIGHLIGHT experience with business requirements analysis and regulatory reporting if mentioned
   - If the job mentions specific methodologies (Agile, DevOps, etc.), include them where appropriate
   - ENSURE data analytics capabilities are properly represented if relevant to the position
   - LIMIT the number of technical skills added - focus on quality over quantity


6. EXCLUDED TECHNICAL KEYWORDS: DO NOT add or emphasize these specific technologies in the resume:
   - Java JDK 17+
   - Docker
   - Kubernetes
   - Apache Kafka
   - Spark
   - Elasticsearch
   - Angular
   - AWS
   - Jenkins
   - SonarQube
   - Nexus Repo
   - Gitlab
   - Gradle (Kotlin DSL)
   - TDD
   - CI/CD
   7. CRITICAL SOFT SKILLS: Ensure these soft skills are prominently featured in the resume if mentioned in the job description:
   - Business Acumen
   - Strategic Thinking
   - Problem Solving Skills
   - Regulatory Reporting knowledge
   - Business Requirements analysis
   - Software Development practices
   - Analytical Skills
CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY the complete modified LaTeX code
- Do NOT wrap the code in markdown code blocks (triple backticks with latex or just triple backticks)
- Do NOT include any explanations, comments, or additional text before or after the LaTeX code
- Do NOT add any introductory text like "Here is the modified resume:" or similar
- The response should start directly with \documentclass and end with \end{document}
- The output must be pure LaTeX code that can be directly compiled without any modifications
`;

      console.log('Sending request to Gemini API...');
      const result = await model.generateContent(prompt);
      console.log('Gemini API request completed');
      
      const response = await result.response;
      console.log('Gemini API response:', response.text());
      let tailoredResume = response.text();

      // tailoredResume = cleanLatexResponse(tailoredResume);
      // console.log('- tailoredResume:', tailoredResume);

      
      return tailoredResume;
    } catch (error) {
      console.error(`Gemini API error (attempt ${attempt}/${maxRetries}):`, error);
      
      // Check if it's a rate limit or service unavailable error
      const isRetryableError = error.message.includes('503') || 
                              error.message.includes('429') || 
                              error.message.includes('overloaded') ||
                              error.message.includes('Service Unavailable') ||
                              error.message.includes('Too Many Requests');
      
      if (attempt === maxRetries || !isRetryableError) {
        throw new Error(`Failed to tailor resume with Gemini API after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}