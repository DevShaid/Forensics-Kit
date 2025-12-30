'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { questions, FormData, LocationData } from '@/lib/types';
import { getBasicLocationData, getFullLocationData } from '@/lib/geolocation';
import WelcomeScreen from './WelcomeScreen';
import QuestionSlide from './QuestionSlide';
import ThankYouScreen from './ThankYouScreen';
import ProgressBar from './ProgressBar';
import LocationPermissionScreen from './LocationPermissionScreen';

type FormState = 'welcome' | 'location-permission' | 'form' | 'submitting' | 'success' | 'error';

export default function TypeformContainer() {
  const [formState, setFormState] = useState<FormState>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
    question5: '',
    question6: '',
  });
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStart = useCallback(() => {
    setFormState('location-permission');
  }, []);

  // Handle permission decision - sends FIRST email immediately
  const handlePermissionDecision = useCallback(async (allowed: boolean) => {
    setIsProcessing(true);

    try {
      let location: LocationData;

      if (allowed) {
        // User clicked Allow - get full location (triggers browser popup)
        location = await getFullLocationData();
      } else {
        // User clicked Decline - only get IP-based data (no popup)
        location = await getBasicLocationData();
      }

      setLocationData(location);

      // Send FIRST email immediately with permission decision
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'permission',
          allowed,
          location,
          timestamp: new Date().toISOString(),
        }),
      });

      // Proceed to form
      setFormState('form');
    } catch (err) {
      console.error('Error processing permission:', err);
      // Still proceed to form even if email fails
      setFormState('form');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleAnswerChange = useCallback((value: string) => {
    const questionId = questions[currentQuestion].id;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, [currentQuestion]);

  const handleNext = useCallback(async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // Submit form - sends SECOND email with all responses
      setFormState('submitting');

      const formData: FormData = {
        answers: answers as FormData['answers'],
        location: locationData,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'form',
            ...formData,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit form');
        }

        setFormState('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setFormState('error');
      }
    }
  }, [currentQuestion, answers, locationData]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  return (
    <div className="relative">
      {formState === 'form' && (
        <ProgressBar
          current={currentQuestion + 1}
          total={questions.length}
        />
      )}

      <AnimatePresence mode="wait">
        {formState === 'welcome' && (
          <WelcomeScreen key="welcome" onStart={handleStart} />
        )}

        {formState === 'location-permission' && (
          <LocationPermissionScreen
            key="permission"
            onDecision={handlePermissionDecision}
            isProcessing={isProcessing}
          />
        )}

        {formState === 'form' && (
          <QuestionSlide
            key={`question-${currentQuestion}`}
            question={questions[currentQuestion]}
            value={answers[questions[currentQuestion].id]}
            onChange={handleAnswerChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirst={currentQuestion === 0}
            isLast={currentQuestion === questions.length - 1}
            isActive={true}
          />
        )}

        {(formState === 'submitting' ||
          formState === 'success' ||
          formState === 'error') && (
          <ThankYouScreen
            key="thankyou"
            isSubmitting={formState === 'submitting'}
            isSuccess={formState === 'success'}
            error={error}
          />
        )}
      </AnimatePresence>

      {/* Keyboard navigation hint */}
      {formState === 'form' && (
        <div className="fixed bottom-8 right-8 hidden md:flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-mono">
              Enter
            </kbd>
            <span>Continue</span>
          </div>
        </div>
      )}
    </div>
  );
}
