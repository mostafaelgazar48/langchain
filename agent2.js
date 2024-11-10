require('dotenv').config();
const axios = require("axios");
const e = require('express');
const express = require('express');
const { getJson } = require("serpapi");

// Azure OpenAI configuration
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

// SerpAPI configuration
const serpApiKey = process.env.SERPAPI_KEY;

// Express app setup
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Custom AzureOpenAI class for calling Azure OpenAI directly
class AzureOpenAI {
    async call(prompt, language = "en") {
        const content = language === "ar" ? `الرجاء الإجابة على هذا السؤال باللغة العربية: ${prompt}` : prompt;

        // Check if the prompt is asking for the bot's name in either language
        const nameRequest = /(?:ما اسمك|اسمك ايه|what's your name|your name|who are you|who's this)/i;
        if (nameRequest.test(prompt)) {
            return language === "ar" ? "اسمي برينز" : "My name's Brainz";
        }

        // Define Link Development responses based on the provided data
        const responses = {
            solutions: language === "ar" 
                ? `نحن نقدم حلولاً تشمل تجربة رقمية متقدمة، التفوق التشغيلي، ديناميكس 365 وتطبيقات الأعمال، التعلم الآلي، التحليلات المتقدمة، السحابة والبنية التحتية، والتعهيد.` 
                : `We offer solutions such as Digital Experience, Operational Excellence, Dynamics 365 & Business Apps, Machine Learning, Advanced Visualization, Cloud & Infrastructure, and Outsourcing.`,
            industries: language === "ar"
                ? `نحن نخدم العديد من الصناعات مثل الطيران (مصر للطيران، الخليج للطيران)، البنوك (البنك المركزي المصري، بنك البركة)، الحكومة (جهاز تنمية الاستثمار، وزارة التضامن الاجتماعي)، الرعاية الصحية (هيئة الصحة في دبي، الهيئة السعودية للتخصصات الصحية)، والعديد من الصناعات الأخرى.` 
                : `We serve various industries including Airlines (EgyptAir, Gulf Air), Banking & Finance (CBE, FABMisr, ABK), Government (GAFI, Ministry of Social Solidarity), Healthcare (Egypt Healthcare Authority, Dubai Healthcare City Authority), and more.`,
            products: language === "ar"
                ? `نحن نقدم منتجات مثل غلوبي (Globby) للدردشة الحية، كاونت بيج (CountBig) لإجراء التعدادات، إنسباكشِن (InspAction) لإدارة الفحوصات، إفنتإكس (EventEX) لإدارة الفعاليات، لِي بَر (Leaper) لاجتماعات الأعمال، والعديد من الحلول الأخرى.` 
                : `Our products include Globby for live chat, CountBig for census management, InspAction for inspection management, EventEX for event management, Leaper for business meetings, and more.`,
            aboutUs: language === "ar"
                ? `لينك ديفيلوبمنت (Link Development) هي شركة رائدة في تقديم الحلول التكنولوجية العالمية، تأسست في عام 1996 على يد خالد بشارة. نحن نقدم حلولاً رقمية مخصصة عبر 24 دولة ولنا مكاتب في الإمارات، مصر، السعودية، قطر، والولايات المتحدة.` 
                : `Link Development, founded by Khaled Bichara in 1996, is a global tech solutions provider operating in 24+ countries with offices in UAE, Egypt, KSA, Qatar, and USA. We specialize in digital transformation across private and public sectors.`
        };

        // Match the query to specific keywords for customized responses related to Link Development
        const linkDevelopmentKeywords = /link development|بتوعنا|بتاعتنا|لينا|لينك ديفيلوبمنت|لينك ديفلوبمنت/i;
        if (linkDevelopmentKeywords.test(prompt)) {
            if (/solutions|الحلول/i.test(prompt)) return responses.solutions;
            if (/industries|الصناعات/i.test(prompt)) return responses.industries;
            if (/products|منتجات/i.test(prompt)) return responses.products;
            if (/about us|من نحن/i.test(prompt)) return responses.aboutUs;
        }
        //

        const systemMessage = `
        You are a helpful assistant. Respond to the user's message and classify the topic and mood from the following lists:

        Topics: Link Development, Generic, Sports, Technology Trends and Innovation, Movies and Cinema, History, Music
        Moods: Natural, Happy, Excited, Playful, Lovestruck, Inspired

        Please respond in this format:
        Topic: <topic>
        Mood: <mood>
        Response: <response>
        `;

        try {
            const response = await axios.post(
                `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
                {
                    messages: [
                        { role: "user", content: content },
                        { role: "system", content: systemMessage }
                    ],
                    max_tokens: 150
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': azureApiKey
                    }
                }
            );
            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error fetching response from Azure OpenAI:', error.response ? error.response : error.message);
            return 'An error occurred while fetching data from Azure OpenAI.';
        }
    }
}

// Function to call SerpAPI for Google searches and handle answer_box with weather_result
async function googleSearch(query) {
    try {
        // const response = await axios.get('https://serpapi.com/search.json', {
        //     params: {
        //         q: query,
        //         api_key: serpApiKey
        //     }
        // });

        // create funcrion to check if the query has some words replace with other words
        query = replaceWords(query);

        const response = await getJson({
            q: query,
            api_key: serpApiKey,
            location: "Cairo, Egypt",
            engine: "google",
        });

        const sportsResults = response?.sports_results;

        
        // Check for answer_box field in the response
        if (response.answer_box && response.answer_box['type'] === "weather_result") {
            const weather = response.answer_box;
            const forecast = weather.forecast || [];

            let weatherReport = `Current Weather in ${weather.location}:\n`;
            weatherReport += `Temperature: ${weather.temperature}° ${weather.unit}\n`;
            weatherReport += `Condition: ${weather.weather}\n`;
            weatherReport += `Precipitation: ${weather.precipitation}\n`;
            weatherReport += `Humidity: ${weather.humidity}\n`;
            weatherReport += `Wind: ${weather.wind}\n`;
            weatherReport += `Date: ${weather.date}\n`;

            if (forecast.length > 0) {
                weatherReport += `\n7-Day Forecast:\n`;
                forecast.forEach(day => {
                    weatherReport += `\nDay: ${day.day}\n`;
                    weatherReport += `High: ${day.temperature.high}° | Low: ${day.temperature.low}°\n`;
                    weatherReport += `Condition: ${day.weather}\n`;
                    weatherReport += `Humidity: ${day.humidity}\n`;
                    weatherReport += `Precipitation: ${day.precipitation}\n`;
                    weatherReport += `Wind: ${day.wind}\n`;
                });
            }

            return classifyTopicAndMood(weatherReport);
        }

        // Handle time result
        if (response.answer_box && response.answer_box.type === "time") {
            const timeResult = `Current Date and Time in ${response.answer_box.date}:\n${response.answer_box.result}`;
            return classifyTopicAndMood(timeResult);
        }

        // Handle sports_results
        if (sportsResults) {
            const game = sportsResults.game_spotlight;
            const teams = game.teams.map(team => {
                let teamDetails = `Team: ${team.name} (${team.score})\n`;
                teamDetails += `Thumbnail: ${team.thumbnail}\n`;

                if (team.goal_summary && team.goal_summary.length > 0) {
                    teamDetails += `Goals:\n`;
                    team.goal_summary.forEach(player => {
                        teamDetails += `Player: ${player.player.name} (#${player.player.jersey_number}, ${player.player.position})\n`;
                        player.goals.forEach(goal => {
                            teamDetails += `- Goal at ${goal.in_game_time.minute}:${goal.in_game_time.second}\n`;
                        });
                    });
                }
                return teamDetails;
            }).join('\n\n');

            const gameDetails = `
            Game Spotlight:
            League: ${game.league}
            Stadium: ${game.stadium}
            Date: ${game.date}
            Status: ${game.status}

            Teams:
            ${teams}
            `;
            return classifyTopicAndMood(gameDetails);
        }

        // If no answer_box, aggregate snippets from search results
        if (response.organic_results && response.organic_results.length > 0) {
            const topResults = response.organic_results.slice(0, 1); // Get top result
            const snippets = topResults.map(result => {
                return {
                    title: result.title,
                    link: result.link,
                    snippet: result.snippet
                };
            });
            return snippets;
        } else {
            return "No relevant results found on Google.";
        }
    } catch (error) {
        console.error("Error with SerpAPI:", error.response ? error.response : error.message);
        return "An error occurred while performing a Google search.";
    }
}

// Function to classify topic and mood based on query response (for both OpenAI and Google search results)
function classifyTopicAndMood(response) {
    // Define some basic patterns to identify topics and moods
    const topics = ['Link Development', 'Sports', 'Technology Trends and Innovation', 'Movies and Cinema', 'History', 'Music'];
    const moods = ['Natural', 'Happy', 'Excited', 'Playful', 'Lovestruck', 'Inspired'];

    let detectedTopic = 'Generic';  // Default topic
    let detectedMood = 'Natural';  // Default mood

    // Check for topics in response
    for (let topic of topics) {
        if (response.includes(topic)) {
            detectedTopic = topic;
            break;
        }
    }

    // Check for moods in response
    for (let mood of moods) {
        if (response.includes(mood)) {
            detectedMood = mood;
            break;
        }
    }

    return {
        topic: detectedTopic,
        mood: detectedMood,
        response: response
    };
}

function replaceWords(query){
    let newQuery = query;
    let words = {
       'وقتك كام':'ما الوقت',
       'انهاردة':'اليوم',
         'دلوقت':'الآن',
            'النهاردة':'اليوم',
            'انهارده':'اليوم',
            'ايه':'ما',
            
    }
    for (const [key, value] of Object.entries(words)) {
        if (query.includes(key)) {
            newQuery = query.replace(key, value);
        }
    }
    return newQuery;
}
// Main function to handle user queries
async function handleQuery(query) {
    // Check if the query contains Arabic characters
    const isArabic = /[\u0600-\u06FF]/.test(query);

    // Keywords that indicate a real-time information need
    const realTimeKeywords = [
        "today", "current", "now", "latest", "this week", "this month","time in","weather in","matches in",
        "one day", "one week", "one month", 
        "اليوم", "الحالي", "الآن", "أحدث", "هذا الأسبوع", "هذا الشهر", "النهاردة","دلوقتي","النهارده","دلوقت",
        'انهاردة','انهارده','وقتك كام','الطقس في','المباريات في','مباريات في','مباريات اليوم في','مباريات اليوم',
        'الان'

    ];

    // Check if the query contains any of the real-time keywords
    const isRealTimeQuery = realTimeKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()));

    let responseText = '';

    if (isRealTimeQuery) {
        const searchResults = await googleSearch(query);
        responseText = searchResults
    } else {
        const openAIResponse = await new AzureOpenAI().call(query, isArabic ? "ar" : "en");
        const classifiedResponse = classifyTopicAndMood(openAIResponse);
        responseText = classifiedResponse;
    }

    return responseText;
}

// API Endpoint to handle user queries
app.post('/query', async (req, res) => {
    const query = req.body.query;
    if (!query) {
        return res.status(400).json({ error: "Query parameter is required." });
    }

    try {
        const responseText = await handleQuery(query);
        res.json(responseText);
    } catch (error) {
        res.status(500).json({ error: "An error occurred while processing the query." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
