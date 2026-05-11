import { useEffect, useRef, useState } from "react";

function Reveal({
  as: Component = "div",
  className = "",
  children,
  delay = 0,
  once = true,
  threshold = 0.18,
  ...props
}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      setIsVisible(true);
      return undefined;
    }

    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);

          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <Component
      ref={elementRef}
      className={`ember-reveal${isVisible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--reveal-delay": `${delay}s` }}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Reveal;
