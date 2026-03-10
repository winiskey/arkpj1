import { LOGO_IMAGE_SRC } from "../lib/logo";

export function FullPageLoader() {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6">
            <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent opacity-70" />
                <div className="absolute inset-2 animate-ping rounded-full bg-accent opacity-20" />
                <img
                    alt="Loading..."
                    className="h-8 w-8 brightness-0 invert drop-shadow-[0_0_8px_rgba(0,209,255,0.4)]"
                    src={LOGO_IMAGE_SRC}
                />
            </div>
            <div className="font-display text-xs uppercase tracking-[0.4em] text-accent/70 animate-pulse">
                System Initializing...
            </div>
        </div>
    );
}
