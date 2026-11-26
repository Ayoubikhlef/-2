// From Uiverse.io by Cobp - https://uiverse.io/Cobp/dangerous-dolphin-47
// MIT License, Copyright (c) Cobp (Fabio Cobb)
//
// Adapted to React with `uv-chat-*` scoped classes. The dark chat shell,
// blinking option icons, glowing send button, focus placeholder fade and tag
// chips are kept from the Uiverse original.
import './ChatBotCard.css';

type ChatBotCardProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  tags?: string[];
  className?: string;
};

export function ChatBotCard({
  id,
  value,
  onChange,
  placeholder = 'Imagine Something...✦˚',
  onSubmit,
  disabled = false,
  tags = [],
  className = '',
}: ChatBotCardProps) {
  return (
    <div className={`uv-chat-root ${className}`}>
      <div className="uv-chat-shell">
        <div className="uv-chat-inner">
          <div className="uv-chat-input-wrap">
            <textarea
              id={id}
              name={id}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              rows={3}
            />
          </div>
          <div className="uv-chat-options">
            <div className="uv-chat-add">
              <button type="button" aria-label="Attach" tabIndex={-1} disabled={disabled}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8v8a5 5 0 1 0 10 0V6.5a3.5 3.5 0 1 0-7 0V15a2 2 0 0 0 4 0V8" />
                </svg>
              </button>
              <button type="button" aria-label="Grid" tabIndex={-1} disabled={disabled}>
                <svg viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0-8h6m-3-3v6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" fill="none" />
                </svg>
              </button>
              <button type="button" aria-label="Language" tabIndex={-1} disabled={disabled}>
                <svg viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.01 8.01 0 0 0 5.648 6.667M10.03 13c.151 2.439.848 4.73 1.97 6.752A15.9 15.9 0 0 0 13.97 13zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.01 8.01 0 0 0 19.938 13M4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333A8.01 8.01 0 0 0 4.062 11m5.969 0h3.938A15.9 15.9 0 0 0 12 4.248A15.9 15.9 0 0 0 10.03 11m4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.01 8.01 0 0 0-5.648-6.667" fill="currentColor" />
                </svg>
              </button>
            </div>
            <button className="uv-chat-submit" type="button" aria-label="Send" disabled={disabled} onClick={onSubmit}>
              <i>
                <svg viewBox="0 0 512 512" aria-hidden="true">
                  <path fill="currentColor" d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05" />
                </svg>
              </i>
            </button>
          </div>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="uv-chat-tags">
          {tags.map((tag) => (
            <span key={tag} onClick={() => onChange(tag)} role="button" tabIndex={0}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatBotCard;
