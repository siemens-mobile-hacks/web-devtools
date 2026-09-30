import { Component } from "solid-js";
import { Badge } from "solid-bootstrap";

interface SwilibStatisticValue {
	bad: number;
	good: number;
	missing: number;
	total: number;
}

interface SwilibStatisticProps {
	statistic: SwilibStatisticValue;
}

export const SwilibStatistic: Component<SwilibStatisticProps> = (props) => {
	const getPercent = (v: number) => (v / props.statistic.total * 100).toFixed(0);
	return (
		<div class="d-flex mb-3 gap-2">
			<Badge
				title="Good functions"
				bg="success"
				class="fs-6"
			>
				OK: {props.statistic.good} | {getPercent(props.statistic.good)}%
			</Badge>
			<Badge
				title="Bad functions"
				bg="danger"
				class="fs-6"
				hidden={props.statistic.bad == 0}
			>
				BAD: {props.statistic.bad} | {getPercent(props.statistic.bad)}%
			</Badge>
			<Badge
				title="Missing functions"
				bg="warning"
				class="fs-6 text-dark"
				hidden={props.statistic.missing == 0}
			>
				MISS: {props.statistic.missing}| {getPercent(props.statistic.missing)}%
			</Badge>
		</div>
	);
};
