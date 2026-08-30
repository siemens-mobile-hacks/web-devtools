import {
	type Ptr89OpenOptions,
	type Ptr89SearchResult,
	type Ptr89SearchType,
	type Ptr89XRef,
	prettify,
	Ptr89,
} from "@sie-js/ptr89";

export type Ptr89WorkerPayload = {
	operation: "find";
	file: File;
	options: Ptr89OpenOptions;
	pattern: string;
	limit: number;
	align: number;
} | {
	operation: "findXRefs";
	file: File;
	options: Ptr89OpenOptions;
	address: number;
	limit: number;
} | {
	operation: "prettify";
	pattern: string;
};

export type Ptr89WorkerResponse =
	| { matches: Ptr89SearchResult[]; type: Ptr89SearchType }
	| { xrefs: Ptr89XRef[] }
	| { pattern: string }
	| { error: string };

const worker = self as unknown as Worker;
const ptr89 = new Ptr89();

worker.addEventListener("message", async (event: MessageEvent<Ptr89WorkerPayload>) => {
	const request = event.data;
	let response: Ptr89WorkerResponse;

	try {
		if (request.operation === "prettify") {
			response = { pattern: await prettify(request.pattern) };
		} else {
			await ptr89.openFile(request.file, request.options);
			if (request.operation === "find") {
				const search = ptr89.find(request.pattern, request.limit, request.align);
				response = { matches: search.results, type: search.type };
			} else {
				response = { xrefs: ptr89.findXRefs(request.address, request.limit) };
			}
		}
	} catch (error) {
		response = { error: error instanceof Error ? error.message : String(error) };
	} finally {
		ptr89.close();
	}

	worker.postMessage(response);
});
