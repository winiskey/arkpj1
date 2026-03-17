/* ─── Embedded Calculator ──────────────────────────────────────────── */
/* Wraps the standalone calculator.html in an iframe so it stays       */
/* within the admin layout (sidebar remains visible).                  */

export function ScoreCalculator() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-strokeSoft bg-surface1 px-8 py-4">
        <h1 className="font-title text-xl font-bold text-text1">单人算分终端</h1>
        <span className="text-xs text-text3">（内嵌计分终端页面）</span>
        <a
          href="/calculator.html"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-brand hover:underline"
        >
          在新窗口中打开 ↗
        </a>
      </div>
      <iframe
        src="/calculator.html"
        title="计分终端"
        className="flex-1 border-none"
        style={{ minHeight: "calc(100vh - 64px)" }}
      />
    </div>
  );
}
