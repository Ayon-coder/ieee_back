require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

console.log('\n╔════════════════════════════════════════╗');
console.log('║      IEEE Backend - Starting          ║');
console.log('╚════════════════════════════════════════╝\n');

// Initialize Firebase
if (!process.env.FIREBASE_TOKEN) {
  console.error('❌ FIREBASE_TOKEN not set in .env file');
  process.exit(1);
}

let db;

try {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_TOKEN, 'base64').toString('utf-8')
  );

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  db = admin.firestore();
  console.log('✓ Firebase Firestore connected successfully\n');
} catch (err) {
  console.error('❌ Firebase initialization failed:', err.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    firebase: 'connected',
    timestamp: new Date().toISOString()
  });
});

// API: GET /events - Fetch all events
app.get('/events', async (req, res) => {
  try {
    process.stdout.write('\n🚀 EVENTS ENDPOINT CALLED\n');
    console.log('\n📥 [GET /events] Fetching all events...');
    
    const snapshot = await db.collection('events').orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      console.log('⚠ No events found');
      return res.json([]);
    }

    const events = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const eventId = doc.id;
      
      console.log(`\n  ✓ Event: ${data.name} (${eventId})`);

      // Fetch template from templates subcollection
      let templateData = null;
      let styling = { namePosition: { x: 400, y: 300 }, width: 800, height: 600 };
      
      try {
        console.log(`    📋 Fetching templates from: events/${eventId}/templates`);
        const templatesSnap = await db
          .collection('events')
          .doc(eventId)
          .collection('templates')
          .limit(1)
          .get();
        
        console.log(`    📊 Templates found: ${templatesSnap.size}`);
        
        if (!templatesSnap.empty) {
          templateData = templatesSnap.docs[0].data();
          console.log(`    ✓ Template ID: ${templatesSnap.docs[0].id}`);
          
          // Extract from config object (nested structure)
          const config = templateData.config || templateData;
          console.log(`    ✓ Font Color: ${config.fontColor}`);
          console.log(`    ✓ Font Family: ${config.fontFamily}`);
          console.log(`    ✓ Text Size: ${config.textSize}`);
          
          // Build FULL styling object from template
          styling = {
            namePosition: templateData.namePosition || config.namePosition || { x: 400, y: 300 },
            width: templateData.width || config.width || 800,
            height: templateData.height || config.height || 600,
            fontColor: config.fontColor || '#000000',
            fontFamily: config.fontFamily || 'Arial',
            textSize: config.textSize || 36,
            fontStyle: config.fontStyle || 'normal',
            fontWeight: config.fontWeight || 'normal',
            svgUrl: templateData.svgUrl,
            certificate_pos: templateData.certificate_pos || config.certificate_pos
          };
          console.log(`    ✓ Styling built with fontColor: ${styling.fontColor}`);
        } else {
          console.log(`    ⚠ No templates in subcollection`);
        }
      } catch (err) {
        console.log(`    ⚠ Template fetch error: ${err.message}`);
      }

      const event = {
        id: eventId,
        name: data.name || 'Unnamed Event',
        description: data.description || '',
        date: data.date || '',
        category: data.category || 'Workshop',
        imageUrl: data.imageUrl || '',
        template: templateData,
        styling: styling
      };
      
      console.log(`    📤 Sending event with styling\n`);
      events.push(event);
    }

    console.log(`✓ Total: ${events.length} event(s)\n`);
    res.json(events);

  } catch (error) {
    console.error('✗ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: GET /events/:eventId - Fetch single event
app.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`\n📥 [GET /events/${eventId}]`);

    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      console.log(`❌ Event not found: ${eventId}`);
      return res.status(404).json({ error: 'Event not found' });
    }

    const data = eventDoc.data();
    const event = {
      id: eventId,
      name: data.name || 'Unnamed Event',
      description: data.description || '',
      date: data.date || '',
      category: data.category || 'Workshop',
      imageUrl: data.imageUrl || ''
    };

    res.json(event);
  } catch (error) {
    console.error('✗ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: GET /events/:eventId/template - Fetch event template
app.get('/events/:eventId/template', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`\n📥 [GET /events/${eventId}/template]`);

    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      console.log(`❌ Event not found: ${eventId}`);
      return res.status(404).json({ error: 'Event not found' });
    }

    const templatesSnap = await db
      .collection('events')
      .doc(eventId)
      .collection('templates')
      .limit(1)
      .get();
    
    if (templatesSnap.empty) {
      console.log(`⚠ No template found for event ${eventId}`);
      return res.json({
        template: null,
        styling: { namePosition: { x: 400, y: 300 }, width: 800, height: 600 }
      });
    }

    const template = templatesSnap.docs[0].data();
    console.log(`✓ Template found\n`);

    res.json({
      template: template,
      styling: {
        namePosition: template.namePosition || template.config?.position || { x: 400, y: 300 },
        width: template.width || 800,
        height: template.height || 600,
        fontColor: template.fontColor || '#000000',
        fontFamily: template.fontFamily || 'Arial',
        textSize: template.textSize || 36,
        fontStyle: template.fontStyle || 'normal',
        fontWeight: template.fontWeight || 'normal',
        svgUrl: template.svgUrl,
        certificate_pos: template.certificate_pos || template.config?.position
      }
    });

  } catch (error) {
    console.error('✗ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: GET /events/:eventId/participants - Fetch all participants for an event
app.get('/events/:eventId/participants', async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`\n📥 [GET /events/${eventId}/participants]`);

    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      console.log(`❌ Event not found: ${eventId}`);
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    console.log(`✓ Event: ${eventData.name}`);

    const studentSnapshot = await db
      .collection('events')
      .doc(eventId)
      .collection('students')
      .get();
    
    const students = [];
    studentSnapshot.forEach(doc => {
      students.push(doc.data());
    });

    console.log(`✓ Found ${students.length} student(s)\n`);
    res.json(students);

  } catch (error) {
    console.error('✗ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: POST /search - Search for a student certificate
app.post('/search', async (req, res) => {
  try {
    const { name, eventId } = req.body;
    
    if (!name || !eventId) {
      return res.status(400).json({ error: 'Name and eventId are required' });
    }

    console.log(`\n🔍 [POST /search] Searching for: "${name}"`);
    console.log(`   Event ID: ${eventId}`);

    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      console.log(`❌ Event not found`);
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    console.log(`✓ Event: ${eventData.name}`);

    const studentSnapshot = await db
      .collection('events')
      .doc(eventId)
      .collection('students')
      .get();
    
    const students = [];
    studentSnapshot.forEach(doc => {
      students.push(doc.data());
    });

    console.log(`📋 Checking ${students.length} student(s)...`);
    console.log(`   Names: ${students.map(s => s.name).join(', ')}`);

    const searchName = name.trim().toLowerCase();
    const foundStudent = students.find(s => {
      const studentName = (s.name || '').trim().toLowerCase();
      return studentName === searchName;
    });

    if (foundStudent) {
      console.log(`✓ FOUND: ${foundStudent.name}\n`);
      res.json({
        found: true,
        data: {
          name: foundStudent.name,
          position: foundStudent.position || 'Participant',
          ...foundStudent
        }
      });
    } else {
      console.log(`❌ Not found\n`);
      res.json({ found: false });
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ CORS enabled for all origins`);
    console.log(`✓ Health check: GET http://localhost:${PORT}/health`);
    console.log(`✓ Events endpoint: GET http://localhost:${PORT}/events`);
    console.log(`✓ Participants endpoint: GET http://localhost:${PORT}/events/:eventId/participants`);
    console.log(`✓ Search endpoint: POST http://localhost:${PORT}/search\n`);
  });
}

module.exports = app;
