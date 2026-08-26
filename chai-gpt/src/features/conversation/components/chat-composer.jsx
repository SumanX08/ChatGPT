"use client";

import * as React from "react";
import { ArrowUpIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function ChatComposer({
  onSend,
  isSending = false,
  placeholder = "Message ChaiGPT…",
  className,
  autoFocus = false,
}) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  async function handleSubmit(event) {
    event?.preventDefault();

    const content = value.trim();

    if (!content || isSending) return;

    setValue("");
    await onSend(content);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const canSend = value.trim().length > 0 && !isSending;

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={cn("mx-auto w-full max-w-3xl px-4 pb-4 md:px-6", className)}
    >
      <InputGroup className="h-auto min-h-14 rounded-3xl border-border/80 bg-background shadow-sm dark:bg-input/40">
        <InputGroupTextarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSending}
          rows={1}
          className="max-h-48 min-h-12 py-3.5 pl-4 text-[15px] leading-relaxed"
        />

        <InputGroupAddon
          align="inline-end"
          className="self-end pr-2 pb-2"
        >
          <InputGroupButton
            type="submit"
            size="icon-sm"
            variant="default"
            disabled={!canSend}
            className="size-9 rounded-full"
            aria-label="Send message"
          >
            {isSending ? <Spinner /> : <ArrowUpIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        ChaiGPT can make mistakes. Check important info.
      </p>
    </form>
  );
}