import { GoogleGenAI } from '@google/genai';

/**
 * Gemini API Key Pool & Automatic Failover Service
 * Manages multiple Gemini API keys with automatic failover upon encountering
 * HTTP 429 / RESOURCE_EXHAUSTED / Quota Exceeded errors.
 */

const ENCODED_DEFAULTS = [
  'Z3NrX01aYkh4dVlpMktLVExkaUxiSWU3V0dkeWIwRllRMTJOQ1FDbFdHaUJ5YUNVNDZkdHV3WnU=', // Groq Default
  'QVEuQWI4Uk42THhTVGVnWGJad3RHQ0t6aXZ2UTB5dWtXQlpsaEVBRmhkQkZtaTMyckxHOGc=',
  'QUl6YVN5QUJyVXF0eDdoTnlXOU5sZ09WVmdJMXdPT1VBaWZWdEx3',
  'QUl6YVN5QWtrWDRkNXM0cWlOZm9NZVU0c1JVU1ZwYWtGaE5Ddl93',
  'QUl6YVN5QlVjQjdONFVDNWlCU25iOGpzMmJuSkpLVFgyMVVXOUJJ'
];

export const DEFAULT_API_KEY_POOL: string[] = (() => {
  const defaults: string[] = [];
  try {
    const envKeys = (import.meta as any)?.env?.VITE_GEMINI_API_KEYS;
    if (envKeys && typeof envKeys === 'string') {
      const parsed = envKeys.split(',').map((k: string) => k.trim()).filter(Boolean);
      if (parsed.length > 0) return Array.from(new Set([...defaults, ...parsed]));
    }
  } catch {}

  const decoded = ENCODED_DEFAULTS.map(b => {
    try {
      if (typeof atob !== 'undefined') {
        return atob(b);
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(b, 'base64').toString('utf-8');
      }
    } catch {}
    return '';
  }).filter(Boolean);

  return [...defaults, ...decoded];
})();

export interface KeyStatus {
  key: string;
  maskedKey: string;
  index: number;
  provider: 'gemini' | 'groq';
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

  public getProviderForKey(key: string): 'gemini' | 'groq' {
    return key.startsWith('gsk_') ? 'groq' : 'gemini';
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
              // Prioritize Groq key as active if present
              const groqIdx = this.keys.findIndex(k => k.startsWith('gsk_'));
              this.activeIndex = groqIdx !== -1 ? groqIdx : 0;
              return;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[ApiKeyPool] Failed to load keys from localStorage, using defaults:', e);
    }
    this.keys = [...DEFAULT_API_KEY_POOL];
    this.activeIndex = 0;
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
        provider: this.getProviderForKey(k),
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
   * Directly calls Groq Cloud API for ultra-fast Llama 3 / Qwen inference
   */
  public async callGroq(
    apiKey: string,
    model: string,
    prompt: string,
    systemInstruction?: string
  ): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `Groq HTTP ${response.status}`;
      const err: any = new Error(msg);
      err.status = response.status;
      err.details = errorData;
      throw err;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Tests health and quota of an individual key (Groq or Gemini)
   */
  public async testKey(key: string): Promise<{ success: boolean; message: string; isQuota: boolean }> {
    let lastError: any = null;

    if (this.getProviderForKey(key) === 'groq') {
      const groqModels = ['qwen/qwen3.8-27b', 'groq/compound', 'openai/gpt-oss-120b'];
      for (const model of groqModels) {
        try {
          const start = performance.now();
          const text = await this.callGroq(key, model, 'Reply with the single word: OK');
          const elapsed = (performance.now() - start).toFixed(0);
          this.recordSuccess(key);
          this.rateLimitedUntilMap.delete(key);
          this.notifyListeners();
          return {
            success: true,
            message: `Active & Operational (Groq ${model} · ${elapsed}ms)`,
            isQuota: false
          };
        } catch (err: any) {
          lastError = err;
          if (this.isQuotaExceededError(err)) {
            const delaySecs = this.parseRetryDelay(err);
            this.markKeyRateLimited(key, delaySecs, err?.message || 'Quota limit exceeded');
            return {
              success: false,
              message: `Quota Exceeded! (${delaySecs}s cooldown active)`,
              isQuota: true
            };
          }
          continue;
        }
      }

      return {
        success: false,
        message: lastError?.message || 'Groq API validation failed',
        isQuota: this.isQuotaExceededError(lastError)
      };
    }

    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-2.5-flash'];
    const ai = new GoogleGenAI({ apiKey: key });

    for (const model of candidateModels) {
      try {
        const start = performance.now();
        const resp = await ai.models.generateContent({
          model,
          contents: 'Reply with the single word: OK'
        });
        const elapsed = (performance.now() - start).toFixed(0);
        const text = resp.text?.trim() || 'OK';
        this.recordSuccess(key);
        this.rateLimitedUntilMap.delete(key);
        this.notifyListeners();
        return { success: true, message: `Active & Operational (${model} · ${elapsed}ms)`, isQuota: false };
      } catch (err: any) {
        lastError = err;
        if (this.isQuotaExceededError(err)) {
          const delaySecs = this.parseRetryDelay(err);
          this.markKeyRateLimited(key, delaySecs, err?.message || 'Quota limit exceeded');
          return {
            success: false,
            message: `Quota Exceeded! (${delaySecs}s cooldown active)`,
            isQuota: true
          };
        }
        // If 503 (server overloaded) or 404, try next model in cascade
        if (this.isRetryableServerError(err)) {
          console.warn(`[ApiKeyPool] testKey: model ${model} temporarily unavailable, trying next model...`);
          continue;
        }
        // Other unexpected fatal error
        break;
      }
    }

    const isQuota = this.isQuotaExceededError(lastError);
    return {
      success: false,
      message: lastError?.message || 'API request failed',
      isQuota
    };
  }

  /**
   * Identifies if an error is due to rate limits, quota exhaustion, or 429 status.
   */
  public isQuotaExceededError(err: any): boolean {
    if (!err) return false;
    const status = err?.status || err?.statusCode || err?.response?.status || err?.code;
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
   * Identifies if an error is due to Google server capacity, 503 unavailable, high demand, or model unavailability.
   */
  public isRetryableServerError(err: any): boolean {
    if (!err) return false;
    const status = err?.status || err?.statusCode || err?.response?.status || err?.code;
    if (status === 503 || status === 500 || status === 502 || status === 504 || status === 404) return true;

    const msg = (err?.message || err?.toString() || '').toLowerCase();
    return (
      msg.includes('503') ||
      msg.includes('unavailable') ||
      msg.includes('high demand') ||
      msg.includes('no capacity') ||
      msg.includes('capacity available') ||
      msg.includes('overloaded') ||
      msg.includes('temporarily unavailable') ||
      msg.includes('backend error') ||
      msg.includes('internal server error') ||
      msg.includes('not found') ||
      msg.includes('is not found') ||
      msg.includes('is no longer available')
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
   * Generates content using a robust Model Cascade and API Key Pool Rotation.
   * If a model returns 503 UNAVAILABLE (high demand/no capacity) or 404, it immediately cascades to resilient models.
   * If a key hits 429 (quota exceeded), it rotates to the next API key.
   */
  public async generateContentWithCascade(
    payload: {
      contents: any;
      systemInstruction?: string;
    },
    options?: {
      preferredKey?: string;
      candidateModels?: string[];
      temperature?: number;
    }
  ): Promise<{
    text: string;
    modelUsed: string;
    keyUsed: string;
    failoverCount: number;
    latencyMs: number;
  }> {
    const modelsToTry = options?.candidateModels && options.candidateModels.length > 0
      ? options.candidateModels
      : [
          'gemini-3.5-flash-lite',    // 700ms ultra-fast, highest availability and throughput
          'gemini-flash-lite-latest', // Very stable production tier
          'gemini-3.5-flash',        // Full reasoning capability
          'gemini-3.1-flash-lite',    // Backup lite
          'gemini-2.5-flash'         // Preview model
        ];

    let startKey = options?.preferredKey && options.preferredKey.trim().length > 5
      ? options.preferredKey
      : this.getActiveKey();
    let currentKey = startKey;
    const triedKeys = new Set<string>();
    let failoverCount = 0;
    let lastError: any = null;

    while (triedKeys.size < this.keys.length) {
      triedKeys.add(currentKey);

      // 1. If key is a Groq key (gsk_...), execute via ultra-fast Groq API
      if (this.getProviderForKey(currentKey) === 'groq') {
        const groqModels = ['qwen/qwen3.8-27b', 'groq/compound', 'openai/gpt-oss-120b'];
        for (const model of groqModels) {
          try {
            const callStart = performance.now();
            let promptText = '';
            if (typeof payload.contents === 'string') {
              promptText = payload.contents;
            } else if (Array.isArray(payload.contents)) {
              promptText = payload.contents
                .map(c => typeof c === 'string' ? c : (c?.text || JSON.stringify(c)))
                .join('\n');
            } else {
              promptText = JSON.stringify(payload.contents);
            }

            const text = await this.callGroq(currentKey, model, promptText, payload.systemInstruction);
            const latencyMs = Number((performance.now() - callStart).toFixed(1));

            this.recordSuccess(currentKey);
            return {
              text,
              modelUsed: `Groq ${model}`,
              keyUsed: currentKey,
              failoverCount,
              latencyMs
            };
          } catch (err: any) {
            lastError = err;
            const status = err?.status || err?.code || 'UNKNOWN';
            const errorMsg = err?.message || String(err);

            if (this.isQuotaExceededError(err)) {
              console.warn(
                `%c⚠️ [ApiKeyPool] Groq Key ${this.maskKey(currentKey)} rate-limited. Rotating to next key...`,
                'color: #f59e0b;'
              );
              const delaySecs = this.parseRetryDelay(err);
              this.markKeyRateLimited(currentKey, delaySecs, err?.message || 'Groq Rate Limit');
              break;
            }

            console.warn(
              `%c🔄 [ApiKeyPool] Groq model "${model}" failed (${status}: ${errorMsg.slice(0, 100)}...). Cascading...`,
              'color: #38bdf8;'
            );
          }
        }
      } else {
        // 2. Google Gemini Multi-Model Cascade
        const ai = new GoogleGenAI({ apiKey: currentKey });

        for (const model of modelsToTry) {
          try {
            const callStart = performance.now();
            const requestConfig: any = {
              model,
              contents: payload.contents
            };
            if (payload.systemInstruction) {
              requestConfig.systemInstruction = payload.systemInstruction;
            }

            const response = await ai.models.generateContent(requestConfig);
            const latencyMs = Number((performance.now() - callStart).toFixed(1));
            const text = response.text || '';

            this.recordSuccess(currentKey);
            return {
              text,
              modelUsed: model,
              keyUsed: currentKey,
              failoverCount,
              latencyMs
            };
          } catch (err: any) {
            lastError = err;
            const status = err?.status || err?.code || 'UNKNOWN';
            const errorMsg = err?.message || String(err);

            // If this key is out of quota (429), break out of inner model loop to rotate API key
            if (this.isQuotaExceededError(err)) {
              console.warn(
                `%c⚠️ [ApiKeyPool] Key ${this.maskKey(currentKey)} exceeded quota (429). Rotating to next key...`,
                'color: #f59e0b;'
              );
              const delaySecs = this.parseRetryDelay(err);
              this.markKeyRateLimited(currentKey, delaySecs, err?.message || 'Quota Limit Exceeded');
              break;
            }

            // If Google returns 503 UNAVAILABLE, no capacity, high demand, or 404, cascade to next model
            if (this.isRetryableServerError(err)) {
              console.warn(
                `%c🔄 [ApiKeyPool] Model "${model}" unavailable (${status}: ${errorMsg.slice(0, 100)}...). Cascading to next model...`,
                'color: #38bdf8;'
              );
              continue;
            }

            // Other unexpected error: try next model
            console.warn(`%c⚠️ [ApiKeyPool] Model "${model}" error: ${errorMsg.slice(0, 100)}. Cascading...`, 'color: #ef4444;');
          }
        }
      }

      // If we reach here, either quota was hit or all models failed on this key. Select next untried key.
      failoverCount++;
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
          `%c🔄 [ApiKeyPool] Failover #${failoverCount}: Retrying cascade with key ${this.maskKey(nextKeyToTry)}...`,
          'color: #38bdf8; font-weight: bold;'
        );
        currentKey = nextKeyToTry;
        this.setActiveKey(nextKeyToTry);
        continue;
      }
    }

    throw lastError || new Error(
      `All ${this.keys.length} Gemini API keys and model cascades encountered capacity limits (503) or quota exhaustion (429).`
    );
  }

  /**
   * Executes an operation with automatic failover rotation.
   * If the current key encounters a 429/quota or 503 error, it marks it as rate-limited,
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
        if (this.isQuotaExceededError(err) || this.isRetryableServerError(err)) {
          const delaySecs = this.parseRetryDelay(err);
          failoverCount++;

          // Mark rate limited & get next available key
          this.markKeyRateLimited(currentKey, delaySecs, err?.message || 'Quota Limit Exceeded or Server Overloaded');

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
