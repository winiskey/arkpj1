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
        const offset = Math.abs(section.element.getBoundingClientRect().top - 140);
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
    <PageFrame className="gap-6 md:gap-8 lg:gap-10">
      <SectionHeader
        cnTitle="赛事规章与细则"
        description="荆楚歌 #2 赛事的完整规则手册，包含赛制说明、通用规则、各主题计分细则与系数计算公式。"
        enTitle="TOURNAMENT ARCHIVE"
      />

      <div className="gsap-stagger-item">
        <SubNav activeSlug={activeSlug} items={navItems} onJump={handleJump} />
      </div>

      <div className="space-y-8">
        {ruleSections.map((section) => (
          <section className="scroll-mt-32" id={section.slug} key={section.id}>
            <article className="panel-content gsap-stagger-item px-6 py-6 md:px-8 md:py-8">
              <div className="mb-6 border-b border-white/8 pb-6">
                <div className="section-kicker">{section.slug}</div>
                <h3 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-text1 md:text-4xl">{section.title}</h3>
                <p className="mt-4 max-w-3xl text-[15px] leading-8 text-text2">{section.intro}</p>
              </div>

              {section.slug === "theme-scoring" ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3">
                    {themeRules.map((theme) => (
                      <ClipButton
                        key={theme.id}
                        className="min-h-[44px]"
                        onClick={() => setActiveTheme(theme.id)}
                        size="md"
                        variant={theme.id === activeTheme ? "primary" : "ghost"}
                      >
                        {theme.name}
                      </ClipButton>
                    ))}
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
                    <div className="space-y-6">
                      <div className="panel-data px-5 py-5">
                        <div className="section-kicker">RESTRICTIONS</div>
                        <h4 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-text1">限制条件</h4>
                        <ul className="mt-5 space-y-3 text-[15px] leading-8 text-text2">
                          {(currentTheme.restrictions.length ? currentTheme.restrictions : ["该主题无额外前置限制，按计分细则执行。"]).map((item) => (
                            <li className="flex gap-4" key={item}>
                              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/80" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="panel-data px-5 py-5">
                        <div className="section-kicker">BASE SCORING</div>
                        <h4 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-text1">基础得分</h4>
                        <ul className="mt-5 space-y-3 text-[15px] leading-8 text-text2">
                          {currentTheme.baseScoring.map((item) => (
                            <li className="flex gap-4" key={item}>
                              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/80" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {currentTheme.scoreGroups.map((group) => (
                        <div className="panel-data px-5 py-5" key={group.title}>
                          <div className="section-kicker">SCORE GROUP</div>
                          <h4 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-text1">{group.title}</h4>
                          <ul className="mt-5 space-y-3 text-[15px] leading-8 text-text2">
                            {group.items.map((item) => (
                              <li className="flex gap-4" key={item}>
                                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/80" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="panel-data px-5 py-5">
                          <div className="section-kicker">FINAL MULTIPLIER</div>
                          <h4 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-text1">最终倍率</h4>
                          <p className="mt-5 text-[15px] leading-8 text-text2">{currentTheme.finalMultiplier}</p>
                          {currentTheme.notes.length ? (
                            <ul className="mt-4 space-y-3 text-sm leading-7 text-text3">
                              {currentTheme.notes.map((item) => (
                                <li className="flex gap-4" key={item}>
                                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>

                        <div className="panel-data px-5 py-5">
                          <div className="section-kicker">PENALTIES</div>
                          <h4 className="mt-3 font-title text-3xl font-black tracking-[0.03em] text-text1">处罚项</h4>
                          <ul className="mt-5 space-y-3 text-[15px] leading-8 text-text2">
                            {(currentTheme.penalties.length ? currentTheme.penalties : ["该主题未单独设置额外处罚项。"]).map((item) => (
                              <li className="flex gap-4" key={item}>
                                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/80" />
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
                <div className="grid gap-5 lg:grid-cols-2">
                  {section.blocks.map((block) => (
                    <div className="panel-data px-5 py-5" key={block.title}>
                      <h4 className="font-title text-3xl font-black tracking-[0.03em] text-text1">{block.title}</h4>
                      {block.paragraphs?.map((paragraph) => (
                        <p className="mt-4 text-[15px] leading-8 text-text2" key={paragraph}>
                          {paragraph}
                        </p>
                      ))}
                      {block.items?.length ? (
                        <ul className="mt-5 space-y-3 text-[15px] leading-8 text-text2">
                          {block.items.map((item) => (
                            <li className="flex gap-4" key={item}>
                              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/80" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}
