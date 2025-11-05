
import React from 'react';

interface SpinnerProps {
  message?: string;
  progress?: number;
}

const Spinner: React.FC<SpinnerProps> = ({ message, progress }) => {
  const hasProgress = typeof progress === 'number';

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-md text-center">
      <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {message && <p className="text-lg text-slate-600 font-semibold">{message}</p>}
      {hasProgress && (
        <div className="w-full bg-slate-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Spinner;
