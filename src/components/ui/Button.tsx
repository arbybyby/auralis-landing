import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost";

interface SharedProps {
  variant?: ButtonVariant;
  children: ReactNode;
}

interface ButtonAsLinkProps
  extends SharedProps, Omit<ComponentPropsWithoutRef<"a">, "children"> {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
}

interface ButtonAsButtonProps
  extends SharedProps, Omit<ComponentPropsWithoutRef<"button">, "children"> {
  href?: undefined;
  ref?: Ref<HTMLButtonElement>;
}

type ButtonProps = ButtonAsLinkProps | ButtonAsButtonProps;

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-small font-medium transition duration-300 ease-out-expo";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-void hover:shadow-[0_0_2.5rem_-0.25rem_var(--color-accent)]",
  ghost: "border border-line text-text hover:border-accent hover:text-accent",
};

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function buttonClasses(variant: ButtonVariant, className?: string): string {
  return cn(base, variants[variant], className);
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant = "primary", className, children, ...anchorProps } = props;
    return (
      <a {...anchorProps} className={buttonClasses(variant, className)}>
        {children}
        <ArrowIcon />
      </a>
    );
  }

  const { variant = "primary", className, children, ...buttonProps } = props;
  return (
    <button
      type="button"
      {...buttonProps}
      className={buttonClasses(variant, className)}
    >
      {children}
      <ArrowIcon />
    </button>
  );
}
