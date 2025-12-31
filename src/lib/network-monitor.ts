// lib/network-monitor.ts
// Network intelligence collection service

export interface NetworkEvent {
  type: 'ip-change' | 'connection-change' | 'speed-test' | 'dns-test' | 'packet-loss';
  timestamp: string;
  data: any;
}

export interface SpeedTestResult {
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage
  server: string;
  timestamp: string;
}

export interface DNSLeakResult {
  servers: string[];
  responseTimes: Record<string, number>;
  isLeaking: boolean;
}

export class NetworkMonitor {
  private events: NetworkEvent[] = [];
  private ipHistory: Array<{ip: string, timestamp: string, source: string}> = [];
  private currentIP: string = '';
  private connection: any = null;
  
  constructor() {
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    // Get current IP
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      this.currentIP = data.ip;
      this.ipHistory.push({
        ip: data.ip,
        timestamp: new Date().toISOString(),
        source: 'initial'
      });
    } catch (error) {
      console.error('Failed to get initial IP:', error);
    }
    
    // Monitor network connection
    if ('connection' in navigator) {
      this.connection = (navigator as any).connection;
      this.connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
    
    // Periodic IP monitoring
    this.startIPMonitoring();
    
    // Run initial tests
    setTimeout(() => {
      this.runSpeedTest();
      this.checkDNSLeak();
    }, 5000);
  }
  
  private startIPMonitoring(): void {
    setInterval(async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        
        if (data.ip !== this.currentIP) {
          this.events.push({
            type: 'ip-change',
            timestamp: new Date().toISOString(),
            data: {
              oldIP: this.currentIP,
              newIP: data.ip,
              timeElapsed: this.getTimeSinceLastIPChange()
            }
          });
          
          this.currentIP = data.ip;
          this.ipHistory.push({
            ip: data.ip,
            timestamp: new Date().toISOString(),
            source: 'periodic-check'
          });
        }
      } catch (error) {
        console.error('IP monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }
  
  private handleConnectionChange(): void {
    if (this.connection) {
      this.events.push({
        type: 'connection-change',
        timestamp: new Date().toISOString(),
        data: {
          effectiveType: this.connection.effectiveType,
          downlink: this.connection.downlink,
          rtt: this.connection.rtt,
          saveData: this.connection.saveData,
          type: this.connection.type
        }
      });
    }
  }
  
  private getTimeSinceLastIPChange(): number {
    if (this.ipHistory.length < 2) return 0;
    const lastChange = new Date(this.ipHistory[this.ipHistory.length - 2].timestamp);
    const now = new Date();
    return now.getTime() - lastChange.getTime();
  }
  
  public async runSpeedTest(): Promise<SpeedTestResult> {
    const startTime = Date.now();
    
    // Simple speed test using image download
    const testImage = new Image();
    const imageUrl = `https://source.unsplash.com/random/2000x2000?${startTime}`;
    
    return new Promise((resolve) => {
      testImage.onload = () => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const imageSize = 500 * 1024; // Approximate 500KB
        const downloadSpeed = (imageSize * 8) / (duration * 1000000); // Mbps
        
        const result: SpeedTestResult = {
          downloadSpeed: parseFloat(downloadSpeed.toFixed(2)),
          uploadSpeed: 0, // Would need server to test upload
          latency: this.connection?.rtt || 50, // Approximate
          jitter: Math.random() * 10, // Simulated
          packetLoss: Math.random() * 2, // Simulated
          server: 'unsplash.com',
          timestamp: new Date().toISOString()
        };
        
        this.events.push({
          type: 'speed-test',
          timestamp: result.timestamp,
          data: result
        });
        
        resolve(result);
      };
      
      testImage.onerror = () => {
        const result: SpeedTestResult = {
          downloadSpeed: 0,
          uploadSpeed: 0,
          latency: 0,
          jitter: 0,
          packetLoss: 100,
          server: 'unsplash.com',
          timestamp: new Date().toISOString()
        };
        
        resolve(result);
      };
      
      // Add cache busting
      testImage.src = `${imageUrl}&t=${startTime}`;
    });
  }
  
  public async checkDNSLeak(): Promise<DNSLeakResult> {
    const dnsServers = [
      'https://dns.google/resolve?name=example.com&type=A',
      'https://cloudflare-dns.com/dns-query?name=example.com&type=A',
      'https://doh.opendns.com/dns-query?name=example.com&type=A'
    ];
    
    const servers: string[] = [];
    const responseTimes: Record<string, number> = {};
    
    for (const server of dnsServers) {
      try {
        const startTime = Date.now();
        const response = await fetch(server, {
          headers: {
            'Accept': 'application/dns-json'
          }
        });
        const endTime = Date.now();
        
        if (response.ok) {
          const domain = new URL(server).hostname;
          servers.push(domain);
          responseTimes[domain] = endTime - startTime;
        }
      } catch (error) {
        console.error(`DNS test failed for ${server}:`, error);
      }
    }
    
    const result: DNSLeakResult = {
      servers,
      responseTimes,
      isLeaking: servers.length > 3 // If we can reach more than 3 DNS servers, might be leaking
    };
    
    this.events.push({
      type: 'dns-test',
      timestamp: new Date().toISOString(),
      data: result
    });
    
    return result;
  }
  
  public getNetworkMetrics() {
    const connectionInfo = this.connection ? {
      effectiveType: this.connection.effectiveType,
      downlink: this.connection.downlink,
      rtt: this.connection.rtt,
      saveData: this.connection.saveData,
      type: this.connection.type
    } : {};
    
    return {
      connection: connectionInfo,
      ipHistory: this.ipHistory,
      networkEvents: this.events.slice(-50), // Last 50 events
      currentIP: this.currentIP,
      stabilityScore: this.calculateStabilityScore(),
      networkType: this.detectNetworkType()
    };
  }
  
  private calculateStabilityScore(): number {
    let score = 100;
    
    // Deduct for IP changes
    const ipChanges = this.ipHistory.length - 1;
    score -= Math.min(ipChanges * 10, 50);
    
    // Deduct for connection type changes
    const connectionChanges = this.events.filter(e => e.type === 'connection-change').length;
    score -= Math.min(connectionChanges * 5, 30);
    
    // Add for good speed
    const speedTests = this.events.filter(e => e.type === 'speed-test');
    if (speedTests.length > 0) {
      const lastTest = speedTests[speedTests.length - 1].data;
      if (lastTest.downloadSpeed > 10) score += 10;
      if (lastTest.downloadSpeed > 50) score += 20;
    }
    
    // Deduct for packet loss
    if (speedTests.length > 0) {
      const lastTest = speedTests[speedTests.length - 1].data;
      if (lastTest.packetLoss > 10) score -= 20;
      if (lastTest.packetLoss > 50) score -= 40;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private detectNetworkType(): string {
    if (!this.connection) return 'unknown';
    
    const effectiveType = this.connection.effectiveType;
    const type = this.connection.type;
    
    if (type === 'cellular') {
      if (effectiveType === '4g') return 'mobile-4g';
      if (effectiveType === '3g') return 'mobile-3g';
      if (effectiveType === '2g') return 'mobile-2g';
      if (effectiveType === 'slow-2g') return 'mobile-2g-slow';
      return 'mobile-unknown';
    }
    
    if (type === 'wifi') return 'wifi';
    if (type === 'ethernet') return 'ethernet';
    if (type === 'wimax') return 'wimax';
    if (type === 'bluetooth') return 'bluetooth';
    if (type === 'vpn') return 'vpn';
    
    return effectiveType || 'unknown';
  }
  
  public reset(): void {
    this.events = [];
    this.ipHistory = [];
    this.currentIP = '';
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();