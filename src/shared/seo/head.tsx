import { SOCIAL_PROFILES } from './site';

/**
 * Extra <head> tags that Next's Metadata API doesn't cover: icons, fonts and
 * rel="me" profile links. Title, description, Open Graph, Twitter, robots and
 * Google verification live in the root layout's `metadata`.
 */
export default function DefaultHead() {
    return (
        <>
            <link rel="icon" type="image/x-icon" href="/assets/icons/favicon.ico" />
            <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.webmanifest" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600;700&display=swap" />

            <link rel="alternate" type="text/markdown" title="llms.txt" href="/llms.txt" />

            {SOCIAL_PROFILES.map((href) => (
                <link key={href} rel="me" href={href} />
            ))}
        </>
    );
}
