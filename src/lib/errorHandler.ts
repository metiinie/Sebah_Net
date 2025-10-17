import toast from 'react-hot-toast';

export const handleError = (error: unknown, context: string = 'Operation') => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error(`${context} error:`, error);
  
  // Sanitize error message for user display
  const sanitizedMessage = sanitizeErrorMessage(errorMessage);
  toast.error(`${context} failed: ${sanitizedMessage}`);
  return sanitizedMessage;
};

const sanitizeErrorMessage = (message: string): string => {
  // Remove sensitive information and technical details
  return message
    .replace(/password|token|key|secret|auth/i, '[REDACTED]')
    .replace(/at .*:\d+:\d+/g, '') // Remove stack trace locations
    .replace(/Error:|TypeError:|ReferenceError:/g, '') // Remove error types
    .trim()
    .substring(0, 200); // Limit message length
};

export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context: string = 'Operation'
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
};
