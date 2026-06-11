const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// 1. Parse .env file manually for database connection URI
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/social_media";

async function runMigration() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URL}...`);
  await mongoose.connect(MONGODB_URL);
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  console.log("Existing collections in DB:", collectionNames);

  // Collections to completely remove/drop if they exist
  const collectionsToDrop = [
    'sidebarpreferences',
    'workspace_customizations',
    'workspace_preferences',
    'workspace_themes',
    'workspace_branding',
    'workspace_settings'
  ];

  for (const colName of collectionsToDrop) {
    if (collectionNames.includes(colName)) {
      console.log(`Dropping collection: ${colName}...`);
      await db.dropCollection(colName);
      console.log(`Collection ${colName} dropped successfully.`);
    } else {
      console.log(`Collection ${colName} does not exist. Skipping.`);
    }
  }

  // Remove customization fields from User collection if merged
  if (collectionNames.includes('users')) {
    console.log("Cleaning user collection customization fields...");
    const userResult = await db.collection('users').updateMany(
      {},
      {
        $unset: {
          customWorkspace: "",
          workspaceTheme: "",
          workspaceBranding: "",
          workspacePreferences: "",
          workspaceLayout: "",
          workspaceConfig: ""
        }
      }
    );
    console.log(`User fields cleanup complete. Matched: ${userResult.matchedCount}, Modified: ${userResult.modifiedCount}`);
  }

  // Remove customization fields from Workspace collection
  if (collectionNames.includes('workspaces')) {
    console.log("Cleaning workspace collection customization fields...");
    const wsResult = await db.collection('workspaces').updateMany(
      {},
      {
        $unset: {
          branding: "",
          theme: "",
          customWorkspace: "",
          workspaceTheme: "",
          workspaceBranding: "",
          workspacePreferences: "",
          workspaceLayout: "",
          workspaceConfig: ""
        }
      }
    );
    console.log(`Workspace fields cleanup complete. Matched: ${wsResult.matchedCount}, Modified: ${wsResult.modifiedCount}`);
  }

  console.log("Database migration cleanup completed successfully!");
  await mongoose.disconnect();
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
