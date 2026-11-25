import { cn } from "@/shared/libs/utils";
import { splitEmoji } from "@/shared/libs/emoji";

const GRADIENT =
    "bg-background bg-clip-text bg-no-repeat text-transparent bg-linear-to-r from-sky-500 via-teal-500 to-green-500 [text-shadow:0_0_rgba(0,0,0,0.1)]";

/**
 * Brand gradient text. `bg-clip-text` + `text-transparent` would paint colour
 * emoji as flat gradient blobs, so emoji runs are left as normal glyphs
 * (the device's own emoji font, e.g. Apple Color Emoji on iOS).
 */
export function GradientText({ children, className }: { children: string; className?: string }) {
    return (
        <span className={cn("text-left", className)}>
            {splitEmoji(children).map((run, index) =>
                run.emoji ? (
                    <span key={index}>{run.text}</span>
                ) : (
                    <span key={index} className={cn(GRADIENT, "box-decoration-clone")}>
                        {run.text}
                    </span>
                ),
            )}
        </span>
    );
}
