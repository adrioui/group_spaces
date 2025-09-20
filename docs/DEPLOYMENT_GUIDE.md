# Group Spaces - Deployment and Operations Guide

## Overview

This guide provides comprehensive instructions for deploying and operating the Group Spaces application in production environments. The guide covers infrastructure setup, deployment procedures, monitoring, and maintenance operations.

## Architecture Overview

### Production Architecture

```
Load Balancer
    │
    ├── CDN (Static Assets)
    │
    ├── Next.js Application Servers (x3)
    │   ├── Application Code
    │   ├── Environment Variables
    │   └── Health Monitoring
    │
    └── Database Layer
        ├── Primary Database (Turso)
        ├── Read Replicas (Optional)
        └── Backup Storage
```

### Technology Stack

- **Application**: Next.js 15 with Node.js 18+
- **Database**: Turso (SQLite) with global replication
- **Authentication**: Better Auth with secure sessions
- **Hosting**: Vercel (recommended) or similar platform
- **CDN**: Vercel Edge Network or Cloudflare
- **Monitoring**: Application performance monitoring (APM)
- **Logging**: Structured logging with aggregation

## Prerequisites

### System Requirements

#### Application Server
- **Node.js**: 18.x or higher
- **Memory**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended
- **Storage**: 10GB minimum (mostly for node_modules)
- **Network**: Reliable internet connection

#### Database
- **Turso Account**: Active account with sufficient capacity
- **Database Size**: Estimate based on expected user base
- **Connection Pooling**: Configure for expected concurrent users

#### Domain and SSL
- **Domain Name**: Registered domain for the application
- **SSL Certificate**: Auto-provisioned by hosting platform
- **DNS Configuration**: Proper A/AAAA records pointing to application

## Environment Setup

### Environment Variables

#### Required Variables
```env
# Database Configuration
TURSO_CONNECTION_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# Application Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

#### Optional Variables
```env
# Analytics and Monitoring
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"

# Email (for notifications)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-email-password"

# File Storage (future enhancement)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="us-east-1"
```

### Configuration Files

#### Next.js Configuration
```javascript
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
};

export default nextConfig;
```

#### Database Configuration
```typescript
// src/db/index.ts
import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
```

## Deployment Options

### Option 1: Vercel (Recommended)

#### Step 1: Connect to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Connect existing project
vercel link

# Set environment variables
vercel env add TURSO_CONNECTION_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add BETTER_AUTH_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

#### Step 2: Configure Deployment
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "cdg1"],
  "functions": {
    "app/api/**/*": {
      "maxDuration": 30
    }
  }
}
```

#### Step 3: Deploy
```bash
# Deploy to production
vercel --prod

# Deploy to preview environment
vercel
```

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Create docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TURSO_CONNECTION_URL=${TURSO_CONNECTION_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

#### Step 3: Deploy
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Option 3: Traditional Server Deployment

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash nextjs
sudo su - nextjs
```

#### Step 2: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-repo/group-spaces.git
cd group-spaces

# Install dependencies
npm ci --production

# Build application
npm run build

# Create PM2 configuration
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'group-spaces',
    script: 'npm',
    args: 'start',
    cwd: './group-spaces',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      TURSO_CONNECTION_URL: process.env.TURSO_CONNECTION_URL,
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Database Setup

### Turso Database Configuration

#### Step 1: Create Database
```bash
# Install Turso CLI
curl -sSfL https://docs.turso.tech/install.sh | bash

# Login to Turso
turso auth login

# Create database
turso db create group-spaces

# Get database URL
turso db show group-spaces --url
# libsql://group-spaces-your-username.turso.io

# Create authentication token
turso db tokens create group-spaces
```

#### Step 2: Configure Replication
```bash
# Create replicas in different regions
turso db replicate group-spaces group-spaces-sfo --location sfo
turso db replicate group-spaces group-spaces-cdg --location cdg

# View database locations
turso db show group-spaces
```

#### Step 3: Run Migrations
```bash
# Install dependencies
npm install

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with test data
npm run db:seed
```

### Database Backup Strategy

#### Automated Backups
```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash

# Configuration
DB_NAME="group-spaces"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Export database
turso db dump $DB_NAME > $BACKUP_DIR/$DB_NAME_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$DB_NAME_$DATE.sql"
EOF

chmod +x backup-db.sh

# Add to crontab for daily backups
crontab -l | { cat; echo "0 2 * * * /path/to/backup-db.sh"; } | crontab -
```

## Monitoring and Logging

### Application Monitoring

#### Health Check Endpoint
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    // Check database connection
    await db.select({ now: 'datetime("now")' }).limit(1);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    }, { status: 500 });
  }
}
```

#### Performance Monitoring
```typescript
// src/lib/monitoring.ts
export class Monitoring {
  private static instance: Monitoring;
  private metrics: Map<string, number> = new Map();

  static getInstance(): Monitoring {
    if (!Monitoring.instance) {
      Monitoring.instance = new Monitoring();
    }
    return Monitoring.instance;
  }

  incrementMetric(name: string, value: number = 1) {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  recordTiming(name: string, duration: number) {
    const key = `${name}_timing`;
    const current = this.metrics.get(key) || 0;
    const count = this.metrics.get(`${name}_count`) || 0;

    this.metrics.set(key, current + duration);
    this.metrics.set(`${name}_count`, count + 1);
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  reset() {
    this.metrics.clear();
  }
}
```

### Logging Configuration

#### Structured Logging
```typescript
// src/lib/logger.ts
export class Logger {
  private static instance: Logger;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: string, message: string, meta?: any) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    });
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: any) {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}
```

### Error Tracking

#### Sentry Integration
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

## Security Configuration

### SSL/TLS Configuration

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Security Headers

#### Next.js Security Configuration
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Rate Limiting

#### API Rate Limiting
```typescript
// src/lib/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';

interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitData>();

export function rateLimit(request: NextRequest, limit: number, windowMs: number): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const key = `rate_limit:${ip}`;
  const now = Date.now();

  const data = rateLimits.get(key);

  if (!data || now > data.resetTime) {
    rateLimits.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (data.count >= limit) {
    return false;
  }

  data.count++;
  return true;
}
```

## Backup and Recovery

### Database Backup Strategy

#### Automated Backup Script
```bash
#!/bin/bash
# /opt/scripts/backup-database.sh

DB_NAME="group-spaces"
BACKUP_DIR="/opt/backups"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/backup.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
log "Starting backup of database $DB_NAME"
if turso db dump $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.sql; then
    log "Backup completed successfully"

    # Compress backup
    gzip $BACKUP_DIR/${DB_NAME}_${DATE}.sql

    # Remove old backups
    find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    log "Old backups removed"
else
    log "Backup failed"
    exit 1
fi
```

### Application Backup

#### Code and Configuration Backup
```bash
#!/bin/bash
# /opt/scripts/backup-application.sh

APP_DIR="/opt/group-spaces"
BACKUP_DIR="/opt/backups/app"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
tar -czf $BACKUP_DIR/app_${DATE}.tar.gz \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=.git \
    $APP_DIR

# Remove old backups
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
turso db execute group-spaces --file /path/to/backup.sql

# Or restore to new database
turso db create group-spaces-restored
turso db execute group-spaces-restored --file /path/to/backup.sql
```

#### Application Recovery
```bash
# Restore application backup
tar -xzf /path/to/app_backup.tar.gz -C /opt/

# Reinstall dependencies
cd /opt/group-spaces
npm ci --production

# Rebuild application
npm run build

# Restart application
pm2 restart group-spaces
```

## Scaling and Performance

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
# nginx.conf
upstream group_spaces {
    least_conn;
    server app1:3000 weight=1;
    server app2:3000 weight=1;
    server app3:3000 weight=1;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://group_spaces;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Scaling

#### Read Replicas
```typescript
// src/db/replica.ts
import { createClient } from '@libsql/client';

const primaryDb = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const replicaDb = createClient({
  url: process.env.TURSO_REPLICA_URL!,
  authToken: process.env.TURSO_REPLICA_TOKEN!,
});

export function getDb(readOnly: boolean = false) {
  return readOnly ? replicaDb : primaryDb;
}
```

### Caching Strategy

#### Redis Integration (Future Enhancement)
```typescript
// src/lib/redis.ts
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on('error', (err) => console.error('Redis Client Error', err));

await redis.connect();

export default redis;
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily Tasks
- Check application logs for errors
- Monitor database performance
- Verify backup completion
- Check security alerts

#### Weekly Tasks
- Review performance metrics
- Update dependencies (security patches)
- Clean up temporary files
- Monitor storage usage

#### Monthly Tasks
- Database maintenance and optimization
- Review and update SSL certificates
- Performance tuning based on metrics
- Security audit and vulnerability scan

### Update Procedures

#### Dependency Updates
```bash
# Check for outdated dependencies
npm outdated

# Update dependencies
npm update

# Update specific package
npm update package-name

# Run security audit
npm audit
npm audit fix
```

#### Database Updates
```bash
# Generate new migration
npm run db:generate

# Apply migration
npm run db:migrate

# Rollback migration if needed
npm run db:rollback
```

## Troubleshooting

### Common Issues

#### Application Not Starting
```bash
# Check Node.js version
node --version

# Check for missing dependencies
npm install

# Check build errors
npm run build

# Check PM2 status
pm2 status
pm2 logs group-spaces
```

#### Database Connection Issues
```bash
# Test database connection
turso db show group-spaces

# Check environment variables
echo $TURSO_CONNECTION_URL
echo $TURSO_AUTH_TOKEN

# Reset database connection
turso db shell group-spaces
```

#### Performance Issues
```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk usage
df -h

# Check application metrics
pm2 monit
```

### Emergency Procedures

#### Application Down
```bash
# Restart application
pm2 restart group-spaces

# Check application status
pm2 status

# View application logs
pm2 logs group-spaces

# If still down, rollback to previous version
pm2 deploy group-spaces rollback
```

#### Database Issues
```bash
# Check database status
turso db show group-spaces

# Restore from backup
turso db execute group-spaces --file /path/to/latest-backup.sql

# If database is corrupted, create new database
turso db create group-spaces-new
turso db execute group-spaces-new --file /path/to/latest-backup.sql
```

## Support and Documentation

### Support Channels
- **Documentation**: This deployment guide and related documentation
- **Community**: GitHub issues and discussions
- **Monitoring**: Built-in application monitoring
- **Alerting**: Email/Slack notifications for critical issues

### Documentation Structure
- `PROJECT_OVERVIEW.md` - High-level project information
- `API_DOCUMENTATION.md` - Complete API reference
- `DATABASE_SCHEMA.md` - Database architecture
- `TESTING_VALIDATION.md` - Testing procedures
- `DEPLOYMENT_GUIDE.md` - This deployment guide
- `DEVELOPMENT_WORKFLOW.md` - Development practices

### Emergency Contacts
- **Technical Lead**: [Contact Information]
- **System Administrator**: [Contact Information]
- **Database Administrator**: [Contact Information]

---

**Last Updated**: September 2025
**Version**: 1.0.0
**Deployment Status**: Production Ready