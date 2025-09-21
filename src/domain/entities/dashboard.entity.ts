import { HistoryItem } from "../common/dashboard.types";

export class Dashboard {
    constructor(
        public commerceId: number,
        public commerceName: string,
        public history: HistoryItem[],
    ) { }

    //TODO aqui mismo se calcularan las metricas luego

    // Factory method
    static create(props: {
        commerceId: number,
        commerceName: string,
        history: HistoryItem[],
    }): Dashboard {
        return new Dashboard(
            props.commerceId,
            props.commerceName,
            props.history,
        );
    }
}