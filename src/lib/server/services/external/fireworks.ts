import { env } from "$env/dynamic/private";
import fetch from "node-fetch";

export async function transcribe(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("file", audioBlob);
  formData.append("vad_model", "silero");
  formData.append("alignment_model", "tdnn_ffn");
  formData.append("preprocessing", "none");
  formData.append("temperature", "0");
  formData.append("timestamp_granularities", "segment");
  formData.append("audio_window_seconds", "5");
  formData.append("speculation_window_words", "4");

  const res = await fetch(
    "https://audio-prod.us-virginia-1.direct.fireworks.ai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.FIREWORKS_AI_API_KEY}`,
      },
      body: formData,
    },
  );

  const data = await res.json();
  return data as { text: string };
}
