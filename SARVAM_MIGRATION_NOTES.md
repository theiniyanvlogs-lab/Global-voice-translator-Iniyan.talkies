# Sarvam Migration Notes

This package was auto-cleaned to remove obvious Gemini/Google GenAI strings and placeholders.

## Important
- You still need to manually verify actual API call logic.
- Replace any remaining Gemini-specific request payloads with Sarvam API request format.
- In Vercel, add environment variable:

SARVAM_API_KEY=YOUR_REAL_SARVAM_KEY

## Recommended deploy flow
1. Push this project to GitHub
2. Import repository into Vercel
3. In Vercel Project Settings -> Environment Variables:
   - SARVAM_API_KEY = your real key
4. Redeploy

