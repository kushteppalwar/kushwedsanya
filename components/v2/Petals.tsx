// Fixed seeds keep the server and client markup identical.
const petals = [
  { left: 6, delay: 0, duration: 16, drift: 5, size: 14 },
  { left: 18, delay: 3.5, duration: 19, drift: -4, size: 10 },
  { left: 31, delay: 7, duration: 15, drift: 6, size: 12 },
  { left: 44, delay: 1.5, duration: 21, drift: -6, size: 9 },
  { left: 57, delay: 9, duration: 17, drift: 4, size: 13 },
  { left: 68, delay: 5, duration: 20, drift: -5, size: 11 },
  { left: 79, delay: 11, duration: 15, drift: 7, size: 10 },
  { left: 90, delay: 2.5, duration: 18, drift: -3, size: 12 },
  { left: 25, delay: 13, duration: 22, drift: 5, size: 8 },
  { left: 63, delay: 15, duration: 16, drift: -7, size: 9 },
];

export default function Petals() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {petals.map((petal, index) => (
        <span
          key={index}
          className="animate-petal absolute top-0 block rounded-[100%_0_100%_0] bg-rani/25"
          style={{
            left: `${petal.left}%`,
            width: petal.size,
            height: petal.size * 1.35,
            animationDelay: `${petal.delay}s`,
            ["--petal-duration" as string]: `${petal.duration}s`,
            ["--petal-drift" as string]: `${petal.drift}vw`,
          }}
        />
      ))}
    </div>
  );
}
