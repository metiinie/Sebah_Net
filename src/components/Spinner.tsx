
export const Spinner = ({ label }: { label?: string }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">{label || 'Loading...'}</p>
      </div>
    </div>
  );
};


