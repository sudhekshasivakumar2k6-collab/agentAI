import AudioPlayer from "./AudioPlayer";
import ImageDisplay from "./ImageDisplay";

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
  </svg>
);

export default function MessageBubble({ message }) {
  const { role, content, audio_url, image_url, timestamp } = message;
  const isUser = role === "user";

  let textContent = content;
  let attachedImage = null;
  if (Array.isArray(content)) {
    const textBlock = content.find(c => c.text);
    const imgBlock = content.find(c => c.image);
    textContent = textBlock ? textBlock.text : "";
    if (imgBlock && imgBlock.image.source && imgBlock.image.source.bytes) {
      attachedImage = `data:image/${imgBlock.image.format};base64,${imgBlock.image.source.bytes}`;
    }
  }

  return (
    <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      {!isUser && <div className="avatar assistant-avatar"><BotIcon /></div>}

      <div className={`bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
        {attachedImage && <img src={attachedImage} alt="User attachment" style={{maxWidth: "250px", width: "100%", borderRadius: "6px", marginBottom: "8px"}} />}
        <p className="bubble-text">{textContent}</p>
        {image_url && <ImageDisplay url={image_url} prompt={content} />}
        {audio_url && <AudioPlayer url={audio_url} />}
        <span className="bubble-timestamp">{timestamp ? formatTime(timestamp) : ""}</span>
      </div>

      {isUser && <div className="avatar user-avatar"><UserIcon /></div>}
    </div>
  );
}
