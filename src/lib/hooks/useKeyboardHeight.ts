"use client";

import { useEffect, useState } from "react";

/**
 * Tracks virtual keyboard height on iOS using the Visual Viewport API.
 * Returns keyboard height and viewport offset for adjusting layouts.
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function onResize() {
      if (!viewport) return;
      const height = window.innerHeight - viewport.height;
      setKeyboardHeight(Math.max(0, height));
    }

    viewport.addEventListener("resize", onResize);
    return () => viewport.removeEventListener("resize", onResize);
  }, []);

  return { keyboardHeight };
}
