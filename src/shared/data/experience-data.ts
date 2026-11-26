import { CompaniesProps } from '@/shared/hooks/skills';
import { getSkill } from '@/shared/libs/brands';

export const experiencesData: CompaniesProps[] = [
    {
        title: "TURBOTECH CO., LTD",
        logo: "assets/brands/org/turbotech.png",
        works: [
            {
                date: "Oct 2022 - Present",
                title: "Senior Frontend Developer",
                skills: [
                    getSkill("Figma"),
                    getSkill("Laravel"),
                    getSkill("React"),
                    getSkill("Next.js"),
                    getSkill("Tailwind CSS", "tailwindcss"),
                    getSkill("Typescript"),
                    getSkill("Node.js", "nodejs"),
                    getSkill("Express.js", "express"),
                    getSkill("PostgreSQL"),
                    getSkill("MySQL"),
                    getSkill("Python"),
                ]
            },
            {
                date: "Oct 2020 - Oct 2022",
                title: "Junior Frontend Developer",
                skills: [
                    getSkill("JavaScript"),
                    getSkill("JQuery"),
                    getSkill("HTML"),
                    getSkill("CSS"),
                    getSkill("Sass"),
                    getSkill("Tailwind CSS", "tailwindcss"),
                    getSkill("Bootstrap"),
                    getSkill("PHP"),
                    getSkill("MySQL"),
                    getSkill("Laravel"),
                ]
            },
            {
                date: "Nov 2019 - Oct 2020",
                title: "Content Writing Officer & UI/UX Designer",
                skills: [
                    getSkill("Ms.Word", "word"),
                    getSkill("Ms.Excel", "excel"),
                    getSkill("Ms.Powerpoint", "powerpoint"),
                    getSkill("Figma")
                ]
            }
        ]
    },
    {
        title: "Nintrea Labs",
        logo: "assets/brands/org/nintrea.png",
        works: [
            {
                date: "2021 - Present",
                title: "Creator & Developer of Nintrea",
                skills: [
                    getSkill("Figma"),
                    getSkill("HTML"),
                    getSkill("CSS"),
                    getSkill("JavaScript"),
                    getSkill("Typescript"),
                    getSkill("JQuery"),
                    getSkill("Tailwind CSS", "tailwindcss"),
                    getSkill("Sass"),
                    getSkill("Bootstrap"),
                    getSkill("React"),
                    getSkill("Next.js"),
                    getSkill("Nuxt.js", "nuxt"),
                    getSkill("EJS"),
                    getSkill("PHP"),
                    getSkill("Laravel"),
                    getSkill("Node.js", "nodejs"),
                    getSkill("Express.js", "express"),
                    getSkill("PostgreSQL"),
                    getSkill("MySQL"),
                    getSkill("Vercel"),
                    getSkill("Netlify"),
                    getSkill("Github"),
                    getSkill("Ubuntu"),
                    getSkill("Nginx"),
                    getSkill("C#", "csharp"),
                    getSkill("C++", "cplusplus"),
                    getSkill("Python"),
                    getSkill("Git")
                ]
            }
        ]
    }
];
