import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center pt-8">
      <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin" />
    </div>
  );
}
