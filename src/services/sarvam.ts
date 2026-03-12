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
      data?.errors?.[0]?.message ||
      JSON.stringify(data) ||
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
    cleanText(data?.translations?.[0]?.translated_text) ||
    cleanText(data?.translations?.[0]?.text) ||
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
    cleanText(data?.translations?.[0]?.transliterated_text) ||
    cleanText(data?.translations?.[0]?.text) ||
    cleanText(data?.output?.transliterated_text) ||
    cleanText(data?.result?.transliterated_text) ||
    cleanText(data?.data?.transliterated_text) ||
    ''
  );
}

/**
 * Translation:
 * sourceLanguageCode examples:
 * auto, ta-IN, hi-IN, te-IN, en-IN
 *
 * targetLanguageCode examples:
 * ta-IN, hi-IN, te-IN, en-IN
 */
export async function translateText(
  text: string,
  sourceLanguageCode: string,
  targetLanguageCode: string
): Promise<string> {
  const cleanInput = text?.trim();

  if (!cleanInput) {
    throw new Error('No text provided for translation.');
  }

  if (!targetLanguageCode) {
    throw new Error('Target language code is required.');
  }

  const payload = {
    input: cleanInput,
    source_language_code: sourceLanguageCode || 'auto',
    target_language_code: targetLanguageCode,
    speaker_gender: 'Male',
    model: 'mayura:v1',
    enable_preprocessing: true,
  };

  const data = await postJson('/translate', payload);
  const translated = parseTranslateResponse(data);

  if (!translated) {
    console.error('Unexpected Sarvam translate response:', data);
    throw new Error('Sarvam translate response did not contain translated text.');
  }

  return translated;
}

/**
 * Real pronunciation / Roman transliteration:
 *
 * Example:
 * input Telugu text -> sourceLanguageCode = 'te-IN'
 * targetLanguageCode = 'en-IN'
 *
 * Output:
 * Roman/English-letter pronunciation if supported by Sarvam
 */
export async function getTransliteration(
  text: string,
  sourceLanguageCode: string,
  targetLanguageCode: string = 'en-IN'
): Promise<string> {
  const cleanInput = text?.trim();

  if (!cleanInput) {
    throw new Error('No text provided for transliteration.');
  }

  if (!sourceLanguageCode) {
    throw new Error('Source language code is required for transliteration.');
  }

  const payload = {
    input: cleanInput,
    source_language_code: sourceLanguageCode,
    target_language_code: targetLanguageCode,
    spoken_form: true,
    model: 'mayura:v1',
  };

  const data = await postJson('/transliterate', payload);
  const transliterated = parseTransliterateResponse(data);

  if (!transliterated) {
    console.error('Unexpected Sarvam transliterate response:', data);
    throw new Error('Sarvam transliteration response did not contain transliterated text.');
  }

  return transliterated;
}
