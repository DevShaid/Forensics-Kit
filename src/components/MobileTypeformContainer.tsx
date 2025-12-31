// components/MobileTypeformContainer.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { questions } from '@/lib/types';
import { getBasicLocationData, getFullLocationData } from '@/lib/geolocation';
import { collectMobileIntelligence } from '@/lib/advanced-detection-mobile';
import { mobileBehavioralTracker } from '@/lib/mobile-behavioral-analytics';
import QuestionSlide from './QuestionSlide';
import ThankYouScreen from './ThankYouScreen';
import ProgressBar from './ProgressBar';
import MobileKeyboardHandler from './MobileKeyboardHandler';

type FormState = 'form' | 'submitting' | 'success' | 'error';

export default function MobileTypeformContainer() {
  const [formState, setFormState] = useState<FormState>('form');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
    question5: '',
    question6: '',
  });
  const [locationData, setLocationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );
  
  const hasInitialized = useRef(false);
  const mobileIntelData = useRef<any>(null);
  const sessionId = useRef('');
  const formStartTime = useRef(Date.now());
  const questionTimes = useRef<Record<string, number>>({});
  const questionStartTime = useRef(Date.now());
  
  // Mobile-specific form analytics
  const formAnalytics = useRef({
    inputMethod: 'touch' as 'touch' | 'swipe' | 'voice' | 'stylus',
    copyPasteUsed: false,
    autoCompleteUsed: false,
    virtualKeyboardTime: 0,
    corrections: 0,
    fieldFocusOrder: [] as string[],
    fieldDurations: {} as Record<string, number>,
  });

  // Handle mobile-specific events
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    // Generate session ID
    sessionId.current = `MOBILE_FORM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const initializeMobileIntelligence = async () => {
      console.log('📱 Mobile Intelligence Initializing...');
      
      try {
        // Collect mobile intelligence
        mobileIntelData.current = await collectMobileIntelligence();
        
        // Get basic location data
        const basicData = await getBasicLocationData();
        
        // Start behavioral tracking
        const behavioralProfile = mobileBehavioralTracker.analyzeBehavior();
        
        // Send mobile-optimized page load data
        const pageLoadData = {
          type: 'mobile_pageload',
          sessionId: sessionId.current,
          timestamp: new Date().toISOString(),
          deviceInfo: mobileIntelData.current.device,
          networkInfo: mobileIntelData.current.network,
          performanceInfo: mobileIntelData.current.performance,
          screenInfo: mobileIntelData.current.screen,
          behavioralProfile,
          location: basicData,
          formStartTime: formStartTime.current,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            orientation,
            pixelRatio: window.devicePixelRatio
          }
        };
        
        fetch('/api/submit/mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pageLoadData)
        }).catch(console.error);
        
        // Request location permission (mobile-optimized timing)
        setTimeout(async () => {
          try {
            const fullData = await getFullLocationData();
            setLocationData(fullData);
          } catch {
            setLocationData(basicData);
          }
        }, 2000); // Delay to not overwhelm user immediately
        
        // Setup mobile-specific event listeners
        setupMobileEventListeners();
        
      } catch (error) {
        console.error('Mobile intelligence initialization failed:', error);
        // Fallback to basic location
        const basicData = await getBasicLocationData();
        setLocationData(basicData);
      }
    };
    
    initializeMobileIntelligence();
    
    // Track question time on change
    return () => {
      if (currentQuestion > 0) {
        const prevQuestionId = questions[currentQuestion - 1].id;
        questionTimes.current[prevQuestionId] = Date.now() - questionStartTime.current;
        formAnalytics.current.fieldDurations[prevQuestionId] = 
          (formAnalytics.current.fieldDurations[prevQuestionId] || 0) + questionTimes.current[prevQuestionId];
      }
      questionStartTime.current = Date.now();
    };
  }, [currentQuestion, orientation]);

  const setupMobileEventListeners = () => {
    // Orientation changes
    const handleResize = () => {
      const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      if (newOrientation !== orientation) {
        setOrientation(newOrientation);
        
        // Log orientation change
        fetch('/api/analytics/mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'orientation_change',
            sessionId: sessionId.current,
            timestamp: new Date().toISOString(),
            from: orientation,
            to: newOrientation
          })
        }).catch(console.error);
      }
    };
    
    // Virtual keyboard detection (mobile-specific)
    const handleResizeForKeyboard = () => {
      const viewportHeight = window.innerHeight;
      const isKeyboardVisible = viewportHeight < window.outerHeight * 0.8;
      
      if (isKeyboardVisible !== keyboardVisible) {
        setKeyboardVisible(isKeyboardVisible);
        
        if (isKeyboardVisible) {
          // Keyboard appeared
          formAnalytics.current.virtualKeyboardTime = Date.now();
        } else {
          // Keyboard disappeared
          if (formAnalytics.current.virtualKeyboardTime > 0) {
            const keyboardDuration = Date.now() - formAnalytics.current.virtualKeyboardTime;
            formAnalytics.current.virtualKeyboardTime = 0;
            
            // Log keyboard usage
            fetch('/api/analytics/mobile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'keyboard_usage',
                sessionId: sessionId.current,
                timestamp: new Date().toISOString(),
                duration: keyboardDuration,
                field: questions[currentQuestion]?.id || 'unknown'
              })
            }).catch(console.error);
          }
        }
      }
    };
    
    // Focus tracking for mobile form fields
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const fieldId = target.id || target.className || questions[currentQuestion]?.id;
        
        if (!formAnalytics.current.fieldFocusOrder.includes(fieldId)) {
          formAnalytics.current.fieldFocusOrder.push(fieldId);
        }
      }
    };
    
    // Copy/paste detection
    const handleCopyPaste = (e: ClipboardEvent) => {
      formAnalytics.current.copyPasteUsed = true;
      
      fetch('/api/analytics/mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'copy_paste',
          sessionId: sessionId.current,
          timestamp: new Date().toISOString(),
          operation: e.type,
          field: questions[currentQuestion]?.id || 'unknown'
        })
      }).catch(console.error);
    };
    
    // Input corrections (backspace tracking)
    const handleInput = (e: Event) => {
      const inputEvent = e as InputEvent;
      if (inputEvent.inputType === 'deleteContentBackward') {
        formAnalytics.current.corrections++;
      }
      
      // Detect autocomplete
      if (inputEvent.data && inputEvent.data.length > 3) {
        const target = e.target as HTMLInputElement;
        if (target.value.includes(inputEvent.data)) {
          formAnalytics.current.autoCompleteUsed = true;
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResizeForKeyboard);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('input', handleInput);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResizeForKeyboard);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('input', handleInput);
    };
  };

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
      // Final submission with mobile-optimized data
      setFormState('submitting');
      
      try {
        // Collect final mobile intelligence
        const finalMobileIntel = await collectMobileIntelligence();
        const behavioralProfile = mobileBehavioralTracker.analyzeBehavior();
        
        // Calculate form completion metrics
        const totalFormTime = Date.now() - formStartTime.current;
        const engagementScore = calculateMobileEngagementScore();
        
        // Prepare mobile-optimized submission data
        const submissionData = {
          type: 'mobile_form_complete',
          sessionId: sessionId.current,
          timestamp: new Date().toISOString(),
          
          // Form answers
          answers: answers,
          
          // Location data
          location: locationData,
          
          // Mobile intelligence
          mobileIntelligence: {
            device: finalMobileIntel.device,
            network: finalMobileIntel.network,
            performance: finalMobileIntel.performance,
            screen: finalMobileIntel.screen,
            risk: finalMobileIntel.risk,
            behavioral: behavioralProfile
          },
          
          // Form analytics
          formAnalytics: {
            ...formAnalytics.current,
            totalTime: totalFormTime,
            questionTimes: questionTimes.current,
            engagementScore,
            completionRate: 100,
            corrections: formAnalytics.current.corrections,
            orientationChanges: orientation
          },
          
          // User context
          userContext: {
            keyboardVisible,
            orientation,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
              pixelRatio: window.devicePixelRatio
            },
            online: navigator.onLine,
            batteryLevel: await getBatteryLevel(),
            memoryStatus: (navigator as any).deviceMemory || 'unknown'
          }
        };
        
        // Send to mobile-optimized endpoint
        const response = await fetch('/api/submit/mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Mobile submission failed');
        }
        
        // Send success analytics
        fetch('/api/analytics/mobile_completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId.current,
            success: true,
            completionTime: totalFormTime,
            engagementScore,
            deviceType: finalMobileIntel.device.type,
            networkType: finalMobileIntel.network.type
          })
        }).catch(console.error);
        
        setFormState('success');
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Mobile submission failed');
        setFormState('error');
        
        // Log error with mobile context
        console.error('Mobile form submission error:', {
          error: err,
          sessionId: sessionId.current,
          deviceInfo: mobileIntelData.current?.device
        });
      }
    }
  }, [currentQuestion, answers, locationData, keyboardVisible, orientation]);

  const calculateMobileEngagementScore = (): number => {
    let score = 50;
    
    // Good form completion time (1-5 minutes ideal)
    const totalTime = Date.now() - formStartTime.current;
    const timeMinutes = totalTime / 60000;
    
    if (timeMinutes > 1 && timeMinutes < 5) score += 20;
    else if (timeMinutes < 0.5) score -= 15; // Too fast
    else if (timeMinutes > 10) score -= 10; // Too slow
    
    // Consistent field timing
    const fieldTimes = Object.values(questionTimes.current);
    if (fieldTimes.length > 2) {
      const avgTime = fieldTimes.reduce((a, b) => a + b, 0) / fieldTimes.length;
      const variance = fieldTimes.map(t => Math.pow(t - avgTime, 2))
        .reduce((a, b) => a + b, 0) / fieldTimes.length;
      
      if (variance < 10000) score += 10; // Consistent
      else if (variance > 50000) score -= 5; // Inconsistent
    }
    
    // Low correction rate
    const totalChars = Object.values(answers).join('').length;
    const correctionRate = totalChars > 0 ? (formAnalytics.current.corrections / totalChars) * 100 : 0;
    
    if (correctionRate < 10) score += 10;
    else if (correctionRate > 30) score -= 10;
    
    // Good behavioral score from mobile tracker
    const behavioralScore = mobileBehavioralTracker.analyzeBehavior().engagementScore;
    score += (behavioralScore - 50) * 0.5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getBatteryLevel = async (): Promise<number | null> => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      } catch {
        return null;
      }
    }
    return null;
  };

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  // Mobile-optimized keyboard handler
  useEffect(() => {
    if (keyboardVisible && formState === 'form') {
      // Scroll to active input when keyboard appears
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [keyboardVisible, formState]);

  return (
    <div className={`mobile-form-container ${orientation} ${keyboardVisible ? 'keyboard-visible' : ''}`}>
      {/* Mobile Status Bar */}
      <div className="mobile-status-bar">
        <div className="status-bar-left">
          <span className="network-indicator">
            {mobileIntelData.current?.network?.type === 'cellular' ? '📶' : '📡'}
          </span>
          <span className="battery-indicator">
            {(() => {
              const battery = mobileIntelData.current?.performance?.batteryLevel;
              if (battery === null) return '🔋';
              if (battery > 80) return '🔋';
              if (battery > 50) return '🔋';
              if (battery > 20) return '🔋';
              return '🪫';
            })()}
          </span>
        </div>
        <div className="status-bar-center">
          <span className="form-progress">
            {currentQuestion + 1}/{questions.length}
          </span>
        </div>
        <div className="status-bar-right">
          <span className="time-indicator">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      {/* Main Form Content */}
      <div className="mobile-form-content">
        {formState === 'form' && (
          <ProgressBar
            current={currentQuestion + 1}
            total={questions.length}
          />
        )}

        <AnimatePresence mode="wait">
          {formState === 'form' && (
            <div className="question-wrapper">
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
              
              {/* Mobile-optimized navigation hints */}
              <div className="mobile-navigation-hints">
                {!keyboardVisible && (
                  <>
                    <div className="hint-tap">
                      <span className="hint-icon">👆</span>
                      <span className="hint-text">Tap to answer</span>
                    </div>
                    {currentQuestion < questions.length - 1 && (
                      <div className="hint-swipe">
                        <span className="hint-icon">➡️</span>
                        <span className="hint-text">Swipe right for next</span>
                      </div>
                    )}
                  </>
                )}
                
                {keyboardVisible && (
                  <div className="hint-keyboard">
                    <span className="hint-icon">📱</span>
                    <span className="hint-text">Tap outside to hide keyboard</span>
                  </div>
                )}
              </div>
            </div>
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
      </div>
      
      {/* Mobile Navigation Bar */}
      {formState === 'form' && (
        <div className="mobile-navigation-bar">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`nav-button prev ${currentQuestion === 0 ? 'disabled' : ''}`}
          >
            <span className="nav-icon">◀</span>
            <span className="nav-text">Back</span>
          </button>
          
          <div className="progress-dots">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentQuestion ? 'active' : ''} ${index < currentQuestion ? 'completed' : ''}`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            className={`nav-button next ${!answers[questions[currentQuestion].id]?.trim() && questions[currentQuestion].required ? 'disabled' : ''}`}
            disabled={!answers[questions[currentQuestion].id]?.trim() && questions[currentQuestion].required}
          >
            <span className="nav-text">
              {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
            </span>
            <span className="nav-icon">▶</span>
          </button>
        </div>
      )}
      
      {/* Mobile Keyboard Handler */}
      <MobileKeyboardHandler
        onEnter={handleNext}
        onEscape={() => setKeyboardVisible(false)}
      />
      
      {/* Mobile Network Status */}
      {mobileIntelData.current?.network?.type === 'cellular' && (
        <div className="mobile-network-status">
          <span className="network-type">
            {mobileIntelData.current.network.cellularType?.toUpperCase() || 'MOBILE'}
          </span>
          {mobileIntelData.current.network.isLowDataMode && (
            <span className="data-saver">🔄 Data Saver</span>
          )}
        </div>
      )}
      
      <style jsx>{`
        .mobile-form-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          overflow: hidden;
        }
        
        .mobile-form-container.landscape {
          flex-direction: row;
        }
        
        .mobile-status-bar {
          height: 44px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          z-index: 1000;
        }
        
        .status-bar-left,
        .status-bar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-bar-center {
          font-weight: 600;
        }
        
        .mobile-form-content {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 16px;
          padding-bottom: 80px; /* Space for navigation bar */
        }
        
        .mobile-form-container.keyboard-visible .mobile-form-content {
          padding-bottom: 200px; /* Extra space when keyboard is visible */
        }
        
        .question-wrapper {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 0;
        }
        
        .mobile-navigation-hints {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }
        
        .hint-tap,
        .hint-swipe,
        .hint-keyboard {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        
        .hint-icon {
          font-size: 16px;
        }
        
        .mobile-navigation-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
        }
        
        .nav-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 100px;
          justify-content: center;
        }
        
        .nav-button:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.2);
        }
        
        .nav-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .nav-button.disabled:active {
          transform: none;
        }
        
        .nav-icon {
          font-size: 18px;
        }
        
        .progress-dots {
          display: flex;
          gap: 8px;
        }
        
        .progress-dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .progress-dot.active {
          width: 24px;
          background: rgba(255, 255, 255, 0.9);
        }
        
        .progress-dot.completed {
          background: rgba(255, 255, 255, 0.6);
        }
        
        .mobile-network-status {
          position: fixed;
          bottom: 70px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          z-index: 900;
        }
        
        .network-type {
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        .data-saver {
          opacity: 0.8;
        }
        
        /* Responsive adjustments */
        @media (max-width: 480px) {
          .mobile-form-content {
            padding: 12px;
            padding-bottom: 80px;
          }
          
          .mobile-navigation-bar {
            height: 56px;
            padding: 0 12px;
          }
          
          .nav-button {
            padding: 10px 16px;
            min-width: 80px;
            font-size: 14px;
          }
          
          .mobile-navigation-hints {
            font-size: 13px;
          }
        }
        
        @media (max-width: 360px) {
          .mobile-status-bar {
            font-size: 12px;
            padding: 0 12px;
          }
          
          .nav-button {
            padding: 8px 12px;
            min-width: 70px;
          }
          
          .nav-text {
            display: none;
          }
        }
        
        /* Landscape mode adjustments */
        .mobile-form-container.landscape .mobile-form-content {
          padding-bottom: 16px;
        }
        
        .mobile-form-container.landscape .mobile-navigation-bar {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: auto;
          width: 80px;
          height: auto;
          flex-direction: column;
          padding: 16px 0;
          border-top: none;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .mobile-form-container.landscape .progress-dots {
          flex-direction: column;
        }
        
        .mobile-form-container.landscape .nav-button {
          min-width: auto;
          width: 60px;
          flex-direction: column;
          gap: 4px;
        }
        
        .mobile-form-container.landscape .nav-text {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}