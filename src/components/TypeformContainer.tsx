'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { questions, FormData, LocationData } from '@/lib/types';
import { getLocationData } from '@/lib/geolocation';
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
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const handleStart = useCallback(() => {
    setFormState('location-permission');
  }, []);

  const handleLocationAllow = useCallback(async () => {
    setIsRequestingLocation(true);
    try {
      const data = await getLocationData();
      setLocationData(data);
    } catch (err) {
      console.error('Failed to get location:', err);
    }
    setIsRequestingLocation(false);
    setFormState('form');
  }, []);

  const handleLocationDeny = useCallback(() => {
    // Still get IP-based data even if geolocation is denied
    getLocationData()
      .then(setLocationData)
      .catch(console.error);
    setFormState('form');
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
      // Submit form
      setFormState('submitting');

      const formData: FormData = {
        answers: answers as FormData['answers'],
        location: locationData,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
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

      {/* Location Permission Modal */}
      <AnimatePresence>
        {formState === 'location-permission' && (
          <LocationPermissionScreen
            onAllow={handleLocationAllow}
            onDeny={handleLocationDeny}
            isRequesting={isRequestingLocation}
          />
        )}
      </AnimatePresence>

      {/* Keyboard navigation hint */}
      {formState === 'form' && (
        <div className="fixed bottom-8 right-8 hidden md:flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-mono">
              ↑
            </kbd>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-mono">
              ↓
            </kbd>
            <span>Navigate</span>
          </div>
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
