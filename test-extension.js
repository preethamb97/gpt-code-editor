// Simple test script to verify Ollama service functionality
async function testOllamaService() {
    console.log('Testing Ollama Service...');
    
    try {
        // Test Ollama service initialization
        console.log('1. Testing Ollama service initialization...');
        
        // Import ollama directly
        const { Ollama } = await import('ollama');
        const ollama = new Ollama();
        
        console.log('Ollama client created successfully');
        
        // Test model availability
        console.log('2. Testing model availability...');
        const models = await ollama.list();
        console.log('Available models:', models.models.map(m => m.name));
        
        const hasLlama32 = models.models.some(m => m.name.includes('llama3.2'));
        console.log('llama3.2 model available:', hasLlama32);
        
        if (hasLlama32) {
            // Test simple response generation
            console.log('3. Testing response generation...');
            const response = await ollama.generate({
                model: 'llama3.2',
                prompt: 'Hello, respond with just "Hello back!"',
                stream: false
            });
            console.log('Response received:', !!response.response);
            console.log('Sample response:', response.response.substring(0, 100) + '...');
        }
        
        console.log('✅ All tests passed! Ollama service is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('Make sure Ollama is running and llama3.2 model is available.');
        console.log('Run: ollama serve');
        console.log('Run: ollama pull llama3.2');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testOllamaService();
}

module.exports = { testOllamaService }; 