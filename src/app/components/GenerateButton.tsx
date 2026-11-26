// From Uiverse.io by dexter-st - https://uiverse.io/dexter-st/young-newt-20
// MIT License, Copyright (c) dexter-st
//
// Adapted to React with scoped `uv-gen-*` classes/keyframes so the animation
// cannot collide with the store's own buttons. The letter-by-letter shimmer,
// focus text swap and active glow are kept from the original.
import './GenerateButton.css';

type GenerateButtonProps = {
  label?: string;
  /** Text revealed briefly on focus, as in the original button. */
  altLabel?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

function Letters({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((char, index) => (
        <span
          className="uv-gen-letter"
          key={`${char}-${index}`}
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  );
}

export function GenerateButton({
  label = 'Generate',
  altLabel = 'Generating',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
}: GenerateButtonProps) {
  return (
    <div className={`uv-gen-wrapper ${className}`}>
      <button
        type={type}
        className="uv-gen-btn"
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
      >
        <svg className="uv-gen-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
          />
        </svg>
        <div className="uv-gen-txt-wrapper">
          <div className="uv-gen-txt uv-gen-txt-1">
            <Letters text={label} />
          </div>
          <div className="uv-gen-txt uv-gen-txt-2">
            <Letters text={altLabel} />
          </div>
        </div>
      </button>
    </div>
  );
}

export default GenerateButton;
