"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [light, setLight] = useState(true); // default to light

  useEffect(() => {
    const saved = localStorage.getItem("hv-theme");
    if (saved === "dark") {
      document.body.classList.remove("light");
      setLight(false);
    } else {
      // Default to light
      document.body.classList.add("light");
      setLight(true);
    }
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) {
      document.body.classList.add("light");
      localStorage.setItem("hv-theme", "light");
    } else {
      document.body.classList.remove("light");
      localStorage.setItem("hv-theme", "dark");
    }
  }

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-bg-elevated transition-colors"
      title={light ? "Modo escuro" : "Modo claro"}
    >
      {light ? <Moon size={16} className="text-gray-600" /> : <Sun size={16} className="text-cream-dim" />}
    </button>
  );
}
