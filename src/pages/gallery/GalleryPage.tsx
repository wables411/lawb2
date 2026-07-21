import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tweet } from 'react-tweet';
import {
  ECOSYSTEM_TIMELINE,
  PLANETS,
  SUN,
  type Moon,
  type Planet,
} from './galleryData';
import './gallery.css';

// World coordinates: sun at (0,0), outermost orbit ~750 + label margin.
const WORLD_RADIUS = 800;

function planetFromHash(): Planet | null {
  const id = window.location.hash.replace('#', '');
  return PLANETS.find((p) => p.id === id) ?? null;
}

/** Deterministic pseudo-random star field so renders are stable. */
function starField(count: number): { top: string; left: string; delay: string }[] {
  const stars = [];
  let seed = 411;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      top: `${(rand() * 100).toFixed(2)}%`,
      left: `${(rand() * 100).toFixed(2)}%`,
      delay: `${(rand() * 3).toFixed(2)}s`,
    });
  }
  return stars;
}

const STARS = starField(90);

function MoonChips({ planet }: { planet: Planet }) {
  const [openMoon, setOpenMoon] = useState<Moon | null>(null);
  useEffect(() => setOpenMoon(null), [planet.id]);
  if (planet.moons.length === 0) return null;
  return (
    <div className="gal-section">
      <h3>Rabbit holes</h3>
      <div className="gal-chip-row">
        {planet.moons.map((moon) => (
          <button
            key={moon.id}
            className={`gal-moon-chip${openMoon?.id === moon.id ? ' gal-moon-chip--active' : ''}`}
            onClick={() => setOpenMoon(openMoon?.id === moon.id ? null : moon)}
          >
            ☾ {moon.name}
          </button>
        ))}
      </div>
      {openMoon && (
        <div className="gal-moon-card">
          {openMoon.blurb && <div>{openMoon.blurb}</div>}
          {openMoon.url && (
            <a className="gal-link" href={openMoon.url} target="_blank" rel="noopener noreferrer">
              {openMoon.url}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function PlanetWindow({ planet, onClose }: { planet: Planet; onClose: () => void }) {
  return (
    <div className="gal-window">
      <div className="gal-window__titlebar">
        <span>
          {planet.name}
          {planet.chain ? ` — ${planet.chain}` : ''}
        </span>
        <div className="gal-window__controls">
          <button className="win98-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      </div>
      <div className="gal-window__body">
        <div className="gal-window__hero">
          <img src={planet.image} alt={planet.name} />
          <dl className="gal-meta">
            {planet.supply && (
              <>
                <dt>Supply</dt>
                <dd>{planet.supply}</dd>
              </>
            )}
            {planet.launched && (
              <>
                <dt>Launched</dt>
                <dd>{planet.launched}</dd>
              </>
            )}
            {planet.contract && (
              <>
                <dt>Contract</dt>
                <dd>{planet.contract}</dd>
              </>
            )}
            <dt>Type</dt>
            <dd>{planet.category}</dd>
          </dl>
        </div>

        <div>{planet.blurb}</div>

        <MoonChips planet={planet} />

        {planet.inspiredBy && planet.inspiredBy.length > 0 && (
          <div className="gal-section">
            <h3>Inspired by</h3>
            <ul>
              {planet.inspiredBy.map((insp) => (
                <li key={insp.name}>
                  {insp.url ? (
                    <a className="gal-link" href={insp.url} target="_blank" rel="noopener noreferrer">
                      {insp.name}
                    </a>
                  ) : (
                    <b>{insp.name}</b>
                  )}{' '}
                  — {insp.note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {planet.traits && planet.traits.length > 0 && (
          <div className="gal-section">
            <h3>Trait references</h3>
            <ul>
              {planet.traits.map((t) => (
                <li key={t.trait}>
                  <b>{t.trait}</b> — {t.refersTo}
                </li>
              ))}
            </ul>
          </div>
        )}

        {planet.timeline && planet.timeline.length > 0 && (
          <div className="gal-section">
            <h3>Timeline</h3>
            {planet.timeline.map((t) => (
              <div className="gal-timeline-item" key={`${t.date}-${t.label}`}>
                <span className="gal-timeline-date">{t.date}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        )}

        {planet.contributors && planet.contributors.length > 0 && (
          <div className="gal-section">
            <h3>Contributors</h3>
            <ul>
              {planet.contributors.map((c) => (
                <li key={c.name}>
                  {c.url ? (
                    <a className="gal-link" href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.name}
                    </a>
                  ) : (
                    <b>{c.name}</b>
                  )}{' '}
                  — {c.role}
                </li>
              ))}
            </ul>
          </div>
        )}

        {planet.links.length > 0 && (
          <div className="gal-section">
            <h3>Links</h3>
            <ul>
              {planet.links.map((l) => (
                <li key={l.url}>
                  <a className="gal-link" href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {planet.xPosts && planet.xPosts.length > 0 && (
          <div className="gal-section" data-theme="dark">
            <h3>Posts</h3>
            {planet.xPosts.map((id) => (
              <div className="gal-tweet-wrap" key={id}>
                <Tweet id={id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineWindow({ onClose }: { onClose: () => void }) {
  return (
    <div className="gal-window">
      <div className="gal-window__titlebar">
        <span>Lawbverse timeline</span>
        <div className="gal-window__controls">
          <button className="win98-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      </div>
      <div className="gal-window__body">
        {ECOSYSTEM_TIMELINE.map((t) => (
          <div className="gal-timeline-item" key={`${t.date}-${t.planetId}-${t.label}`}>
            <span className="gal-timeline-date">{t.date}</span>
            <span>
              <b>{t.planetName}:</b> {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Planet | null>(() => planetFromHash());
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    document.title = 'LAWB GALLERY — the lawbverse';
    const onHash = () => setSelected(planetFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const selectPlanet = (planet: Planet | null) => {
    setSelected(planet);
    setShowTimeline(false);
    window.history.replaceState(null, '', planet ? `#${planet.id}` : window.location.pathname);
  };

  const viewBox = useMemo(
    () => `${-WORLD_RADIUS} ${-WORLD_RADIUS} ${WORLD_RADIUS * 2} ${WORLD_RADIUS * 2}`,
    []
  );

  return (
    <div className="lawb-gallery">
      <div className="lawb-gallery__stars" aria-hidden>
        {STARS.map((s, i) => (
          <span key={i} style={{ top: s.top, left: s.left, animationDelay: s.delay }} />
        ))}
      </div>

      <div className="lawb-gallery__topbar">
        <span className="lawb-gallery__title">LAWB GALLERY — {SUN.tagline}</span>
        <div className="lawb-gallery__topbar-buttons">
          <button className="win98-btn" onClick={() => setShowTimeline((v) => !v)}>
            Timeline
          </button>
          <button className="win98-btn" onClick={() => navigate('/')}>
            Desktop
          </button>
        </div>
      </div>

      <div className={`lawb-gallery__system${selected || showTimeline ? ' gal-paused' : ''}`}>
        <svg viewBox={viewBox} role="img" aria-label="Lawb ecosystem solar system">
          {/* orbit rings */}
          {PLANETS.map((p) => (
            <circle key={`ring-${p.id}`} className="gal-orbit-ring" r={p.orbit} />
          ))}

          {/* sun */}
          <g onClick={() => selectPlanet(null)} style={{ cursor: 'inherit' }}>
            <image
              className="gal-sun-img"
              href={SUN.image}
              x={-46}
              y={-46}
              width={92}
              height={92}
            />
            <text className="gal-planet-label" y={70}>
              {SUN.name}
            </text>
          </g>

          {/* planets */}
          {PLANETS.map((p) => (
            <g
              key={p.id}
              className="gal-orbit"
              style={{
                animationDuration: `${p.speed}s`,
                animationDelay: `${-(p.phase / 360) * p.speed}s`,
              }}
            >
              <g transform={`translate(${p.orbit} 0)`}>
                <g
                  className="gal-sprite"
                  style={{
                    animationDuration: `${p.speed}s`,
                    animationDelay: `${-(p.phase / 360) * p.speed}s`,
                  }}
                  onClick={() => selectPlanet(p)}
                >
                  <circle r={p.size + 6} fill={p.color} opacity={0.25} />
                  <image
                    className="gal-planet-img"
                    href={p.image}
                    x={-p.size}
                    y={-p.size}
                    width={p.size * 2}
                    height={p.size * 2}
                  />
                  <text className="gal-planet-label" y={p.size + 16}>
                    {p.name}
                  </text>
                </g>
              </g>
            </g>
          ))}
        </svg>
      </div>

      {selected && <PlanetWindow planet={selected} onClose={() => selectPlanet(null)} />}
      {showTimeline && !selected && <TimelineWindow onClose={() => setShowTimeline(false)} />}

      <div className="lawb-gallery__index">
        {PLANETS.map((p) => (
          <button
            key={p.id}
            className={selected?.id === p.id ? 'active' : ''}
            onClick={() => selectPlanet(selected?.id === p.id ? null : p)}
          >
            <img src={p.image} alt="" />
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
