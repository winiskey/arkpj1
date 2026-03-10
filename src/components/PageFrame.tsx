import type { PropsWithChildren } from "react";

interface PageFrameProps extends PropsWithChildren {
  className?: string;
}

export function PageFrame({ children, className = "" }: PageFrameProps) {
  return (
    <main className={`relative z-10 flex w-full flex-1 flex-col px-6 pb-16 pt-28 md:px-12 lg:px-20 xl:px-28 ${className}`}>
      {children}
    </main>
  );
}
