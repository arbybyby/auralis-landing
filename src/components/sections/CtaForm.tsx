"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import type { EmailFormContent } from "@/content/finalCta";

type FormStatus = "idle" | "invalid" | "success";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CtaFormProps {
  copy: EmailFormContent;
}

export function CtaForm({ copy }: CtaFormProps) {
  const inputId = useId();
  const messageId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(EMAIL_PATTERN.test(email.trim()) ? "success" : "invalid");
  };

  if (status === "success") {
    return (
      <p role="status" className="text-h3 font-medium text-accent">
        {copy.success}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-xl">
      <label htmlFor={inputId} className="sr-only">
        {copy.label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder={copy.placeholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={status === "invalid"}
          aria-describedby={status === "invalid" ? messageId : undefined}
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-6 py-3.5 text-small text-text placeholder:text-muted focus:border-accent"
        />
        <Button type="submit">{copy.submit}</Button>
      </div>
      <p
        id={messageId}
        role="alert"
        className="mt-3 min-h-5 pl-6 text-small text-warm"
      >
        {status === "invalid" ? copy.invalid : null}
      </p>
    </form>
  );
}
