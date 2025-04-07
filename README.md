
# Freelancer CRM with Fortnox Integration

A comprehensive CRM application for freelancers with time tracking, invoicing, and Fortnox integration.

## Self-Hosted Deployment Guide

This guide will walk you through setting up the application on a self-hosted Linux server with a self-hosted Supabase instance.

### Prerequisites

- A Linux server (Ubuntu 20.04 LTS or later recommended)
- Docker and Docker Compose installed
- Git
- Node.js 18+ and npm
- Domain name (optional but recommended)

### Step 1: Set Up Self-hosted Supabase

1. **Clone the Supabase repository**:

```bash
git clone https://github.com/supabase/supabase
cd supabase/docker
```

2. **Create a copy of the example env file**:

```bash
cp .env.example .env
```

3. **Edit the .env file** to set your passwords and configuration:

```bash
nano .env
```

4. **Generate JWT secrets**:

```bash
# Generate JWT_SECRET for authentication
openssl rand -base64 64

# Generate ANON_KEY (for public API calls)
openssl rand -base64 64

# Generate SERVICE_ROLE_KEY (for admin API calls)
openssl rand -base64 64
```

5. **Update your .env file** with these values, and set appropriate PostgreSQL credentials.

6. **Start Supabase services**:

```bash
docker-compose up -d
```

7. **Verify all services are running**:

```bash
docker-compose ps
```

### Step 2: Set Up the Database Schema

1. **Connect to the PostgreSQL database**:

```bash
docker exec -it supabase_db_1 psql -U postgres -d postgres
```

2. **Create the fortnox_credentials table**:

```sql
CREATE TABLE IF NOT EXISTS fortnox_credentials (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE fortnox_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own Fortnox credentials"
    ON fortnox_credentials
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Fortnox credentials"
    ON fortnox_credentials
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Fortnox credentials"
    ON fortnox_credentials
    FOR UPDATE
    USING (auth.uid() = user_id);
```

3. **Exit PostgreSQL**:

```sql
\q
```

### Step 3: Configure Supabase Edge Functions

For the Fortnox API integration, you'll need to create a Supabase Edge Function:

1. **Set up Supabase CLI**:

```bash
npm install -g supabase
```

2. **Login to your Supabase instance**:

```bash
supabase login
```

3. **Initialize Supabase in your project directory**:

```bash
cd /path/to/your/project
supabase init
```

4. **Create an Edge Function for Fortnox integration**:

```bash
mkdir -p supabase/functions/fortnox-export
touch supabase/functions/fortnox-export/index.ts
```

5. **Edit the Edge Function**:

```bash
nano supabase/functions/fortnox-export/index.ts
```

6. **Add the following code to the Edge Function**:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Get the JWT token from the request
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the Fortnox credentials for this user
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('fortnox_credentials')
      .select('client_id, client_secret, access_token, refresh_token')
      .eq('user_id', user.id)
      .single()
      
    if (credentialsError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'Fortnox credentials not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get the invoice data from the request
    const invoiceData = await req.json()
    
    // In a real implementation, you would use the credentials and invoice data
    // to make API calls to Fortnox
    
    // For now, just return success
    return new Response(
      JSON.stringify({ success: true, message: 'Invoice exported to Fortnox (simulated)' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

7. **Deploy the Edge Function**:

```bash
supabase functions deploy fortnox-export --project-ref <your-supabase-project-ref>
```

### Step 4: Deploy the Frontend Application

1. **Clone your application repository**:

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Create a .env file for your production environment**:

```bash
touch .env.production
```

3. **Add your Supabase configuration**:

```
VITE_SUPABASE_URL=http://your-server-ip:8000
VITE_SUPABASE_ANON_KEY=your-anon-key-from-earlier-steps
```

4. **Install dependencies and build the application**:

```bash
npm install
npm run build
```

5. **Set up Nginx to serve the built frontend files**:

```bash
sudo apt update
sudo apt install nginx
sudo nano /etc/nginx/sites-available/freelancer-crm
```

6. **Add this Nginx configuration**:

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;

    root /path/to/your/project/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy requests to Supabase
    location /rest/v1/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /auth/v1/ {
        proxy_pass http://localhost:9999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /storage/v1/ {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

7. **Enable the site and restart Nginx**:

```bash
sudo ln -s /etc/nginx/sites-available/freelancer-crm /etc/nginx/sites-enabled/
sudo nginx -t  # Test the configuration
sudo systemctl restart nginx
```

8. **(Optional) Set up SSL with Certbot**:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Step 5: Create an Initial Admin User

1. **Use the Supabase UI** to create an initial admin user:

   - Open your browser and navigate to `http://your-server-ip:3000`
   - Log in with the email and password you set in the `.env` file
   - Go to Authentication > Users and create a new user

2. **Alternatively, use the API**:

```bash
curl -X POST 'http://your-server-ip:8000/auth/v1/signup' \
-H "apikey: your-anon-key" \
-H "Content-Type: application/json" \
--data '{"email":"admin@example.com","password":"strong-password"}'
```

### Step 6: Regular Maintenance

1. **Set up automated backups**:

```bash
# Create a backup script
nano /root/backup-supabase.sh
```

2. **Add this content to the script**:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/supabase"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec supabase_db_1 pg_dump -U postgres postgres > $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Compress the backup
gzip $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Keep only the last 7 backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -type f -mtime +7 -delete
```

3. **Make the script executable and add to cron**:

```bash
chmod +x /root/backup-supabase.sh
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * /root/backup-supabase.sh
```

### Updating the Application

To update your application with new changes:

```bash
cd /path/to/your/project
git pull
npm install
npm run build
```

To update Supabase:

```bash
cd /path/to/supabase/docker
git pull
docker-compose down
docker-compose up -d
```

## Troubleshooting

1. **Check Supabase logs**:
```bash
cd /path/to/supabase/docker
docker-compose logs -f
```

2. **Check nginx logs**:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. **Check Edge Function logs**:
```bash
supabase functions logs --project-ref <your-project-ref>
```

4. **Reset database password** (if needed):
```bash
docker exec -it supabase_db_1 psql -U postgres
ALTER USER postgres WITH PASSWORD 'new-password';
```

5. **Restart all services**:
```bash
cd /path/to/supabase/docker
docker-compose restart
sudo systemctl restart nginx
```

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/hosting/docker)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)
