import { type Component, ErrorBoundary, lazy } from "solid-js";
import { App } from "@/components/Layout/App/App";
import { Navigate, Route, Router } from "@solidjs/router";

const SwilibSummaryAnalysisPage = lazy(() => import("@/pages/SwilibSummaryAnalysis/SwilibSummaryAnalysisPage"));
const SwilibTargetAnalysisPage = lazy(() => import("@/pages/SwilibTargetAnalysis/SwilibTargetAnalysisPage"));
const SwilibCheckPage = lazy(() => import("@/pages/SwilibCheck/SwilibCheckPage"));
const SwilibMergePage = lazy(() => import("@/pages/SwilibMerge/SwilibMergePage"));
const SwilibMergeEditorPage = lazy(() => import("@/pages/SwilibMerge/SwilibMergeEditorPage"));
const ReFilesPage = lazy(() => import("@/pages/ReFiles/ReFilesPage"));
const Ptr89Page = lazy(() => import("@/pages/Ptr89/Ptr89Page"));

export const Root: Component = () => {
	const showAppError = (err: any) => {
		console.log(err);
		return <div>FATAL ERROR: {err.toString()}</div>;
	};

	return (
		<ErrorBoundary fallback={showAppError}>
			<Router root={App} base={import.meta.env.BASE_URL}>
				<Route path="/" component={() => <Navigate href={() => "/swilib/analysis/summary"} />} />
				<Route path="/swilib/analysis/summary" component={SwilibSummaryAnalysisPage} />
				<Route path="/swilib/analysis/target" component={SwilibTargetAnalysisPage} />
				<Route path="/swilib/check" component={SwilibCheckPage} />
				<Route path="/swilib/merge" component={SwilibMergePage} />
				<Route path="/swilib/merge/editor" component={SwilibMergeEditorPage} />
				<Route path="/re/ptr89" component={Ptr89Page} />
				<Route path="/re/symbols" component={ReFilesPage} />

				{/* Legacy routes */}
				<Route path="/swilib" component={() => <Navigate href={() => "/swilib/analysis/summary"} />} />
				<Route path="/swilib/analysis" component={() => <Navigate href={() => "/swilib/analysis/summary"} />} />
				<Route path="/swilib/phone" component={() => <Navigate href={() => "/swilib/analysis/target"} />} />
				<Route path="/re" component={() => <Navigate href={() => "/re/symbols"} />} />
			</Router>
		</ErrorBoundary>
	);
};
