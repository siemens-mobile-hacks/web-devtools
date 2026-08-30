import "./Sidebar.scss";
import { Component, For } from "solid-js";
import { SidebarLink, SidebarLinkProps } from "@/components/Layout/Sidebar/SidebarLink";
import clsx from "clsx";

interface SidebarSection {
	title: string;
	links: Array<SidebarLinkProps>
}

interface SidebarProps {
	offcanvas?: boolean
}

export const Sidebar: Component<SidebarProps> = (props) => {
	const sections: SidebarSection[] = [
		{
			title: "Functions library",
			links: [
				{ label: "Swilib analysis", href: "/swilib/analysis/summary", icon: "bi bi-activity" },
				{ label: "Check swilib.vkp", href: "/swilib/check", icon: "bi bi-file-earmark-check" },
				{ label: "Merge swilib.vkp", href: "/swilib/merge", icon: "bi bi-arrow-left-right" }
			]
		},

		{
			title: "Reverse engineering",
			links: [
				{ label: "Patterns finder", href: "/re/ptr89", icon: "bi bi-search" },
				{ label: "C166 calculator", href: "/re/c166-calculator", icon: "bi bi-calculator" },
				{ label: "Download symbols", href: "/re/symbols", icon: "bi bi-download" }
			]
		},

		{
			title: "Database",
			links: [
				{ label: "Patches map", href: "/db/patches-map", icon: "bi bi-diagram-3", disabled: true },
				{ label: "Memory map", href: "/db/memory-map", icon: "bi bi-grid-3x3-gap", disabled: true }
			]
		}
	];

	return (
		<aside class={clsx("sidebar", props.offcanvas && "sidebar--offcanvas")}>
			<For each={sections}>{(section) =>
				<section class="sidebar__section">
					<div class="sidebar__section-title">{section.title}</div>
					<For each={section.links}>{(link) =>
						<SidebarLink {...link} />
					}</For>
				</section>
			}</For>
		</aside>
	);
};
