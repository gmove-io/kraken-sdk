import { Dep, Member, Threshold } from "./multisig-types";

export type ProposalArgs = {
    key: string;
    description?: string;
    executionTime?: number;
    expirationEpoch?: number;
}

export type ConfigNameArgs = {
    name: string;
}

export type ConfigRulesArgs = {
    members?: Member[];
    thresholds?: { global: number, roles: Threshold[] };
}

export type ConfigDepsArgs = {
    deps: Dep[];
}

export type MintArgs = {
    coinType: string;
    amount: number;
}

export type BurnArgs = {
    coinType: string;
    coinId: string;
    amount: number;
}

export type UpdateArgs = {
    coinType: string;
    name: string | null;
    symbol: string | null;
    description: string | null;
    icon: string | null;
}

export type TakeArgs = {
    name: string;
    nftIds: string[];
    recipient: string;
}