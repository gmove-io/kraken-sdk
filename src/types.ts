export type Multisig = {
    name: string,
    threshold: number,
    members: Account[],
    proposals: Proposal[],
}

export type Proposal = {
    id: string,
    key: string,
    description: string,
    executionTime: number,
    expirationEpoch: number,
    approved: string[],
    action: any,
}

export type Account = {
    owner: string,
    id: string,
	username: string,
	profilePicture: string,
    multisigs: string[],
};

export type Kiosk = {
    cap: string,
    kiosk: string,
    profits: number,
    itemCount: number,
}

export type TransferPolicy = {
    id: string,
    hasFloorPrice: boolean,
    hasRoyalty: boolean,
    isLocked: boolean,
}

export type Config = {
    name?: string,
    threshold?: number,
    toAdd?: string[],
    toRemove?: string[],
}

