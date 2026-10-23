import type { SpeechInput } from '../application/ports';

// The Web Speech API is not in TypeScript's DOM types; this is the part the app uses.
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionConstructor = new () => Recognition;

const Constructor = (globalThis as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor })
  .SpeechRecognition ?? (globalThis as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;

/**
 * Chrome's speech recognition (ADR-006). Chrome sends the audio to Google to transcribe it
 * (docs/SEGURANCA.md); the app itself makes no request.
 */
export const browserSpeech: SpeechInput = {
  supported: Constructor !== undefined,
  listen(onText, onEnd) {
    if (!Constructor) {
      onEnd('failed');
      return () => {};
    }
    const recognition = new Constructor();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.continuous = false;
    let error: 'denied' | 'failed' | undefined;
    recognition.onresult = (event) => {
      const text = Array.from(event.results, (result) => result[0]?.transcript ?? '').join(', ');
      if (text.trim()) onText(text);
    };
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      error = event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'denied' : 'failed';
    };
    recognition.onend = () => onEnd(error);
    recognition.start();
    return () => recognition.stop();
  },
};
