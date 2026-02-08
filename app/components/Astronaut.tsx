import Image from "next/image";

/**
 * Component for displaying an animated, floating astronaut image.
 * Includes a background glow effect and decorative drop shadows.
 * Primarily used on the sign-in page for thematic appeal.
 */
export default function Astronaut() {
  return (
    <div className="astronaut-float relative z-10">
      {/* Glow behind astronaut */}
      <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"></div>

      <Image
        src="/astronaut.png"
        alt="Astronaut"
        width={750}
        height={750}
        className="relative drop-shadow-2xl"
        priority
      />
    </div>
  );
}
