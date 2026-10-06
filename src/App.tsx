import { MotionConfig } from "framer-motion";
import { Studio } from "./components/Studio";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#line"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--accent-ink)]"
      >
        Skip to the line
      </a>
      <Studio />
      <div className="grain" aria-hidden="true" />
    </MotionConfig>
  );
}
