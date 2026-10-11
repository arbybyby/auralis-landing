interface SkipLinkProps {
  label: string;
}

export function SkipLink({ label }: SkipLinkProps) {
  return (
    <a
      href="#main"
      className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-full bg-accent px-5 py-2.5 text-small font-medium text-void focus:translate-y-0"
    >
      {label}
    </a>
  );
}
