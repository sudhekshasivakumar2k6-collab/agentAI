import ChatWindow from "./components/ChatWindow";
import VoiceInput from "./components/VoiceInput";
import { useAssistant } from "./hooks/useAssistant";

export default function App() {
  const {
    messages, input, setInput, isLoading, isRecording,
    isTranscribing, voiceEnabled, setVoiceEnabled,
    error, clearError, sendMessage, toggleRecording,
    attachmentPreview, handleFileChange, clearAttachment,
  } = useAssistant();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" width="32" height="32">
              <circle cx="20" cy="20" r="18" fill="url(#grad)" />
              <defs>
                <radialGradient id="grad" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </radialGradient>
              </defs>
              <path d="M13 20a7 7 0 0 1 14 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="3" fill="#fff" />
            </svg>
          </div>
          <div>
            <h1 className="app-title">Multi-Model Assistant</h1>
            <p className="app-subtitle">Powered by AWS Bedrock · Transcribe · Polly</p>
          </div>
        </div>

        <label className="voice-toggle" title="Enable voice response">
          <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span className="toggle-label">🔊 Voice Response</span>
        </label>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <span>⚠ {error}</span>
          <button onClick={clearError}>✕</button>
        </div>
      )}

      <main className="app-main">
        <ChatWindow messages={messages} isLoading={isLoading} />
      </main>

      <footer className="input-bar-container">
        {attachmentPreview && (
          <div className="attachment-preview-bar">
            <img src={attachmentPreview} alt="upload preview" className="attachment-thumb" />
            <button className="remove-attachment-btn" onClick={clearAttachment} title="Remove image">✕</button>
          </div>
        )}
        <div className="input-bar">
          <label className="attach-btn" title="Attach Image">
            <input type="file" accept="image/jpeg, image/png, image/webp" onChange={(e) => handleFileChange(e.target.files[0])} disabled={isLoading || isTranscribing} />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </label>
          
          <VoiceInput isRecording={isRecording} isTranscribing={isTranscribing} onToggle={toggleRecording} disabled={isLoading} />

          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording ? "🎙 Recording… click mic to stop"
              : isTranscribing ? "Transcribing…"
              : 'Message or "generate image of…"'
            }
            rows={1}
            disabled={isLoading || isTranscribing}
          />

          <button className="send-btn" onClick={() => sendMessage()} disabled={(!input.trim() && !attachmentPreview) || isLoading} aria-label="Send">
            {isLoading ? (
              <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M2 21 23 12 2 3v7l15 2-15 2v7z" />
              </svg>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
