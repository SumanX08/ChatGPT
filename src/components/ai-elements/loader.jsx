import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

export const Loader = ({
  className,
  size = 16,
  ...props
}) => (
  <div
    className={cn(
      "inline-flex items-center justify-center",
      className
    )}
    {...props}
  >
    <Loader2Icon
      className="animate-spin"
      size={size}
    />
  </div>
);