// Session management for anonymous users
// Generates and maintains a session ID for tracking analysis history

/**
 * Generates a random session ID using crypto API or fallback
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'session_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now().toString(36);
}

/**
 * Gets or creates a session ID for the current user
 */
export function getSessionId(): string {
  const STORAGE_KEY = 'angelic_session_id';
  
  try {
    // Try to get existing session ID from localStorage
    let sessionId = localStorage.getItem(STORAGE_KEY);
    
    if (!sessionId) {
      // Generate new session ID if none exists
      sessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Fallback for browsers with disabled localStorage or private mode
    console.warn('localStorage not available, using temporary session ID');
    return generateSessionId();
  }
}

/**
 * Clears the current session (useful for testing or resetting)
 */
export function clearSession(): void {
  const STORAGE_KEY = 'angelic_session_id';
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Could not clear session from localStorage');
  }
}