const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/social_media';

async function run() {
  console.log('Connecting to:', mongoUrl);
  await mongoose.connect(mongoUrl);
  console.log('Connected successfully!');

  // Define schemas inline to avoid dependency compilation issues
  const AIGenerationSchema = new mongoose.Schema({
    userId: String,
    prompt: String,
    response: String,
    model: String,
    createdAt: Date
  }, { collection: 'ai_generations' });

  const AIUsageSchema = new mongoose.Schema({
    userId: String,
    workspaceId: String,
    feature: String,
    provider: String,
    model: String,
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number,
    cost: Number,
    responseTime: Number,
    status: String,
    createdAt: Date
  }, { collection: 'aiusages' });

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n--- Available Collections ---');
  collections.forEach(col => console.log(` - ${col.name}`));

  const aiGenColName = collections.find(c => c.name.toLowerCase().includes('generation'))?.name || 'aigenerations';
  const aiUsageColName = collections.find(c => c.name.toLowerCase().includes('usage'))?.name || 'aiusages';

  console.log(`\nUsing collection names: AIGeneration -> "${aiGenColName}", AIUsage -> "${aiUsageColName}"`);

  const AIGeneration = mongoose.models.AIGeneration || mongoose.model('AIGeneration', AIGenerationSchema, aiGenColName);
  const AIUsage = mongoose.models.AIUsage || mongoose.model('AIUsage', AIUsageSchema, aiUsageColName);

  const generations = await AIGeneration.find().sort({ createdAt: -1 }).limit(5);
  console.log('\n--- Recent AIGeneration Entries ---');
  if (generations.length === 0) {
    console.log('No entries found.');
  } else {
    generations.forEach((g, index) => {
      console.log(`[${index + 1}] Model: ${g.model} | User: ${g.userId} | Date: ${g.createdAt}`);
      console.log(`Prompt: "${g.prompt.substring(0, 60)}..."`);
      console.log(`Response snippet: "${g.response ? g.response.substring(0, 60) : ''}..."`);
      console.log('-------------------------------------------');
    });
  }

  const usageLogs = await AIUsage.find().sort({ createdAt: -1 }).limit(5);
  console.log('\n--- Recent AIUsage Logs ---');
  if (usageLogs.length === 0) {
    console.log('No logs found.');
  } else {
    usageLogs.forEach((u, index) => {
      console.log(`[${index + 1}] Provider: ${u.provider} | Model: ${u.model} | Status: ${u.status} | Cost: $${u.cost} | Time: ${u.responseTime}ms`);
      console.log(`Feature: ${u.feature} | Tokens: ${u.totalTokens} (Prompt: ${u.promptTokens}, Completion: ${u.completionTokens})`);
      console.log('-------------------------------------------');
    });
  }

  console.log('\n--- Provider Usage Stats Summary ---');
  const allUsage = await AIUsage.find();
  const summary = {};
  allUsage.forEach(u => {
    const prov = u.provider || 'UNKNOWN';
    if (!summary[prov]) {
      summary[prov] = { count: 0, cost: 0, tokens: 0, success: 0, failed: 0 };
    }
    summary[prov].count++;
    summary[prov].cost += u.cost || 0;
    summary[prov].tokens += u.totalTokens || 0;
    if (u.status === 'success') summary[prov].success++;
    else summary[prov].failed++;
  });
  console.table(summary);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error running test script:', err);
  process.exit(1);
});
