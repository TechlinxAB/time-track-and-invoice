
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

### Installing Prerequisites

1. **Update your system packages**:

```bash
sudo apt update
sudo apt upgrade -y
```

2. **Install Docker**:

```bash
# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Add Docker repository
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Install Docker
sudo apt update
sudo apt install -y docker-ce

# Verify Docker is running
sudo systemctl status docker
```

3. **Install Docker Compose**:

```bash
# Download Docker Compose binary
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Apply executable permissions
sudo chmod +x /usr/local/bin/docker-compose

# Create symbolic link
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installation
docker-compose --version
```

4. **Install Node.js and npm**:

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

5. **Install Git**:

```bash
sudo apt install -y git
git --version
```

### Step 1: Set Up Self-hosted Supabase

1. **Create a directory for Supabase and clone the repository**:

```bash
# Create directory and navigate into it
mkdir -p ~/supabase
cd ~/supabase

# Clone the Supabase repository
git clone https://github.com/supabase/supabase
cd supabase/docker
```

2. **Create a copy of the example env file**:

```bash
# Make sure you're in the supabase/docker directory
cp .env.example .env
```

3. **Edit the .env file** to set your passwords and configuration:

```bash
# Make sure you're in the supabase/docker directory
nano .env
```

4. **Generate JWT secrets and encryption key** (you can open another terminal or exit nano temporarily):

```bash
# Generate JWT_SECRET for authentication
openssl rand -base64 64

# Generate ANON_KEY (for public API calls)
openssl rand -base64 64

# Generate SERVICE_ROLE_KEY (for admin API calls)
openssl rand -base64 64

# Generate VAULT_ENC_KEY (at least 32 characters)
openssl rand -base64 32
```

5. **Update your .env file** with these values, and set appropriate PostgreSQL credentials.

   **IMPORTANT**: Make sure to set `VAULT_ENC_KEY` to the generated value from the previous step. This value MUST be at least 32 characters long or your Supabase services will fail to start properly.
   
   Example .env configuration:
   ```
   # PostgreSQL database
   POSTGRES_PASSWORD=your_secure_password_here
   
   # JWT settings
   JWT_SECRET=your_generated_jwt_secret_here
   
   # API Keys
   ANON_KEY=your_generated_anon_key_here
   SERVICE_ROLE_KEY=your_generated_service_role_key_here
   
   # Encryption key (REQUIRED, must be at least 32 chars)
   VAULT_ENC_KEY=your_generated_vault_enc_key_here
   ```

   **Important**: For older versions of Docker Compose (1.29.x), you need to modify the docker-compose.yml file to fix the environment variables:

```bash
# Make sure you're in the supabase/docker directory
nano docker-compose.yml
```

Find all boolean values like `true` or `false` in environment variables and convert them to strings by adding quotes like `"true"` or `"false"`.

6. **Start Supabase services**:

```bash
# Make sure you're in the supabase/docker directory
docker-compose up -d
```

7. **Verify all services are running**:

```bash
# Make sure you're in the supabase/docker directory
docker-compose ps
```

If any services failed to start or show "unhealthy" status, check the logs:

```bash
docker-compose logs <service-name>
```

Common issues:
- Missing `VAULT_ENC_KEY` in .env file (must be at least 32 characters)
- Docker Compose version compatibility (use quotes for boolean values)
- Insufficient system resources (especially for smaller VPS instances)
- Port conflicts with existing services

### Step 2: Set Up the Database Schema

1. **Connect to the PostgreSQL database**:

```bash
# Make sure you're in the supabase/docker directory
# Use the actual container name from docker-compose ps output
# It might be 'supabase-db' instead of 'supabase_db_1'
sudo docker exec -it supabase-db psql -U postgres -d postgres
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

### Step 3: Configure the Frontend Application

1. **Clone the application repository**:

```bash
# Navigate to your home directory or preferred location
cd ~/

# Clone your repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Create a .env file for your production environment**:

```bash
# Make sure you're in your project directory
touch .env.production
```

3. **Add your Supabase configuration**:

```bash
# Make sure you're in your project directory
nano .env.production
```

Add the following content:

```
VITE_SUPABASE_URL=http://your-server-ip:8000
VITE_SUPABASE_ANON_KEY=your-anon-key-from-earlier-steps
```

4. **Install dependencies and build the application**:

```bash
# Make sure you're in your project directory
npm install
npm run build
```

### Step 4: Set up Nginx to serve the frontend and proxy API requests

1. **Install Nginx**:

```bash
sudo apt update
sudo apt install -y nginx
```

2. **Create a directory for your application**:

```bash
# Create the directory where the built files will be served from
sudo mkdir -p /var/www/html/freelancer-crm
```

3. **Copy your built frontend files**:

```bash
# Copy the built files to the nginx directory
sudo cp -r dist/* /var/www/html/freelancer-crm/
```

4. **Create a Nginx configuration file**:

```bash
sudo nano /etc/nginx/sites-available/freelancer-crm.conf
```

5. **Add this Nginx configuration**:

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;

    # Root directory where your built frontend files are located
    root /var/www/html/freelancer-crm;
    index index.html;

    # Handle frontend routes for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy Supabase API requests
    location /rest/v1/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth/v1/ {
        proxy_pass http://localhost:9999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /storage/v1/ {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Redirect Edge Functions if needed
    location /functions/v1/ {
        proxy_pass http://localhost:8000/functions/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy WebSocket connections for realtime features
    location /realtime/v1/ {
        proxy_pass http://localhost:8080/realtime/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific settings
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Note: Be sure to replace "your-domain-or-ip" with your actual domain name or server IP address.

6. **Enable the site and restart Nginx**:

```bash
# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/freelancer-crm.conf /etc/nginx/sites-enabled/

# Remove default site to avoid conflicts (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test the nginx configuration
sudo nginx -t

# If the test is successful, restart nginx
sudo systemctl restart nginx
```

7. **(Optional) Set up SSL with Certbot**:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Step 5: Create an Initial Admin User

1. **Use the Supabase UI** to create an initial admin user:

   - Open your browser and navigate to `http://your-server-ip:3000`
   - Log in with the email and password you set in the `.env` file (default is `supabase`)
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
sudo nano /root/backup-supabase.sh
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
sudo chmod +x /root/backup-supabase.sh
sudo crontab -e

# Add this line to run daily at 2 AM
0 2 * * * /root/backup-supabase.sh
```

### Accessing Your Application

After completing the setup:

1. Access your frontend application at: `http://your-domain-or-ip`
2. Access the Supabase Studio at: `http://your-domain-or-ip:3000`

### Updating the Application

To update your application with new changes:

```bash
# Navigate to your project directory
cd /path/to/your/project
git pull
npm install
npm run build

# Copy the updated files to the nginx directory
sudo cp -r dist/* /var/www/html/freelancer-crm/
```

To update Supabase:

```bash
# Navigate to the supabase/docker directory
cd ~/supabase/supabase/docker
git pull
docker-compose down
docker-compose up -d
```

## Troubleshooting

1. **Check Supabase logs**:
```bash
# Navigate to the supabase/docker directory
cd ~/supabase/supabase/docker
docker-compose logs -f
```

2. **View specific service logs**:
```bash
# Check logs for specific services
docker-compose logs db
docker-compose logs rest
docker-compose logs auth
docker-compose logs realtime
```

3. **Check for unhealthy services**:
```bash
docker-compose ps
```

If you see "(unhealthy)" status like `Up 29 seconds (unhealthy)` for any service:

- Check the service's specific logs: `docker-compose logs realtime`
- Restart the specific service: `docker-compose restart realtime`
- Check the .env file for missing required variables
- Verify the service has enough system resources (RAM, CPU)

4. **Fixing the Realtime Service**:
If you see `realtime-dev.supabase-realtime unhealthy` status:

```bash
# Check realtime service logs
docker-compose logs realtime

# Ensure VAULT_ENC_KEY is set and at least 32 characters
nano .env

# Restart the realtime service
docker-compose restart realtime

# If needed, restart all Supabase services
docker-compose down
docker-compose up -d
```

5. **Check nginx logs**:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

6. **Common Supabase Issues**:
   - Missing `VAULT_ENC_KEY`: Make sure your .env file contains a VAULT_ENC_KEY that is at least 32 characters long
   - Connection issues: Make sure the correct ports are exposed and not blocked by a firewall
   - Database errors: Check PostgreSQL logs with `docker-compose logs db`
   - Insufficient resources: Supabase requires adequate CPU and RAM to run properly

7. **Reset database password** (if needed):
```bash
docker exec -it supabase_db_1 psql -U postgres
ALTER USER postgres WITH PASSWORD 'new-password';
```

8. **Restart all services**:
```bash
# Navigate to the supabase/docker directory
cd ~/supabase/supabase/docker
docker-compose restart
sudo systemctl restart nginx
```

9. **If all else fails, clean reinstall**:
```bash
# Stop and remove all Supabase containers
cd ~/supabase/supabase/docker
docker-compose down -v

# Remove the Supabase directory
cd ~/
rm -rf ~/supabase

# Start fresh with the installation steps from the beginning
```

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/hosting/docker)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)

