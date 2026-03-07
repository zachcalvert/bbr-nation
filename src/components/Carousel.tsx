import { useEffect, useState } from "react";

interface Slide {
  id: number;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

export function Carousel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/carousel")
      .then((res) => res.json())
      .then((data) => setSlides(data.slides))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  useEffect(() => {
    if (current >= slides.length && slides.length > 0) {
      setCurrent(0);
    }
  }, [slides.length, current]);

  if (slides.length === 0) return null;

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="carousel-viewport">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`carousel-slide ${i === current ? "active" : ""}`}
          >
            <img src={slide.imageUrl} alt={slide.caption ?? ""} />
            {slide.caption && (
              <div className="carousel-caption">{slide.caption}</div>
            )}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === current ? "active" : ""}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
