// components/MobileQuestionSlide.tsx
'use client';

import { motion } from 'framer-motion';
import { Question } from '@/lib/types';
import { useState, useEffect, useRef, KeyboardEvent, TouchEvent } from 'react';

interface MobileQuestionSlideProps {
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

export default function MobileQuestionSlide({
  question,
  value,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  isActive,
  orientation
}: MobileQuestionSlideProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [showError, setShowError] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const touchStartX = useRef(0);
  
  useEffect(() => {
    if (isActive && inputRef.current && orientation === 'portrait') {
      // Auto-focus with delay for mobile
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isActive, orientation]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    
    // Swipe right to go previous (if not first)
    if (deltaX > 50 && !isFirst) {
      handlePrevious();
    }
    
    // Swipe left to go next (if not last)
    if (deltaX < -50 && !isLast) {
      handleNext();
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    // Mobile-optimized keyboard handling
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
  
  const handlePrevious = () => {
    onPrevious();
  };
  
  const handleChange = (newValue: string) => {
    onChange(newValue);
    setIsTouched(true);
    
    if (showError && newValue.trim()) {
      setShowError(false);
    }
  };
  
  const handleInputFocus = () => {
    // Scroll to input on mobile
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: orientation === 'portrait' ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: orientation === 'portrait' ? -50 : 50 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`mobile-question-slide ${orientation}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Question header with mobile-optimized layout */}
      <div className="question-header">
        <div className="question-number-container">
          <span className="question-number">{question.number}</span>
          <div className="question-count">
            {question.number}/{6}
          </div>
        </div>
        
        <div className="question-content">
          <h2 className="question-title">
            {question.question}
            {question.required && <span className="required-star">*</span>}
          </h2>
          
          {question.subtext && (
            <p className="question-subtext">{question.subtext}</p>
          )}
        </div>
      </div>
      
      {/* Input field with mobile optimizations */}
      <div className="input-container">
        {question.type === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={question.placeholder}
            className="mobile-textarea"
            rows={orientation === 'portrait' ? 4 : 8}
            inputMode={question.id.includes('email') ? 'email' :
                      question.id.includes('tel') ? 'tel' : 'text'}
            autoCapitalize="sentences"
            autoComplete={question.id.includes('name') ? 'name' : 
                         question.id.includes('email') ? 'email' : 
                         question.id.includes('tel') ? 'tel' : 'off'}
            spellCheck={true}
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
            onFocus={handleInputFocus}
            placeholder={question.placeholder}
            className="mobile-input"
            inputMode={question.id.includes('email') ? 'email' :
                      question.id.includes('tel') ? 'tel' :
                      question.type === 'number' ? 'numeric' : 'text'}
            autoCapitalize={question.id.includes('name') ? 'words' : 'sentences'}
            autoComplete={question.id.includes('name') ? 'name' : 
                         question.id.includes('email') ? 'email' : 
                         question.id.includes('tel') ? 'tel' : 'off'}
            spellCheck={true}
            data-required={question.required}
            data-question-id={question.id}
          />
        )}
        
        {/* Character count for mobile (if applicable) */}
        {(question.type === 'textarea' || question.type === 'text') && value.length > 0 && (
          <div className="character-count">
            {value.length} {value.length === 1 ? 'character' : 'characters'}
          </div>
        )}
        
        {/* Mobile-optimized error message */}
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mobile-error-message"
          >
            <svg className="error-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>This field is required</span>
          </motion.div>
        )}
        
        {/* Mobile input validation indicators */}
        {isTouched && !showError && value.trim() && (
          <div className="validation-success">
            <svg className="success-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        )}
      </div>
      
      {/* Mobile action buttons */}
      <div className="mobile-actions">
        {!isFirst && (
          <button
            onClick={handlePrevious}
            className="mobile-action-button secondary"
            aria-label="Previous question"
          >
            <svg className="action-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
            <span>Back</span>
          </button>
        )}
        
        <button
          onClick={handleNext}
          className={`mobile-action-button primary ${!value.trim() && question.required ? 'disabled' : ''}`}
          disabled={!value.trim() && question.required}
          aria-label={isLast ? "Submit form" : "Next question"}
        >
          <span>{isLast ? 'Submit' : 'Next'}</span>
          <svg className="action-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </button>
      </div>
      
      {/* Mobile swipe hints */}
      <div className="swipe-hints">
        {!isFirst && (
          <div className="swipe-hint left">
            <svg className="swipe-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
            <span>Swipe right to go back</span>
          </div>
        )}
        
        {!isLast && (
          <div className="swipe-hint right">
            <span>Swipe left for next</span>
            <svg className="swipe-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .mobile-question-slide {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-question-slide.landscape {
          flex-direction: row;
          align-items: center;
          gap: 40px;
        }
        
        .question-header {
          margin-bottom: 32px;
        }
        
        .mobile-question-slide.landscape .question-header {
          flex: 1;
          margin-bottom: 0;
        }
        
        .question-number-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .question-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 20px;
          font-weight: 600;
        }
        
        .question-count {
          font-size: 14px;
          opacity: 0.8;
        }
        
        .question-content {
          flex: 1;
        }
        
        .question-title {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 12px;
        }
        
        .required-star {
          color: #ff6b6b;
          margin-left: 4px;
        }
        
        .question-subtext {
          font-size: 16px;
          opacity: 0.9;
          line-height: 1.5;
        }
        
        .input-container {
          position: relative;
          margin-bottom: 32px;
        }
        
        .mobile-question-slide.landscape .input-container {
          flex: 1;
          margin-bottom: 0;
        }
        
        .mobile-input,
        .mobile-textarea {
          width: 100%;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          color: white;
          font-size: 18px;
          font-family: inherit;
          resize: none;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.2s ease;
        }
        
        .mobile-input:focus,
        .mobile-textarea:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
        }
        
        .mobile-input::placeholder,
        .mobile-textarea::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .mobile-textarea {
          line-height: 1.5;
        }
        
        .character-count {
          position: absolute;
          bottom: 10px;
          right: 15px;
          font-size: 12px;
          opacity: 0.7;
        }
        
        .mobile-error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 12px 16px;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 12px;
          color: #ff6b6b;
          font-size: 14px;
        }
        
        .error-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        
        .validation-success {
          position: absolute;
          top: 20px;
          right: 20px;
        }
        
        .success-icon {
          width: 24px;
          height: 24px;
          color: #51cf66;
        }
        
        .mobile-actions {
          display: flex;
          gap: 12px;
          margin-top: auto;
        }
        
        .mobile-question-slide.landscape .mobile-actions {
          flex-direction: column;
          gap: 16px;
        }
        
        .mobile-action-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 18px 24px;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-action-button:active {
          transform: scale(0.98);
        }
        
        .mobile-action-button.primary {
          background: white;
          color: #667eea;
        }
        
        .mobile-action-button.primary.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .mobile-action-button.primary.disabled:active {
          transform: none;
        }
        
        .mobile-action-button.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          backdrop-filter: blur(10px);
        }
        
        .action-icon {
          width: 20px;
          height: 20px;
        }
        
        .swipe-hints {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          opacity: 0.7;
          font-size: 14px;
        }
        
        .mobile-question-slide.landscape .swipe-hints {
          display: none;
        }
        
        .swipe-hint {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .swipe-icon {
          width: 16px;
          height: 16px;
        }
        
        /* Mobile-specific optimizations */
        @media (max-width: 480px) {
          .mobile-question-slide {
            padding: 16px;
          }
          
          .question-title {
            font-size: 24px;
          }
          
          .mobile-input,
          .mobile-textarea {
            padding: 16px;
            font-size: 16px;
          }
          
          .mobile-action-button {
            padding: 16px 20px;
            font-size: 15px;
          }
        }
        
        @media (max-width: 360px) {
          .question-title {
            font-size: 22px;
          }
          
          .question-subtext {
            font-size: 14px;
          }
          
          .mobile-action-button span {
            display: none;
          }
          
          .mobile-action-button {
            padding: 16px;
          }
          
          .swipe-hints {
            font-size: 12px;
          }
        }
        
        /* Landscape specific styles */
        @media (orientation: landscape) and (max-height: 600px) {
          .mobile-question-slide.landscape {
            padding: 12px;
            gap: 24px;
          }
          
          .question-title {
            font-size: 22px;
          }
          
          .question-subtext {
            font-size: 14px;
          }
          
          .mobile-input,
          .mobile-textarea {
            padding: 14px;
            font-size: 16px;
          }
        }
      `}</style>
    </motion.div>
  );
}