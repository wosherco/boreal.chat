# MCP Proxy Configuration

This document explains how to configure proxy settings for MCP (Model Context Protocol) external requests in Boreal Chat.

## Overview

The MCP proxy system provides security and control over external HTTP requests made by MCP servers. This is particularly important in production environments where you want to:

- Route MCP traffic through a corporate proxy
- Restrict which domains MCP servers can access
- Monitor and log MCP external requests
- Add authentication to external requests
- Implement rate limiting and security controls

## Environment Variables

Add these environment variables to your `.env` file:

### Basic Proxy Settings

```env
# Enable/disable MCP proxy (true/false)
MCP_PROXY_ENABLED="true"

# HTTP/HTTPS proxy URL
MCP_PROXY_URL="http://your-proxy-server:8080"

# Proxy authentication (optional)
MCP_PROXY_USERNAME="your-username"
MCP_PROXY_PASSWORD="your-password"
```

### Security Settings

```env
# Comma-separated list of allowed domains for MCP HTTP requests
MCP_ALLOWED_DOMAINS="localhost,127.0.0.1,*.internal.company.com,api.example.com"

# Maximum number of concurrent MCP requests
MCP_MAX_CONCURRENT_REQUESTS="5"

# MCP request timeout (in milliseconds)
MCP_REQUEST_TIMEOUT="30000"
```

### Proxy Timeout Settings

```env
# Proxy timeout settings (in milliseconds)
MCP_PROXY_TIMEOUT="30000"
MCP_PROXY_CONNECT_TIMEOUT="10000"
```

## Configuration Examples

### Corporate Environment

For a corporate environment with a proxy server:

```env
MCP_PROXY_ENABLED="true"
MCP_PROXY_URL="http://corporate-proxy.company.com:8080"
MCP_PROXY_USERNAME="service-account"
MCP_PROXY_PASSWORD="secure-password"
MCP_ALLOWED_DOMAINS="*.company.com,trusted-api.example.com"
MCP_MAX_CONCURRENT_REQUESTS="3"
MCP_REQUEST_TIMEOUT="60000"
```

### Development Environment

For development with domain restrictions but no proxy:

```env
MCP_PROXY_ENABLED="false"
MCP_ALLOWED_DOMAINS="localhost,127.0.0.1,*.local,httpbin.org"
MCP_MAX_CONCURRENT_REQUESTS="10"
MCP_REQUEST_TIMEOUT="15000"
```

### High-Security Environment

For maximum security with strict controls:

```env
MCP_PROXY_ENABLED="true"
MCP_PROXY_URL="http://security-proxy.internal:3128"
MCP_ALLOWED_DOMAINS="whitelisted-api.internal"
MCP_MAX_CONCURRENT_REQUESTS="2"
MCP_REQUEST_TIMEOUT="20000"
MCP_PROXY_TIMEOUT="20000"
MCP_PROXY_CONNECT_TIMEOUT="5000"
```

## Domain Whitelisting

The `MCP_ALLOWED_DOMAINS` setting supports:

- **Exact domains**: `api.example.com`
- **Wildcards**: `*.internal.company.com` (matches any subdomain)
- **IP addresses**: `192.168.1.100`
- **Localhost variants**: `localhost`, `127.0.0.1`

## How It Works

1. **Request Interception**: All HTTP requests from MCP clients are intercepted
2. **Domain Validation**: URLs are checked against the allowed domains list
3. **Rate Limiting**: Concurrent request limits are enforced
4. **Proxy Routing**: If enabled, requests are routed through the configured proxy
5. **Security Headers**: Standard security headers are added to all requests

## Monitoring

### Settings Page

The MCP settings page (`/settings/mcp`) displays:
- Current proxy status (enabled/disabled)
- Allowed domains list
- Active request count
- Proxy configuration status

### API Endpoints

- `GET /api/v1/mcp/proxyStatus` - Get current proxy configuration
- `POST /api/v1/mcp/testConnection` - Test MCP server connectivity

### Logs

Proxy operations are logged to the console:
- Proxy configuration on startup
- Connection attempts and results
- Domain validation failures
- Rate limiting events

## Security Considerations

### Best Practices

1. **Always use allowlists**: Never use `*` in production
2. **Minimize concurrent requests**: Lower limits reduce attack surface
3. **Use authentication**: Configure proxy username/password
4. **Monitor actively**: Watch logs for suspicious activity
5. **Regular reviews**: Periodically review allowed domains

### Proxy Server Requirements

Your proxy server should support:
- HTTP and HTTPS protocols
- Basic authentication (if using credentials)
- Standard HTTP headers
- Connection timeouts

### Network Security

- Ensure proxy server is properly secured
- Use internal/private networks when possible
- Consider TLS termination at proxy level
- Implement proper firewall rules

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Increase `MCP_PROXY_TIMEOUT` and `MCP_PROXY_CONNECT_TIMEOUT`
   - Check proxy server availability

2. **Domain Blocked**
   - Verify domain is in `MCP_ALLOWED_DOMAINS`
   - Check wildcard patterns are correct

3. **Authentication Failures**
   - Verify `MCP_PROXY_USERNAME` and `MCP_PROXY_PASSWORD`
   - Ensure proxy supports basic auth

4. **Rate Limiting**
   - Increase `MCP_MAX_CONCURRENT_REQUESTS`
   - Check for stuck/slow requests

### Testing Connectivity

Use the test endpoint to verify MCP server connectivity:

```bash
curl -X POST http://localhost:5173/api/v1/mcp/testConnection \
  -H "Content-Type: application/json" \
  -d '{"id": "mcp-server-uuid"}'
```

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV="development"
```

This will log all proxy operations and connection attempts.

## Implementation Details

The proxy system uses:
- `http-proxy-agent` and `https-proxy-agent` for proxy support
- Node.js `fetch` with custom agents
- Global fetch patching for MCP client compatibility
- Request/response interception and modification

Files involved:
- `src/lib/server/utils/proxiedFetch.ts` - Core proxy functionality
- `src/lib/server/utils/mcpGlobalFetch.ts` - Global fetch patching
- `src/lib/server/utils/mcpTester.ts` - Connection testing
- `src/lib/server/services/mcp.ts` - MCP service integration