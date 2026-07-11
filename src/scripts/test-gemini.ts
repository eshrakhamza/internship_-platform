import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
config({ path: '.env' });

console.log('🚀 Starting Gemini test...');

async function testGemini() {
  console.log('📂 Checking for API key...');
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    console.log('💡 Get your API key from: https://makersuite.google.com/app/apikey');
    return;
  }

  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');

  try {
    console.log('📡 Initializing Gemini...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try these models that might work with your API key
    const modelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
    ];

    let workingModel: string | null = null; // Explicitly type as string | null
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`\n📝 Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = 'Say "Hello" in 2 words.';
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Model ${modelName} is working!`);
        console.log('📨 Response:', text);
        workingModel = modelName;
        break;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Model ${modelName} failed:`, errorMessage.substring(0, 100));
      }
    }
    
    if (!workingModel) {
      console.log('\n❌ No working model found. Your API key might be invalid or you need to enable billing.');
      console.log('💡 Go to: https://makersuite.google.com/app/apikey to check your API key status.');
    } else {
      console.log(`\n✅ Working model found: ${workingModel}`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Gemini error:', errorMessage);
  }
}

// Run the test
testGemini().catch(console.error);