const mongoose = require('mongoose');

const uri = "mongodb+srv://vijendrajat693_db_user:N891Eaq6uNv3JPPU@vj-cluster.mg6hzxx.mongodb.net/admin?appName=VJ-Cluster";

async function run() {
  console.log("Connecting to:", uri);
  try {
    await mongoose.connect(uri);
    console.log("Connected successfully!");
    const adminDb = mongoose.connection.db.admin();
    const dbsList = await adminDb.listDatabases();
    
    for (const dbInfo of dbsList.databases) {
      const dbName = dbInfo.name;
      // Skip system dbs
      if (['admin', 'local', 'config'].includes(dbName)) continue;
      
      console.log(`\nChecking database: ${dbName}`);
      const db = mongoose.connection.useDb(dbName);
      const collections = await db.db.listCollections().toArray();
      for (const col of collections) {
        const count = await db.db.collection(col.name).countDocuments();
        if (count > 0) {
          console.log(`- ${col.name}: ${count} documents`);
        } else {
          console.log(`- ${col.name}: 0 documents`);
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
