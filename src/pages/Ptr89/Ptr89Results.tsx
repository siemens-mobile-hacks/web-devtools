import { type Component, createMemo, createSignal, For, Show } from "solid-js";
import { Form } from "solid-bootstrap";
import {
	type Ptr89Arch,
	type Ptr89SearchType,
	type Ptr89XRefType,
} from "@sie-js/ptr89";
import { formatAddress } from "@/utils/format";
import {
	type AddressSpace,
	type FullflashMatch,
	type SearchResult,
	type XRefResult,
	usePtr89State,
} from "@/pages/Ptr89/store/ptr89State";

interface SearchResultsProps {
	result: SearchResult;
}

interface XRefResultsProps {
	result: XRefResult;
}

const formatAddressBytes = (value: number) => [0, 8, 16, 24]
	.map((shift) => ((value >>> shift) & 0xFF).toString(16).toUpperCase().padStart(2, "0"))
	.join(" ");

const formatC166Pointer = (value: number, addressSpace: AddressSpace) => {
	const pageSize = addressSpace === "data" ? 0x4000 : 0x10000;
	const pageWidth = addressSpace === "data" ? 4 : 2;
	const offset = value % pageSize;
	const page = Math.floor(value / pageSize);
	return {
		pointer: `${page.toString(16).toUpperCase().padStart(pageWidth, "0")}:${offset.toString(16).toUpperCase().padStart(4, "0")}`,
		bytes: formatAddressBytes((page << 16) | offset),
	};
};

const AddressCell: Component<{ address: number; showBytes: boolean; fullflashName?: string }> = (props) => (
	<td>
		<Show when={props.fullflashName}>
			<strong class="d-block d-sm-none mb-1">{props.fullflashName}</strong>
		</Show>
		<div>{formatAddress(props.address)}</div>
		<Show when={props.showBytes}>
			<code class="d-block text-nowrap">{formatAddressBytes(props.address)}</code>
		</Show>
	</td>
);

const C166PointerCell: Component<{
	address: number;
	arch: Ptr89Arch;
	addressSpace: AddressSpace;
	showBytes: boolean;
}> = (props) => {
	const pointer = createMemo(() => formatC166Pointer(props.address, props.addressSpace));

	return (
		<td>
			<Show when={props.arch === "c166"} fallback="-">
				<div>{pointer().pointer}</div>
				<Show when={props.showBytes}>
					<code class="d-block text-nowrap">{pointer().bytes}</code>
				</Show>
			</Show>
		</td>
	);
};

const BytesCell: Component<{ bytes?: string }> = (props) => {
	const [expanded, setExpanded] = createSignal(false);
	const bytes = createMemo(() => props.bytes?.replace(/\s/g, "").match(/.{1,2}/g) ?? []);
	const visibleBytes = createMemo(() => (expanded() ? bytes() : bytes().slice(0, 16)).join(" "));

	return (
		<td>
			<Show when={bytes().length > 0} fallback="-">
				{visibleBytes()}
				<Show when={bytes().length > 16}>
					<Show when={!expanded()}> …</Show>
					<button
						type="button"
						class="btn btn-link btn-sm p-0 ms-1 align-baseline"
						title={expanded() ? "Collapse bytes" : "Show all bytes"}
						aria-label={expanded() ? "Collapse bytes" : "Show all bytes"}
						aria-expanded={expanded()}
						onClick={() => setExpanded((value) => !value)}
					>
						<i class={expanded() ? "bi bi-chevron-up" : "bi bi-chevron-down"}></i>
					</button>
				</Show>
			</Show>
		</td>
	);
};

const formatDuration = (duration: number) => duration < 1000 ?
	`${Math.round(duration)} ms` :
	`${(duration / 1000).toFixed(2)} s`;

const formatResultType = (type: Ptr89SearchType, count: number) => {
	if (count === 1)
		return type;
	if (type === "address")
		return "addresses";
	return type === "branch" ? "branches" : `${type}s`;
};

const resultColumnNames: Record<Ptr89SearchType, string> = {
	address: "Address",
	pointer: "Pointer",
	reference: "Address",
	branch: "Function",
};

const xrefTypeNames: Record<Ptr89XRefType, string> = {
	pointer: "Pointer",
	reference: "Address",
	branch: "Branch",
};

export const SearchResults: Component<SearchResultsProps> = (props) => {
	const [ptr89State, ptr89] = usePtr89State();
	const matchGroups = createMemo(() => {
		const groups: FullflashMatch[][] = [];
		for (const match of props.result.matches) {
			const lastGroup = groups.at(-1);
			if (lastGroup?.[0].fullflashId === match.fullflashId) {
				lastGroup.push(match);
			} else {
				groups.push([match]);
			}
		}
		return groups;
	});
	const hasC166Matches = createMemo(() => props.result.matches.some((match) => match.arch === "c166"));
	const resultColumnName = () => hasC166Matches() ? "Physical" : resultColumnNames[props.result.type];
	const resultSummary = () => `Found ${props.result.matches.length} ${formatResultType(props.result.type, props.result.matches.length)} in ${formatDuration(props.result.duration)}`;

	return (
		<div class="mt-3">
			<Show when={props.result.issues.length > 0}>
				<div class="alert alert-warning py-2" role="alert">
					<For each={props.result.issues}>{(issue) =>
						<div>
							<strong>{issue.fullflashName}:</strong> {issue.message}
						</div>
					}</For>
				</div>
			</Show>
			<h6 class="mb-2">
				{resultSummary()}
			</h6>
			<Show when={props.result.matches.length > 0}>
				<div class="d-flex flex-row mb-2">
					<Form.Check
						inline
						id="ptr89-show-address-bytes"
						type="checkbox"
						class="me-4"
						label="Show address bytes"
						checked={ptr89State.showAddressBytes}
						onChange={(e) => ptr89.setState("showAddressBytes", e.currentTarget.checked)}
					/>
					<Show when={hasC166Matches()}>
						<span class="me-3">Address space:</span>
						<Form.Check
							inline
							id="ptr89-address-space-data"
							name="ptr89-address-space"
							type="radio"
							label="DATA"
							checked={ptr89State.addressSpace === "data"}
							onChange={() => ptr89.setState("addressSpace", "data")}
						/>
						<Form.Check
							inline
							id="ptr89-address-space-code"
							name="ptr89-address-space"
							type="radio"
							label="CODE"
							checked={ptr89State.addressSpace === "code"}
							onChange={() => ptr89.setState("addressSpace", "code")}
						/>
					</Show>
				</div>
				<table class="table table-bordered table-hover table-sticky-header font-monospace" style={{ width: "auto" }}>
					<thead>
						<tr>
							<th class="d-none d-sm-table-cell">
								<small>File</small>
							</th>
							<th>
								<small>{resultColumnName()}</small>
							</th>
							<th>
								<small>Offset</small>
							</th>
							<Show when={hasC166Matches()}>
								<th>
									<small title={ptr89State.addressSpace === "data" ? "PAG:POF" : "SEG:SOF"}>
										Pointer
									</small>
								</th>
							</Show>
							<Show when={props.result.type === "address"}>
								<th>
									<small>Bytes</small>
								</th>
							</Show>
						</tr>
					</thead>
					<For each={matchGroups()}>{(group) =>
						<tbody>
							<For each={group}>{(match, index) =>
								<tr>
									<td class="d-none d-sm-table-cell text-truncate" title={index() === 0 ? match.fullflashName : undefined}>
										{index() === 0 ? match.fullflashName : ""}
									</td>
									<AddressCell
										address={match.address}
										showBytes={ptr89State.showAddressBytes}
										fullflashName={index() === 0 ? match.fullflashName : undefined}
									/>
									{match.offset === undefined ?
										<td>-</td> :
										<AddressCell address={match.offset} showBytes={ptr89State.showAddressBytes} />
									}
									<Show when={hasC166Matches()}>
										<C166PointerCell
											address={match.address}
											arch={match.arch}
											addressSpace={ptr89State.addressSpace}
											showBytes={ptr89State.showAddressBytes}
										/>
									</Show>
									<Show when={props.result.type === "address"}>
										<BytesCell bytes={match.bytes} />
									</Show>
								</tr>
							}</For>
						</tbody>
					}</For>
				</table>
			</Show>
		</div>
	);
};

export const XRefResults: Component<XRefResultsProps> = (props) => {
	const resultSummary = () => `Found ${props.result.xrefs.length} ${props.result.xrefs.length === 1 ? "x-reference" : "x-references"} in ${formatDuration(props.result.duration)}`;

	return (
		<div class="mt-3">
			<h6 class="mb-2">
				{resultSummary()}
			</h6>
			<Show when={props.result.xrefs.length > 0}>
				<table class="table table-bordered table-hover table-sticky-header font-monospace" style={{ width: "auto" }}>
					<thead>
						<tr>
							<th>
								<small>Type</small>
							</th>
							<th>
								<small>X-Reference</small>
							</th>
							<th>
								<small>Offset</small>
							</th>
						</tr>
					</thead>
					<tbody>
						<For each={props.result.xrefs}>{(xref) =>
							<tr>
								<td>{xrefTypeNames[xref.type]}</td>
								<td>{formatAddress(xref.xref)}</td>
								<td>{formatAddress(xref.offset)}</td>
							</tr>
						}</For>
					</tbody>
				</table>
			</Show>
		</div>
	);
};
