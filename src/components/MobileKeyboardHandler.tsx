// components/MobileKeyboardHandler.tsx
'use client';

import { useEffect, useCallback } from 'react';

interface MobileKeyboardHandlerProps {
  onEnter: () => void;
  onEscape: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export default function MobileKeyboardHandler({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown
}: MobileKeyboardHandlerProps) {
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Mobile-optimized keyboard shortcuts
    switch(e.key) {
      case 'Enter':
        if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          onEnter();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        onEscape();
        break;
        
      case 'ArrowUp':
        if (onArrowUp) {
          e.preventDefault();
          onArrowUp();
        }
        break;
        
      case 'ArrowDown':
        if (onArrowDown) {
          e.preventDefault();
          onArrowDown();
        }
        break;
        
      case 'Tab':
        // On mobile, tab should move to next field
        // We'll handle this separately with focus management
        break;
    }
  }, [onEnter, onEscape, onArrowUp, onArrowDown]);
  
  const handleTouchOutside = useCallback((e: TouchEvent) => {
    // Dismiss keyboard when tapping outside input fields
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && 
        target.tagName !== 'TEXTAREA' && 
        target.tagName !== 'SELECT') {
      // Blur any active input
      if (document.activeElement && 
          (document.activeElement.tagName === 'INPUT' || 
           document.activeElement.tagName === 'TEXTAREA')) {
        (document.activeElement as HTMLElement).blur();
      }
    }
  }, []);
  
  const handleInputFocus = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Scroll input into view on mobile
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      
      // Set appropriate input mode for mobile
      if (target.getAttribute('type') === 'email') {
        target.setAttribute('inputmode', 'email');
      } else if (target.getAttribute('type') === 'tel') {
        target.setAttribute('inputmode', 'tel');
      } else if (target.getAttribute('type') === 'number') {
        target.setAttribute('inputmode', 'numeric');
      } else {
        target.setAttribute('inputmode', 'text');
      }
    }
  }, []);
  
  useEffect(() => {
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Add touch event for dismissing keyboard
    document.addEventListener('touchstart', handleTouchOutside);
    
    // Add focus listener for mobile input optimization
    document.addEventListener('focusin', handleInputFocus);
    
    // Configure viewport for mobile keyboards
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    // Prevent bounce/overscroll on mobile
    const preventPullToRefresh = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchOutside);
      document.removeEventListener('focusin', handleInputFocus);
      window.removeEventListener('resize', setViewportHeight);
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, [handleKeyDown, handleTouchOutside, handleInputFocus]);
  
  // This component doesn't render anything
  return null;
}