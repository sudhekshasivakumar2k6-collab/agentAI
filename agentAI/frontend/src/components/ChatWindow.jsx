import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

function TypingIndicator() {
  return (
    <div className="message-row assistant-row">
      <div className="avatar assistant-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        </svg>
      </div>
      <div className="bubble assistant-bubble typing-bubble">
        <span className="dot" /><span className="dot" /><span className="dot" />
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="chat-window" role="log" aria-live="polite">
      {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
