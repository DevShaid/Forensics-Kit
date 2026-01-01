// components/QuantumIntelligenceInitializer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { intelligenceOrchestrator } from '@/lib/intelligence-orchestrator';
import { aiBehavioralEngine } from '@/lib/ai-behavioral-analytics';

export default function QuantumIntelligenceInitializer() {
  const initialized = useRef(false);
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    console.log('🚀 Quantum Intelligence System Initializing...');
    
    // Start intelligence collection
    const startIntelligenceCollection = async () => {
      try {
        // Get session metrics
        const sessionMetrics = intelligenceOrchestrator.getSessionMetrics();
        console.log('📊 Session Metrics:', sessionMetrics);
        
        // Subscribe to reports
        const unsubscribe = intelligenceOrchestrator.subscribeToReports((report) => {
          console.log('📈 Intelligence Report Generated:', {
            id: report.reportId,
            risk: report.riskAssessment.overallRisk,
            level: report.riskAssessment.riskLevel
          });
          
          // Send to server
          fetch('/api/intelligence/realtime', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'realtime_report',
              report: report,
              timestamp: new Date().toISOString()
            })
          }).catch(console.error);
        });
        
        // Generate initial report
        setTimeout(() => {
          intelligenceOrchestrator.generateFullReport()
            .then(report => {
              console.log('✅ Initial intelligence report ready');
              
              // Send initial report
              fetch('/api/intelligence/initial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'initial_report',
                  report: report,
                  sessionId: report.sessionId
                })
              }).catch(console.error);
            })
            .catch(error => {
              console.error('❌ Initial report generation failed:', error);
            });
        }, 5000);
        
        // Cleanup
        return () => {
          unsubscribe();
          console.log('🧹 Intelligence collection cleanup');
        };
        
      } catch (error) {
        console.error('❌ Intelligence system failed to initialize:', error);
      }
    };
    
    startIntelligenceCollection();
    
    // Monitor page visibility for intelligence optimization
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce collection frequency
        console.log('📱 Page hidden, reducing intelligence collection');
      } else {
        // Page is visible, resume normal collection
        console.log('📱 Page visible, resuming intelligence collection');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Generate final report
      intelligenceOrchestrator.generateFinalReport()
        .then(report => {
          console.log('📋 Final intelligence report generated');
        })
        .catch(error => {
          console.error('Failed to generate final report:', error);
        });
    };
  }, []);
  
  return null; // This component doesn't render anything
}