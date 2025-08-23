'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ApiStatus {
  latexInstalled: boolean;
  geminiConfigured: boolean;
  resumeTemplateExists: boolean;
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [mounted, setMounted] = useState(false);
  const [latexContent, setLatexContent] = useState('');

  useEffect(() => {
    setMounted(true);
    // Load previously saved LaTeX content from localStorage
    const savedLatexContent = localStorage.getItem('latestLatexContent');
    if (savedLatexContent) {
      setLatexContent(savedLatexContent);
    }
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('/api/tailor');
      const data = await response.json();
      setApiStatus(data.configuration);
    } catch (error) {
      console.error('Failed to check API status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle rate limiting errors with specific messaging
        if (response.status === 503 && errorData.type === 'rate_limit') {
          throw new Error(`${errorData.error} The AI service is experiencing high demand. Please wait ${errorData.retryAfter} seconds before trying again.`);
        }
        
        throw new Error(errorData.error || 'Failed to generate tailored resume');
      }

      // Extract LaTeX content from response headers
      const latexContentEncoded = response.headers.get('X-Latex-Content');
      if (latexContentEncoded) {
        const decodedLatexContent = decodeURIComponent(latexContentEncoded);
        setLatexContent(decodedLatexContent);
        // Save to localStorage
        localStorage.setItem('latestLatexContent', decodedLatexContent);
        localStorage.setItem('latexContentTimestamp', new Date().toISOString());
      }

      // Handle PDF download with dynamic filename
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/); 
      const filename = filenameMatch ? filenameMatch[1] : 'tailored_resume.pdf';
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Resume Tailor</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your resume with AI-powered customization. Enter a job description and get a perfectly tailored resume in seconds.
          </p>
        </div>

        {/* API Status Check */}
        {/*
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              <button
                onClick={checkApiStatus}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Check Status
              </button>
            </div>
            
            {mounted && apiStatus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`flex items-center p-3 rounded-md ${
                  apiStatus.latexInstalled ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {apiStatus.latexInstalled ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    LaTeX {apiStatus.latexInstalled ? 'Installed' : 'Not Found'}
                  </span>
                </div>
                
                <div className={`flex items-center p-3 rounded-md ${
                  apiStatus.geminiConfigured ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {apiStatus.geminiConfigured ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    Gemini API {apiStatus.geminiConfigured ? 'Configured' : 'Missing'}
                  </span>
                </div>
                
                <div className={`flex items-center p-3 rounded-md ${
                  apiStatus.resumeTemplateExists ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {apiStatus.resumeTemplateExists ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    Resume Template {apiStatus.resumeTemplateExists ? 'Found' : 'Missing'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        */}

        {/* Main Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here. Include required skills, qualifications, and responsibilities..."
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {mounted && error && (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {mounted && success && (
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <p className="text-green-700">Resume successfully tailored and downloaded!</p>
                </div>
              )}

              {/* LaTeX Content Display */}
              {mounted && latexContent && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Generated LaTeX Code</h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(latexContent);
                        alert('LaTeX content copied to clipboard!');
                      }}
                      className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <div className="bg-white border rounded-md p-3 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {latexContent}
                    </pre>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !jobDescription.trim()}
                className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Tailored Resume...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Generate Tailored Resume
                  </>
                )}
              </button>
            </form>

            {/* Instructions */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Paste the job description in the textarea above</li>
                    <li>Click "Generate Tailored Resume" to start the AI processing</li>
                    <li>Our AI will analyze the job requirements and customize your resume</li>
                    <li>A tailored PDF resume will be automatically downloaded</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Powered by Google Gemini AI and LaTeX</p>
        </div>
      </div>
    </div>
  );
}
