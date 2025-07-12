import { env } from "$env/dynamic/private";
import fetch, { FormData } from "node-fetch";
import { z } from "zod";
import { m } from '$lib/paraglide/messages.js';

const transcriptionResponseSchema = z.object({
  text: z.string(),
});

export async function transcribe(audioBlob: Blob) {
  if (!env.FIREWORKS_AI_API_KEY) {
    console.error("FIREWORKS_AI_API_KEY is not set");
    throw new Error(m.error_serverConfigurationError());
  }

  const formData = new FormData();
  formData.append("file", audioBlob);
  formData.append("vad_model", "silero");
  formData.append("alignment_model", "tdnn_ffn");
  formData.append("preprocessing", "none");
  formData.append("temperature", "0");
  formData.append("timestamp_granularities", "segment");
  formData.append("audio_window_seconds", "5");
  formData.append("speculation_window_words", "4");

  let res;
  try {
    res = await fetch(
      "https://audio-prod.us-virginia-1.direct.fireworks.ai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.FIREWORKS_AI_API_KEY}`,
        },
        body: formData,
      },
    );
  } catch (error) {
    console.error("Fireworks transcription API request failed to send", error);
    throw new Error(m.error_couldNotConnectTranscription());
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Could not read error body.");
    console.error(
      `Fireworks transcription API returned an error. Status: ${res.status}, Body: ${errorBody}`,
    );
    throw new Error(m.error_transcriptionServiceError());
  }

  try {
    const data = await res.json();
    return transcriptionResponseSchema.parse(data);
  } catch (error) {
    console.error("Failed to parse or validate response from Fireworks AI API", error);
    throw new Error(m.error_invalidTranscriptionResponse());
  }
}
