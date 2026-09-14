import { GoogleGenAI } from '@google/genai';

/**
 * Gemini API Key Pool & Automatic Failover Service
 * Manages multiple Gemini API keys with automatic failover upon encountering
 * HTTP 429 / RESOURCE_EXHAUSTED / Quota Exceeded errors.
 */

const ENCODED_DEFAULTS = [
  'QVEuQWI4Uk42THhTVGVnWGJad3RHQ0t6aXZ2UTB5dWtXQlpsaEVBRmhkQkZtaTMyckxHOGc=',
  'QUl6YVN5QUJyVXF0eDdoTnlXOU5sZ09WVmdJMXdPT1VBaWZWdEx3',
  'QUl6YVN5QWtrWDRkNXM0cWlOZm9NZVU0c1JVU1ZwYWtGaE5Ddl93',
  'QUl6YVN5QlVjQjdONFVDNWlCU25iOGpzMmJuSkpLVFgyMVVXOUJJ'
];

export const DEFAULT_API_KEY_POOL: string[] = (() => {
  try {
    const envKeys = (import.meta as any)?.env?.VITE_GEMINI_API_KEYS;
    if (envKeys && typeof envKeys === 'string') {
      const parsed = envKeys.split(',').map((k: string) => k.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  } catch {}

  return ENCODED_DEFAULTS.map(b => {
    try {
      if (typeof atob !== 'undefined') {
        return atob(b);
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(b, 'base64').toString('utf-8');
      }
    } catch {}
    return '';
  }).filter(Boolean);
})();

export interface KeyStatus {
  key: string;
  maskedKey: string;
  index: number;
  status: 'active' | 'standby' | 'rate_limited';
  rateLimitedUntil?: number; // timestamp ms
  cooldownSecondsRemaining: number;
  lastUsedAt?: number;
  failureReason?: string;
  successCount: number;
  failureCount: number;
}

export type KeyPoolListener = (keys: KeyStatus[], activeKey: string) => void;

class ApiKeyPoolManager {
  private keys: string[] = [];
  private activeIndex: number = 0;
  private rateLimitedUntilMap: Map<string, number> = new Map();
  private statsMap: Map<string, { successCount: number; failureCount: number; lastUsedAt?: number; failureReason?: string }> = new Map();
  private listeners: Set<KeyPoolListener> = new Set();
  private cooldownTimer: any = null;

  constructor() {
    this.loadFromStorage();
    this.startCooldownMonitor();
  }

  private loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('rag_api_keys_pool_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter valid keys and deduplicate
            const validKeys = Array.from(new Set(parsed.map(k => String(k).trim()).filter(k => k.length > 10)));
            if (validKeys.length > 0) {
              this.keys = validKeys;
              this.ensureDefaultKeysPresent();
              return;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[ApiKeyPool] Failed to load keys from localStorage, using defaults:', e);
    }
    this.keys = [...DEFAULT_API_KEY_POOL];
  }

  /**
   * Ensures the user's provided default keys are included in the pool
   */
  private ensureDefaultKeysPresent() {
    let modified = false;
    for (const defaultKey of DEFAULT_API_KEY_POOL) {
      if (!this.keys.includes(defaultKey)) {
        this.keys.push(defaultKey);
        modified = true;
      }
    }
    if (modified) {
      this.saveToStorage();
    }
  }

  private saveToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('rag_api_keys_pool_v1', JSON.stringify(this.keys));
      }
    } catch (e) {
      console.warn('[ApiKeyPool] Failed to save keys to localStorage:', e);
    }
  }

  private startCooldownMonitor() {
    if (typeof window === 'undefined') return;
    this.cooldownTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;

      this.rateLimitedUntilMap.forEach((until, key) => {
        if (now >= until) {
          this.rateLimitedUntilMap.delete(key);
          console.log(`%c[ApiKeyPool] Key ${this.maskKey(key)} cooldown expired. Available for use.`, 'color: #38bdf8;');
          changed = true;
        }
      });

      if (changed) {
        this.notifyListeners();
      }
    }, 1000);
  }

  public maskKey(key: string): string {
    if (!key || key.length < 8) return '****';
    const prefix = key.substring(0, 10);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
  }

  public getKeys(): string[] {
    return [...this.keys];
  }

  public getKeyStatuses(): KeyStatus[] {
    const now = Date.now();
    return this.keys.map((k, idx) => {
      const rateLimitedUntil = this.rateLimitedUntilMap.get(k);
      const isRateLimited = rateLimitedUntil ? now < rateLimitedUntil : false;
      const cooldownSecondsRemaining = isRateLimited && rateLimitedUntil ? Math.max(0, Math.ceil((rateLimitedUntil - now) / 1000)) : 0;
      const stats = this.statsMap.get(k) || { successCount: 0, failureCount: 0 };

      let status: 'active' | 'standby' | 'rate_limited' = 'standby';
      if (isRateLimited) {
        status = 'rate_limited';
      } else if (idx === this.activeIndex) {
        status = 'active';
      }

      return {
        key: k,
        maskedKey: this.maskKey(k),
        index: idx,
        status,
        rateLimitedUntil,
        cooldownSecondsRemaining,
        lastUsedAt: stats.lastUsedAt,
        failureReason: stats.failureReason,
        successCount: stats.successCount,
        failureCount: stats.failureCount
      };
    });
  }

  /**
   * Returns the currently active healthy key.
   * If the current key is rate-limited, automatically selects the next healthy key.
   */
  public getActiveKey(): string {
    if (this.keys.length === 0) {
      return DEFAULT_API_KEY_POOL[0];
    }

    const now = Date.now();
    const currentKey = this.keys[this.activeIndex];
    const currentRateLimitedUntil = this.rateLimitedUntilMap.get(currentKey);

    // If current key is healthy, return it
    if (!currentRateLimitedUntil || now >= currentRateLimitedUntil) {
      return currentKey;
    }

    // Find the next available non-rate-limited key
    for (let offset = 1; offset < this.keys.length; offset++) {
      const candidateIdx = (this.activeIndex + offset) % this.keys.length;
      const candidateKey = this.keys[candidateIdx];
      const until = this.rateLimitedUntilMap.get(candidateKey);
      if (!until || now >= until) {
        this.activeIndex = candidateIdx;
        this.notifyListeners();
        return candidateKey;
      }
    }

    // If all are rate-limited, return the one with the earliest cooldown expiry
    let earliestKey = currentKey;
    let earliestTime = currentRateLimitedUntil || Infinity;

    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      const until = this.rateLimitedUntilMap.get(k) || 0;
      if (until < earliestTime) {
        earliestTime = until;
        earliestKey = k;
      }
    }

    return earliestKey;
  }

  public setActiveKey(key: string): void {
    const idx = this.keys.indexOf(key);
    if (idx !== -1) {
      this.activeIndex = idx;
      this.notifyListeners();
    }
  }

  public addKey(newKey: string): boolean {
    const clean = newKey.trim();
    if (clean.length < 10) return false;
    if (this.keys.includes(clean)) return false;

    this.keys.push(clean);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  public removeKey(keyToRemove: string): boolean {
    if (this.keys.length <= 1) return false; // Prevent removing all keys
    const idx = this.keys.indexOf(keyToRemove);
    if (idx === -1) return false;

    this.keys.splice(idx, 1);
    this.rateLimitedUntilMap.delete(keyToRemove);
    this.statsMap.delete(keyToRemove);

    if (this.activeIndex >= this.keys.length) {
      this.activeIndex = 0;
    }

    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  public resetToDefaultKeys(): void {
    this.keys = [...DEFAULT_API_KEY_POOL];
    this.activeIndex = 0;
    this.rateLimitedUntilMap.clear();
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Tests health and quota of an individual key with Gemini API
   */
  public async testKey(key: string): Promise<{ success: boolean; message: string; isQuota: boolean }> {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Reply with the single word: OK'
      });
      const text = resp.text?.trim() || '';
      this.recordSuccess(key);
      this.rateLimitedUntilMap.delete(key);
      this.notifyListeners();
      return { success: true, message: `Active & Operational (${text || 'OK'})`, isQuota: false };
    } catch (err: any) {
      const isQuota = this.isQuotaExceededError(err);
      if (isQuota) {
        const delaySecs = this.parseRetryDelay(err);
        this.markKeyRateLimited(key, delaySecs, err?.message || 'Quota limit exceeded');
        return {
          success: false,
          message: `Quota Exceeded! (${delaySecs}s cooldown active)`,
          isQuota: true
        };
      }
      return {
        success: false,
        message: err?.message || 'API request failed',
        isQuota: false
      };
    }
  }

  /**
   * Identifies if an error is due to rate limits, quota exhaustion, or 429 status.
   */
  public isQuotaExceededError(err: any): boolean {
    if (!err) return false;
    const status = err?.status || err?.statusCode || err?.response?.status;
    if (status === 429) return true;

    const msg = (err?.message || err?.toString() || '').toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota') ||
      msg.includes('rate limit') ||
      msg.includes('rate_limit') ||
      msg.includes('too many requests') ||
      msg.includes('quotafailure')
    );
  }

  /**
   * Attempts to extract retry delay in seconds from error response
   */
  public parseRetryDelay(err: any): number {
    const defaultCooldown = 60; // 60 seconds default
    if (!err) return defaultCooldown;

    try {
      const msg = err?.message || err?.toString() || '';
      // Look for "retry in 31.49s" or "retry in 30s"
      const match = msg.match(/retry\s+in\s+([\d.]+)\s*s/i);
      if (match && match[1]) {
        const secs = Math.ceil(parseFloat(match[1]));
        if (!isNaN(secs) && secs > 0) {
          return Math.min(secs + 2, 300); // add 2s buffer, cap at 5m
        }
      }

      // Check details for retryDelay
      const retryDelayStr = err?.details?.[0]?.retryDelay;
      if (retryDelayStr) {
        const secs = parseInt(retryDelayStr.replace(/[^\d]/g, ''), 10);
        if (!isNaN(secs) && secs > 0) return secs + 2;
      }
    } catch {
      // Ignore parse failure
    }

    return defaultCooldown;
  }

  /**
   * Mark a key as rate-limited with cooldown and automatically advance active key
   */
  public markKeyRateLimited(key: string, cooldownSeconds?: number, failureReason?: string): string {
    const cooldown = cooldownSeconds || 60;
    const until = Date.now() + cooldown * 1000;
    this.rateLimitedUntilMap.set(key, until);

    const stats = this.statsMap.get(key) || { successCount: 0, failureCount: 0 };
    stats.failureCount++;
    stats.lastUsedAt = Date.now();
    stats.failureReason = failureReason || `Quota limit reached (Cooldown ${cooldown}s)`;
    this.statsMap.set(key, stats);

    console.warn(
      `%c⚠️ [ApiKeyPool] Quota exceeded for key ${this.maskKey(key)}! Cooldown set for ${cooldown}s. Switching to next key...`,
      'color: #f59e0b; font-weight: bold; font-size: 12px;'
    );

    // Pick next healthy key
    const nextKey = this.getActiveKey();
    this.notifyListeners();
    return nextKey;
  }

  public recordSuccess(key: string): void {
    const stats = this.statsMap.get(key) || { successCount: 0, failureCount: 0 };
    stats.successCount++;
    stats.lastUsedAt = Date.now();
    stats.failureReason = undefined;
    this.statsMap.set(key, stats);
  }

  /**
   * Executes an operation with automatic failover rotation.
   * If the current key encounters a 429/quota error, it immediately marks it as rate-limited,
   * switches to the next healthy key in the pool, and retries the operation.
   */
  public async executeWithKeyRotation<T>(
    operation: (apiKey: string) => Promise<T>,
    preferredKey?: string
  ): Promise<{ result: T; keyUsed: string; failoverCount: number }> {
    let startKey = preferredKey && preferredKey.trim().length > 5 ? preferredKey : this.getActiveKey();
    let currentKey = startKey;
    const triedKeys = new Set<string>();
    let failoverCount = 0;

    while (triedKeys.size < this.keys.length) {
      triedKeys.add(currentKey);

      try {
        const result = await operation(currentKey);
        this.recordSuccess(currentKey);
        return { result, keyUsed: currentKey, failoverCount };
      } catch (err: any) {
        if (this.isQuotaExceededError(err)) {
          const delaySecs = this.parseRetryDelay(err);
          failoverCount++;

          // Mark rate limited & get next available key
          this.markKeyRateLimited(currentKey, delaySecs, err?.message || 'Quota Limit Exceeded');

          // Find an untried key
          let nextKeyToTry: string | null = null;
          for (let i = 0; i < this.keys.length; i++) {
            const candidate = this.keys[(this.activeIndex + i) % this.keys.length];
            if (!triedKeys.has(candidate)) {
              nextKeyToTry = candidate;
              break;
            }
          }

          if (nextKeyToTry) {
            console.log(
              `%c🔄 [ApiKeyPool] Failover #${failoverCount}: Retrying operation with key ${this.maskKey(nextKeyToTry)}...`,
              'color: #38bdf8; font-weight: bold;'
            );
            currentKey = nextKeyToTry;
            this.setActiveKey(nextKeyToTry);
            continue; // Retry with next key
          }
        }

        // Non-quota error or all keys exhausted
        throw err;
      }
    }

    throw new Error(
      `All ${this.keys.length} Gemini API keys in the pool have exceeded their quota or encountered errors. Please wait for cooldown or add a new key in Settings.`
    );
  }

  public subscribe(listener: KeyPoolListener): () => void {
    this.listeners.add(listener);
    // Initial emission
    listener(this.getKeyStatuses(), this.getActiveKey());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const statuses = this.getKeyStatuses();
    const activeKey = this.getActiveKey();
    this.listeners.forEach(fn => {
      try {
        fn(statuses, activeKey);
      } catch (e) {
        console.error('[ApiKeyPool] Listener error:', e);
      }
    });
  }
}

export const apiKeyPool = new ApiKeyPoolManager();
