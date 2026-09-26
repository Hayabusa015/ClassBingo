import type { DeckId } from '../data/types';

/** Local vector artwork: crisp on projectors and available offline in Electron. */
export default function ScienceArt({ deck }: { deck: DeckId }) {
  return (
    <svg className={`science-art science-art-${deck}`} viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <circle className="art-halo" cx="120" cy="80" r="64" />
      {!['elements', 'ions', 'minerals', 'rocks'].includes(deck) && (
        <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
          <path
            d="M120 48C98 33 80 34 60 40v80c20-6 38-5 60 10 22-15 40-16 60-10V40c-20-6-38-7-60 8Z"
            fill="currentColor"
            fillOpacity=".1"
          />
          <path d="M120 48v82M74 56l30 10M74 74l30 10M136 66l30-10M136 84l30-10" />
        </g>
      )}
      <g className="art-guide" stroke="currentColor">
        <path d="M20 80h28m144 0h28M120 8v16m0 112v16" />
        <circle cx="120" cy="80" r="72" strokeDasharray="2 12" />
      </g>
      {deck === 'elements' && (
        <g stroke="currentColor" strokeWidth="2">
          <g className="art-orbit">
            <ellipse cx="120" cy="80" rx="68" ry="26" />
            <ellipse cx="120" cy="80" rx="68" ry="26" transform="rotate(60 120 80)" />
            <ellipse cx="120" cy="80" rx="68" ry="26" transform="rotate(120 120 80)" />
            <circle cx="188" cy="80" r="5" fill="currentColor" />
            <circle cx="86" cy="21" r="4" fill="currentColor" />
          </g>
          <circle cx="120" cy="80" r="13" fill="currentColor" fillOpacity=".2" />
          <circle cx="120" cy="80" r="5" fill="currentColor" />
        </g>
      )}
      {deck === 'ions' && (
        <g className="art-float" stroke="currentColor" strokeWidth="2.5">
          <path d="m118 80-41 25m41-25 38 30m-38-30 9-45" strokeWidth="6" strokeOpacity=".4" />
          <circle cx="118" cy="80" r="25" fill="currentColor" fillOpacity=".18" />
          <circle cx="77" cy="105" r="16" fill="currentColor" fillOpacity=".1" />
          <circle cx="156" cy="110" r="20" fill="currentColor" fillOpacity=".22" />
          <circle cx="127" cy="35" r="13" fill="currentColor" fillOpacity=".14" />
          <path d="M174 40h14m-7-7v14M53 58h12" />
          <path d="M111 71h8m-4-4v8" strokeOpacity=".8" />
        </g>
      )}
      {deck === 'minerals' && (
        <g className="art-float" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="m116 20 30 26-3 68-27 28-26-32 1-66Z" fill="currentColor" fillOpacity=".15" />
          <path d="m116 20 3 38 27-12m-27 12-28-14m28 14-3 84m3-84 24 56m-24-56-29 52" />
          <path d="m146 78 25-21 13 24-13 44-28 12Z" fill="currentColor" fillOpacity=".25" />
          <path d="m171 57-9 33 22-9m-22 9-19 47" />
          <path d="m87 70-22-9-9 27 15 35 19 8Z" fill="currentColor" fillOpacity=".1" />
          <path d="m65 61 9 31-18-4m18 4 16 39" />
          <path d="M175 28v12m-6-6h12" />
        </g>
      )}
      {deck === 'rocks' && (
        <g className="art-float" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="m54 101 18-49 51-26 45 22 22 55-31 29-65 3Z" fill="currentColor" fillOpacity=".12" />
          <path d="m72 52 42 19 54-23-13 40 35 15-60 10-36 22-6-40-34 6 60-30 16 42 25-25" />
          <path d="m54 101 34-6 42 18 60-10-31 29-65 3Z" fill="currentColor" fillOpacity=".18" />
          <path d="m72 52 42 19 9-45" fill="currentColor" fillOpacity=".24" />
        </g>
      )}
    </svg>
  );
}
