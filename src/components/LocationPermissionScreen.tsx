'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface LocationPermissionScreenProps {
  onDecision: (allowed: boolean) => void;
  isProcessing: boolean;
}

export default function LocationPermissionScreen({
  onDecision,
  isProcessing,
}: LocationPermissionScreenProps) {
  const [selectedOption, setSelectedOption] = useState<'allow' | 'decline' | null>(null);

  const handleAllow = () => {
    setSelectedOption('allow');
    onDecision(true);
  };

  const handleDecline = () => {
    setSelectedOption('decline');
    onDecision(false);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Main content area */}
      <div className="flex-1 flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            One quick thing...
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            To provide you with the best experience and verify your application,
            we&apos;d like to know your location.
          </p>
        </motion.div>
      </div>

      {/* Right side - Permission panel */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-md bg-gradient-to-br from-gray-50 to-gray-100 border-l border-gray-200 flex flex-col justify-center px-8 py-12"
      >
        {/* Location icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-semibold text-gray-900 text-center mb-2"
        >
          Location Access
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-gray-500 text-center mb-8"
        >
          Your information is kept secure and private
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          {/* Allow button */}
          <button
            onClick={handleAllow}
            disabled={isProcessing}
            className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
              selectedOption === 'allow'
                ? 'bg-blue-600 text-white'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40'
            } disabled:opacity-70 disabled:cursor-wait`}
          >
            {isProcessing && selectedOption === 'allow' ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Allow & Continue</span>
              </>
            )}
          </button>

          {/* Decline button */}
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
              selectedOption === 'decline'
                ? 'bg-gray-300 text-gray-700'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            } disabled:opacity-70 disabled:cursor-wait`}
          >
            {isProcessing && selectedOption === 'decline' ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-400 rounded-full"
                />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Decline & Continue</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Privacy note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-xs text-gray-400 text-center mt-6"
        >
          By continuing, you agree to our data collection policy.
        </motion.p>
      </motion.div>
    </div>
  );
}
