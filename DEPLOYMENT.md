# Deployment Guide — Caddy Server

This guide covers deploying the **YFC Delivery App** (React frontend + Express/SQLite backend) on a Linux VPS using **Caddy** as a reverse proxy with automatic HTTPS.

---

## Prerequisites

- A **Linux VPS** (Ubuntu 20.04+ recommended)
- A **domain name** pointed to your server's IP (e.g. `yourdomain.com`)
- **Node.js 18+** and **npm** installed
- **Caddy** installed
- **Git** installed

---

## 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

---

## 2. Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Verify installation:

```bash
caddy version
```

---

## 3. Clone & Setup the Project

```bash
cd /home
git clone <your-repo-url> YFC
cd YFC
npm ci
```

---

## 4. Set Server Environment

```bash
export PORT=5000
export ADMIN_USERNAME="your-admin-username"
export ADMIN_PASSWORD="use-a-strong-password"
```

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` only when you need to bootstrap an admin account in a fresh database. Keep these values in your server's secret manager or service configuration; never commit them to the repository.

---

## 5. Build the React Frontend

```bash
npm run build
```

This creates a production-optimized `build/` folder.

---

## 6. Configure the Express Server to Serve Static Files

Make sure your `server/index.js` serves the React build in production. Add these lines **before** `app.listen(...)`:

```js
// Serve React build in production
app.use(express.static(path.join(__dirname, '..', 'build')));

// Catch-all: serve index.html for any non-API route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});
```

> **Important:** Place these lines **after** all your `/api/*` routes so API endpoints are matched first.

---

## 7. Configure the Caddyfile

Edit the Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

### Option A: With a Domain (Automatic HTTPS)

```caddyfile
yourdomain.com {
    reverse_proxy localhost:5000

    # Enable gzip compression
    encode gzip

    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }

    # Logs
    log {
        output file /var/log/caddy/yfc-access.log
        format json
    }
}
```

### Option B: Without a Domain (HTTP only, for testing)

```caddyfile
:80 {
    reverse_proxy localhost:5000
    encode gzip
}
```

### Option C: Domain + `www` Redirect

```caddyfile
www.yourdomain.com {
    redir https://yourdomain.com{uri} permanent
}

yourdomain.com {
    reverse_proxy localhost:5000

    encode gzip

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }

    log {
        output file /var/log/caddy/yfc-access.log
        format json
    }
}
```

> Replace `yourdomain.com` with your actual domain. Caddy automatically provisions and renews **Let's Encrypt** SSL certificates.

---

## 8. Create a Log Directory

```bash
sudo mkdir -p /var/log/caddy
sudo chown caddy:caddy /var/log/caddy
```

---

## 9. Validate & Reload Caddy

```bash
# Validate config
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload
sudo systemctl reload caddy

# Check status
sudo systemctl status caddy
```

---

## 10. Run the Backend with PM2 (Process Manager)

Install PM2 globally to keep the Node.js server running and auto-restart on crash/reboot:

```bash
sudo npm install -g pm2
```

Start the server:

```bash
cd /home/delivery-jagannath
pm2 start server/index.js --name "yfc-backend"
```

Save the process list and enable startup on boot:

```bash
pm2 save
pm2 startup
# Run the command PM2 outputs (it will look like: sudo env PATH=... pm2 startup ...)
```

Useful PM2 commands:

```bash
pm2 status            # Check running processes
pm2 logs yfc-backend  # View logs
pm2 restart yfc-backend  # Restart server
pm2 stop yfc-backend  # Stop server
```

---

## 11. Firewall Configuration

Allow HTTP/HTTPS traffic:

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
sudo ufw status
```

> Do **not** expose port `5000` publicly. Caddy handles all external traffic and proxies to the backend internally.

---

## 12. Verify Deployment

1. Open `https://yourdomain.com` in a browser
2. Verify the homepage loads
3. Place a test order and confirm it appears in `/admin`
4. Check the API directly: `https://yourdomain.com/api/orders`

---

## Updating the App

When you push new code:

```bash
cd /home/delivery-jagannath
git pull origin main
npm install
npm run build
pm2 restart yfc-backend
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| **502 Bad Gateway** | Check if the backend is running: `pm2 status` |
| **SSL not working** | Ensure your domain's DNS A record points to this server's IP |
| **API returns errors** | Check logs: `pm2 logs yfc-backend` |
| **Caddy won't start** | Validate config: `sudo caddy validate --config /etc/caddy/Caddyfile` |
| **Port 5000 in use** | Find process: `sudo lsof -i :5000` and kill it |
| **Database issues** | Check SQLite file exists: `ls -la server/database.sqlite` |
| **Permission denied** | Fix ownership: `sudo chown -R $USER:$USER /home/delivery-jagannath` |

---

## Project Architecture (Production)

```
Client Browser
     │
     ▼
 Caddy (port 443/80)  ← Automatic HTTPS via Let's Encrypt
     │
     ▼ reverse_proxy
 Express (port 5000)
     ├── /api/*         → API routes (orders, restaurants, admin)
     └── /*             → Serves React build/index.html (SPA)
                              │
                              ▼
                         SQLite DB (server/database.sqlite)
```

---

## File Structure (Key Files)

```
delivery-jagannath/
├── build/              # React production build (generated)
├── public/             # React public assets
├── server/
│   ├── index.js        # Express backend (port 5000)
│   └── database.sqlite # SQLite database (auto-created)
├── src/                # React source code
├── .env                # Environment variables
├── package.json        # Dependencies & scripts
└── Caddyfile           # (on server at /etc/caddy/Caddyfile)
```
