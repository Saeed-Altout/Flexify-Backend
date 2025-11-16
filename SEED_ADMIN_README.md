# Seed Admin User

This script creates an admin user in your Supabase database.

## Prerequisites

1. Make sure you have run the SQL setup file (`server/sql/users_setup.sql`) in your Supabase database
2. Set up your environment variables in `server/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Usage

Run the seed script:

```bash
cd server
npm run seed:admin
```

## Admin Credentials

- **Email:** `admin@flexify.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Status:** `active`

## Notes

- The script will skip if the admin user already exists
- Make sure your Supabase database has the `users` table created
- The password will be hashed using bcrypt before storing

