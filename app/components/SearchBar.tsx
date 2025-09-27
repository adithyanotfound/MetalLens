"use client";
import { useEffect, useState } from "react";

type ResultStation = { type: "station"; id: number; name: string; lat: number; lng: number };
type ResultState = { type: "state"; name: string; state: string };
type Result = ResultStation | ResultState;

type Props = {
  onSelectStation?: (s: ResultStation) => void;
  onSelectState?: (state: string, center: { lat: number; lng: number }) => void;
};

export default function SearchBar({ onSelectStation, onSelectState }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    if (!query) return setResults([]);
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal, cache: "no-store" });
        const json = await res.json();
        setResults(json.results ?? []);
      } catch (err: any) {
        if (err?.name !== 'AbortError' && err?.code !== 'ABORT_ERR') {
          // swallow non-abort network errors silently
          setResults([]);
        }
      }
    };
    run();
    return () => {
      try { controller.abort(); } catch {}
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search station"
        className="w-full px-3 py-2 rounded bg-[#0b0f17] text-sm focus:outline-none"
      />
      {results.length > 0 && (
        <div className="absolute z-10 bg-[#161a22] rounded w-full mt-1 max-h-60 overflow-auto border border-white/10 text-sm">
          {results.map((r, idx) => (
            <div
              key={idx}
              className="px-3 py-2 hover:bg-white/10 cursor-pointer"
              onClick={() => {
                if (r.type === "station") {
                  onSelectStation?.(r);
                } else {
                  const center = (r as any).lat && (r as any).lng
                    ? { lat: (r as any).lat as number, lng: (r as any).lng as number }
                    : { lat: 22.9734, lng: 78.6569 };
                  onSelectState?.(r.state, center);
                }
                setQuery("");
                setResults([]);
              }}
            >
              {r.type === "state" ? `State: ${r.name}` : r.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
