# 🗄️ MySQL Migration Guide

This guide will help you migrate your Student Feedback Portal from Supabase to local MySQL.

## 📋 Prerequisites

### 1. Install MySQL
- **Windows**: Download MySQL Community Server from [mysql.com](https://dev.mysql.com/downloads/mysql/)
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-server`

### 2. Start MySQL Service
- **Windows**: MySQL should start automatically after installation
- **macOS/Linux**: `brew services start mysql` or `sudo systemctl start mysql`

### 3. Set Root Password
Make sure your MySQL root password is set to `root` (as specified in .env):
```bash
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;
```

## 🚀 Setup Instructions

### 1. Install Dependencies
All necessary packages have been installed. If you need to reinstall:
```bash
npm install
```

### 2. Environment Configuration
The `.env` file is already configured with:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=feedback_portal
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

### 3. Start the Application
Run both the backend server and frontend simultaneously:
```bash
npm start
```

Or run them separately:
```bash
# Terminal 1 - Backend server
npm run server

# Terminal 2 - Frontend
npm run dev
```

## 🔧 What Has Been Migrated

### ✅ Completed
1. **Database Schema**: Complete MySQL schema created in `server/migrations/001_create_tables.sql`
2. **Backend API**: Express.js server with all batch CRUD operations
3. **Authentication**: JWT-based authentication replacing Supabase Auth
4. **Database Connection**: MySQL connection pool with proper configuration
5. **Frontend Integration**: Updated batch management to use MySQL API
6. **Session Management**: Custom session context provider

### 📊 Database Tables Created
- `users` - User accounts with email/password
- `profiles` - User profile information
- `batches` - Student batches (the main feature you wanted to fix)
- `subjects` - Classes/subjects
- `timetables` - Class scheduling
- `feedback` - Student feedback
- `feedback_questions` - Custom feedback questions

### 🔐 Default Admin Account
- **Email**: `admin@feedback.com`
- **Password**: `admin123`

## 🧪 Testing the Migration

### 1. Check Database Connection
When you run `npm run server`, you should see:
```
✅ MySQL database connected successfully!
✅ Database migrations completed successfully!
🚀 Server running on http://localhost:3001
```

### 2. Test Batch Functionality
1. Go to http://localhost:8080/login
2. Login with admin credentials
3. Navigate to Admin → Batches
4. Add a new batch (e.g., "2024-2028")
5. Refresh the page - **the batch should persist!** 

## 🔍 API Endpoints

The following endpoints are now available:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Profile
- `GET /api/profile` - Get current user profile

### Batches
- `GET /api/batches` - Get all batches
- `POST /api/batches` - Create new batch (admin only)
- `PUT /api/batches/:id` - Update batch (admin only)
- `DELETE /api/batches/:id` - Delete batch (admin only)

## 🔧 Architecture Changes

### Before (Supabase)
```
Frontend → Supabase Client → Supabase Database
```

### After (MySQL)
```
Frontend → API Client → Express.js Server → MySQL Database
```

## 📁 New Files Added

- `server/server.js` - Express.js API server
- `server/config/database.js` - MySQL connection configuration
- `server/migrations/001_create_tables.sql` - Database schema
- `src/lib/api-client.ts` - MySQL API client (replaces Supabase client)
- `.env` - Environment variables

## 📝 Modified Files

- `src/hooks/useBatches.ts` - Updated to use MySQL API
- `src/components/SessionContextProvider.tsx` - Custom authentication
- `src/pages/Login.tsx` - Custom login form
- `package.json` - Added server scripts

## 🚨 Important Notes

1. **Security**: Change the JWT_SECRET in production
2. **Database**: The migration creates the database automatically
3. **CORS**: API is configured for localhost:8080 and localhost:3000
4. **Real-time**: Unlike Supabase, this doesn't have real-time features
5. **Migration**: Only batch functionality is fully migrated; other features still use Supabase

## 🐛 Troubleshooting

### MySQL Connection Failed
- Check if MySQL is running: `brew services list` or `sudo systemctl status mysql`
- Verify root password is set to 'root'
- Check if port 3306 is available

### Server Won't Start
- Make sure port 3001 is available
- Check that all dependencies are installed
- Verify .env file exists

### Frontend Can't Connect to API
- Ensure both frontend (8080) and backend (3001) are running
- Check browser console for CORS errors
- Verify API_BASE_URL in api-client.ts

## 🎉 Success Indicators

✅ **Database connected** - Server logs show successful connection
✅ **Migrations run** - Database tables created
✅ **Admin login works** - Can login with admin@feedback.com
✅ **Batches persist** - Added batches stay after refresh
✅ **CRUD operations work** - Can add, edit, delete batches

## 🔄 Next Steps (Optional)

To fully migrate from Supabase, you would need to:
1. Migrate all remaining hooks (subjects, timetables, feedback, etc.)
2. Update all components to use the new API
3. Implement real-time features if needed
4. Add data import/export functionality
5. Set up production deployment

The batch functionality is now fully working with MySQL and should resolve your persistence issue!
