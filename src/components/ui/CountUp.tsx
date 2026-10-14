"use client";

import { useRef } from "react";

import { createCountFormatter, parseCount } from "@/lib/countUp";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { COUNT_UP, MOTION_ALLOWED_QUERY, REVEAL } from "@/lib/motion";

interface CountUpProps {
  /** The number as displayed, such as "12K", "0.4s" or "98%". */
  value: string;
}

/**
 * A number that counts up from zero the first time it scrolls into view. The final value is what
 * the server renders, so it is there without JavaScript, for search engines and with reduced
 * motion; a number already on screen when the page opens simply stays as it is. Tabular figures,
 * and a hidden copy of the final value that sets the width, keep it from shifting as digits change.
 */
export function CountUp({ value }: CountUpProps) {
  const numberRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const digits = numberRef.current?.firstChild;
      const format = parseCount(value);
      if (!(digits instanceof Text) || !format || !numberRef.current) return;
      const number = numberRef.current;

      const media = gsap.matchMedia();
      media.add(MOTION_ALLOWED_QUERY, () => {
        if (number.getBoundingClientRect().top < window.innerHeight) return;
        const counter = { value: 0 };
        const formatValue = createCountFormatter(format);
        // Writes into React's own text node, so the DOM React keeps track of stays the same.
        const render = () => {
          digits.data = formatValue(counter.value);
        };
        render();
        ScrollTrigger.create({
          trigger: number,
          start: REVEAL.start,
          once: true,
          onEnter: () => {
            gsap.to(counter, {
              value: format.value,
              duration: COUNT_UP.duration,
              ease: COUNT_UP.ease,
              onUpdate: render,
              // The exact text it started as, not a re-formatted float.
              onComplete: () => {
                digits.data = value;
              },
            });
          },
        });
        return () => {
          digits.data = value;
        };
      });
      return () => media.revert();
    },
    { dependencies: [value] },
  );

  return (
    <span
      data-value={value}
      className="inline-grid tabular-nums before:invisible before:col-start-1 before:row-start-1 before:content-[attr(data-value)]"
    >
      <span ref={numberRef} className="col-start-1 row-start-1">
        {value}
      </span>
    </span>
  );
}
