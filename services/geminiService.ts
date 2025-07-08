import { GoogleGenAI } from "@google/genai";
import type { AnalyzedJob } from '../types';

function getUserApiKey(): string | null {
    return localStorage.getItem('geminiApiKey');
}

const getAiInstance = () => {
    const apiKey = getUserApiKey();
    if (!apiKey) {
        throw new Error("No Gemini API key found. Please enter your key in the app header.");
    }
    return new GoogleGenAI({ apiKey });
};

const callGemini = async (systemInstruction: string, userPrompt: string): Promise<string> => {
     try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: userPrompt,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
            }
        });

        let jsonStr = (response.text ?? '').trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        return jsonStr;

    } catch (e) {
        console.error("Error in Gemini API call:", e);
        if (e instanceof Error && e.message.includes('API_KEY_INVALID')) {
             throw new Error("The provided API key is invalid. Please check your configuration.");
        }
        throw new Error("Failed to communicate with the AI model. Check the console for more details.");
    }
}

/**
 * Analyzes a single pasted job description against a resume using the Gemini API.
 */
export const analyzePastedJobs = async (
    resumeText: string,
    pastedJobsText: string
): Promise<AnalyzedJob | null> => {

    const systemInstruction = `You are an advanced AI assistant specialized in executive-level resume optimization and job fit analysis. You combine the judgment of a senior recruiting manager with the integrity of a personal career strategist. Your role is to analyze a resume against a specific job description.

    **Analysis Methodology:**
    1.  **Job Identification:** First, identify the job 'title' and 'company' from the provided job description. If the company is not explicitly mentioned, you can infer it or set it to 'Unknown'. If a title is not clear, use the most appropriate title you can infer.
    2.  **ATS Compatibility Score (0–100):** Provide an 'atsScore'. 80–100 = Strong fit, 60–79 = Viable with adjustments, Below 60 = Not viable.
    3.  **Qualification Assessment:** Honestly assess if the candidate is 'Under-qualified', 'Qualified', or 'Over-qualified' for the 'qualificationLevel' field.
    4.  **Candidacy Viability:** For 'candidacyViability', recommend 'Yes', 'No', or 'With adjustments'.
    5.  **Overall Fit:** Write a concise 'overallFit' summary (2-3 sentences) explaining the match level. This field must not be empty.
    6.  **Core Strengths:** List 3-5 bullet points of standout alignment in 'resumeStrengths'.
    7.  **Critical Gaps:** List what's missing and its impact in 'potentialGaps'.
    8.  **Keywords:** Extract a list of important 'suggestedKeywords' from the job description.
    9.  **Interview Questions:** Generate insightful 'interviewQuestions' based on the job and resume, focusing on bridging gaps.
    
    **Output Requirements:**
    - You MUST return your analysis as a single, raw JSON object.
    - The JSON object must conform to the structure of the AnalyzedJob type, containing all the fields mentioned above.
    - Do not include any other text, explanations, or markdown fences (like \`\`\`json\`).
    - ALWAYS return a complete and valid JSON object, even if the job description is poorly formatted or incomplete. Make a best effort to fill in the fields. The 'title' and 'overallFit' fields are mandatory and cannot be empty.`;

    const prompt = `
        Here is the candidate's resume:
        --- RESUME START ---
        ${resumeText}
        --- RESUME END ---

        Here is the single job description to analyze:
        --- JOB DESCRIPTION START ---
        ${pastedJobsText}
        --- JOB DESCRIPTION END ---

        Please provide your analysis in the specified JSON format now.
    `;

    const jsonStr = await callGemini(systemInstruction, prompt);
    const parsedData = JSON.parse(jsonStr) as AnalyzedJob;

    if (!parsedData.title || !parsedData.overallFit) {
       return null;
    }

    return parsedData;
};


/**
 * Generates a tailored resume based on an original resume and a job description.
 */
export const generateTailoredResume = async (
    originalResumeText: string,
    jobDescriptionText: string
): Promise<string> => {
     const systemInstruction = `You are an advanced AI assistant specialized in editing and tailoring executive-level resumes. You will rewrite a candidate's original resume to align it perfectly with a specific job description, while adhering to an extremely strict truth and accuracy protocol.

    **Core Task:**
    Your goal is to EDIT and ENHANCE the provided original resume. You are NOT creating a resume from scratch. The output must be a modified version of the original, not a new document with fabricated history.

    **Truth & Accuracy Protocol (MANDATORY):**
    1.  **Never Fabricate or Exaggerate:** You are strictly forbidden from inventing, fabricating, or exaggerating any part of the candidate's experience. You must not invent new job titles, companies, or employment dates. All changes must comply with the candidate's actual experience.
    2.  **Source of Truth:** The 'ORIGINAL RESUME' provided in the prompt is the ONLY source of truth for the candidate's work history, companies, job titles, and dates. Every company and role in your output MUST be present in the original resume.
    3.  **Marking Additions:** If you suggest a skill, certification, keyword, or achievement that does not already exist in the resume, you must clearly mark it as \`[NEW ADDITION]\` and state that the candidate's approval is required before integrating it.
    4.  **Honest ATS Alignment:** Do not insert industry buzzwords, keywords, or technologies unless they are reflected in the candidate's actual experience. ATS alignment must remain truthful.

    **Communication Style Requirements:**
    1.  **Language:** Use human language that is warm, precise, strategic, and mature.
    2.  **Reflect Strengths:** The tone must reflect the candidate's key strengths.
    3.  **Use these Aligned Soft Skills:**
        *   Building clarity from chaos
        *   Calm decision-making under pressure
        *   Leading across complexity, not above it
        *   Translating business needs into systems that work
        *   Seeing around corners and navigating foggy environments
    4.  **Avoid Overused Soft Skills:** Do not use phrases like "motivated," "team player," or "passionate" unless they are backed by a concrete action and impact described in the original resume.

    **Resume Creation Guidelines:**
    1.  **Foundation:** Use the provided original resume as the unchangeable foundation.
    2.  **Alignment:** Rewrite the summary and experience bullet points to directly address the requirements in the target job description.
    3.  **Keywords:** Integrate keywords from the job description naturally into the candidate's existing experience. No "keyword stuffing."
    4.  **Tone:** The tone must be human, strategic, confident, and mature. Use active language. Avoid robotic jargon.
    5.  **Formatting:** The output must be a single block of markdown-compatible plain text. Use markdown for headings (#, ##), bullets (*), and bolding (**).

    **Output Requirements:**
    -   Return ONLY the full text of the newly generated resume.
    -   Do not include any commentary, preamble, or explanations.
    -   Do not wrap the output in JSON or markdown fences.
    -   Before providing the final output, double-check that you have not invented any companies or roles that were not in the original resume text.`;

    const prompt = `
        Here is the candidate's original resume:
        --- ORIGINAL RESUME START ---
        ${originalResumeText}
        --- ORIGINAL RESUME END ---

        Here is the target job description:
        --- JOB DESCRIPTION START ---
        ${jobDescriptionText}
        --- JOB DESCRIPTION END ---

        Please generate the complete, tailored resume now based on the instructions.
    `;
    
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              // responseMimeType is not json here
            }
        });
        return response.text ?? '';
    } catch (e) {
        console.error("Error in Gemini API call for resume generation:", e);
        if (e instanceof Error && e.message.includes('API_KEY_INVALID')) {
             throw new Error("The provided API key is invalid. Please check your configuration.");
        }
        throw new Error("Failed to communicate with the AI model. Check the console for more details.");
    }
};