/**
 * Brand icons (public/assets/brands/**), snapshotted at build time by
 * scripts/generate-brands.mjs. Do not read the filesystem here: the site runs
 * on Cloudflare Workers, where `fs` is unavailable at request time.
 */
import brands from '@/shared/data/brands.generated.json';
import { Image } from '@/shared/interfaces/image';

const svgByFile = brands.svg as Record<string, string>;
const fileSet = new Set<string>(brands.files);

const toCaption = (name: string) =>
    name.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

/** All .svg/.jpg/.jpeg icons in one brands sub-folder (e.g. "stacks"). */
export function brandImages(folder: string): Image[] {
    return brands.files
        .filter((file) => file.startsWith(`${folder}/`) && /\.(jpg|jpeg|svg)$/i.test(file))
        .map((file) => {
            const name = file.slice(folder.length + 1).split('.')[0];
            return {
                src: `/assets/brands/${file}`,
                svg: svgByFile[file],
                alt: name,
                width: 200,
                height: 200,
                caption: toCaption(name),
            };
        });
}

/** Look up a skill icon by title, trying the same folders/extensions as before. */
export function getSkill(title: string, fileName?: string): { title: string; svg?: string } {
    const name = (fileName || title).toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
    const candidates = [
        `stacks/${name}.svg`,
        `design/${name}.svg`,
        `office/${name}.svg`,
        `deploy/${name}.svg`,
        `stacks/${name}.png`,
        `stacks/${name}.jpg`,
    ];
    const match = candidates.find((file) => fileSet.has(file));
    return match ? { title, svg: svgByFile[match] } : { title };
}
