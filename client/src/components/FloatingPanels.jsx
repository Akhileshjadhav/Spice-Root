import { motion } from "framer-motion";

const MotionSpan = motion.span;

function FloatingPanels({ items, className = "" }) {
  return (
    <div className={`floating-panels ${className}`.trim()} aria-hidden="true">
      {items.map((item, index) => (
        <MotionSpan
          key={`${item.top ?? item.bottom}-${item.left ?? item.right}-${index}`}
          className={`floating-panel floating-panel-${item.variant ?? "soft"}`}
          style={{
            top: item.top,
            right: item.right,
            bottom: item.bottom,
            left: item.left,
            width: item.width,
            height: item.height,
            "--panel-accent": item.accent,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: [0.34, 0.58, 0.4],
            y: [0, item.shiftY ?? -10, 0],
            scale: [1, 1.015, 1],
          }}
          transition={{
            duration: item.duration ?? 22,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: item.delay ?? 0,
          }}
        >
          <span className="floating-panel-line floating-panel-line-one" />
          <span className="floating-panel-line floating-panel-line-two" />
          <span className="floating-panel-dot" />
        </MotionSpan>
      ))}
    </div>
  );
}

export default FloatingPanels;
