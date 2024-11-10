
require('dotenv').config();
const axios = require('axios');

// Azure OpenAI configuration
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

// SerpAPI configuration
const serpApiKey = process.env.SERPAPI_KEY;

// Function to call Azure OpenAI for language-based responses
async function getOpenAIResponse(prompt) {
    try {
        const response = await axios.post(
            `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
            {
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': azureApiKey
                }
            }
        );
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error fetching response from Azure OpenAI:', error.response ? error.response.data : error.message);
        return 'An error occurred while fetching data from Azure OpenAI.';
    }
}

// Function to call SerpAPI for Google searches
async function googleSearch(query) {
    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                q: query,
                api_key: serpApiKey
            }
        });

        // Get the title, link, and snippet of the top search result
        if (response.data.organic_results && response.data.organic_results.length > 0) {
            const topResult = response.data.organic_results[0];
            console.log(topResult);
            
            return `Top result from Google:\nTitle: ${topResult.title}\nLink: ${topResult.link}\nSnippet: ${topResult.snippet}`;
        } else {
            return "No relevant results found on Google.";
        }
    } catch (error) {
        console.error("Error with SerpAPI:", error.response ? error.response.data : error.message);
        return "An error occurred while performing a Google search.";
    }
}

// Main agent function to decide which service to use based on the query
async function queryAgent(query) {
    // Determine if the query should go to Google or Azure OpenAI
    if (query.toLowerCase().includes("search") || query.toLowerCase().includes("find")) {
        return await googleSearch(query);
    } else {
        return await getOpenAIResponse(`Answer the following question in detail: ${query}`);
    }
}

// Example usage of the agent
(async () => {
    const q = "what is todays matches in egypt ?";
    const userQuery1 = "What is the time now in Egypt?";
    const userQuery2 = `search  ${q}`;
    
    console.log("Agent Response 1:", await queryAgent(userQuery1));
    console.log("Agent Response 2:", await queryAgent(userQuery2));
})();
