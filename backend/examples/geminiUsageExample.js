// examples/geminiUsageExample.js
/**
 * Example: Using Gemini Service
 * 
 * This file demonstrates how to use the geminiService in different scenarios
 */

// ============================================
// EXAMPLE 1: Direct Service Usage in Node.js
// ============================================

const { 
  askAboutCity, 
  getUrbanDataSnapshot, 
  aggregateUrbanData, 
  queryWithContext 
} = require('../utils/geminiService');

/**
 * Example 1a: Ask a simple question
 */
async function example1a() {
  console.log('📍 Example 1a: Simple Question');
  
  const result = await askAboutCity(
    'What were the events going on and how is the weather?'
  );
  
  if (result.success) {
    console.log('\n✅ AI Response:');
    console.log(result.aiResponse);
    console.log('\n📊 Urban Data Used:');
    console.log(JSON.stringify(result.urbanData, null, 2));
  } else {
    console.error('❌ Error:', result.error);
  }
}

/**
 * Example 1b: Ask about a specific location
 */
async function example1b() {
  console.log('\n📍 Example 1b: Specific Location Query');
  
  const result = await askAboutCity(
    'Is it safe to go jogging considering weather and air quality?',
    17.3850,  // Different latitude
    78.4867   // Different longitude
  );
  
  console.log(result.success ? '✅ Success' : '❌ Error');
  console.log('Response:', result.aiResponse);
}

/**
 * Example 1c: Get urban data without AI processing
 */
async function example1c() {
  console.log('\n📍 Example 1c: Urban Data Snapshot');
  
  const snapshot = await getUrbanDataSnapshot(16.5062, 80.6480);
  
  console.log('\n📊 Current Conditions:');
  console.log('Temperature:', snapshot.weather.temperature + '°C');
  console.log('AQI:', snapshot.pollution.avgAQI);
  console.log('Events:', snapshot.eventCount);
}

/**
 * Example 1d: Multiple queries in sequence
 */
async function example1d() {
  console.log('\n📍 Example 1d: Multiple Queries');
  
  const questions = [
    'What events are happening today?',
    'How is the air quality?',
    'Should I plan an outdoor activity?'
  ];
  
  for (const question of questions) {
    console.log(`\n❓ Asking: "${question}"`);
    const result = await askAboutCity(question);
    
    if (result.success) {
      console.log('✅ Response:', result.aiResponse.substring(0, 200) + '...');
    }
  }
}

// ============================================
// EXAMPLE 2: In Express Route Handlers
// ============================================

/**
 * This would go in your routes/geminiRoutes.js or controllers/geminiController.js
 */
const express = require('express');

// Already implemented in controllers/geminiController.js
// Just showing the pattern here:

/*
router.post('/query', async (req, res) => {
  const { question, lat, lon } = req.body;
  const result = await askAboutCity(question, lat, lon);
  res.json(result);
});

router.get('/urban-data', async (req, res) => {
  const { lat, lon } = req.query;
  const snapshot = await getUrbanDataSnapshot(lat, lon);
  res.json({ success: true, data: snapshot });
});
*/

// ============================================
// EXAMPLE 3: WebSocket Integration (socket.js)
// ============================================

/**
 * Example: Real-time updates via Socket.IO
 * Add this to your socket.js file
 */

const socketExample = `
const io = require('socket.io')(server);
const { askAboutCity } = require('./utils/geminiService');

io.on('connection', (socket) => {
  // Listen for city questions
  socket.on('ask-about-city', async (data) => {
    const { question, lat, lon } = data;
    
    // Process query
    const result = await askAboutCity(question, lat, lon);
    
    // Send response back
    socket.emit('city-response', result);
  });
  
  // Optional: Real-time urban data streaming
  socket.on('subscribe-urban-data', async () => {
    const interval = setInterval(async () => {
      const snapshot = await getUrbanDataSnapshot();
      socket.emit('urban-data-update', snapshot);
    }, 60000); // Update every minute
    
    socket.on('disconnect', () => clearInterval(interval));
  });
});
`;

// ============================================
// EXAMPLE 4: Advanced Usage Patterns
// ============================================

/**
 * Example 4a: Custom context with additional data
 */
async function example4a() {
  console.log('\n📍 Example 4a: Custom Context');
  
  // Get urban data
  const urbanData = await aggregateUrbanData(16.5062, 80.6480);
  
  // Enhance with custom data
  urbanData.customContext = {
    userPreferences: 'outdoor activities',
    healthConditions: 'asthma',
    budget: 'moderate'
  };
  
  // Query with enhanced context
  const question = 'What outdoor events should I attend given my asthma condition?';
  const response = await queryWithContext(question, urbanData);
  
  console.log('✅ Personalized Response:', response);
}

/**
 * Example 4b: Batch processing multiple locations
 */
async function example4b() {
  console.log('\n📍 Example 4b: Batch Processing');
  
  const locations = [
    { name: 'Vijayawada', lat: 16.5062, lon: 80.6480 },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946 }
  ];
  
  const results = await Promise.all(
    locations.map(loc => 
      askAboutCity('What events are happening today?', loc.lat, loc.lon)
    )
  );
  
  results.forEach((result, i) => {
    console.log(`\n📍 ${locations[i].name}:`);
    console.log(result.success ? '✅ Success' : '❌ Error');
  });
}

/**
 * Example 4c: Error handling and retry logic
 */
async function example4c() {
  console.log('\n📍 Example 4c: Error Handling');
  
  const maxRetries = 3;
  let attempts = 0;
  let result;
  
  while (attempts < maxRetries) {
    try {
      result = await askAboutCity('Tell me about the city');
      
      if (result.success) {
        console.log('✅ Success on attempt', attempts + 1);
        break;
      }
    } catch (err) {
      console.error(`❌ Attempt ${attempts + 1} failed:`, err.message);
    }
    
    attempts++;
    
    if (attempts < maxRetries) {
      console.log(`⏳ Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!result?.success) {
    console.error('❌ Failed after', maxRetries, 'attempts');
  }
}

// ============================================
// RUN EXAMPLES
// ============================================

// Uncomment any of these to run examples:

/*
(async () => {
  try {
    await example1a();
    // await example1b();
    // await example1c();
    // await example1d();
    // await example4a();
    // await example4b();
    // await example4c();
  } catch (err) {
    console.error('Error running example:', err);
  }
})();
*/

module.exports = {
  example1a,
  example1b,
  example1c,
  example1d,
  example4a,
  example4b,
  example4c,
  socketExample
};
