// From Uiverse.io by Praashoo7 - https://uiverse.io/Praashoo7/silent-sheep-14
// MIT License, Copyright (c) Praashoo7 (Prashant)
//
// Adapted to React with scoped `uv-sheep-*` classes. The collapsed card grows
// on hover, the product photo floats/rotates away, and the heading, details,
// price and both actions slide into place exactly as in the original.
import type { ReactNode } from 'react';
import './ProductShowcaseCard.css';

type ProductShowcaseCardProps = {
  title: string;
  description: string;
  price: ReactNode;
  image: string;
  buyLabel: string;
  cartLabel: string;
  onBuy: () => void;
  onAddCart: () => void;
  onDetails: () => void;
  onQuickView: () => void;
  wished: boolean;
  onWishlist: () => void;
  quantity: number;
  onQuantityChange: (delta: number) => void;
  badge?: ReactNode;
  eager?: boolean;
  /** Use a page's own icon instead of a product photo. */
  icon?: ReactNode;
  /** Hide wishlist/quick-view/quantity controls on non-shop cards. */
  showStoreControls?: boolean;
  labels: {
    wishlist: string;
    quickView: string;
    decrease: string;
    increase: string;
  };
};

export function ProductShowcaseCard({
  title,
  description,
  price,
  image,
  buyLabel,
  cartLabel,
  onBuy,
  onAddCart,
  onDetails,
  onQuickView,
  wished,
  onWishlist,
  quantity,
  onQuantityChange,
  badge,
  eager = false,
  icon,
  showStoreControls = true,
  labels,
}: ProductShowcaseCardProps) {
  return (
    <div className="uv-sheep-root">
      <div className="uv-sheep-card">
        {showStoreControls && <div className="uv-sheep-top">
          {badge ? <span className="uv-sheep-badge">{badge}</span> : null}
          <button
            type="button"
            className="uv-sheep-icon"
            aria-label={wished ? labels.wishlist : labels.wishlist}
            onClick={(event) => { event.stopPropagation(); onWishlist(); }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill={wished ? '#ef4444' : 'none'} stroke={wished ? '#ef4444' : 'currentColor'} strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
            </svg>
          </button>
          <button
            type="button"
            className="uv-sheep-icon"
            aria-label={labels.quickView}
            onClick={(event) => { event.stopPropagation(); onQuickView(); }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>}

        <button type="button" className="uv-sheep-heading" onClick={onDetails}>{title}</button>
        <div className="uv-sheep-details">{description}</div>
        <div className="uv-sheep-price">{price}</div>

        {showStoreControls && <div className="uv-sheep-qty">
          <button type="button" aria-label={labels.decrease} onClick={() => onQuantityChange(-1)}>−</button>
          <span>{quantity}</span>
          <button type="button" aria-label={labels.increase} onClick={() => onQuantityChange(1)}>+</button>
        </div>}

        <button type="button" className="uv-sheep-btn1" onClick={onBuy}>{buyLabel}</button>
        <button type="button" className="uv-sheep-btn2" onClick={onAddCart}>{cartLabel}</button>
      </div>
      <button type="button" className="uv-sheep-image-btn" onClick={onDetails} aria-label={title}>
        {icon ? (
          <span className="uv-sheep-icon-slot">{icon}</span>
        ) : (
          <img src={image} alt={title} className="uv-sheep-image" loading={eager ? 'eager' : 'lazy'} />
        )}
      </button>
    </div>
  );
}

export default ProductShowcaseCard;
