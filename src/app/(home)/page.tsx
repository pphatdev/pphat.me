import Footer from "@/shared/components/layouts/footer";
import type { Metadata } from "next";
import { openGraphBase, SITE_DESCRIPTION, SITE_TITLE } from "@/shared/seo/site";
import HeroSection from "./hero";
import { SectionSkills } from "./skills";
import { GotoTop } from "@/shared/components/layouts/goto-top";
import { SectionAboutMe } from "./about";
import { SectionProjects } from "@/app/(home)/projects";
import { SectionExperience } from "./experience";
import { experiencesData } from "./experience-data";
import { getLatestPost } from "./latest-post";

export default async function Home() {
    const latestPost = await getLatestPost();

    return (
        <div className="w-full flex flex-col">
            {/* <HomePersonStructuredData />
            <WebsiteStructuredData />
            <OrganizationStructuredData /> */}

            {/* Hero Section */}
            <HeroSection latestPost={latestPost} />

            {/* About Me Section */}
            <SectionAboutMe />

            {/* Skill Section */}
            <SectionSkills />

            {/* Projects Section */}
            <SectionProjects />

            {/* Experience Section */}
            <SectionExperience experiences={experiencesData} />

            {/* Goto Top Section */}
            <GotoTop />

            {/* Footer Section */}
            <Footer />
        </div>
    );
}

// Home uses the layout's default title/description; it only needs its own
// canonical and og:url (deliberately not set in the layout, see layout.tsx).
export const metadata: Metadata = {
    alternates: { canonical: "/" },
    openGraph: { ...openGraphBase, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/" },
};
