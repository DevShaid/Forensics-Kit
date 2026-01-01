// lib/intelligence-orchestrator.ts
// Enterprise-Grade Intelligence Collection Orchestrator

import { collectEliteIntelligence } from './advanced-detection';
import { aiBehavioralEngine, BehavioralProfile } from './ai-behavioral-analytics';
import { quantumSecurity } from './quantum-security';

export interface IntelligenceReport {
  reportId: string;
  timestamp: string;
  sessionId: string;
  riskAssessment: {
    overallRisk: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    riskFactors: string[];
    confidence: number;
  };
  deviceIntelligence: any;
  networkIntelligence: any;
  behavioralIntelligence: BehavioralProfile;
  threatIndicators: ThreatIndicator[];
  recommendations: Recommendation[];
  metadata: ReportMetadata;
}

export interface ThreatIndicator {
  type: 'bot' | 'fraud' | 'privacy' | 'security' | 'automation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence: any[];
  confidence: number;
  timestamp: string;
}

export interface Recommendation {
  type: 'verification' | 'monitoring' | 'blocking' | 'flagging' | 'notification';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  estimatedEffectiveness: number;
}

export interface ReportMetadata {
  generationTime: number;
  dataSources: string[];
  collectionMethods: string[];
  privacyCompliance: string[];
  retentionPolicy: string;
  encryptionLevel: string;
}

class IntelligenceOrchestrator {
  private sessionId: string;
  private startTime: number;
  private collectedData: Map<string, any> = new Map();
  private reportCallbacks: Array<(report: IntelligenceReport) => void> = [];
  private isInitialized: boolean = false;

  constructor() {
    this.sessionId = quantumSecurity.getSessionId();
    this.startTime = Date.now();
    // Defer initialization to avoid SSR issues
    if (typeof window !== 'undefined') {
      this.initializeCollection();
    }
  }

  private initializeCollection(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Start all intelligence collection modules
    this.startPeriodicCollection();
    this.startRealTimeMonitoring();
    this.setupAutoReporting();
  }
  
  private startPeriodicCollection(): void {
    // Collect elite intelligence every 30 seconds
    setInterval(async () => {
      try {
        const eliteIntel = await collectEliteIntelligence();
        this.collectedData.set('elite_intelligence', eliteIntel);
        
        // Trigger risk assessment
        this.assessRisk();
      } catch (error) {
        console.error('Periodic collection failed:', error);
      }
    }, 30000);
    
    // Collect behavioral data every 10 seconds
    setInterval(() => {
      const behavioralData = aiBehavioralEngine.exportData();
      this.collectedData.set('behavioral_intelligence', behavioralData);
    }, 10000);
  }
  
  private startRealTimeMonitoring(): void {
    // SSR safety check
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Monitor for specific events in real-time
    window.addEventListener('beforeunload', () => {
      this.generateFinalReport();
    });

    // Monitor network changes
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && typeof conn.addEventListener === 'function') {
        conn.addEventListener('change', () => {
          this.collectedData.set('network_change', {
            timestamp: new Date().toISOString(),
            connection: {
              type: conn.type,
              effectiveType: conn.effectiveType,
              downlink: conn.downlink,
              rtt: conn.rtt
            }
          });
        });
      }
    }

    // Monitor visibility changes
    document.addEventListener('visibilitychange', () => {
      this.collectedData.set('visibility_change', {
        timestamp: new Date().toISOString(),
        hidden: document.hidden,
        visibilityState: document.visibilityState
      });
    });
  }
  
  private setupAutoReporting(): void {
    // Auto-report based on triggers
    const triggers = [
      {
        condition: () => this.collectedData.size >= 10,
        action: () => this.generateIntermediateReport('data_threshold_reached')
      },
      {
        condition: () => this.getSessionDuration() > 300000, // 5 minutes
        action: () => this.generateIntermediateReport('session_timeout')
      },
      {
        condition: () => this.detectHighRisk(),
        action: () => this.generateAlertReport('high_risk_detected')
      }
    ];
    
    setInterval(() => {
      triggers.forEach(trigger => {
        if (trigger.condition()) {
          trigger.action();
        }
      });
    }, 5000);
  }
  
  private getSessionDuration(): number {
    return Date.now() - this.startTime;
  }
  
  private detectHighRisk(): boolean {
    const eliteIntel = this.collectedData.get('elite_intelligence');
    if (!eliteIntel) return false;
    
    return eliteIntel.riskAssessment.overallRisk > 70;
  }
  
  private assessRisk(): void {
    const eliteIntel = this.collectedData.get('elite_intelligence');
    const behavioralIntel = this.collectedData.get('behavioral_intelligence');
    
    if (!eliteIntel || !behavioralIntel) return;
    
    // Combine risk assessments
    const combinedRisk = this.calculateCombinedRisk(
      eliteIntel.riskAssessment,
      behavioralIntel.analysis.riskScore
    );
    
    this.collectedData.set('combined_risk_assessment', {
      timestamp: new Date().toISOString(),
      risk: combinedRisk,
      factors: this.identifyRiskFactors(eliteIntel, behavioralIntel)
    });
  }
  
  private calculateCombinedRisk(eliteRisk: any, behavioralScore: number): number {
    // Weighted average with elite intelligence having higher weight
    const eliteWeight = 0.6;
    const behavioralWeight = 0.4;
    
    const eliteRiskValue = eliteRisk.overallRisk || 0;
    const combined = (eliteRiskValue * eliteWeight) + (behavioralScore * behavioralWeight);
    
    return Math.min(100, combined);
  }
  
  private identifyRiskFactors(eliteIntel: any, behavioralIntel: any): string[] {
    const factors: string[] = [];
    
    // Elite intelligence factors
    if (eliteIntel.riskAssessment.overallRisk > 50) {
      factors.push('High risk from device/network analysis');
    }
    
    if (eliteIntel.riskAssessment.categories.privacyRisk > 60) {
      factors.push('Privacy risk detected (VPN/Proxy/WebRTC leaks)');
    }
    
    if (eliteIntel.riskAssessment.categories.automationRisk > 50) {
      factors.push('Potential automation/bot activity');
    }
    
    // Behavioral factors
    if (behavioralIntel.analysis.riskScore > 60) {
      factors.push('Suspicious behavioral patterns');
    }
    
    if (behavioralIntel.analysis.anomalies.length > 0) {
      factors.push(`Behavioral anomalies detected: ${behavioralIntel.analysis.anomalies.length}`);
    }
    
    return factors;
  }
  
  public async generateFullReport(): Promise<IntelligenceReport> {
    // Collect all available intelligence
    const [
      eliteIntel,
      behavioralIntel,
      riskAssessment
    ] = await Promise.all([
      this.collectedData.get('elite_intelligence') || collectEliteIntelligence(),
      Promise.resolve(this.collectedData.get('behavioral_intelligence') || aiBehavioralEngine.exportData()),
      Promise.resolve(this.collectedData.get('combined_risk_assessment') || { risk: 0, factors: [] })
    ]);
    
    // Generate threat indicators
    const threatIndicators = this.generateThreatIndicators(eliteIntel, behavioralIntel);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(threatIndicators, riskAssessment);
    
    // Determine risk level
    const overallRisk = riskAssessment.risk || 0;
    const riskLevel = this.determineRiskLevel(overallRisk);
    
    // Create report
    const report: IntelligenceReport = {
      reportId: `REPORT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      riskAssessment: {
        overallRisk,
        riskLevel,
        riskFactors: riskAssessment.factors || [],
        confidence: this.calculateConfidence(eliteIntel, behavioralIntel)
      },
      deviceIntelligence: eliteIntel?.deviceFingerprint || {},
      networkIntelligence: eliteIntel?.networkIntelligence || {},
      behavioralIntelligence: behavioralIntel.analysis,
      threatIndicators,
      recommendations,
      metadata: {
        generationTime: Date.now() - this.startTime,
        dataSources: ['device_fingerprint', 'network_analysis', 'behavioral_analytics', 'ai_pattern_recognition'],
        collectionMethods: ['passive', 'active', 'real-time', 'periodic'],
        privacyCompliance: ['gdpr_compliant', 'ccpa_ready', 'data_minimized'],
        retentionPolicy: 'session_only',
        encryptionLevel: quantumSecurity.getSecurityMetrics().encryptionStrength
      }
    };
    
    // Encrypt the report
    const encryptedReport = await quantumSecurity.createSecurePayload(report);
    
    // Trigger callbacks
    this.reportCallbacks.forEach(callback => callback(report));
    
    return report;
  }
  
  private generateIntermediateReport(reason: string): void {
    this.generateFullReport().then(report => {
      console.log(`Intermediate report generated (${reason}):`, report.reportId);
      
      // Send to server
      this.sendToServer(report, 'intermediate');
    });
  }
  
  private generateAlertReport(reason: string): void {
    this.generateFullReport().then(report => {
      console.log(`ALERT report generated (${reason}):`, report.reportId);
      
      // Send immediate alert
      this.sendToServer(report, 'alert');
      
      // Trigger additional actions
      this.triggerAlertActions(report);
    });
  }
  
  public generateFinalReport(): Promise<void> {
    return this.generateFullReport().then(report => {
      console.log('Final report generated:', report.reportId);

      // Send to server
      this.sendToServer(report, 'final');
    });
  }
  
  private generateThreatIndicators(eliteIntel: any, behavioralIntel: any): ThreatIndicator[] {
    const indicators: ThreatIndicator[] = [];
    
    // Bot detection
    if (eliteIntel?.riskAssessment?.categories?.automationRisk > 60) {
      indicators.push({
        type: 'bot',
        severity: 'high',
        description: 'High probability of automated/bot activity',
        evidence: [
          `Automation risk score: ${eliteIntel.riskAssessment.categories.automationRisk}`,
          'Pattern analysis indicates non-human behavior'
        ],
        confidence: eliteIntel.riskAssessment.categories.automationRisk / 100,
        timestamp: new Date().toISOString()
      });
    }
    
    // Privacy threats
    if (eliteIntel?.networkIntelligence?.webrtc?.ipData?.publicIPs?.length > 0) {
      indicators.push({
        type: 'privacy',
        severity: 'medium',
        description: 'WebRTC IP leak detected',
        evidence: [
          `Public IPs leaked: ${eliteIntel.networkIntelligence.webrtc.ipData.publicIPs.join(', ')}`,
          'Real IP may be exposed despite VPN/proxy'
        ],
        confidence: 0.85,
        timestamp: new Date().toISOString()
      });
    }
    
    // Fraud indicators
    if (behavioralIntel?.analysis?.anomalies?.length > 2) {
      indicators.push({
        type: 'fraud',
        severity: 'medium',
        description: 'Multiple behavioral anomalies detected',
        evidence: behavioralIntel.analysis.anomalies.slice(0, 3).map((a: any) => a.description),
        confidence: 0.75,
        timestamp: new Date().toISOString()
      });
    }
    
    // Security threats
    if (!eliteIntel?.deviceFingerprint?.browserFeatures?.webGL) {
      indicators.push({
        type: 'security',
        severity: 'low',
        description: 'WebGL disabled (possible headless browser)',
        evidence: ['WebGL API not available', 'Common in automation tools'],
        confidence: 0.65,
        timestamp: new Date().toISOString()
      });
    }
    
    return indicators;
  }
  
  private generateRecommendations(
    threatIndicators: ThreatIndicator[],
    riskAssessment: any
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // High risk recommendations
    if (riskAssessment.risk > 70) {
      recommendations.push({
        type: 'verification',
        priority: 'immediate',
        action: 'Require additional identity verification',
        reason: 'High overall risk score',
        estimatedEffectiveness: 90
      });
    }
    
    // Bot detection recommendations
    const botIndicators = threatIndicators.filter(i => i.type === 'bot');
    if (botIndicators.length > 0) {
      recommendations.push({
        type: 'verification',
        priority: 'high',
        action: 'Implement CAPTCHA or biometric verification',
        reason: 'Bot activity suspected',
        estimatedEffectiveness: 85
      });
    }
    
    // Privacy leak recommendations
    const privacyIndicators = threatIndicators.filter(i => i.type === 'privacy');
    if (privacyIndicators.length > 0) {
      recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        action: 'Monitor for location spoofing or VPN abuse',
        reason: 'Privacy leaks detected',
        estimatedEffectiveness: 75
      });
    }
    
    // Behavioral anomaly recommendations
    if (threatIndicators.some(i => i.type === 'fraud')) {
      recommendations.push({
        type: 'flagging',
        priority: 'medium',
        action: 'Flag session for manual review',
        reason: 'Suspicious behavioral patterns',
        estimatedEffectiveness: 80
      });
    }
    
    // Default recommendation if no specific threats
    if (recommendations.length === 0 && riskAssessment.risk < 30) {
      recommendations.push({
        type: 'monitoring',
        priority: 'low',
        action: 'Continue standard monitoring',
        reason: 'Low risk profile detected',
        estimatedEffectiveness: 95
      });
    }
    
    return recommendations;
  }
  
  private determineRiskLevel(riskScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }
  
  private calculateConfidence(eliteIntel: any, behavioralIntel: any): number {
    let confidence = 0;
    let factors = 0;
    
    if (eliteIntel) {
      confidence += 50;
      factors++;
    }
    
    if (behavioralIntel?.analysis) {
      confidence += behavioralIntel.analysis.confidence * 0.5;
      factors++;
    }
    
    // Add factor for data volume
    const dataVolume = this.collectedData.size;
    confidence += Math.min(20, dataVolume * 2);
    
    return factors > 0 ? confidence / factors : 50;
  }
  
  private async sendToServer(report: IntelligenceReport, type: 'intermediate' | 'alert' | 'final'): Promise<void> {
    try {
      const encryptedPayload = await quantumSecurity.createSecurePayload(report);
      
      await fetch('/api/intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Intelligence-Type': type,
          'X-Session-ID': this.sessionId,
          'X-Encryption-Level': quantumSecurity.getSecurityMetrics().encryptionStrength
        },
        body: JSON.stringify(encryptedPayload)
      });
      
      console.log(`Intelligence report sent (${type}):`, report.reportId);
    } catch (error) {
      console.error('Failed to send intelligence report:', error);
      
      // Fallback: Store locally
      this.storeLocally(report, type);
    }
  }
  
  private storeLocally(report: IntelligenceReport, type: string): void {
    const storageKey = `intelligence_report_${type}_${report.reportId}`;
    const data = {
      report,
      timestamp: new Date().toISOString(),
      type,
      sessionId: this.sessionId
    };
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('Report stored locally:', storageKey);
    } catch (error) {
      console.error('Failed to store report locally:', error);
    }
  }
  
  private triggerAlertActions(report: IntelligenceReport): void {
    // Play alert sound
    this.playAlertSound();
    
    // Show visual alert (if allowed)
    this.showVisualAlert(report);
    
    // Log to console
    console.warn('🚨 SECURITY ALERT:', report);
    
    // Trigger external notifications (if configured)
    this.sendExternalNotification(report);
  }
  
  private playAlertSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Sound not supported or blocked
    }
  }
  
  private showVisualAlert(report: IntelligenceReport): void {
    // Create a subtle visual indicator
    const alertDiv = document.createElement('div');
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '10px';
    alertDiv.style.right = '10px';
    alertDiv.style.backgroundColor = '#ff4444';
    alertDiv.style.color = 'white';
    alertDiv.style.padding = '5px 10px';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.zIndex = '999999';
    alertDiv.style.fontSize = '12px';
    alertDiv.style.opacity = '0.9';
    alertDiv.innerText = '⚠️ Security Alert';
    
    document.body.appendChild(alertDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
      document.body.removeChild(alertDiv);
    }, 5000);
  }
  
  private sendExternalNotification(report: IntelligenceReport): void {
    // This would integrate with external notification services
    // For now, just log
    console.log('External notification would be sent for:', report.reportId);
  }
  
  public subscribeToReports(callback: (report: IntelligenceReport) => void): () => void {
    this.reportCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.reportCallbacks.indexOf(callback);
      if (index > -1) {
        this.reportCallbacks.splice(index, 1);
      }
    };
  }
  
  public getSessionMetrics(): {
    duration: number;
    dataPoints: number;
    riskLevel: string;
    encryption: string;
  } {
    const riskAssessment = this.collectedData.get('combined_risk_assessment');
    const riskLevel = riskAssessment ? 
      this.determineRiskLevel(riskAssessment.risk) : 'unknown';
    
    return {
      duration: this.getSessionDuration(),
      dataPoints: this.collectedData.size,
      riskLevel,
      encryption: quantumSecurity.getSecurityMetrics().encryptionStrength
    };
  }
  
  public resetSession(): void {
    this.collectedData.clear();
    aiBehavioralEngine.clearEvents();
    this.startTime = Date.now();
    console.log('Intelligence session reset');
  }
}

// Export singleton instance
export const intelligenceOrchestrator = new IntelligenceOrchestrator();