import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 120_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(new Error(err.response?.data?.detail || err.message || "Unexpected error."))
);

export async function sendChat(messages, voiceResponse = false) {
  const { data } = await api.post("/api/chat", { messages, voice_response: voiceResponse });
  return data;
}

export async function transcribeAudio(audioBlob, mediaFormat = "webm") {
  const form = new FormData();
  form.append("audio", audioBlob, `recording.${mediaFormat}`);
  const { data } = await api.post(`/api/transcribe?media_format=${mediaFormat}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.transcript;
}

export async function generateImage(prompt) {
  const { data } = await api.post("/api/image", { prompt });
  return data;
}

export async function synthesizeSpeech(text) {
  const { data } = await api.post("/api/tts", { text });
  return data.audio_url;
}
