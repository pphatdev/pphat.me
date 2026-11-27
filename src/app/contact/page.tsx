import Footer from "@/shared/components/layouts/footer";
import { GotoTop } from "@/shared/components/layouts/goto-top";
import { Metadata } from "next";
import { openGraphBase } from "@/shared/seo/site";
import { ContactHero } from "./contact-hero";
import { ContactForm } from "./contact-form";

const description = "Get in touch with LEAT Sophat. I'm always open to discussing new projects, creative ideas or opportunities to be part of your vision.";

export const metadata: Metadata = {
    title: "Contact",
    description,
    alternates: { canonical: "/contact", types: { "text/markdown": "/contact/llms.txt" } },
    openGraph: { ...openGraphBase, title: "Contact LEAT Sophat", description, url: "/contact" },
};

export default function Contact() {
    return (
        <main className="w-full flex flex-col relative">
            <ContactHero />
            <ContactForm />
            <Footer />
            <GotoTop />
        </main>
    );
}
