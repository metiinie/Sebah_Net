import { supabase, Movie, Music } from './supabase';
import toast from 'react-hot-toast';


// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
};

// Exponential backoff retry function
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries,
  baseDelay: number = RETRY_CONFIG.baseDelay
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        RETRY_CONFIG.maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Enhanced data fetching
export const dataService = {
  async fetchMovies(): Promise<Movie[]> {
    try {
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return data || [];
      });

      return result;
    } catch (error) {
      console.error('Failed to fetch movies from database:', error);
      // Don't show toast here, let the component handle the error display
      throw error; // Re-throw to let the component handle it
    }
  },

  async fetchMusic(): Promise<Music[]> {
    try {
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('music')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        return data || [];
      });

      return result;
    } catch (error) {
      console.error('Failed to fetch music from database:', error);
      // Don't show toast here, let the component handle the error display
      throw error; // Re-throw to let the component handle it
    }
  }
};

