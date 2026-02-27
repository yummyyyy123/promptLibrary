# OWASP Top 10 Security Implementation - Environment Variables

# JWT Configuration
JWT_SECRET=8b53360b-4dd1-42c0-994f-40a8ba75f5ec
JWT_KEY_ID=1
REQUEST_SIGNING_SECRET=your-request-signing-secret-change-in-production

# Security Headers
ALLOWED_ORIGINS=http://localhost:3000,https://prompt-library-three-wheat.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Session Management
SESSION_SECRET=your-session-secret-change-in-production
SESSION_TIMEOUT_MS=86400000

# Logging
SECURITY_LOG_LEVEL=info
SECURITY_ALERT_WEBHOOK=your-webhook-url

# CSP Configuration
CSP_DEFAULT_SRC='self'
CSP_SCRIPT_SRC='self' 'unsafe-inline' 'unsafe-eval'
CSP_STYLE_SRC='self' 'unsafe-inline'
CSP_IMG_SRC='self' data: https:
CSP_CONNECT_SRC='self' https://urqzfyvbkmibwhjlpyyo.supabase.co
