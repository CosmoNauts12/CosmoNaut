import Image from "next/image";
import { useTheme } from "./ThemeContext";

/**
 * Component for displaying an animated, floating robot image.
 * Includes a background glow effect and decorative drop shadows.
 * Primarily used on the sign-in page for thematic appeal.
 */
export default function Astronaut() {
  const { theme } = useTheme();

  return (
    <div className="astronaut-float relative z-10">
      {/* Glow behind astronaut */}
      <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"></div>

      <Image
        src="/robot.png"
        alt="Astronaut"
        width={750}
        height={750}
        className={`relative transition-all duration-500 ${theme === 'light'
          ? 'drop-shadow-[0_0_20px_rgba(0,0,0,0.1)]'
          : 'drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]'
          }`}
        priority
      />
    </div>
  );
}
