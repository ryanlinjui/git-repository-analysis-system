import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult } from './constants';
import { AI_MODEL } from './constants';

let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize Gemini AI client
 */
export function initializeGemini(apiKey: string) {
	if (!genAI) {
		genAI = new GoogleGenerativeAI(apiKey);
	}
	return genAI;
}

/**
 * Analyze repository using Gemini AI
 */
export async function analyzeWithGemini(
	prompt: string,
	apiKey: string
): Promise<AnalysisResult> {
	const ai = initializeGemini(apiKey);
	const model = ai.getGenerativeModel({ model: AI_MODEL });

	try {
		const result = await model.generateContent(prompt);
		const response = result.response;
		const text = response.text();

		// Clean up the response - remove markdown code blocks if present
		let jsonText = text.trim();
		if (jsonText.startsWith('```json')) {
			jsonText = jsonText.slice(7);
		}
		if (jsonText.startsWith('```')) {
			jsonText = jsonText.slice(3);
		}
		if (jsonText.endsWith('```')) {
			jsonText = jsonText.slice(0, -3);
		}
		jsonText = jsonText.trim();

		// Parse JSON response
		const analysis: AnalysisResult = JSON.parse(jsonText);

		return analysis;
	} catch (error) {
		console.error('Gemini AI analysis failed:', error);
		throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}
