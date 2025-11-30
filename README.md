# Smart Cold Storage Monitoring System

A full-stack IoT application for monitoring cold storage units. Features real-time MQTT data visualization, historical data persistence in Postgres, and automated alerting.

## Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, Chart.js, MQTT over WebSockets.
- **Backend:** Next.js API Routes (Serverless).
- **Database:** Neon Serverless Postgres.
- **Message Broker:** HiveMQ Cloud (MQTT).
- **Simulation:** Python scripts.

## Prerequisites

1.  **Node.js 18+** & **Python 3.8+**
2.  **Neon Postgres Account:** Create a project and get the Connection String.
3.  **HiveMQ Cloud Account:** Create a cluster, add a user credentials, and note the Hostname.

## Setup & Local Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env.local` and fill in your secrets.
    ```bash
    cp .env.example .env.local
    ```

3.  **Database Setup:**
    Go to Neon Console SQL Editor or use a local client to run the SQL in `sql/schema.sql`. This creates tables and inserts the initial 3 storage units and thresholds.

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Simulation (Generating Data)

To see live data and charts populate, you need to run the simulation scripts.

1.  **Install Python Deps:**
    ```bash
    pip install paho-mqtt requests
    ```

2.  **Export Env Vars (or hardcode in scripts):**
    ```bash
    export HIVEMQ_HOST="your.host..."
    export HIVEMQ_USER="user"
    export HIVEMQ_PASS="pass"
    ```

3.  **Run MQTT Publisher (Real-time updates):**
    ```bash
    python scripts/mqtt_publisher.py
    ```

4.  **Run HTTP Logger (Historical persistence):**
    ```bash
    python scripts/http_logger.py
    ```
    *Note: This posts data to `localhost:3000`. If deployed, update `API_BASE_URL` in the script.*

5.  **Run Backend Subscriber (Alternative Persistence):**
    If you want MQTT messages to be saved to DB immediately without the HTTP logger:
    ```bash
    npm run subscriber
    ```

## Vercel Deployment

1.  Push code to GitHub.
2.  Import project in Vercel.
3.  **Important:** Add Environment Variables in Vercel Settings (`DATABASE_URL`, `HIVEMQ_HOST`, `NEXT_PUBLIC_HIVEMQ_WSS_URL`, etc.).
4.  Deploy.
5.  Update `scripts/http_logger.py` to point to your Vercel URL (e.g., `https://your-app.vercel.app`) to continue logging history from your local machine to the cloud DB.
