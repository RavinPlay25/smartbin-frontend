import { Button, Input } from "antd";
import { MessageOutlined, SendOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../services/api";

const QUICK_SUGGESTIONS = [
  "Which bin needs attention?",
  "Show tamper summary",
  "RFID denied attempts",
  "What should I do now?",
  "Explain this chart"
];

export default function Chatbot({ context = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi, I am Smart Assistant. Ask me about bins, tamper, or RFID status." }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  const sendMessage = async (rawText) => {
    const text = String(rawText || "").trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(text, context || null);
      const reply = String(result?.reply || "").trim();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply || "Unable to fetch response. Showing system insight."
        }
      ]);
    } catch (_error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Unable to fetch response. Showing system insight."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = () => {
    sendMessage(inputValue);
  };

  return (
    <div className="chatbot-wrap" aria-live="polite">
      {isOpen ? (
        <section className="chatbot-panel">
          <header className="chatbot-header">
            <h4>Smart Assistant</h4>
            <button
              type="button"
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              x
            </button>
          </header>

          <div className="chatbot-suggestions">
            {QUICK_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className="chatbot-suggestion-btn"
                onClick={() => sendMessage(item)}
                disabled={isLoading}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}-${message.text.slice(0, 12)}`} className={`chat-row ${message.sender}`}>
                <div className={`chat-bubble ${message.sender}`}>{message.text}</div>
              </div>
            ))}

            {isLoading ? (
              <div className="chat-row bot">
                <div className="chat-bubble bot typing">Typing...</div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-row">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask something..."
              onPressEnter={onSubmit}
              disabled={isLoading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={onSubmit}
              disabled={isLoading || !inputValue.trim()}
            >
              Send
            </Button>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="chatbot-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Smart Assistant"
      >
        <MessageOutlined />
      </button>
    </div>
  );
}
