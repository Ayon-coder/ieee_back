# IEEE Backend Server

Firebase-powered backend for IEEE Frontend application.

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm run dev
```

Server runs on `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /health
```
Response: `{ status: 'ok', firebase: 'connected', timestamp: '...' }`

### Get All Events
```
GET /events
```
Response: Array of events with templates and styling

### Get Single Event
```
GET /events/:eventId
```
Response: Single event object

### Get Event Template
```
GET /events/:eventId/template
```
Response: Template and styling configuration

## Environment Variables

See `.env` file - Firebase configuration is pre-configured.

## Dependencies

- **express** - Web framework
- **firebase-admin** - Firebase integration
- **cors** - Cross-origin support
- **dotenv** - Environment variables

## Troubleshooting

See [SETUP_GUIDE.md](../SETUP_GUIDE.md) for detailed troubleshooting and setup instructions.
