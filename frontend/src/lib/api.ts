/**
 * API service functions to communicate with the Python Flask backend
 */

// Base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ChatResponse {
  user_id?: string;
  query: string;
  response: string;
  status: string;
  category?: string;
}

interface ApiError {
  error: string;
  status: string;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest<T>(endpoint: string, data: any): Promise<T> {
  try {
    console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);
    console.log('Request data:', data);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('API Response:', result);

    if ('error' in result) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the backend. Please ensure the backend server is running on http://localhost:5000');
    }
    throw error;
  }
}

/**
 * General chat endpoint that routes through the orchestrator
 */
export async function sendChatMessage(query: string, userId: string): Promise<string> {
  try {
    const data = await apiRequest<ChatResponse>('/chat', {
      query,
      user_id: userId,
    });
    return data.response;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Basic query endpoint for simple questions
 */
export async function sendBasicQuery(query: string, userId: string): Promise<string> {
  try {
    const data = await apiRequest<ChatResponse>('/basicquery', {
      query,
      user_id: userId,
    });
    return data.response;
  } catch (error) {
    console.error('Error sending basic query:', error);
    throw error;
  }
}

/**
 * Consultation endpoint for consultation-related queries
 */
export async function sendConsultationQuery(query: string): Promise<string> {
  try {
    const data = await apiRequest<ChatResponse>('/consultation', {
      query,
    });
    return data.response;
  } catch (error) {
    console.error('Error sending consultation query:', error);
    throw error;
  }
}

/**
 * Exercise endpoint for exercise-related queries
 */
export async function sendExerciseQuery(query: string): Promise<string> {
  try {
    const data = await apiRequest<ChatResponse>('/exercise', {
      query,
    });
    return data.response;
  } catch (error) {
    console.error('Error sending exercise query:', error);
    throw error;
  }
}

/**
 * Diet endpoint for diet-related queries
 */
export async function sendDietQuery(query: string): Promise<string> {
  try {
    const data = await apiRequest<ChatResponse>('/diet', {
      query,
    });
    return data.response;
  } catch (error) {
    console.error('Error sending diet query:', error);
    throw error;
  }
}

/**
 * Generic helper to format consultation queries for the backend
 */
export function formatConsultationQuery(symptom: string, userName: string): string {
  return `Generate a personalized consultation for ${userName} focusing on their primary symptom: ${symptom}. Please provide a consultation paragraph, diet plan recommendations, and exercise plan recommendations.`;
}

/**
 * Generic helper to format dietary recommendation queries
 */
export function formatDietaryRecommendationQuery(symptoms: string[]): string {
  if (symptoms.length === 0) {
    return "Provide general dietary recommendations for menopause wellness.";
  }
  return `Based on these symptoms: ${symptoms.join(', ')}, provide dietary recommendations for menopause wellness. Format the response with bullet points and include a disclaimer about consulting healthcare professionals.`;
}

/**
 * Generic helper to format self-care tip queries
 */
export function formatSelfCareTipsQuery(symptoms: string[]): string {
  if (symptoms.length === 0) {
    return "Provide general self-care tips for menopause wellness.";
  }
  return `Based on these symptoms: ${symptoms.join(', ')}, provide self-care tips and wellness recommendations for managing menopause.`;
}

/**
 * Generic helper to format report summary queries
 */
export function formatReportSummaryQuery(symptomData: any): string {
  return `Generate a health report summary based on the following symptom data: ${JSON.stringify(symptomData)}. Provide insights and trends analysis.`;
}

/**
 * Health check endpoint to test backend connectivity
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Test endpoint for quick connectivity check
 */
export async function testConnection(): Promise<string> {
  try {
    const data = await apiRequest<ChatResponse>('/basicquery', {
      query: 'Hello, this is a test connection',
      user_id: 'test-user',
    });
    return data.response;
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  }
}
