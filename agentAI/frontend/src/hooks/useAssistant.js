import { useCallback, useRef, useState } from "react";
import { sendChat, transcribeAudio, generateImage } from "../api/assistant";

const IMAGE_KEYWORDS = [
  "generate image", "create image", "draw image", "make image",
  "generate picture", "create picture", "draw a", "paint a", "illustrate",
];

const isImageRequest = (text) => IMAGE_KEYWORDS.some((kw) => text.toLowerCase().includes(kw));

const WELCOME = {
  id: "welcome",
  role: "assistant",
  content: "Hello! I'm your AI assistant. Chat with me, ask me to generate images, or use the microphone. How can I help?",
  timestamp: new Date().toISOString(),
};

export function useAssistant() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const inputRef = useRef("");
  const sendMessageRef = useRef(null);

  const newId = () => `${Date.now()}-${Math.random()}`;

  const sendMessage = useCallback(
    async (text = input.trim()) => {
      if (!text && !attachment) return;
      if (isLoading) return;
      setError(null);
      setInput("");
      
      let finalContent = text;
      if (attachment) {
        finalContent = [
          { image: { format: attachment.format, source: { bytes: attachment.bytes } } },
          { text: text || "Analyze this image." }
        ];
      }

      const userMsg = { id: newId(), role: "user", content: finalContent, timestamp: new Date().toISOString() };
      
      const prevAttachment = attachment;
      const prevAttachmentPreview = attachmentPreview;
      setAttachment(null);
      setAttachmentPreview(null);

      setMessages((prev) => {
        const updated = [...prev, userMsg];
        const history = updated.filter((m) => m.id !== "welcome" && (m.role === "user" || m.role === "assistant")).map(({ role, content }) => ({ role, content }));

        (async () => {
          setIsLoading(true);
          try {
            if (!attachment && isImageRequest(text)) {
              const imageData = await generateImage(text);
              setMessages((p) => [
                ...p,
                { id: newId(), role: "assistant", timestamp: new Date().toISOString(), content: "Here is your generated image:", image_url: imageData.image_url },
              ]);
            } else {
              const data = await sendChat(history, voiceEnabled);
              setMessages((p) => [
                ...p,
                { id: newId(), role: "assistant", timestamp: new Date().toISOString(), content: data.response, audio_url: data.audio_url || null, image_url: data.image_url || null, tokens_used: data.tokens_used },
              ]);
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setIsLoading(false);
          }
        })();

        return updated;
      });
    },
    [input, isLoading, voiceEnabled, attachment, attachmentPreview]
  );

  sendMessageRef.current = sendMessage;

  const startRecording = useCallback(() => {
    setError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Your browser does not support Speech Recognition.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(currentTranscript);
        inputRef.current = currentTranscript;
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (inputRef.current.trim()) {
          sendMessageRef.current(inputRef.current.trim());
          inputRef.current = "";
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          setError("Transcription error: " + event.error);
        }
        setIsRecording(false);
      };

      mediaRecorderRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError("Speech recognition failed: " + err.message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleFileChange = (file) => {
    if (!file) {
      setAttachment(null);
      setAttachmentPreview(null);
      return;
    }
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please attach a valid image file.");
      return;
    }
    const format = file.type.split("/")[1] === "jpeg" ? "jpeg" : file.type.split("/")[1] === "png" ? "png" : file.type.split("/")[1] === "webp" ? "webp" : "jpeg";
    
    const previewReader = new FileReader();
    previewReader.onload = (e) => setAttachmentPreview(e.target.result);
    previewReader.readAsDataURL(file);

    const b64Reader = new FileReader();
    b64Reader.onload = (e) => {
      const b64 = e.target.result.split(',')[1];
      setAttachment({ bytes: b64, format });
    };
    b64Reader.readAsDataURL(file);
  };

  return {
    messages, input, setInput, isLoading, isRecording, isTranscribing,
    voiceEnabled, setVoiceEnabled, error,
    attachmentPreview, handleFileChange,
    clearAttachment: () => { setAttachment(null); setAttachmentPreview(null); },
    clearError: () => setError(null),
    sendMessage,
    toggleRecording: () => (isRecording ? stopRecording() : startRecording()),
  };
}
