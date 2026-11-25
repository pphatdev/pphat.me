/**
 * Emoji detection. Emoji are rendered with each device's own font (Apple
 * Color Emoji on iOS/macOS, Segoe UI Emoji on Windows, Noto on Android/Linux);
 * this only finds them so styles like gradient text can leave them alone.
 */

/**
 * A grapheme is an emoji when it is a full RGI emoji (Unicode's
 * "recommended for general interchange" list). This keeps plain-text symbols
 * like © or ™ as text unless written as emoji (with U+FE0F). The `v` flag is
 * built at runtime so older TS targets compile; engines without it fall back
 * to a pictographic check.
 */
const IS_EMOJI: RegExp = (() => {
    try {
        return new RegExp('^\\p{RGI_Emoji}$', 'v');
    } catch {
        return /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[#*0-9]️?⃣)/u;
    }
})();

/** Fast pre-check so plain text skips segmentation entirely. */
const MAY_CONTAIN_EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;

export type TextRun = { text: string; emoji: boolean };

let segmenter: Intl.Segmenter | undefined;

/**
 * Split text into alternating plain-text and emoji runs. Uses grapheme
 * clusters so ZWJ sequences, skin tones and flags stay whole, and combining
 * scripts (e.g. Khmer) are never split mid-cluster. Each emoji is its own run.
 */
export function splitEmoji(text: string): TextRun[] {
    if (!text || !MAY_CONTAIN_EMOJI.test(text)) return text ? [{ text, emoji: false }] : [];
    segmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });

    const runs: TextRun[] = [];
    for (const { segment } of segmenter.segment(text)) {
        const emoji = IS_EMOJI.test(segment);
        const last = runs[runs.length - 1];
        if (!emoji && last && !last.emoji) last.text += segment;
        else runs.push({ text: segment, emoji });
    }
    return runs;
}
