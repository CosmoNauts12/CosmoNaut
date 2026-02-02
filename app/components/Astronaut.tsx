import Image from "next/image";

export default function Astronaut() {
  return (
    <div className="astronaut-float relative z-10">
      {/* Glow behind astronaut */}
      <div className="absolute inset-0 blur-3xl bg-purple-500/20 rounded-full"></div>

      <Image
        src="/astronaut.png"
        alt="Astronaut"
        width={550}
        height={550}
        className="relative drop-shadow-2xl"
        priority
      />
    </div>
  );
}
