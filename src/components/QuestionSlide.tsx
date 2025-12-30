'use client';

import { motion } from 'framer-motion';
import { Question } from '@/lib/types';
import { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface QuestionSlideProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  isActive: boolean;
}

export default function QuestionSlide({
  question,
  value,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isActive,
}: QuestionSlideProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (isActive && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [isActive]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (question.type !== 'textarea') {
        e.preventDefault();
        handleNext();
      } else if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleNext();
      }
    }
  };

  const handleNext = () => {
    if (question.required && !value.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onNext();
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (showError && newValue.trim()) {
      setShowError(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center px-4 md:px-8"
    >
      <div className="w-full max-w-2xl">
        {/* Question header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-start gap-3 mb-2">
            <span className="question-number">{question.number}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-400">→</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mt-4 leading-relaxed">
            {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h2>
          {question.subtext && (
            <p className="text-gray-500 mt-2 text-lg">{question.subtext}</p>
          )}
        </motion.div>

        {/* Input field */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          {question.type === 'textarea' ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={question.placeholder}
              className="typeform-input resize-none min-h-[150px]"
              rows={4}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={question.type}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={question.placeholder}
              className="typeform-input"
            />
          )}

          {showError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 mt-3 text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Please fill this in
            </motion.p>
          )}
        </motion.div>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={handleNext}
            className="typeform-button"
          >
            {isLast ? 'Submit' : 'OK'}
            <svg
              className="w-4 h-4 arrow-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14m-7-7l7 7-7 7"
              />
            </svg>
          </button>

          <span className="text-sm text-gray-400">
            press <strong>Enter ↵</strong>
          </span>
        </motion.div>

        {/* Previous button (if not first question) */}
        {!isFirst && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <button
              onClick={onPrevious}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
