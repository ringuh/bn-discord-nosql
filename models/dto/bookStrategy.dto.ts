import { StrategyDTO } from "./strategy.dto";

export interface BookStrategyDTO {
    strategyId: string;
    strategy: StrategyDTO;
    enabledExternalLink: boolean;
    showText: string;
    externalLink: string;
    updateTime: Date;
    createTime: Date;
    id: string;
}