// From Uiverse.io by craig_8499 - https://uiverse.io/craig_8499/nervous-dodo-39
// MIT License, Copyright (c) craig_8499 (Cosmodo)
//
// Adapted to this React + Tailwind project. Every class and keyframe is
// prefixed with `uv-brut-` so it cannot collide with the store's own styles;
// the markup, 3D flip on :active, hover tilt/scanline/noise/glitch remain the
// same as the Uiverse original.
import { useId, type ReactNode } from 'react';
import './BrutalistCard.css';

type BrutalistCardProps = {
  title: string;
  price: ReactNode;
  description?: ReactNode;
  /** Text on the black "added" face shown while the card is pressed. */
  backLabel?: string;
  /** Text inside the bottom action bar. */
  actionLabel?: string;
  /** Replaces the original hexagonal SVG when a page has its own icon. */
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Extra page content (features, badges, etc.) rendered above the action bar. */
  children?: ReactNode;
  className?: string;
};

function DefaultIcon({ patternId }: { patternId: string }) {
  return (
    <svg className="uv-brut-card__product-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#fff" />
          <rect width="4" height="4" fill="#000" />
          <rect x="4" y="4" width="4" height="4" fill="#000" />
        </pattern>
      </defs>
      <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="#fff" stroke="#fff" strokeWidth="3" />
      <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="#000" stroke="#fff" strokeWidth="2" />
      <rect x="35" y="35" width="30" height="30" fill={`url(#${patternId})`} />
      <polygon points="50,25 70,40 50,55 30,40" fill="#fff" />
      <circle cx="50" cy="45" r="8" fill="#000" />
      <rect x="46" y="41" width="8" height="8" fill="#fff" />
      <polygon points="50,60 65,70 50,75 35,70" fill="#fff" />
    </svg>
  );
}

export function BrutalistCard({
  title,
  price,
  description,
  backLabel = 'ADDED TO CART',
  actionLabel = 'ADD TO CART',
  icon,
  badge,
  active = false,
  onClick,
  children,
  className = '',
}: BrutalistCardProps) {
  // The SVG pattern id must be unique: a page renders many of these cards.
  const patternId = `uv-brut-pattern-${useId().replace(/:/g, '')}`;
  const interactive = Boolean(onClick);

  return (
    <div
      className={`uv-brut-card ${active ? 'uv-brut-card--active' : ''} ${className}`}
      {...(interactive
        ? {
            role: 'button' as const,
            tabIndex: 0,
            onClick,
            onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            },
          }
        : {})}
    >
      <div className="uv-brut-card__inner">
        <div className="uv-brut-card__front">
          <div className="uv-brut-card__scanlines" />
          <div className="uv-brut-card__noise" />
          <div className="uv-brut-card__product-image">
            {icon ?? <DefaultIcon patternId={patternId} />}
          </div>
          <div className="uv-brut-card__content">
            <div className="uv-brut-card__product-title">
              <span>{title}</span>
              {badge ? <span className="uv-brut-card__badge">{badge}</span> : null}
            </div>
            <div className="uv-brut-card__product-price">{price}</div>
            {description ? <div className="uv-brut-card__product-description">{description}</div> : null}
            {children}
            <div className="uv-brut-card__buy-button">
              <div>{actionLabel}</div>
            </div>
          </div>
        </div>
        <div className="uv-brut-card__back">
          <DefaultIcon patternId={`${patternId}-back`} />
          <div className="uv-brut-card__added-text">{price}</div>
          <div className="uv-brut-card__added-subtext">{backLabel}</div>
        </div>
      </div>
    </div>
  );
}

export default BrutalistCard;
