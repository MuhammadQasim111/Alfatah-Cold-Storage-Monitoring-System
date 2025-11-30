# Quick Start Guide - Smart Cold Storage Monitoring System

## Step 1: Configure Environment Variables (REQUIRED!)

Open `.env.local` and add your credentials:

```env
# Neon Database - Get from: https://console.neon.tech/app/projects/divine-lab-15602457/auth?tab=configuration
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD_HERE@ep-shiny-lab-15602457.us-east-2.aws.neon.tech/neondb?sslmode=require

# HiveMQ Cloud - Create credentials at: https://console.hivemq.cloud/clusters/2faf87fb25a94c94af4d9f4569ab6381/access-management
HIVEMQ_HOST=2faf87fb25a94c94af4d9f4569ab6381.s1.eu.hivemq.cloud
HIVEMQ_USER=YOUR_USERNAME_HERE
HIVEMQ_PASS=YOUR_PASSWORD_HERE

NEXT_PUBLIC_HIVEMQ_WSS_URL=wss://2faf87fb25a94c94af4d9f4569ab6381.s1.eu.hivemq.cloud:8884/mqtt
NEXT_PUBLIC_HIVEMQ_USER=YOUR_USERNAME_HERE
NEXT_PUBLIC_HIVEMQ_PASS=YOUR_PASSWORD_HERE
```

## Step 2: Initialize Database

Go to Neon SQL Editor: https://console.neon.tech/app/projects/divine-lab-15602457/sql-editor

Copy and paste the entire contents of `sql/schema.sql` and click "Run"

## Step 3: Install Dependencies

```powershell
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install paho-mqtt requests python-dotenv
```

## Step 4: Run the System

Open **3 separate PowerShell terminals**:

### Terminal 1: Start Next.js Server
```powershell
cd "c:\Users\hp\Desktop\smart monitoring"
npm run dev
```

Then open browser to: **http://localhost:3000**

### Terminal 2: Start MQTT Publisher (Real-time updates)
```powershell
cd "c:\Users\hp\Desktop\smart monitoring"
$env:HIVEMQ_HOST="2faf87fb25a94c94af4d9f4569ab6381.s1.eu.hivemq.cloud"
$env:HIVEMQ_USER="YOUR_USERNAME_HERE"
$env:HIVEMQ_PASS="YOUR_PASSWORD_HERE"
python scripts/mqtt_publisher.py
```

### Terminal 3: Start HTTP Logger (Historical data)
```powershell
cd "c:\Users\hp\Desktop\smart monitoring"
python scripts/http_logger.py
```

## What You'll See

✅ Dashboard with 3 storage unit cards  
✅ Real-time temperature and humidity updates every 5 seconds  
✅ Historical charts showing 24-hour trends  
✅ Alerts panel showing threshold violations  

## Troubleshooting

If you see errors, make sure:
1. `.env.local` has correct credentials
2. Database schema was run successfully
3. All dependencies are installed
