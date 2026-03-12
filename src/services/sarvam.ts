const SARVAM_API_KEY =
  import.meta.env.VITE_SARVAM_API_KEY ||
  import.meta.env.SARVAM_API_KEY ||
  '';

const SARVAM_API_BASE = (
  import.meta.env.VITE_SARVAM_API_BASE || 'https://api.sarvam.ai'
).replace(/\/$/, '');

function ensureApiKey() {
  if (!SARVAM_API_KEY) {
    throw new Error(
      'Missing Sarvam API key. Add VITE_SARVAM_API_KEY in Vercel environment variables.'
    );
  }
}

async function postJson<T = any>(endpoint: string, body: Record<string, any>): Promise<T> {
  ensureApiKey();

  const res = await fetch(`${SARVAM_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Subscription-Key': SARVAM_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      data?.detail ||
      `Sarvam API error (${res.status})`;

    throw new Error(message);
  }

  return data as T;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseTranslateResponse(data: any): string {
  return (
    cleanText(data?.translated_text) ||
    cleanText(data?.translation) ||
    cleanText(data?.output?.translated_text) ||
    cleanText(data?.result?.translated_text) ||
    cleanText(data?.data?.translated_text) ||
    ''
  );
}

function parseTransliterateResponse(data: any): string {
  return (
    cleanText(data?.transliterated_text) ||
    cleanText(data?.transliteration) ||
    cleanText(data?.output?.transliterated_text) ||
    cleanText(data?.result?.transliterated_text) ||
    cleanText(data?.data?.transliterated_text) ||
    ''
  );
}

/**
 * sourceLanguage / targetLanguage should be codes like:
 * auto, en-IN, ta-IN, hi-IN, te-IN, ml-IN, kn-IN
 */
export async function translateText(
  text: string,
  sourceLanguageCode: string,
  targetLanguageCode: string
) {
  const payload = {
    input: text,
    source_language_code: sourceLanguageCode || 'auto',
    target_language_code: targetLanguageCode,
    speaker_gender: 'Male',
    model: 'mayura:v1',
    enable_preprocessing: true,
  };

  const data = await postJson('/translate', payload);
  const translated = parseTranslateResponse(data);

  if (!translated) {
    throw new Error('Sarvam translate response did not contain translated text.');
  }

  return translated;
}

/**
 * languageCode should be like ta-IN / hi-IN / en-IN
 */
export async function getTransliteration(text: string, languageCode: string) {
  const payload = {
    input: text,
    target_language_code: languageCode,
    spoken_form: true,
    model: 'mayura:v1',
  };

  const data = await postJson('/transliterate', payload);
  const transliterated = parseTransliterateResponse(data);

  if (!transliterated) {
    throw new Error('Sarvam transliteration response did not contain transliterated text.');
  }

  return transliterated;
}
