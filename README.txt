AgriSense AI — Open-ended chatbot patch

This patch upgrades the existing rule-based assistant to use Gemini for open-ended conversations and passes recent chat history for follow-up questions. The existing farming knowledge base remains as a fallback.

COPY THESE FILES INTO YOUR EXISTING PROJECT (merge/replace only these files):
- frontend/src/pages/AIAssistant.jsx -> your frontend/src/pages/AIAssistant.jsx
- backend/assistant_service.py -> your backend/assistant_service.py
- backend/main.py -> your backend/main.py
- backend/.env.example -> use as a template for backend/.env (do not overwrite an existing .env)

SETUP
1. Get an API key from Google AI Studio: https://aistudio.google.com/apikey
2. In your existing backend folder, create a file named .env. Add:
   GEMINI_API_KEY=your_real_key_here
   GEMINI_MODEL=gemini-2.5-flash
3. Keep .env private. Never commit it to GitHub or put the key in frontend files.
4. The supplied project requirements include requests and python-dotenv. If missing in your actual environment, install them: pip install requests python-dotenv
5. Restart FastAPI and refresh/restart Vite.
6. Test a general question, then a follow-up question to check conversation context.

IMPORTANT
- A model API key is required for ChatGPT-style general answers. Google AI Studio may offer a no-cost quota depending on account, region, model, and current limits; this is not guaranteed to be unlimited or permanently free.
- The app uses a server-side API call; the key is not sent to the browser.
- This does not make the model omniscient or guarantee every answer is correct. Current/live weather, prices, and schemes still require verified data sources.
- Backend/main.py is based on the supplied rotation_data.zip snapshot. If your local main.py has newer changes, apply only the AssistantInput and /assistant/query changes instead of replacing the entire file.
