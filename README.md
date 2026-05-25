# IEEE Backend

This directory holds both backend services for the IEEE website.

## Structure

```
ieee_backend/
├── certificate_generator/   Node.js / Express — events, participants, certificate search
│   ├── server.js
│   ├── package.json
│   └── .env
└── chatbot_backend/         Python / Flask — Vai AI chatbot (Deep Dive + Student Branch)
    ├── app.py
    ├── requirements.txt
    └── .env
```

## Running locally

### Certificate generator backend

```bash
cd certificate_generator
npm install
npm start          # http://localhost:5001
```

### Chatbot backend

```bash
cd chatbot_backend
python -m venv venv
source venv/Scripts/activate    # Windows bash
pip install -r requirements.txt
python app.py                    # http://localhost:5000
```

Both services run independently — the IEEE frontend reads them via the
`VITE_API_URL` (certificates) and `VITE_CHATBOT_URL` (chatbot) env vars.
