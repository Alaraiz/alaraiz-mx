"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

/* Dynamically import issue content */
const Issue01 = dynamic(() => import("@/content/detente/01"), { ssr: true });
const Issue02 = dynamic(() => import("@/content/detente/02"), { ssr: true });

/* Reveal observer hook */
function useDetenteReveal() {
  const init = useCallback(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      document.querySelectorAll(".dt-reveal").forEach((el) => {
        el.classList.add("dt-revealed");
      });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("dt-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    document
      .querySelectorAll(".dt-reveal")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);
}

export default function DetenteClientPage({ slug }: { slug: string }) {
  const [lang, setLang] = useState<"es" | "en">("es");

  useDetenteReveal();

  return (
    <main data-lang={lang} className="detente-page-wrapper">
      <button
        className="dt-lang-toggle"
        onClick={() => setLang(lang === "es" ? "en" : "es")}
        aria-label="Toggle language"
      >
        <span className={lang === "es" ? "dt-lang-active" : ""}>ES</span>
        {" / "}
        <span className={lang === "en" ? "dt-lang-active" : ""}>EN</span>
      </button>

      {slug === "01" && <Issue01 />}
      {slug === "02" && <Issue02 />}
    </main>
  );
}
