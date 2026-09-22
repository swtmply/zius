"use client";

import { useRef, type ReactNode } from "react";

export const earlyAccessEmail = "sw.allenwhun@gmail.com";

/** Early access is a conversation, not a form: the button opens a dialog with the address to write to. */
export function EarlyAccessButton({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className={className} onClick={() => dialogRef.current?.showModal()} type="button">
        {children}
      </button>

      <dialog
        aria-labelledby="early-access-title"
        className="m-auto w-[min(calc(100%-2rem),28rem)] rounded-3xl bg-white p-8 text-black shadow-[0_30px_70px_-40px_rgb(0_0_0/0.45)] backdrop:bg-black/40 max-sm:p-6"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        ref={dialogRef}
      >
        <div className="flex flex-col items-start gap-4">
          <span className="text-xs font-semibold tracking-[0.06em] text-black/60 uppercase">
            Android · early access
          </span>
          <h2
            className="m-0 text-2xl leading-[1.1] font-bold tracking-[-0.04em]"
            id="early-access-title"
          >
            Email me for a build
          </h2>
          <p className="m-0 text-[15px] leading-6 text-black/60">
            Zius is Android only right now, and builds go out one at a time. Send me a note and I
            will reply with the APK and get you set up.
          </p>
          <a
            className="text-[15px] font-semibold text-black underline underline-offset-4"
            href={`mailto:${earlyAccessEmail}?subject=Zius%20early%20access`}
          >
            {earlyAccessEmail}
          </a>
          <button
            className="mt-2 inline-flex min-h-11.5 w-full items-center justify-center rounded-2xl bg-black px-6 text-[15px] font-semibold text-white transition hover:opacity-80 motion-reduce:transition-none"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
