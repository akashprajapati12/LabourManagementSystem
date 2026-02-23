# Deployment Guide

## Quick Start

1. **Clone your repository:**
```bash
git clone <your-github-repo-url>
cd labour-mgmt-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
# Copy .env.example to .env and update values
cp .env.example .env
# Edit .env file with your settings
```

4. **Start the application:**
```bash
npm start
```

## Production Deployment Options

### 1. Traditional Server Deployment

**Requirements:**
- Node.js 14+ installed on server
- SSH access to server
- Domain name (optional)

**Steps:**
1. Upload files to server
2. Install Node.js and npm
3. Run `npm install` in project directory
4. Configure environment variables
5. Start with `npm start`
6. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name labour-mgmt
pm2 startup
pm2 save
```

### 2. Docker Deployment

**Requirements:**
- Docker installed on target system

**Steps:**
```bash
# Build and run with Docker
docker build -t labour-mgmt-system .
docker run -d -p 5000:5000 --name labour-mgmt-system labour-mgmt-system

# Or use docker-compose
docker-compose up -d
```

### 3. Cloud Platform Deployment

#### Heroku
```bash
heroku create your-labour-app
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

#### Railway
1. Connect GitHub repository to Railway
2. Railway auto-deploys on push
3. Add environment variables in dashboard

#### Vercel (Backend)
```bash
vercel --prod
```

## Environment Variables

Create a `.env` file with these variables:

```bash
PORT=5000
JWT_SECRET=your_secure_secret_key_here_change_this
NODE_ENV=production
DB_PATH=./database.sqlite
```

## Database Management

### Backup Strategy
```bash
# Manual backup
cp database.sqlite backups/database_$(date +%Y%m%d_%H%M%S).sqlite

# Automated backup script
#!/bin/bash
cp database.sqlite backups/database_$(date +%Y%m%d_%H%M%S).sqlite
find backups/ -name "database_*.sqlite" -mtime +7 -delete
```

### Migration
The application automatically creates/updates database schema on startup.

## Security Considerations

1. **Change default JWT secret** in production
2. **Use HTTPS** in production
3. **Regular database backups**
4. **Update dependencies** regularly
5. **Monitor logs** for suspicious activity

## Monitoring

### Health Check Endpoint
`GET /api/health` returns:
```json
{
  "status": "OK",
  "timestamp": "2026-02-23T10:30:00.000Z",
  "uptime": 3600
}
```

### Log Monitoring
Check application logs:
```bash
# If using PM2
pm2 logs labour-mgmt

# If using Docker
docker logs labour-mgmt-system
```

## Scaling Options

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Shared database or database cluster
- Session storage (Redis recommended)

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add caching layer

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   lsof -i :5000
   kill -9 <PID>
   ```

2. **Database connection errors:**
   - Check file permissions
   - Verify database file exists
   - Check disk space

3. **Authentication failures:**
   - Verify JWT_SECRET is consistent
   - Clear browser cache/cookies
   - Check token expiration

### Support
For deployment issues, check:
- Application logs
- System resources
- Network connectivity
- Firewall settings