import { type Component, createSignal, For, onCleanup, Show } from "solid-js";
import viktor89Image from "@/assets/viktor89.webp";
import "@/pages/Ptr89/Viktor89.scss";

const SNOWFLAKE_COUNT = 96;
const SNOWFALL_DURATION = 13000;

interface Snowflake {
	left: number;
	size: number;
	delay: number;
	duration: number;
	drift: number;
	sway: number;
	swayDuration: number;
}

const createSnowflake = (): Snowflake => ({
	left: Math.random() * 100,
	size: 2 + Math.random() * 2,
	delay: Math.random() * 4,
	duration: 7 + Math.random() * 2,
	drift: (Math.random() - 0.5) * 30,
	sway: 2 + Math.random() * 4,
	swayDuration: 1.2 + Math.random() * 1.2,
});

export const Viktor89: Component = () => {
	const [snowflakes, setSnowflakes] = createSignal<Snowflake[]>([]);
	const [visible, setVisible] = createSignal(true);
	const [hiding, setHiding] = createSignal(false);
	let snowfallTimer: number | undefined;

	const startSnowfall = () => {
		setHiding(true);
		setSnowflakes(Array.from({ length: SNOWFLAKE_COUNT }, createSnowflake));
		snowfallTimer = window.setTimeout(() => setSnowflakes([]), SNOWFALL_DURATION);
	};

	onCleanup(() => window.clearTimeout(snowfallTimer));

	return (
		<>
			<Show when={visible()}>
				<button
					type="button"
					class="ptr89-viktor"
					classList={{ "ptr89-viktor-hiding": hiding() }}
					aria-label="Let it snow"
					title="Let it snow"
					disabled={hiding()}
					onClick={startSnowfall}
					onAnimationEnd={(e) => {
						if (e.animationName === "ptr89-viktor-hide")
							setVisible(false);
					}}
				>
					<img src={viktor89Image} alt="" draggable={false} />
				</button>
			</Show>
			<div class="ptr89-snowfall" aria-hidden="true">
				<For each={snowflakes()}>{(snowflake) =>
					<span
						class="ptr89-snowflake"
						style={{
							"--ptr89-left": `${snowflake.left}%`,
							"--ptr89-size": `${snowflake.size}rem`,
							"--ptr89-delay": `${snowflake.delay}s`,
							"--ptr89-duration": `${snowflake.duration}s`,
							"--ptr89-drift": `${snowflake.drift}vw`,
							"--ptr89-sway-start": `${-snowflake.sway}vw`,
							"--ptr89-sway-end": `${snowflake.sway}vw`,
							"--ptr89-sway-duration": `${snowflake.swayDuration}s`,
						}}
					>
						<img src={viktor89Image} alt="" draggable={false} />
					</span>
				}</For>
			</div>
		</>
	);
};
