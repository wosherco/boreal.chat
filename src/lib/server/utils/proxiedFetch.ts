import fetch, { type RequestInit, type Response } from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import { env } from "$env/dynamic/private";

interface ProxiedFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  signal?: AbortSignal;
}

interface ProxyConfig {
  enabled: boolean;
  url?: string;
  username?: string;
  password?: string;
  timeout: number;
  connectTimeout: number;
  allowedDomains: string[];
  maxConcurrentRequests: number;
  requestTimeout: number;
}

// Active request tracking for rate limiting
let activeRequests = 0;

// Parse proxy configuration from environment variables
function getProxyConfig(): ProxyConfig {
  const allowedDomains = env.MCP_ALLOWED_DOMAINS 
    ? env.MCP_ALLOWED_DOMAINS.split(',').map(d => d.trim())
    : ['localhost', '127.0.0.1'];

  return {
    enabled: env.MCP_PROXY_ENABLED === 'true',
    url: env.MCP_PROXY_URL,
    username: env.MCP_PROXY_USERNAME,
    password: env.MCP_PROXY_PASSWORD,
    timeout: parseInt(env.MCP_PROXY_TIMEOUT || '30000'),
    connectTimeout: parseInt(env.MCP_PROXY_CONNECT_TIMEOUT || '10000'),
    allowedDomains,
    maxConcurrentRequests: parseInt(env.MCP_MAX_CONCURRENT_REQUESTS || '5'),
    requestTimeout: parseInt(env.MCP_REQUEST_TIMEOUT || '30000'),
  };
}

// Validate if a URL is allowed based on domain whitelist
function isUrlAllowed(url: string, allowedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    return allowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        // Wildcard domain matching
        const baseDomain = domain.slice(2);
        return hostname.endsWith(baseDomain);
      }
      return hostname === domain;
    });
  } catch {
    return false;
  }
}

// Create proxy agent based on URL protocol
function createProxyAgent(proxyUrl: string, username?: string, password?: string) {
  const proxyUrlWithAuth = username && password 
    ? proxyUrl.replace('://', `://${encodeURIComponent(username)}:${encodeURIComponent(password)}@`)
    : proxyUrl;

  const url = new URL(proxyUrlWithAuth);
  
  if (url.protocol === 'https:') {
    return new HttpsProxyAgent(proxyUrlWithAuth);
  } else {
    return new HttpProxyAgent(proxyUrlWithAuth);
  }
}

/**
 * Proxied fetch function for MCP external requests with security controls
 * @param url - The URL to fetch
 * @param options - Fetch options with optional timeout
 * @returns Promise<Response>
 */
export async function proxiedFetch(url: string, options: ProxiedFetchOptions = {}): Promise<Response> {
  const config = getProxyConfig();

  // Check if URL is allowed
  if (!isUrlAllowed(url, config.allowedDomains)) {
    throw new Error(`URL ${url} is not allowed. Allowed domains: ${config.allowedDomains.join(', ')}`);
  }

  // Check concurrent request limit
  if (activeRequests >= config.maxConcurrentRequests) {
    throw new Error(`Maximum concurrent requests limit (${config.maxConcurrentRequests}) reached`);
  }

  activeRequests++;
  
  try {
    const timeoutMs = options.timeout || config.requestTimeout;
    const fetchOptions: any = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'boreal-chat-mcp-client/1.0',
        'Accept': 'application/json, text/plain, */*',
        'Connection': 'close',
        ...((options.headers as Record<string, string>) || {}),
      },
      body: options.body,
    };

    // Add proxy agent if enabled
    if (config.enabled && config.url) {
      const agent = createProxyAgent(config.url, config.username, config.password);
      fetchOptions.agent = agent;
    }

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    fetchOptions.signal = options.signal || controller.signal;

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  } finally {
    activeRequests--;
  }
}

/**
 * Get the configured fetch function for MCP requests
 * This function returns either the proxied fetch or regular fetch based on configuration
 */
export function getMCPFetch(): typeof fetch {
  const config = getProxyConfig();
  
  if (config.enabled) {
    return proxiedFetch as any;
  }
  
  // Return a wrapped regular fetch with domain restrictions and rate limiting
  return async (url: string | URL | Request, options?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    if (!isUrlAllowed(urlString, config.allowedDomains)) {
      throw new Error(`URL ${urlString} is not allowed. Allowed domains: ${config.allowedDomains.join(', ')}`);
    }

    if (activeRequests >= config.maxConcurrentRequests) {
      throw new Error(`Maximum concurrent requests limit (${config.maxConcurrentRequests}) reached`);
    }

    activeRequests++;
    
    try {
      const timeout = config.requestTimeout;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'boreal-chat-mcp-client/1.0',
          'Accept': 'application/json, text/plain, */*',
          'Connection': 'close',
          ...((options?.headers as Record<string, string>) || {}),
        },
      };

      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if ((error as any).name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }
    } finally {
      activeRequests--;
    }
  };
}

/**
 * Get current proxy configuration (for debugging/monitoring)
 */
export function getProxyInfo() {
  const config = getProxyConfig();
  return {
    enabled: config.enabled,
    hasProxy: !!config.url,
    allowedDomains: config.allowedDomains,
    maxConcurrentRequests: config.maxConcurrentRequests,
    requestTimeout: config.requestTimeout,
    activeRequests,
  };
}