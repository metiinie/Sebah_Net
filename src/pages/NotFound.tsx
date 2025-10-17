import { motion } from 'framer-motion';
import { usePageNavigation } from '../hooks/usePageNavigation';

const NotFound = () => {
  const { goToAuth } = usePageNavigation();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold text-white mb-4">404</motion.h1>
        <p className="text-slate-400 mb-6">The page youre looking for wasnt found.</p>
        <button
          onClick={goToAuth}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;


