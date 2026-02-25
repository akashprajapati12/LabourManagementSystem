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
# Add this to your package.json if not already present
"engines": {
  "node": ">=18.x"
}

# Deploy to Heroku
heroku create your-labour-app
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secure_secret_key
heroku addons:create heroku-postgresql:hobby-dev  # if using PostgreSQL
git push heroku main
```

#### Railway
1. Connect GitHub repository to Railway
2. Railway auto-deploys on push
3. Add environment variables in dashboard
4. Set build command to: `npm install` (if needed)
5. Set start command to: `npm start`

#### Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`

#### Vercel (Backend)
1. Add `@vercel/node` to your dependencies if creating API routes
2. Create `vercel.json` configuration file
3. Deploy using: `vercel --prod`

## GitHub Pages Limitation Notice

⚠️ **Important**: This application CANNOT be deployed to GitHub Pages as GitHub Pages only hosts static files (HTML, CSS, JavaScript) and cannot run Node.js applications with server-side logic and database interactions. GitHub Pages is designed for frontend-only applications, not full-stack applications like this Labour Management System. To deploy this application, you must use a cloud platform that supports Node.js applications such as Heroku, Railway, Render, or AWS.

## Environment Variables

Create a `.env` file with these variables:

```bash
PORT=5000
JWT_SECRET=your_secure_secret_key_here_change_this
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/labourDB
```

## Database Management

### Backup Strategy
```bash
# Example backup using mongodump (adjust URI as needed)
mongodump --uri "$MONGODB_URI" --out backups/labour-db-$(date +%Y%m%d_%H%M%S)

# automated script
#!/bin/bash
mongodump --uri "$MONGODB_URI" --out backups/labour-db-$(date +%Y%m%d_%H%M%S)
find backups/ -maxdepth 1 -name "labour-db-*" -mtime +7 -exec rm -rf {} \;
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