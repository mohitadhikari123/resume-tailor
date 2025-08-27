import { compileLatexToPdfOnline } from './latexOnlineCompiler.js';

export async function compileLatexToPdf(latexContent) {
  console.log('--- USING ONLINE LATEX COMPILER ---');
  return await compileLatexToPdfOnline(latexContent);
}

export function checkLatexInstallation() {
  console.log('--- CHECKING ONLINE LATEX SERVICE ---');
  return import('./latexOnlineCompiler.js').then(module => {
    return module.checkOnlineLatexService();
  });
}