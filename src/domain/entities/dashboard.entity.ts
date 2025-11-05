import { HistoryItem, RecentItem } from "../common/dashboard.types";

export class Dashboard {
    constructor(
        public commerceId: number,
        public commerceName: string,
        public logoUrl: string,
        public history: HistoryItem[],
        public recentActivity: RecentItem[],
    ) { }

    // Factory method
    static create(props: {
        commerceId: number,
        commerceName: string,
        logoUrl: string,
        history: HistoryItem[],
        recentActivity: RecentItem[],
    }): Dashboard {
        return new Dashboard(
            props.commerceId,
            props.commerceName,
            props.logoUrl,
            props.history,
            props.recentActivity
        );
    }
}