# 🤖 Multi-Model Assistant

A production-ready AI assistant powered by **AWS Bedrock** (Amazon Nova-Lite + Stable Diffusion XL), **Amazon Polly**, **Amazon S3**, and native **Web Speech API**. Built with **FastAPI** + **React (Vite)**.

---

## 🏗 Architecture

```
Browser (React)
    │
    ├── POST /api/chat       → Bedrock Amazon Nova-Lite (LLM + Vision)
    │                         ↳ Bedrock SDXL (image if requested)
    │                         ↳ Amazon Polly (TTS if enabled)
    │
    ├── Speech Recognition   → Native Browser Web Speech API (Zero Latency)
    ├── POST /api/image      → Bedrock SDXL → S3 → presigned URL
    └── POST /api/tts        → Amazon Polly → S3 → presigned URL

FastAPI Backend (Python 3.12)
    └── All AWS calls via boto3
```

---

## 📁 Project Structure

```
multi-modal-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, health
│   │   ├── config.py           # Pydantic settings (reads .env)
│   │   ├── models/schemas.py   # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── chat.py         # POST /api/chat
│   │   │   ├── transcribe.py   # POST /api/transcribe (deprecated)
│   │   │   ├── image.py        # POST /api/image
│   │   │   └── tts.py          # POST /api/tts
│   │   └── services/
│   │       ├── bedrock.py      # Nova-Lite + Stable Diffusion XL
│   │       ├── transcribe.py   # Amazon Transcribe (deprecated)
│   │       ├── polly.py        # Amazon Polly
│   │       └── s3.py           # Upload + presigned URLs
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/assistant.js    # Axios API client
│   │   ├── hooks/useAssistant.js
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── VoiceInput.jsx
│   │   │   ├── ImageDisplay.jsx
│   │   │   └── AudioPlayer.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── infra/
│   └── iam_policy.json         # Least-privilege IAM policy
└── README.md
```

---

## ✅ Prerequisites

- Python 3.12+
- Node.js 20+
- AWS account with programmatic access
- AWS CLI configured (`aws configure`)

---

## ☁️ AWS Setup

### 1. Create S3 Bucket

```bash
aws s3 mb s3://multi-modal-assistant-bucket --region us-east-1
# Disable public access (assets served via presigned URLs only)
aws s3api put-public-access-block \
  --bucket multi-modal-assistant-bucket \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 2. Enable Bedrock Model Access

1. Go to **AWS Console → Amazon Bedrock → Model access**
2. Enable:
   - `Amazon Nova Lite`
   - `Stability AI Stable Diffusion XL 1.0`

### 3. Create IAM User / Role

```bash
# Create IAM policy from the provided file
aws iam create-policy \
  --policy-name MultiModalAssistantPolicy \
  --policy-document file://infra/iam_policy.json

# Create a user and attach the policy
aws iam create-user --user-name mma-app-user
aws iam attach-user-policy \
  --user-name mma-app-user \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/MultiModalAssistantPolicy

# Generate access keys
aws iam create-access-key --user-name mma-app-user
```

> **Tip:** On EC2, use an IAM instance profile instead of access keys. Leave `AWS_ACCESS_KEY_ID` blank in `.env` – boto3 will automatically use the instance profile.

---

## 🔧 Local Development

### Backend

```bash
cd backend

# 1. Create virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env    # Windows
# cp .env.example .env   # macOS/Linux
# Edit .env with your AWS credentials and bucket name

# 4. Run development server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment (optional for local dev – Vite proxy handles /api)
copy .env.example .env

# 3. Start dev server
npm run dev
```

App: http://localhost:5173

---

## 🚀 Deployment

### Option A – EC2 (Simple)

```bash
# On EC2 (Amazon Linux 2023 / Ubuntu)
git clone <your-repo>
cd multi-modal-assistant

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env && nano .env   # fill in values

# Run with gunicorn (production)
pip install gunicorn
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2 --bind 0.0.0.0:8000 --daemon

# Frontend – build and serve via Nginx
cd ../frontend
npm install && npm run build
# Copy dist/ to /var/www/html and set up Nginx reverse proxy
```

### Option B – Docker

```bash
# Build backend image
cd backend
docker build -t mma-backend .
docker run -p 8000:8000 --env-file .env mma-backend

# Build frontend
cd ../frontend
npm run build   # Serve dist/ via Nginx or an S3 static site
```

### Option C – AWS Lambda (Serverless)

```bash
# Install Mangum adapter
pip install mangum

# In backend/app/main.py, add at the bottom:
# from mangum import Mangum
# handler = Mangum(app)

# Package and deploy with AWS SAM or Serverless Framework
```

---

## 🧪 Testing API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}],"voice_response":false}'

# Image generation
curl -X POST http://localhost:8000/api/image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a futuristic city at night, neon lights"}'

# TTS
curl -X POST http://localhost:8000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, I am your AI assistant."}'

```

---

## 🎯 Features

| Feature | Details |
|---|---|
| **Chat & Vision** | Amazon Nova Lite via Bedrock Converse API. Fully supports attaching images and full conversation history. |
| **Seamless Voice Input** | Native Web Speech API → Real-time local browser transcription + Auto-Send |
| **Image Generation** | Keyword detection → SDXL 1024×1024 → S3 presigned URL |
| **Voice Response** | Amazon Polly neural TTS → MP3 → S3 presigned URL |
| **Loading States** | Typing indicator, spinner, skeleton loader, pulse animation |
| **Ultra Premium UI** | Fully floating 3D frosted glass layout with an animated pastel mesh-gradient background |

---

## 🔒 Security Notes

- Presigned URLs expire after 1 hour (configurable via `S3_PRESIGNED_URL_EXPIRY`)
- S3 bucket has all public access blocked
- Use IAM roles (not access keys) on EC2/Lambda
- Never commit `.env` to version control (add to `.gitignore`)
