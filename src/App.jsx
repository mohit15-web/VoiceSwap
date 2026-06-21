import { useState, useEffect, useRef, useCallback } from "react";

const LANGUAGES = [
  { code: "auto", name: "Detect language" },
  { code: "en",   name: "English" },
  { code: "hi",   name: "Hindi" },
  { code: "id",   name: "Indonesian" },
  { code: "ja",   name: "Japanese" },
  { code: "es",   name: "Spanish" },
  { code: "fr",   name: "French" },
  { code: "de",   name: "German" },
  { code: "it",   name: "Italian" },
  { code: "pt",   name: "Portuguese" },
  { code: "ru",   name: "Russian" },
  { code: "ko",   name: "Korean" },
  { code: "zh",   name: "Chinese (Simplified)" },
  { code: "ar",   name: "Arabic" },
  { code: "tr",   name: "Turkish" },
  { code: "nl",   name: "Dutch" },
  { code: "pl",   name: "Polish" },
  { code: "sv",   name: "Swedish" },
  { code: "cs",   name: "Czech" },
  { code: "ro",   name: "Romanian" },
  { code: "el",   name: "Greek" },
  { code: "he",   name: "Hebrew" },
  { code: "th",   name: "Thai" },
  { code: "vi",   name: "Vietnamese" },
  { code: "ms",   name: "Malay" },
  { code: "uk",   name: "Ukrainian" },
  { code: "bn",   name: "Bengali" },
  { code: "mr",   name: "Marathi" },
  { code: "ta",   name: "Tamil" },
  { code: "te",   name: "Telugu" },
  { code: "gu",   name: "Gujarati" },
  { code: "kn",   name: "Kannada" },
  { code: "ml",   name: "Malayalam" },
  { code: "pa",   name: "Punjabi" },
  { code: "ur",   name: "Urdu" },
  { code: "fa",   name: "Persian" },
  { code: "bg",   name: "Bulgarian" },
  { code: "hr",   name: "Croatian" },
  { code: "sk",   name: "Slovak" },
  { code: "sl",   name: "Slovenian" },
  { code: "sw",   name: "Swahili" },
  { code: "tl",   name: "Filipino" },
  { code: "fi",   name: "Finnish" },
  { code: "da",   name: "Danish" },
  { code: "no",   name: "Norwegian" },
  { code: "hu",   name: "Hungarian" },
  { code: "af",   name: "Afrikaans" },
  { code: "la",   name: "Latin" },
  { code: "cy",   name: "Welsh" },
  { code: "ne",   name: "Nepali" },
];

const MAX_CHARS = 5000;

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function LanguageSelect({ value, onChange, includeAuto = false, dark }) {
  const chevronColor = dark ? "%2394a3b8" : "%236b7280";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border text-sm rounded-lg px-3 py-2 cursor-pointer focus:outline-none transition-colors
        bg-white border-gray-300 text-gray-700 hover:border-gray-400 focus:border-violet-500
        dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 dark:focus:border-violet-500"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${chevronColor}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        paddingRight: "30px",
        appearance: "none",
        minWidth: "170px",
      }}
    >
      {LANGUAGES.filter((l) => includeAuto || l.code !== "auto").map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}

function IconButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg transition-all
        text-gray-400 hover:text-gray-700 hover:bg-gray-100
        dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}

export default function App() {
  const [inputText, setInputText]   = useState("");
  const [outputText, setOutputText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("hi");
  const [isLoading, setIsLoading]   = useState(false);
  const [statusMsg, setStatusMsg]   = useState("");
  const [copied, setCopied]         = useState(false);
  const [dark, setDark]             = useState(() => {
    const saved = localStorage.getItem("voiceswap-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const timerRef = useRef(null);
  const abortRef = useRef(null);

  // Apply / remove the `dark` class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("voiceswap-theme", dark ? "dark" : "light");
  }, [dark]);

  const translate = useCallback(async (text, src, tgt) => {
    if (!text.trim()) {
      setOutputText("");
      setStatusMsg("");
      return;
    }
    if (src !== "auto" && src === tgt) {
      setOutputText(text);
      setStatusMsg("Same language — no translation needed.");
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setStatusMsg("Translating…");

    const langpair = `${src === "auto" ? "autodetect" : src}|${tgt}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;

    try {
      const res  = await fetch(url, { signal: abortRef.current.signal });
      const data = await res.json();

      if (data.responseStatus === 200) {
        setOutputText(data.responseData.translatedText);
        if (src === "auto") {
          const detected = data.responseData.detectedLanguage;
          if (detected) {
            const lang = LANGUAGES.find((l) => l.code === detected.toLowerCase());
            setStatusMsg(`Detected: ${lang ? lang.name : detected}`);
          } else {
            setStatusMsg("");
          }
        } else {
          setStatusMsg("");
        }
      } else {
        setStatusMsg("Translation failed — try again.");
      }
    } catch (err) {
      if (err.name !== "AbortError") setStatusMsg("Network error — check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!inputText.trim()) {
      setOutputText("");
      setStatusMsg("");
      return;
    }
    timerRef.current = setTimeout(() => translate(inputText, sourceLang, targetLang), 500);
    return () => clearTimeout(timerRef.current);
  }, [inputText, sourceLang, targetLang, translate]);

  function handleSwap() {
    const newSrc = targetLang;
    const newTgt = sourceLang === "auto" ? "en" : sourceLang;
    setSourceLang(newSrc);
    setTargetLang(newTgt);
    if (outputText) {
      setInputText(outputText);
      setOutputText("");
    }
  }

  function handleClear() {
    if (abortRef.current) abortRef.current.abort();
    setInputText("");
    setOutputText("");
    setStatusMsg("");
  }

  async function handleCopy() {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 dark:bg-slate-900 dark:text-slate-200 transition-colors duration-200">

      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-6 py-3 flex-shrink-0
        bg-white border-b border-gray-200
        dark:bg-slate-800 dark:border-slate-700 transition-colors duration-200">
        <span className="text-2xl select-none">🌐</span>
        <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
          VoiceSwap
        </span>
        <span className="text-sm text-gray-400 hidden sm:block dark:text-slate-500">
          Instant language translation
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark((d) => !d)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-lg transition-all
              text-gray-500 hover:text-gray-800 hover:bg-gray-100
              dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              bg-gray-100 hover:bg-gray-200 text-gray-700
              dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Swap
          </button>
        </div>
      </header>

      {/* ── Two panes ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* Source pane */}
        <div className="flex flex-col flex-1 min-h-0 border-b-2 md:border-b-0 md:border-r-2 border-violet-500">
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0
            bg-white border-b border-gray-200
            dark:bg-slate-800 dark:border-slate-700 transition-colors duration-200">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Source
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {inputText.length} / {MAX_CHARS}
              </span>
              <LanguageSelect value={sourceLang} onChange={setSourceLang} includeAuto dark={dark} />
              <IconButton onClick={handleClear} title="Clear text">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setInputText(e.target.value); }}
            placeholder="Type or paste text here…"
            spellCheck
            className="flex-1 w-full bg-transparent text-lg leading-relaxed p-6 resize-none focus:outline-none transition-colors duration-200
              text-gray-800 placeholder-gray-300
              dark:text-slate-100 dark:placeholder-slate-700"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        {/* Target pane */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0
            bg-white border-b border-gray-200
            dark:bg-slate-800 dark:border-slate-700 transition-colors duration-200">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Translation
            </span>
            <div className="flex items-center gap-2">
              <LanguageSelect value={targetLang} onChange={setTargetLang} dark={dark} />
              <IconButton onClick={handleCopy} title="Copy translation">
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </IconButton>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto text-lg leading-relaxed">
            {outputText ? (
              <p className="whitespace-pre-wrap break-words text-violet-600 dark:text-violet-300">
                {outputText}
              </p>
            ) : (
              <p className="text-gray-300 dark:text-slate-700">
                Translation will appear here…
              </p>
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-2 px-6 py-2 flex-shrink-0 min-h-9
            bg-white border-t border-gray-200
            dark:bg-slate-800 dark:border-slate-700 transition-colors duration-200">
            {isLoading && (
              <svg className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            <span className="text-xs text-gray-400 dark:text-slate-500">{statusMsg}</span>
            {copied && <span className="text-xs text-emerald-500 dark:text-emerald-400 ml-auto">Copied!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
