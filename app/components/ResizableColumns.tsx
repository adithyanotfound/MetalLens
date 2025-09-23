"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  minLeft?: number; // px
  minRight?: number; // px
};

export default function ResizableColumns({
  left,
  center,
  right,
  minLeft = 220,
  minRight = 320,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftWidth, setLeftWidth] = useState<number>(300);
  const [rightWidth, setRightWidth] = useState<number>(420);
  const dragging = useRef<null | { side: "left" | "right"; startX: number; startWidth: number }>(null);

  const onMouseDown = (side: "left" | "right") => (e: React.MouseEvent) => {
    dragging.current = {
      side,
      startX: e.clientX,
      startWidth: side === "left" ? leftWidth : rightWidth,
    };
    document.body.style.cursor = "col-resize";
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const { side, startX, startWidth } = dragging.current;
    const dx = e.clientX - startX;
    if (side === "left") {
      setLeftWidth(Math.max(minLeft, startWidth + dx));
    } else {
      setRightWidth(Math.max(minRight, startWidth - dx));
    }
  }, [minLeft, minRight]);

  const onMouseUp = useCallback(() => {
    dragging.current = null;
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <div ref={containerRef} className="w-full h-full flex overflow-hidden select-none">
      <div style={{ width: leftWidth }} className="h-full shrink-0">
        {left}
      </div>
      <div
        onMouseDown={onMouseDown("left")}
        className="w-1 cursor-col-resize bg-[#0f172a] hover:bg-[#1f2a44]"
        title="Drag to resize"
      />
      <div className="flex-1 h-full min-w-[200px]">
        {center}
      </div>
      <div
        onMouseDown={onMouseDown("right")}
        className="w-1 cursor-col-resize bg-[#0f172a] hover:bg-[#1f2a44]"
        title="Drag to resize"
      />
      <div style={{ width: rightWidth }} className="h-full shrink-0">
        {right}
      </div>
    </div>
  );
}


