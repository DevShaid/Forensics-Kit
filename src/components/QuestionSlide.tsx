// components/QuestionSlide.tsx
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
  orientation: 'portrait' | 'landscape';
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
  orientation
}: QuestionSlideProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (isActive && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isActive]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (question.type !== 'textarea') {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center px-8 py-16"
    >
      <div className="max-w-3xl w-full">
        {/* Question header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <span className="question-number">{question.number}</span>
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">
                {question.question}
                {question.required && <span className="text-red-500 ml-2">*</span>}
              </h2>
              {question.subtext && (
                <p className="text-lg text-gray-600 mt-2">{question.subtext}</p>
              )}
            </div>
          </div>
        </div>

        {/* Input field */}
        <div className="mb-12">
          {question.type === 'textarea' ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={question.placeholder}
              className="typeform-input resize-none"
              rows={3}
              autoComplete="off"
              data-required={question.required}
              data-question-id={question.id}
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
              autoComplete="off"
              data-required={question.required}
              data-question-id={question.id}
            />
          )}

          {/* Error message */}
          {showError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-red-500 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>This field is required</span>
            </motion.div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleNext}
            className="typeform-button"
            disabled={question.required && !value.trim()}
          >
            <span>{isLast ? 'Submit' : 'OK'}</span>
            <svg className="arrow-icon w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          {!isFirst && (
            <button
              onClick={onPrevious}
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              ↑ Previous
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="mt-8 text-sm text-gray-400 flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-mono">
            Enter ↵
          </kbd>
          <span>to continue</span>
        </div>
      </div>
    </motion.div>
  );
}
