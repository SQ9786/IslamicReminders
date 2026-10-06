import { useEffect, useState } from "react";
import { DeviceMobile } from "@phosphor-icons/react";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
};

type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

function alreadyInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function fallbackCopy() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios) return "In Safari, tap Share, then Add to Home Screen.";
  return "Open the browser menu, then choose Install app or Add to Home Screen.";
}

export function InstallHome() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState("");

  useEffect(() => {
    if (alreadyInstalled()) setInstalled(true);

    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPrompt);
    }
    function onInstalled() {
      setInstalled(true);
      setPromptEvent(null);
      setHelp("");
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!promptEvent) {
      setHelp(fallbackCopy());
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") setInstalled(true);
  }

  return (
    <div className="flex max-w-[28ch] flex-col items-start gap-2 md:items-end">
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--wash)] active:scale-[0.98]"
      >
        <DeviceMobile size={16} weight="regular" />
        Add to Home Screen
      </button>
      {help && (
        <p className="text-xs leading-relaxed text-[var(--soft)] md:text-right" role="status">
          {help}
        </p>
      )}
    </div>
  );
}
