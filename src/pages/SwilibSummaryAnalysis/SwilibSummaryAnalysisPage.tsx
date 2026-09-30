import { Component, createMemo, createResource, createSignal, For, Show } from "solid-js";
import { useSwilibTableOptionsStore } from "@/store/swilibTableOptionsStore";
import { SwilibTargetsTabs } from "@/components/Swilib/SwilibTargetsTabs";
import { Button, Form, Spinner } from "solid-bootstrap";
import { SwilibTable } from "@/pages/SwilibSummaryAnalysis/SwilibTable";
import {
	getAvailableSwilibDevices,
	getPatternsCoverage,
	getSummarySwilibAnalysis,
	SummarySwilibAnalysisEntry,
	SWILIB_PLATFORMS,
	SwilibEntryType,
} from "@/api/swilib";
import { formatId } from "@/utils/format";
import { SwilibEntryModal } from "@/pages/SwilibSummaryAnalysis/SwilibEntryModal";
import { useResourcesState } from "@/hooks/useResourcesState";

const SwilibSummaryAnalysisPage: Component = () => {
	const [tableOptions, setTableOptions] = useSwilibTableOptionsStore();
	const [devices] = createResource(getAvailableSwilibDevices);
	const [summaryAnalysis] = createResource(getSummarySwilibAnalysis);
	const groups = () => tableOptions.groupByFile ? summaryAnalysis()?.files : ['swilib.h'];
	const [selectedEntry, setSelectedEntry] = createSignal<SummarySwilibAnalysisEntry>();

	const resourcesState = useResourcesState([devices, summaryAnalysis], { catchError: true });
	const coverageByPlatform = createMemo(() => {
		const statistics: Record<string, { coverage: number; total: number }> = {};
		for (const platform of SWILIB_PLATFORMS)
			statistics[platform] = { coverage: 0, total: 0 };

		for (const entry of summaryAnalysis()?.entries ?? []) {
			if (entry.type == SwilibEntryType.EMPTY)
				continue;

			const coverage = tableOptions.coverageType == 'PTR' ?
				getPatternsCoverage(entry.patterns, entry.coverage) :
				entry.coverage;
			for (const platform of SWILIB_PLATFORMS) {
				const value = coverage[platform];
				if (value == null || value == -200)
					continue;

				statistics[platform].total++;
				statistics[platform].coverage += value == 200 ? 100 : value;
			}
		}

		return Object.fromEntries(SWILIB_PLATFORMS.map((platform) => {
			const { coverage, total } = statistics[platform];
			return [platform, total ? Math.round(coverage / total) : 0];
		}));
	});

	const handleFilterByType = (e: Event & { currentTarget: HTMLInputElement }) => {
		if (e.currentTarget.checked)
			setTableOptions("filterByType", e.currentTarget.value);
	};

	return <>
		<div class="mb-2">
			<div class="mb-2">
				<SwilibTargetsTabs devices={devices()} />
			</div>

			<div class="d-flex justify-content-start">
				<div class="align-self-center me-3">
					<Form.Check
						type="checkbox"
						id="group-by-c-header"
						label="Group by C header"
						checked={tableOptions.groupByFile}
						onChange={(e) => setTableOptions("groupByFile", e.currentTarget.checked)}
					/>
				</div>

				<div class="align-self-center me-3">
					<Form.Check
						type="checkbox"
						id="show-old-names"
						label="Show old names"
						checked={tableOptions.showOldNames}
						onChange={(e) => setTableOptions("showOldNames", e.currentTarget.checked)}
					/>
				</div>

				<Button
					variant="outline-primary"
					size="sm"
					onClick={() => setTableOptions("globalCollapsed", (prev) => !prev)}
				>
					<Show when={!tableOptions.globalCollapsed}>
						<i class="bi bi-eye-slash"></i> Collapse all
					</Show>
					<Show when={tableOptions.globalCollapsed}>
						<i class="bi bi-eye"></i> Expand all
					</Show>
				</Button>
			</div>
		</div>

		<div class="d-flex flex-row mb-2">
			<span class="me-3"><i class="bi bi-globe"></i> Show coverage:</span>
			<Form.Check
				inline
				type="radio"
				id="coverage-type-swi"
				name="coverage-type"
				label="For swilib"
				value="SWI"
				checked={tableOptions.coverageType == 'SWI'}
				onChange={(e) => e.currentTarget.checked && setTableOptions("coverageType", e.currentTarget.value)}
			/>
			<Form.Check
				inline
				type="radio"
				id="coverage-type-ptr"
				name="coverage-type"
				label="For patterns"
				value="PTR"
				checked={tableOptions.coverageType == 'PTR'}
				onChange={(e) => e.currentTarget.checked && setTableOptions("coverageType", e.currentTarget.value)}
			/>
		</div>

		<div class="d-flex flex-row mb-3">
			<span class="me-3"><i class="bi bi-funnel"></i> Filter functions:</span>
			<Form.Check
				inline
				type="radio"
				name="filter-type"
				id="filter-type-all"
				label="All"
				value="all"
				checked={tableOptions.filterByType == 'all'}
				onChange={handleFilterByType}
			/>
			<Form.Check
				inline
				type="radio"
				name="filter-type"
				id="filter-type-unused"
				label="Unused"
				value="unused"
				checked={tableOptions.filterByType == 'unused'}
				onChange={handleFilterByType}
			/>
			<Form.Check
				inline
				type="radio"
				class="text-danger"
				name="filter-type"
				id="filter-type-dirty"
				label="Dirty"
				value="dirty"
				checked={tableOptions.filterByType == 'dirty'}
				onChange={handleFilterByType}
			/>
		</div>

		<Show when={resourcesState.isLoading}>
			<Spinner animation="border" role="status">
				<span class="visually-hidden">Loading...</span>
			</Spinner>
		</Show>

		<Show when={resourcesState.isError}>
			<div class="alert alert-danger" role="alert">
				Can't load data from the server. Please reload the page.
			</div>
		</Show>

		<Show when={resourcesState.isReady}>
			<div class="text-secondary mb-2">
				<span class="bi bi-info-circle"></span> {' '}
				Next free ID: <b>{formatId(summaryAnalysis()!.nextId)}</b>
			</div>

			<table class="table table-bordered w-auto mb-3">
				<caption class="visually-hidden">Coverage by platform</caption>
				<thead>
					<tr>
						<th scope="col"><small>Platform</small></th>
						<For each={SWILIB_PLATFORMS}>{(platform) =>
							<th scope="col" class="text-center"><small>{platform}</small></th>
						}</For>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row"><small>Coverage</small></th>
						<For each={SWILIB_PLATFORMS}>{(platform) =>
							<td class="text-center">{coverageByPlatform()[platform]}%</td>
						}</For>
					</tr>
				</tbody>
			</table>

			<For each={groups()}>{(file) =>
				<SwilibTable
					file={file}
					analysis={summaryAnalysis()!}
					onEntrySelect={(entry) => setSelectedEntry(entry)}
				/>
			}</For>

			<Show when={selectedEntry()}>{(selectedEntry) =>
				<SwilibEntryModal
					entry={selectedEntry()}
					analysis={summaryAnalysis()!}
					devices={devices()!}
					onHide={() => setSelectedEntry(undefined)}
				/>
			}</Show>
		</Show>
	</>;
};

export default SwilibSummaryAnalysisPage;
