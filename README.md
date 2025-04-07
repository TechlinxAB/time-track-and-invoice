
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/52e26dbd-d172-4be7-b218-3a3f43fb9a28

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/52e26dbd-d172-4be7-b218-3a3f43fb9a28) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Option 1: Use Lovable's built-in deployment

Simply open [Lovable](https://lovable.dev/projects/52e26dbd-d172-4be7-b218-3a3f43fb9a28) and click on Share -> Publish.

### Option 2: Deploy on your own Linux server with self-hosted Supabase

#### Prerequisites

- A Linux server (Ubuntu 20.04 LTS or later recommended)
- Docker and Docker Compose installed
- Nginx or another web server for proxying requests
- SSH access to your server
- Domain name (optional but recommended)

#### Step 1: Set up self-hosted Supabase

1. Clone the Supabase repository:

```sh
git clone https://github.com/supabase/supabase
cd supabase/docker
```

2. Create a copy of the example env file:

```sh
cp .env.example .env
```

3. Edit the .env file to set your passwords and configuration:

```sh
nano .env
```

4. Generate JWT secrets:

```sh
openssl rand -base64 64 # For JWT_SECRET
openssl rand -base64 64 # For ANON_KEY
openssl rand -base64 64 # For SERVICE_ROLE_KEY
```

5. Update your .env file with these values, and set appropriate PostgreSQL credentials.

6. Start Supabase services:

```sh
docker-compose up -d
```

7. Verify all services are running:

```sh
docker-compose ps
```

#### Step 2: Deploy the frontend application

1. Clone your application repository:

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Create a .env file for your production environment:

```sh
touch .env.production
```

3. Add your Supabase configuration (replace with your actual server address and keys):

```
VITE_SUPABASE_URL=https://your-supabase-domain-or-ip/
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Install dependencies and build the application:

```sh
npm install
npm run build
```

5. Set up Nginx to serve the built frontend files:

```sh
sudo nano /etc/nginx/sites-available/your-app
```

6. Add this Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

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
}
```

7. Enable the site and restart Nginx:

```sh
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t  # Test the configuration
sudo systemctl restart nginx
```

8. (Optional) Set up SSL with Certbot:

```sh
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Step 3: Initialize your database schema

1. Create your database schema:

```sh
# Connect to the PostgreSQL instance
docker exec -it supabase_db_1 psql -U postgres

# Inside PostgreSQL, create your tables (example)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  organization_number TEXT
);

# Create other tables as needed
```

2. Set up Row Level Security (RLS) policies as required:

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read clients" ON clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert clients" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### Step 4: Maintenance and Backups

1. Set up a backup schedule:

```sh
# Example backup script - save as /root/backup-db.sh
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/supabase"
mkdir -p $BACKUP_DIR
docker exec supabase_db_1 pg_dump -U postgres postgres > $BACKUP_DIR/db_backup_$TIMESTAMP.sql
```

2. Make it executable and add to crontab:

```sh
chmod +x /root/backup-db.sh
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

#### Updating the Application

To update your application with new changes:

```sh
cd /path/to/your/project
git pull
npm install
npm run build
```

#### Troubleshooting

- Check Docker container logs: `docker logs supabase_db_1`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check application logs: `sudo journalctl -u your-app-service`

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

