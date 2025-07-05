# Database Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=8889
MYSQL_DATABASE=semester4
MYSQL_USER=root
MYSQL_PASSWORD=root

# Groq API Key (for AI features)
GROQ_API_KEY=your_groq_api_key_here
```

## Database Setup Steps

1. **Install MySQL/MAMP/XAMPP**
   - Use MAMP (recommended for Mac/Windows)
   - Or XAMPP for Windows
   - Or standalone MySQL server

2. **Create Database**
   ```sql
   CREATE DATABASE semester4;
   ```

3. **Import Schema**
   ```bash
   mysql -u root -p semester4 < scripts/semester4.sql
   ```

4. **Verify Data**
   ```sql
   USE semester4;
   SELECT * FROM RESTAURANT;
   ```

## Demo Credentials

The system includes fallback demo credentials that work without database:

- **Email**: admin@restomate.com
- **Password**: admin123

## Troubleshooting

### Login Timeout Issues
1. Check if MySQL is running
2. Verify environment variables
3. Test database connection
4. Use demo credentials as fallback

### Database Connection Errors
1. Ensure MySQL service is running
2. Check port configuration (default: 8889 for MAMP)
3. Verify database name and credentials
4. Test connection manually

## Current Status
- ✅ Demo credentials work without database
- ✅ Fallback system implemented
- ✅ Error messages are helpful
- ⚠️ Database connection needs proper setup for production 