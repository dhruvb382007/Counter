# Counter App (Next.js + Express)

A multi-user SaaS counter platform separated into a React/Next.js Frontend and an Express/Node.js Backend.

## 📂 Project Structure

- **/frontend**: React + Next.js frontend application.
- **/backend**: Node.js + Express backend server.

---

## 🛠️ Local Development

### 1. Setup Backend
```bash
cd backend
npm install
# Create the .env file from the example
cp .env.example .env
```
*Edit the `.env` file to include your actual MongoDB Atlas connection string and Gmail App Password.*

Run the backend:
```bash
node server.js
# Runs on http://localhost:5000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
# Create the .env.local file
cp .env.example .env.local
```
*Edit the `.env.local` to point to the backend if needed (defaults to `http://localhost:5000`).*

Run the frontend:
```bash
npm run dev
# Runs on http://localhost:3000
```

---

## 🚀 Deployment Instructions

### Deploying the Backend (Render / Railway)

1. Create a new Web Service on **Render** or **Railway**.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. Set the **Build Command** to `npm install`.
5. Set the **Start Command** to `node server.js`.
6. Add all the Environment Variables from `backend/.env.example` into the service settings (Dashboard).
7. Deploy! Copy the live backend URL (e.g. `https://my-backend.onrender.com`).

### Deploying the Frontend (Vercel)

1. Go to your **Vercel** dashboard and Import the GitHub repository.
2. In the project settings, set the **Root Directory** to `frontend`.
3. Add the following Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `[YOUR_LIVE_BACKEND_URL_FROM_ABOVE]`
4. Click **Deploy**.

*Note: You must also update the `FRONTEND_URL` environment variable in your **Backend** service settings to point to your new Vercel URL so that CORS works securely.*
