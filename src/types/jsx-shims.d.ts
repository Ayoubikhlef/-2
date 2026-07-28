import type { ComponentType, ReactNode } from 'react';

declare module './GooeyNav' {
  const GooeyNav: ComponentType<any>;
  export default GooeyNav;
}

declare module './TextType' {
  interface TextTypeProps {
    text: string | string[];
    as?: string;
    typingSpeed?: number;
    initialDelay?: number;
    pauseDuration?: number;
    deletingSpeed?: number;
    loop?: boolean;
    className?: string;
    showCursor?: boolean;
    cursorCharacter?: string;
    cursorClassName?: string;
    hideCursorWhileTyping?: boolean;
    cursorBlinkDuration?: number;
    textColors?: string[];
    variableSpeed?: { min: number; max: number };
    onSentenceComplete?: (sentence: string, index: number) => void;
    startOnVisible?: boolean;
    reverseMode?: boolean;
    [x: string]: any;
  }
  const TextType: ComponentType<TextTypeProps>;
  export default TextType;
}

declare module './TiltedCard' {
  interface TiltedCardProps {
    imageSrc: string;
    altText?: string;
    captionText?: string;
    containerHeight?: string;
    containerWidth?: string;
    imageHeight?: string;
    imageWidth?: string;
    scaleOnHover?: number;
    rotateAmplitude?: number;
    showMobileWarning?: boolean;
    showTooltip?: boolean;
    overlayContent?: ReactNode;
    displayOverlayContent?: boolean;
    [x: string]: any;
  }
  const TiltedCard: ComponentType<TiltedCardProps>;
  export default TiltedCard;
}
