// From Uiverse.io by emmanuelh-dev - https://uiverse.io/emmanuelh-dev/orange-cougar-98
// MIT License, Copyright (c) emmanuelh-dev (Emmanuel Hernandez)
//
// Kept as Tailwind utility classes (this project uses Tailwind v4) with the
// original hover/focus treatment. Only the data is driven by props.
import type { ReactNode } from 'react';

type PricingCardProps = {
  title: string;
  tagline: string;
  price: ReactNode;
  period?: string;
  cta: string;
  href?: string;
  onClick?: () => void;
  describedBy?: string;
};

export function PricingCard({
  title,
  tagline,
  price,
  period,
  cta,
  href,
  onClick,
  describedBy,
}: PricingCardProps) {
  const classes =
    'flex items-center justify-center w-full px-6 py-2.5 text-center text-white duration-200 bg-black border-2 border-black rounded-full inline-flex hover:bg-transparent hover:border-black hover:text-black focus:outline-none focus-visible:outline-black text-sm focus-visible:ring-black';

  return (
    <div className="flex flex-col bg-white rounded-3xl">
      <div className="px-6 py-8 sm:p-10 sm:pb-6">
        <div className="grid items-center justify-center w-full grid-cols-1 text-left">
          <div>
            <h2 className="text-lg font-medium tracking-tighter text-gray-600 lg:text-3xl">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{tagline}</p>
          </div>
          <div className="mt-6">
            <p>
              <span className="text-5xl font-light tracking-tight text-black">{price}</span>
              {period ? <span className="text-base font-medium text-gray-500"> {period}</span> : null}
            </p>
          </div>
        </div>
      </div>
      <div className="flex px-6 pb-8 sm:px-8">
        {href ? (
          <a aria-describedby={describedBy} className={classes} href={href}>
            {cta}
          </a>
        ) : (
          <button type="button" aria-describedby={describedBy} className={classes} onClick={onClick}>
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

export default PricingCard;
