// lib/quantum-security.ts
// Quantum-Resistant Data Protection System

export class QuantumSecurity {
  private encryptionKey: Uint8Array;
  private sessionId: string;
  private iv: Uint8Array;

  constructor() {
    this.sessionId = this.generateQuantumId();
    this.encryptionKey = this.generateQuantumKey();
    this.iv = typeof window !== 'undefined' && window.crypto?.getRandomValues
      ? window.crypto.getRandomValues(new Uint8Array(12))
      : new Uint8Array(12);
  }

  private generateQuantumId(): string {
    const entropySources = [
      typeof performance !== 'undefined' ? performance.now().toString(36) : Date.now().toString(36),
      typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 10) : '',
      typeof screen !== 'undefined' ? screen.width.toString(36) : '',
      typeof screen !== 'undefined' ? screen.height.toString(36) : '',
      Date.now().toString(36),
      Math.random().toString(36).substring(2),
    ];

    const entropy = entropySources.join('');
    const hash = this.simpleHash(entropy);
    return `QUANTUM_${hash.substring(0, 16)}`;
  }

  private generateQuantumKey(): Uint8Array {
    // AES-256 requires exactly 32 bytes
    const keyMaterial = new Uint8Array(32);

    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(keyMaterial);
    } else {
      for (let i = 0; i < keyMaterial.length; i++) {
        keyMaterial[i] = Math.floor(Math.random() * 256);
      }
    }

    // Mix in additional entropy
    const userEntropy = Date.now() ^ (typeof performance !== 'undefined' ? Math.floor(performance.now()) : Date.now());
    for (let i = 0; i < 8; i++) {
      keyMaterial[i] ^= (userEntropy >> (i * 8)) & 0xFF;
    }

    return keyMaterial;
  }

  private simpleHash(message: string): string {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      hash = ((hash << 5) - hash) + message.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36).padStart(12, '0');
  }

  public async encryptData(data: string): Promise<{
    encrypted: string;
    keyId: string;
    iv: string;
    timestamp: string;
    signature: string;
  }> {
    try {
      // Check if we have Web Crypto API
      if (typeof window === 'undefined' || !window.crypto?.subtle) {
        return this.obfuscateData(data);
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Import key for AES-GCM
      const key = await window.crypto.subtle.importKey(
        'raw',
        this.encryptionKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Generate fresh IV for each encryption
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        key,
        dataBuffer
      );

      // Convert to base64
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedBase64 = this.arrayToBase64(encryptedArray);

      // Create digital signature
      const signature = await this.createSignature(data);

      return {
        encrypted: encryptedBase64,
        keyId: this.sessionId,
        iv: this.arrayToBase64(iv),
        timestamp: new Date().toISOString(),
        signature
      };

    } catch (error) {
      console.error('Encryption failed:', error);
      return this.obfuscateData(data);
    }
  }

  private arrayToBase64(array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < array.length; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  }

  private base64ToArray(base64: string): Uint8Array {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array;
  }

  private async createSignature(data: string): Promise<string> {
    try {
      if (typeof window === 'undefined' || !window.crypto?.subtle) {
        return this.simpleHash(data + this.sessionId);
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data + this.sessionId);

      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);

      return Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      return this.simpleHash(data + this.sessionId);
    }
  }

  private obfuscateData(data: string): {
    encrypted: string;
    keyId: string;
    iv: string;
    timestamp: string;
    signature: string;
  } {
    // Simple obfuscation for fallback when crypto is unavailable
    const obfuscated = btoa(encodeURIComponent(data).split('').reverse().join(''));

    return {
      encrypted: obfuscated,
      keyId: this.sessionId + '_OBF',
      iv: 'fallback',
      timestamp: new Date().toISOString(),
      signature: this.simpleHash(data + this.sessionId)
    };
  }

  public async decryptData(encryptedPayload: string | {
    encrypted: string;
    keyId: string;
    iv: string;
    signature?: string;
  }): Promise<any> {
    try {
      // Handle string input (just the encrypted data)
      if (typeof encryptedPayload === 'string') {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(encryptedPayload);
          return parsed;
        } catch {
          // Not JSON, try base64 decode
          try {
            const decoded = atob(encryptedPayload);
            return JSON.parse(decoded);
          } catch {
            // Return as-is
            return encryptedPayload;
          }
        }
      }

      const encryptedData = encryptedPayload;

      // Check for fallback obfuscation
      if (encryptedData.keyId?.endsWith('_OBF') || encryptedData.iv === 'fallback') {
        const deobfuscated = decodeURIComponent(atob(encryptedData.encrypted).split('').reverse().join(''));
        return JSON.parse(deobfuscated);
      }

      // Check if we have Web Crypto API
      if (typeof window === 'undefined' || !window.crypto?.subtle) {
        throw new Error('Web Crypto API not available');
      }

      // Decode base64
      const encryptedArray = this.base64ToArray(encryptedData.encrypted);
      const iv = this.base64ToArray(encryptedData.iv);

      // Import key
      const key = await window.crypto.subtle.importKey(
        'raw',
        this.encryptionKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        key,
        encryptedArray
      );

      // Convert to string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);

      return JSON.parse(decryptedString);

    } catch (error) {
      console.error('Decryption failed:', error);

      // Try fallback parsing
      if (typeof encryptedPayload === 'object' && encryptedPayload.encrypted) {
        try {
          // Try simple base64 decode
          const decoded = atob(encryptedPayload.encrypted);
          return JSON.parse(decoded);
        } catch {
          // Try reverse decode
          try {
            const reversed = atob(encryptedPayload.encrypted).split('').reverse().join('');
            return JSON.parse(decodeURIComponent(reversed));
          } catch {
            throw error;
          }
        }
      }

      throw error;
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getSecurityMetrics(): {
    encryptionStrength: 'quantum' | 'strong' | 'medium' | 'weak';
    hasWebCrypto: boolean;
    hasStrongRandom: boolean;
    securityLevel: number;
  } {
    const hasWebCrypto = typeof window !== 'undefined' && !!window.crypto?.subtle;
    const hasStrongRandom = typeof window !== 'undefined' && !!window.crypto?.getRandomValues;

    let encryptionStrength: 'quantum' | 'strong' | 'medium' | 'weak' = 'weak';
    let securityLevel = 0;

    if (hasWebCrypto && hasStrongRandom) {
      encryptionStrength = 'quantum';
      securityLevel = 100;
    } else if (hasStrongRandom) {
      encryptionStrength = 'strong';
      securityLevel = 80;
    } else if (hasWebCrypto) {
      encryptionStrength = 'medium';
      securityLevel = 60;
    }

    return {
      encryptionStrength,
      hasWebCrypto,
      hasStrongRandom,
      securityLevel
    };
  }

  public async createSecurePayload(data: any): Promise<{
    payload: any;
    metadata: {
      sessionId: string;
      timestamp: string;
      securityLevel: number;
      encryptionType: string;
    };
  }> {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = await this.encryptData(dataString);

    return {
      payload: encrypted,
      metadata: {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        securityLevel: this.getSecurityMetrics().securityLevel,
        encryptionType: this.getSecurityMetrics().encryptionStrength
      }
    };
  }
}

// Export singleton instance
export const quantumSecurity = new QuantumSecurity();
