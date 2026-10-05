const words = ["sabr", "shukr", "tawakkul", "rahma", "salah", "dhikr", "sidq", "ihsan"];

export function WordBand() {
  const line = [...words, ...words];
  return (
    <div className="overflow-hidden border-y border-white/10 py-2 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="animate-band flex w-max gap-8">
        {line.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="text-[0.68rem] uppercase tracking-[0.28em] text-[#c4a574]"
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
