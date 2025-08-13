
/**
 * Environment variable validation for MALLEX
 * Validates required Firebase configuration at app startup
 */

export interface RequiredEnv {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_APP_ID: string;
}

/**
 * Validates that all required environment variables are present
 * @throws Error if any required environment variable is missing
 */
export function assertEnv(): RequiredEnv {
  const env = import.meta.env;
  
  const required = {
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID,
  };

  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(required)) {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('ENV Validation Failed:', errorMessage);
    throw new Error(errorMessage);
  }

  return required as RequiredEnv;
}
