import AboutHero from "./about-hero";
import { SectionExperience } from "@/app/(home)/experience";
import { experiencesData } from "@/app/(home)/experience-data";
import Footer from "@/shared/components/layouts/footer";
import { GotoTop } from "@/shared/components/layouts/goto-top";
import { Metadata } from "next";
import { openGraphBase } from "@/shared/seo/site";

const description = "I am Leat Sophat (LEAT Sophat, PPhat), a Senior Front-end Developer and Freelance UI/UX Designer from Phnom Penh, Cambodia. Learn more about my journey, skills, and experience.";

export const metadata: Metadata = {
    title: "About",
    description,
    alternates: { canonical: "/about", types: { "text/markdown": "/about/llms.txt" } },
    openGraph: { ...openGraphBase, title: "About LEAT Sophat", description, url: "/about", type: "profile" },
};

export default function About() {
    return (
        <main className="w-full flex flex-col gap-7 pb-5">
            <AboutHero />
            <SectionExperience experiences={experiencesData} />
            <Footer />
            <GotoTop />
        </main>
    );
}
