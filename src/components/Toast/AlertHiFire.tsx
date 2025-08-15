
import { Toast, ToastToggle } from "flowbite-react";
import { HiFire } from "react-icons/hi";

export const AlertHiFire = ({description}:{description: String}) => {
  return (
    <div className="w-full max-w-xl mx-auto mb-5">
      <Toast className="w-full max-w-full flex items-center transition-all">
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-500 dark:bg-cyan-800 dark:text-cyan-200">
          <HiFire className="h-5 w-5" />
        </div>
        <div className="ml-3 text-sm font-normal flex-1">{description}</div>
        <ToastToggle />
      </Toast>
    </div>
  );
}
