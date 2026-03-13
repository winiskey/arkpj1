import type { PropsWithChildren } from "react";

interface PageFrameProps extends PropsWithChildren {
  className?: string;
}

export function PageFrame({ children, className = "" }: PageFrameProps) {
  return (
    <main className={`relative z-10 mx-auto flex w-full max-w-[1920px] flex-1 flex-col px-4 pb-20 pt-28 md:px-8 md:pt-32 lg:px-10 xl:px-12 2xl:px-20 ${className}`}>
      {children}
    </main>
  );
}
