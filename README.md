# Resume Tailor

An AI-powered web application that automatically tailors your resume to match job descriptions using Google Gemini AI and LaTeX compilation.

## Features

- 🤖 **AI-Powered Customization**: Uses Google Gemini AI to intelligently modify your resume
- 📄 **LaTeX Integration**: Professional PDF generation with perfect formatting
- 🎯 **Smart Keyword Extraction**: Automatically identifies and integrates relevant skills from job descriptions
- 🚀 **Next.js App Router**: Modern React framework with server-side rendering
- 💾 **Instant Download**: Get your tailored resume as a PDF immediately
- 🔍 **System Status Check**: Built-in diagnostics to ensure everything is configured correctly

## Prerequisites

Before running this application, you need to install LaTeX on your system:

### Windows
1. **MiKTeX** (Recommended)
   - Download from: https://miktex.org/download
   - Run the installer and follow the setup wizard
   - Choose "Install missing packages on-the-fly: Yes"

2. **TeX Live** (Alternative)
   - Download from: https://tug.org/texlive/windows.html
   - This is a larger download but includes more packages

### macOS
1. **MacTeX**
   - Download from: https://tug.org/mactex/
   - Run the installer (.pkg file)
   - This includes everything you need

### Linux
1. **Ubuntu/Debian**:
   ```bash
   sudo apt-get update
   sudo apt-get install texlive-full
   ```

2. **CentOS/RHEL/Fedora**:
   ```bash
   sudo yum install texlive-scheme-full
   # or for newer versions:
   sudo dnf install texlive-scheme-full
   ```

### Verify LaTeX Installation
After installation, verify LaTeX is working:
```bash
pdflatex --version
```

You should see version information if LaTeX is properly installed.

## Setup Instructions

### 1. Clone and Install Dependencies
```bash
cd resume-tailor
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key and paste it in your `.env.local` file

### 3. Customize Your Resume Template
Edit the LaTeX resume template at `resume-template/resume.tex` with your personal information:
- Update contact information in the header
- Modify the Professional Summary
- Update Experience section with your work history
- Add your Projects
- Update Education section
- Customize Technical Skills

### 4. Run the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Input**: Paste a job description into the textarea
2. **AI Analysis**: Gemini AI extracts relevant skills and keywords from the job posting
3. **Resume Tailoring**: The AI strategically places keywords throughout your resume:
   - Professional Summary: Adds relevant soft skills and competencies
   - Experience: Enhances bullet points with relevant technologies
   - Projects: Updates descriptions to highlight matching skills
   - Technical Skills: Adds missing skills that match job requirements
4. **PDF Generation**: LaTeX compiles the tailored resume into a professional PDF
5. **Download**: The customized resume is automatically downloaded

## Project Structure

```
resume-tailor/
├── src/
│   └── app/
│       ├── api/
│       │   └── tailor/
│       │       └── route.js          # API endpoint for resume tailoring
│       ├── page.tsx                  # Main frontend interface
│       ├── layout.tsx                # App layout
│       └── globals.css               # Global styles
├── utils/
│   ├── gemini.js                     # Gemini AI integration
│   └── latexCompiler.js              # LaTeX to PDF compilation
├── resume-template/
│   └── resume.tex                    # Your LaTeX resume template
├── temp/                             # Temporary files (auto-created)
├── .env.local                        # Environment variables
└── README.md
```

## API Endpoints

### POST `/api/tailor`
Tailors a resume based on a job description.

**Request Body:**
```json
{
  "jobDescription": "Your job description text here..."
}
```

**Response:**
- Success: PDF file download
- Error: JSON with error message

### GET `/api/tailor`
Checks system status and configuration.

**Response:**
```json
{
  "status": "Resume Tailor API is running",
  "configuration": {
    "latexInstalled": true,
    "geminiConfigured": true,
    "resumeTemplateExists": true,
    "ready": true
  }
}
```

## Troubleshooting

### Common Issues

1. **"LaTeX not found" error**
   - Ensure LaTeX is installed and `pdflatex` is in your system PATH
   - Restart your terminal/command prompt after installation
   - Try running `pdflatex --version` to verify installation

2. **"Gemini API key not configured" error**
   - Check that `.env.local` exists and contains your API key
   - Ensure the key is valid and has proper permissions
   - Restart the development server after adding the key

3. **"Resume template not found" error**
   - Verify `resume-template/resume.tex` exists
   - Check file permissions

4. **PDF compilation fails**
   - Check that your LaTeX template is valid
   - Look for syntax errors in the LaTeX code
   - Ensure all required LaTeX packages are installed

5. **AI response issues**
   - Verify your Gemini API key is valid
   - Check your internet connection
   - Ensure you haven't exceeded API rate limits

### Debug Mode
To see detailed error messages, check the browser console and terminal output when running the development server.

## Customization

### Modifying the AI Prompt
Edit `utils/gemini.js` to customize how the AI tailors your resume:
- Adjust the prompt to focus on specific skills
- Change the tone or style of modifications
- Add industry-specific instructions

### Styling the Frontend
The application uses Tailwind CSS. Modify `src/app/page.tsx` to customize:
- Colors and themes
- Layout and spacing
- Component styling

### LaTeX Template
Customize `resume-template/resume.tex` to:
- Change fonts and formatting
- Add new sections
- Modify the layout structure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check the system status in the application
4. Review the console logs for detailed error messages

---

**Note**: This application requires an active internet connection for AI processing and a valid Gemini API key. LaTeX compilation is performed locally for security and performance.
