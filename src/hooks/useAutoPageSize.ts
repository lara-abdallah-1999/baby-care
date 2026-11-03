import { useLayoutEffect, useRef, useState } from "react";

/** Measure the remaining table space without depending on the rendered row count. */
export function useAutoPageSize() {
  const tableRegion = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(5);
  useLayoutEffect(() => {
    const region = tableRegion.current;
    if (!region) return;
    const panel = region.closest(".register-results")!;
    const main = region.closest("main");
    const measure = () => {
      const row = region.querySelector("tbody tr:not(:has(.register-empty))");
      const rowHeight = row?.getBoundingClientRect().height || 46;
      const headerHeight = region.querySelector("thead")?.getBoundingClientRect().height || 40;
      const footerHeight = panel.querySelector("footer")?.getBoundingClientRect().height || 52;
      const bottom = main
        ? Math.min(window.innerHeight, main.getBoundingClientRect().bottom) -
          parseFloat(getComputedStyle(main).paddingBottom || "0")
        : window.innerHeight - 18;
      const available =
        bottom - region.getBoundingClientRect().top - headerHeight - footerHeight - 18;
      if (region.getBoundingClientRect().width > 0)
        setSize(Math.max(1, Math.min(50, Math.floor(available / rowHeight))));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    if (main) observer.observe(main);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return { tableRegion, size };
}
