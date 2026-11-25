"use client";

import { Badge } from "@/shared/components/ui/badge";
import Link from "next/link";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import AvatarCircles from "@/shared/components/ui/avatar-circles";
import Image from "next/image";
import React from "react";
import { cn } from "@/shared/libs/utils";
import { Contributor, Project } from "@/shared/interfaces/projects";


const ProjectCard: React.FC<{ project: Project, className?: string }> = ({ project, className }) => {
    const avatars = project?.contributors?.map((contributor: Contributor) => ({
        imageUrl: contributor.avatarUrl,
        profileUrl: contributor.url,
        title: contributor.name,
    })) ?? [];

    return (
        <article
            className={cn("col-span-1 top-5 sticky duration-300 drop-shadow-xl drop-shadow-black/2 overflow-hidden max-sm:p-1 p-1 max-sm:rounded-none bg-background group font-sans rounded-[28px] mb-4 ring-1 ring-foreground/5 hover:ring-primary/50 hover:ring-2 transition-all ease-in-out flex flex-col h-full", className)}
            tabIndex={-1}>

            <Image src={project.thumbnail} width={512} height={512} alt={project.title || ""} className="object-cover w-full aspect-video duration-300 transition-all ease-in-out max-sm:rounded-none rounded-3xl" />

            <div className='bg-background/30 ring-1 w-fit absolute top-2 right-2 ml-auto ring-foreground/10 justify-end flex rounded-full max-sm:rounded-none p-1'>
                <Link
                    // target="_blank"
                    href={`/projects/${project.slug}`}
                    className="flex max-sm:rounded-none rounded-full p-2 hover:ring ring-foreground/20 hover:bg-background/40 text-foreground/90 hover:text-foreground transition-all items-center justify-center">
                    <ExternalLinkIcon className="size-4" />
                </Link>
            </div>

            <div className='ring-1 bg-background/20 absolute top-1/2 right-5 translate-y-[-18%] w-fit ring-foreground/10 justify-end flex  max-sm:rounded-none rounded-full p-1'>
                <AvatarCircles numPeople={Math.max(0, avatars.length - 4)} avatarUrls={avatars} />
            </div>

            <h2 className="text-lg px-2.5 mt-4 z-10 font-semibold font-sans leading-8 tracking-tight line-clamp-1">{project.title}</h2>
            <header className='mb-2 px-2 relative flex mt-2 justify-between items-center'>
                <div className="flex gap-2 items-center">
                    {project.tags?.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border border-primary/50">{tag.tag}</Badge>
                    ))}
                </div>
            </header>

            <p className='font-normal px-2.5 z-10 text-sm line-clamp-2 text-foreground/80'>
                {project.description}
            </p>

            {/* <footer className="mt-auto px-4 pb-4 flex justify-between pt-2 z-10">
                <div className='bg-foreground/5 ring-1 w-fit ring-foreground/10 justify-end flex  max-sm:rounded-none rounded-full p-1'>
                    <AvatarCircles numPeople={Math.max(0, avatars.length - 4)} avatarUrls={avatars} />
                </div>
            </footer> */}
        </article>
    );
};

export default ProjectCard;