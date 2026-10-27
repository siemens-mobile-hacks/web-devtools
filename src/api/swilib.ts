import { apiClient } from "@/api/client";

export interface SwilibDevice {
	target: string;
	model: string;
	sw: number;
	platform: string;
	patchId: number;
}

export enum SwilibEntryType {
	EMPTY = 0,
	FUNCTION = 1,
	POINTER = 2,
	VALUE = 3
}

export enum SwilibEntryFlags {
	NONE		= 0,
	BUILTIN		= 1 << 0,
	FROM_PATCH	= 1 << 1,
	DIRTY		= 1 << 2,
}

export interface SummarySwilibAnalysisEntry {
	id: number;
	name: string;
	aliases: string[];
	flags: SwilibEntryFlags;
	file: string;
	type: SwilibEntryType;
	coverage: Record<string, number>;
	patterns: Record<string, string>;
	values: Record<string, number>;
	targets: string[];
}

export interface SummarySwilibAnalysis {
	entries: SummarySwilibAnalysisEntry[];
	coverage: Record<string, number>;
	nextId: number;
	files: string[];
}

export interface TargetSwilibAnalysisEntry {
	id: number;
	value?: number;
	symbol?: string;
	error?: string;
	missing?: boolean;
}

export interface TargetSwilibAnalysis {
	target: string;
	platform: string;
	patchId: number;
	offset: number;
	statistic: {
		bad: number;
		good: number;
		missing: number;
		total: number;
		builtin: number;
		unavailable: number;
		unused: number;
	};
	entries: TargetSwilibAnalysisEntry[];
	coverage: Record<string, number>;
}

export enum SwilibDiffAction {
	LEFT,
	RIGHT,
	ASK,
	DELETE,
	SKIP,
}

export interface SwilibEntryDiffSide {
	value: number;
	error?: string;
}

export interface SwilibEntryDiff {
	id: number;
	name?: string;
	symbol?: string;
	left?: SwilibEntryDiffSide;
	right?: SwilibEntryDiffSide;
	action: SwilibDiffAction;
}

export interface CpuSymbolsFile {
	name: string;
	ida: string;
	ghidra: string;
	cpu: string;
}

export const SWILIB_PLATFORMS = ['ELKA', 'NSG', 'X75', 'SG'];

export async function getTargetSwilibAnalysis(target: string) {
	const response = await apiClient.get<TargetSwilibAnalysis>(`/api/swilib/analyze/${target}`);
	return response.data;
}

export async function getTargetSwilibCustomAnalysis(platform: string, code: string) {
	const response = await apiClient.post<TargetSwilibAnalysis>(`/api/swilib/analyze`, { code, platform });
	return response.data;
}

export async function getSummarySwilibAnalysis() {
	const response = await apiClient.get<SummarySwilibAnalysis>(`/api/swilib/analyze/all`);
	return response.data;
}

export async function getAvailableSwilibDevices() {
	const response = await apiClient.get<SwilibDevice[]>(`/api/swilib/devices`, {
		id: "swilib-devices",
		cache: {
			enabled: true
		},
	});
	return response.data;
}

export async function getSwilibDiff(platform: string, left: string, right: string) {
	const response = await apiClient.post<SwilibEntryDiff[]>(`/api/swilib/diff`, { left, right, platform });
	return response.data;
}

export async function getSwilibDiffResult(platform: string, left: string, right: string, target: string, answers: Record<number, SwilibDiffAction>) {
	const response = await apiClient.post<Blob>(
		`/api/swilib/diff/result`,
		{ left, right, target, platform, answers },
		{ responseType: 'blob' }
	);
	return response.data;
}

export async function downloadSwilibAs(target: string, format: string, code?: string) {
	const formatToName: Record<string, string> = {
		vkp: `swilib_${target}.vkp`,
		blib: `swilib_${target}.blib`,
		symbols: `symbols-${target}.txt`,
		idc: `symbols-${target}.idc`,
	};
	const name = formatToName[format] ?? `swilib_${target}.${format}`;
	const response = code ?
		await apiClient.post<Blob>(`/api/swilib/download/${target}/${name}`, { code }, { responseType: 'blob' }) :
		await apiClient.get<Blob>(`/api/swilib/download/${target}/${name}`, { responseType: 'blob' });
	return {
		name,
		blob: response.data,
	};
}

export async function getAvailableCpuSymbolsFiles(): Promise<CpuSymbolsFile[]> {
	const response = await apiClient.get<CpuSymbolsFile[]>(`/api/disassembler/cpu-symbols`);
	return response.data;
}

export function getPatternsCoverage(patterns: Record<string, string>, coverage: Record<string, number>) {
	const patternsCoverage: Record<string, number> = {};
	for (const platform of SWILIB_PLATFORMS) {
		const platformCoverage = coverage[platform] ?? 0;
		patternsCoverage[platform] = getCoverageValue(platformCoverage, platform in patterns);
	}
	return patternsCoverage;
}

export function getCoverageValue(platformCoverage: number, isExist: boolean) {
	if (platformCoverage < 0 || platformCoverage > 100) {
		return platformCoverage;
	} else {
		return isExist ? 100 : 0;
	}
}
