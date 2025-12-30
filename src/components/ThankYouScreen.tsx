'use client';

import { motion } from 'framer-motion';

interface ThankYouScreenProps {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}

export default function ThankYouScreen({
  isSubmitting,
  isSuccess,
  error,
}: ThankYouScreenProps) {
  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 md:px-8 bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          {/* Loading spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-8 border-4 border-blue-200 border-t-blue-500 rounded-full"
          />
          <h2 className="text-2xl font-medium text-gray-900">
            Submitting your application...
          </h2>
          <p className="text-gray-500 mt-2">Please wait a moment</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 md:px-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-medium text-gray-900 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="typeform-button"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-8 bg-white">
      <motion.div
        initial={{
          opacity: 0,
          filter: 'blur(20px)',
          y: 30,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 1.2,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="text-center max-w-md"
      >
        {/* Success checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </motion.div>

        {/* Thank you message */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4"
        >
          Thank you!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-xl text-gray-500 mb-8"
        >
          Your application has been submitted successfully.
          <br />
          We&apos;ll be in touch soon!
        </motion.p>

        {/* Confetti-like decorative elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                y: -100,
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                rotate: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
                rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              }}
              transition={{
                delay: 0.8 + Math.random() * 0.5,
                duration: 2 + Math.random() * 2,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][
                  Math.floor(Math.random() * 5)
                ],
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
