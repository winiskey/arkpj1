import { useEffect, useMemo, useState } from "react";
import { ClipButton } from "../components/ClipButton";
import { PageFrame } from "../components/PageFrame";
import { SectionHeader } from "../components/SectionHeader";
import { SubNav } from "../components/SubNav";
import { useSiteData } from "../context/SiteDataContext";

const navItems = [
  { slug: "format", label: "赛制总览" },
  { slug: "general-rules", label: "通用规则" },
  { slug: "theme-scoring", label: "主题计分" },
  { slug: "coefficient", label: "总分系数" },
  { slug: "finals-note", label: "决赛说明" },
];

export function RulesPage() {
  const {
    data: { ruleSections, themeRules },
  } = useSiteData();
  const [activeSlug, setActiveSlug] = useState(navItems[0].slug);
  const [activeTheme, setActiveTheme] = useState(themeRules[0]?.id ?? "");

  const currentTheme = useMemo(
    () => themeRules.find((theme) => theme.id === activeTheme) ?? themeRules[0],
    [activeTheme, themeRules],
  );

  useEffect(() => {
    if (!themeRules.some((theme) => theme.id === activeTheme)) {
      setActiveTheme(themeRules[0]?.id ?? "");
    }
  }, [activeTheme, themeRules]);

  useEffect(() => {
    const sections = navItems
      .map((item) => {
        const element = document.getElementById(item.slug);
        return element ? { slug: item.slug, element } : null;
      })
      .filter((section): section is { slug: string; element: HTMLElement } => section !== null);

    let frameId = 0;

    const updateActiveSlug = () => {
      frameId = 0;

      let closestSlug = navItems[0].slug;
      let closestOffset = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const offset = Math.abs(section.element.getBoundingClientRect().top - 130);
        if (offset < closestOffset) {
          closestOffset = offset;
          closestSlug = section.slug;
        }
      }

      setActiveSlug((current) => (current === closestSlug ? current : closestSlug));
    };

    const onScroll = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(updateActiveSlug);
    };

    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const target = sections.find((section) => section.slug === hash)?.element;
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSlug(hash);
      }
    }

    updateActiveSlug();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleJump = (slug: string) => {
    const target = document.getElementById(slug);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${slug}`);
    setActiveSlug(slug);
  };

  if (!currentTheme) {
    return null;
  }

  return (
    <PageFrame>
      <SectionHeader enTitle="TOURNAMENT ARCHIVE" cnTitle="赛事规章与细则" />
      <div className="gsap-stagger-item">
        <SubNav activeSlug={activeSlug} items={navItems} onJump={handleJump} />
      </div>

      <div className="space-y-8">
        {ruleSections.map((section) => (
          <section className="scroll-mt-32" id={section.slug} key={section.id}>
            <article className="hud-panel gsap-stagger-item overflow-hidden p-6 lg:p-8">
              <div className="pointer-events-none absolute right-5 top-2 font-display text-7xl font-black tracking-tighter text-white/[0.03]">
                {section.title.slice(0, 2)}
              </div>
              <div className="relative z-10">
                <div className="mb-6 border-b border-white/[0.08] pb-6">
                  <div className="font-display text-[10px] tracking-[0.24em] text-accent/80 uppercase">{section.slug}</div>
                  <h3 className="mt-3 font-sans text-3xl font-medium tracking-wide text-white/95">
                    {section.title}
                  </h3>
                  <p className="mt-4 max-w-xl font-sans text-[15px] leading-[1.8] text-white/70">{section.intro}</p>
                </div>

                {section.slug === "theme-scoring" ? (
                  <div>
                    <div className="mb-6 flex flex-wrap gap-3">
                      {themeRules.map((theme) => (
                        <ClipButton
                          key={theme.id}
                          className="px-4 py-2 text-xs"
                          onClick={() => setActiveTheme(theme.id)}
                          primary={theme.id === activeTheme}
                        >
                          {theme.name}
                        </ClipButton>
                      ))}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
                      <div className="space-y-6">
                        <div className="rounded-sm border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.02]">
                          <div className="font-display text-[10px] tracking-[0.2em] text-accent/80 uppercase">RESTRICTIONS</div>
                          <h4 className="mt-3 font-sans text-xl font-medium tracking-wide text-white/90">
                            限制条件
                          </h4>
                          <ul className="mt-5 space-y-3 font-sans text-[15px] leading-[1.8] text-white/75">
                            {(currentTheme.restrictions.length ? currentTheme.restrictions : ["该主题无额外前置限制，按计分细则执行。"]).map((item) => (
                              <li className="flex gap-4" key={item}>
                                <span className="mt-2.5 h-1 w-1 rounded-full shrink-0 bg-accent/60" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-sm border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.02]">
                          <div className="font-display text-[10px] tracking-[0.2em] text-accent/80 uppercase">BASE SCORING</div>
                          <h4 className="mt-3 font-sans text-xl font-medium tracking-wide text-white/90">
                            基础得分
                          </h4>
                          <ul className="mt-5 space-y-3 font-sans text-[15px] leading-[1.8] text-white/75">
                            {currentTheme.baseScoring.map((item) => (
                              <li className="flex gap-4" key={item}>
                                <span className="mt-2.5 h-1 w-1 rounded-full shrink-0 bg-accent/60" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {currentTheme.scoreGroups.map((group) => (
                          <div className="rounded-sm border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.02]" key={group.title}>
                            <div className="font-display text-[10px] tracking-[0.2em] text-accent/80 uppercase">SCORE GROUP</div>
                            <h4 className="mt-3 font-sans text-xl font-medium tracking-wide text-white/90">
                              {group.title}
                            </h4>
                            <ul className="mt-5 space-y-3 font-sans text-[15px] leading-[1.8] text-white/75">
                              {group.items.map((item) => (
                                <li className="flex gap-4" key={item}>
                                  <span className="mt-2.5 h-1 w-1 rounded-full shrink-0 bg-accent/60" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        <div className="grid gap-6 lg:grid-cols-2">
                          <div className="rounded-sm border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.02]">
                            <div className="font-display text-[10px] tracking-[0.2em] text-accent/80 uppercase">FINAL MULTIPLIER</div>
                            <h4 className="mt-3 font-sans text-xl font-medium tracking-wide text-white/90">
                              最终倍率
                            </h4>
                            <p className="mt-5 font-sans text-[15px] leading-[1.8] text-white/75">{currentTheme.finalMultiplier}</p>
                            {currentTheme.notes.length ? (
                              <ul className="mt-4 space-y-3 font-sans text-[15px] leading-[1.8] text-white/50">
                                {currentTheme.notes.map((item) => (
                                  <li className="flex gap-4" key={item}>
                                    <span className="mt-2.5 h-1 w-1 rounded-full shrink-0 bg-accent/40" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                          <div className="rounded-sm border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.02]">
                            <div className="font-display text-[10px] tracking-[0.2em] text-accent/80 uppercase">PENALTIES</div>
                            <h4 className="mt-3 font-sans text-xl font-medium tracking-wide text-white/90">
                              处罚项
                            </h4>
                            <ul className="mt-5 space-y-3 font-sans text-[15px] leading-[1.8] text-white/75">
                              {(currentTheme.penalties.length ? currentTheme.penalties : ["该主题未单独设置额外处罚项。"]).map((item) => (
                                <li className="flex gap-4" key={item}>
                                  <span className="mt-2.5 h-1 w-1 rounded-full shrink-0 bg-accent/60" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {section.blocks.map((block) => (
                      <div className="rounded-sm border border-white/[0.05] bg-white/[0.01] p-6 transition-colors hover:bg-white/[0.02]" key={block.title}>
                        <h4 className="font-sans text-xl font-medium tracking-wide text-white/90">
                          {block.title}
                        </h4>
                        {block.paragraphs?.map((paragraph) => (
                          <p className="mt-5 font-sans text-[15px] leading-[1.8] text-white/75" key={paragraph}>
                            {paragraph}
                          </p>
                        ))}
                        {block.items?.length ? (
                          <ul className="mt-5 space-y-3 font-sans text-[15px] leading-[1.8] text-white/75">
                            {block.items.map((item) => (
                              <li className="flex gap-4" key={item}>
                                <span className="mt-2.5 h-1 w-1 rounded-full shrink-0 bg-accent/60" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}
