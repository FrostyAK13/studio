/**
 * @fileoverview This file initializes the Genkit AI instance with the Google AI plugin.
 * It ensures that the AI capabilities are available throughout the server-side
 * of the application. The `ai` object exported from this file should be used
 * for all AI-related tasks, such as defining flows and prompts.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize Genkit and configure the Google AI plugin.
// The plugin is configured automatically based on environment variables.
export const ai = genkit({
  plugins: [googleAI()],
});
