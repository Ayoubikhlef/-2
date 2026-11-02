import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import './TiltedCard.css';

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2
};

const PLACEHOLDER = '/products/placeholder.svg';

export default function TiltedCard({
  imageSrc,
  altText = 'Tilted card image',
  captionText = '',
  containerHeight = '300px',
  containerWidth = '100%',
  imageHeight = '300px',
  imageWidth = '300px',
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = true,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  priority = false
}) {
  const ref = useRef(null);
  const retryTimer = useRef(null);

  // Native `loading="lazy"` never fires inside this 3D-transformed subtree, so
  // the card decides when to start the request itself (see effect below).
  const [inView, setInView] = useState(priority);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // A failed URL or a new product must not keep stale state.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setAttempt(0);
    setInView(priority);
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [imageSrc, priority]);

  // Start loading when the card approaches the viewport. Once triggered we use
  // eager loading, which is reliable inside the transformed card. We use a
  // position check driven by scroll/resize (instead of native lazy loading or
  // IntersectionObserver) because both are unreliable inside 3D transforms.
  useEffect(() => {
    if (priority || inView) return;
    const node = ref.current;
    if (!node) return;
    let done = false;
    const check = () => {
      if (done || !node.isConnected) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh + 300 && rect.bottom > -300) {
        done = true;
        setInView(true);
        window.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
      }
    };
    // Cover the case where the card is already near the viewport on mount.
    const timer = window.setTimeout(check, 120);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [priority, inView, imageSrc]);

  const x = useMotionValue();
  const y = useMotionValue();
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1
  });

  const [lastY, setLastY] = useState(0);

  function handleMouse(e) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    const velocityY = offsetY - lastY;
    rotateFigcaption.set(-velocityY * 0.6);
    setLastY(offsetY);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  // One automatic retry with a short backoff, then the local placeholder.
  function handleError() {
    if (attempt >= 1) {
      setFailed(true);
      return;
    }
    if (retryTimer.current) return;
    retryTimer.current = window.setTimeout(() => {
      retryTimer.current = null;
      setAttempt(1);
    }, 700);
  }

  const retrySuffix = attempt > 0 && !/^data:/i.test(imageSrc || '')
    ? `${String(imageSrc).includes('?') ? '&' : '?'}retry=${attempt}`
    : '';
  const resolvedSrc = imageSrc ? `${imageSrc}${retrySuffix}` : PLACEHOLDER;

  return (
    <figure
      ref={ref}
      className="tilted-card-figure"
      style={{
        height: containerHeight,
        width: containerWidth
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className="tilted-card-mobile-alert">This effect is not optimized for mobile. Check on desktop.</div>
      )}

      <motion.div
        className="tilted-card-inner"
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale
        }}
      >
        {!failed ? (
          <>
            {(!inView || !loaded) && <div className="tilted-card-skeleton" aria-hidden="true" />}
            {inView && (
              <motion.img
                key={attempt}
                src={resolvedSrc}
                alt={altText}
                width={800}
                height={800}
                loading="eager"
                decoding="async"
                draggable={false}
                fetchPriority={priority ? 'high' : 'auto'}
                className="tilted-card-img"
                onLoad={() => setLoaded(true)}
                onError={handleError}
                style={{
                  width: imageWidth,
                  height: imageHeight
                }}
              />
            )}
          </>
        ) : (
          <div
            className="tilted-card-img flex items-center justify-center"
            style={{ width: imageWidth, height: imageHeight }}
          >
            <img
              src={PLACEHOLDER}
              alt={altText}
              width={800}
              height={800}
              className="h-full w-full object-contain p-5"
              style={{ borderRadius: 15 }}
            />
          </div>
        )}

        {displayOverlayContent && overlayContent && (
          <motion.div className="tilted-card-overlay">{overlayContent}</motion.div>
        )}
      </motion.div>

      {showTooltip && (
        <motion.figcaption
          className="tilted-card-caption"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}
