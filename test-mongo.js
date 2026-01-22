const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Poskusi z različnimi URI
    const uris = [
      'mongodb://127.0.0.1:27017/secret-match',
      'mongodb://localhost:27017/secret-match',
      'mongodb://0.0.0.0:27017/secret-match'
    ];
    
    for (const uri of uris) {
      console.log(\`Trying: \${uri}\`);
      try {
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });
        console.log(\` Success with: \${uri}\`);
        
        // Preveri, če lahko naredimo nekaj osnovnega
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(\`Collections in database: \${collections.length}\`);
        
        await mongoose.disconnect();
        return;
      } catch (err) {
        console.log(\` Failed with: \${uri}\`);
        console.log(\`   Error: \${err.message}\`);
        await mongoose.disconnect().catch(() => {});
      }
    }
    
    console.log('');
    console.log(' Troubleshooting tips:');
    console.log('1. Make sure MongoDB is running: brew services start mongodb-community');
    console.log('2. Or start manually: mongod --config /usr/local/etc/mongod.conf');
    console.log('3. Check if port 27017 is open: lsof -i :27017');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testConnection();
