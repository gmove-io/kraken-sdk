import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { TransactionBlock, TransactionResult } from "@mysten/sui.js/transactions";
import { KioskClient, Network } from "@mysten/kiosk";
import { defaultMoveCoder } from "@typemove/sui";
import { account as moveAccount, multisig as moveMultisig } from "../test/types/kraken.js";
import { kiosk } from "../test/types/0x2.js";
import { CLOCK, FRAMEWORK } from "./types/constants.js";
import { Kiosk, Proposal, TransferPolicy } from "./types/types.js";
import { Account } from "./lib/account.js";
import { Multisig } from "./lib/multisig.js";
import { proposeModify, executeModify } from "./lib/proposals.js";

export class KrakenClient {
	/**
	 * @description SDK to interact with Kraken package.
	 * @param client connection to fullnode
	 */

	public client: SuiClient;
	public account?: Account;
	public multisig?: Multisig;

	private constructor(
		private network: "mainnet" | "testnet" | "devnet" | "localnet" | string,
		private packageId: string,
		private userAddr: string,
	) {
		const url = (network == "mainnet" || network == "testnet" || network == "devnet" || network == "localnet") ? getFullnodeUrl(network) : network;
		this.client = new SuiClient({ url });
	}
	
	static async init(
        network: "mainnet" | "testnet" | "devnet" | "localnet" | string,
        packageId: string, 
        userAddr: string, 
		multisigId?: string,
    ): Promise<KrakenClient> {
		const kraken = new KrakenClient(network, packageId, userAddr);
		const account = await Account.init(network, packageId, userAddr);
		const multisig = await Multisig.init(network, packageId, userAddr, multisigId);
		kraken.account = account;
		kraken.multisig = multisig;
		return kraken;
	}

	// members and weights are optional, if none are provided then only the creator is added with weight 1
	createMultisig(
		tx: TransactionBlock, 
		name: string, 
		threshold?: number, // if none then 1, minimum members.length + 1
		members?: string[], // creator must be added with his weight
		weights?: number[], // weight for each member
	): TransactionResult {
		if (!this.account?.id) {
			throw new Error("User doesn't have an Account or its ID is not set.");
		}
		if (!this.multisig) {
			throw new Error("Multisig not initialized.");
		}
		
		const [multisig] = this.multisig?.newMultisig(tx, this.account.id, name);
		
		let toRemove: string[] = [];
		if (members || weights) {
			if (members?.length !== weights?.length) {
				throw new Error("Members and weights must have the same length.");
			}
			// if we add members (including creator) we must remove it first
			toRemove = [this.userAddr];
		};
		// update multisig parameters if any of them are provided
		if (threshold || members) {
			proposeModify(tx, multisig, this.packageId, "init_members", 0, 0, "", threshold, toRemove, members, weights, name);
			this.approveAndMaybeExecute(tx, multisig, "init_members", executeModify, multisig, this.packageId);
		}
		// creator register the multisig in his account
		this.account.joinMultisig(tx, this.account.id, multisig);
		// send invites to added members
		members?.forEach(member => { if (member !== this.userAddr) this.account?.sendInvite(tx, this.multisig?.id!, member) });
		// share the multisig
		return this.multisig?.shareMultisig(tx, multisig);
	}

	// approve then execute the proposal and execute the action passed if userWeight + multisigWeight >= threshold
	approveAndMaybeExecute(
		tx: TransactionBlock, 
		multisig: string | TransactionResult,
		key: string, 
		executeFn: (tx: TransactionBlock, executable: TransactionResult, ...args: any[]) => TransactionResult, 
		...args: any[]
	): TransactionResult {
		this.multisig?.approveProposal(tx, key, multisig);
		if (this.isExecutableAfterApproval(key, this.multisig?.members?.find(m => m.owner == this.userAddr)?.weight!)) {
			const executable = this.multisig?.executeProposal(tx, key, multisig);
			return executeFn(tx, executable, ...args);
		}
	}

	// multisigData must be up to date before calling this function
	// returns if proposal reaches threshold after approval with weight
	isExecutableAfterApproval(key: string, weight: number): boolean {
		const proposal = this.multisig?.proposals?.find(p => p.key == key);
		return (proposal?.approval_weight! + weight >= this.multisig?.threshold!);
	}

	// ===== PROPOSALS =====


	// === Kiosk ===

	// initKioskClient(): KioskClient {
	// 	let network: Network;
	// 	if (this.network == "mainnet") {
	// 		network = Network.MAINNET;
	// 	} else if (this.network == "testnet") {
	// 		network = Network.TESTNET;
	// 	} else {
	// 		network = Network.CUSTOM;
	// 	}

	// 	return new KioskClient({
	// 		client: this.client,
	// 		network,
	// 	});
	// }

	// async getKiosks(): Promise<Kiosk[]> {
	// 	const kioskClient = this.initKioskClient();
	// 	const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({address: this.multisigId});
		
	// 	let kiosks: Kiosk[] = [];

	// 	for (let i = 0; i < kioskOwnerCaps.length; i += 25) {
	// 		const ids = kioskOwnerCaps.map(cap => cap.kioskId).slice(i, i + 25);
	// 		const kioskObjects = await this.client.multiGetObjects({
	// 			ids,
	// 			options: { showContent: true }
	// 		});
			
	// 		kiosks = kiosks.concat(await Promise.all(kioskObjects.map(async (obj: any, index) => {
	// 			const kioskDecoded = await defaultMoveCoder().decodedType(obj.data?.content, kiosk.Kiosk.type());
	// 			return {
	// 				cap: kioskOwnerCaps[i + index].objectId,
	// 				kiosk: kioskOwnerCaps[i + index].kioskId,
	// 				profits: kioskDecoded!.profits,
	// 				itemCount: kioskDecoded!.item_count,
	// 			}
	// 		})));
	// 	}

	// 	return kiosks;
	// }
	
	// async getPolicy(nftType: string): Promise<TransferPolicy> {
	// 	const kioskClient = this.initKioskClient();
	// 	const policies = await kioskClient.getTransferPolicies({type: nftType});

	// 	return {
	// 		id: policies[0].id,
	// 		hasFloorPrice: policies[0].rules.find(rule => rule.includes("floor_price_rule")) ? true : false,
	// 		hasRoyalty: policies[0].rules.find(rule => rule.includes("royalty_rule")) ? true : false,
	// 		isLocked: policies[0].rules.find(rule => rule.includes("kiosk_lock_rule")) ? true : false,
	// 	};
	// }

	// // return the Kiosk (must be shared)
	// createKiosk(tx: TransactionBlock): TransactionResult {
	// 	return tx.moveCall({
	// 		target: `${this.packageId}::kiosk::new`,
	// 		arguments: [tx.object(this.multisigId)],
	// 	});
	// }	

	// // 1. create a Kiosk if the Multisig doesn't have one OR
	// // 1(bis) get the Kiosk if it already exists
	// // 2. get the TransferPolicy for the type
	// // 3. transferFrom for each nft of this type
	// // 4. repeat for each type
	// // (5. share the Kiosk if it has been created in this PTB)
	// // not a proposal
	// transferFrom(
	// 	tx: TransactionBlock, 
	// 	policy: TransferPolicy,
	// 	multisigKiosk: string,
	// 	multisigCap: string,
	// 	senderKiosk: string,
	// 	senderCap: string,
	// 	nftId: string,
	// 	nftType: string,
	// ): TransactionResult {
	// 	const [request] = tx.moveCall({
	// 		target: `${this.packageId}::kiosk::transfer_from`,
	// 		arguments: [
	// 			tx.object(this.multisigId), 
	// 			tx.object(multisigKiosk),
	// 			tx.object(multisigCap),
	// 			tx.object(senderKiosk),
	// 			tx.object(senderCap),
	// 			tx.pure(nftId),
	// 		],
	// 		typeArguments: [nftType]
	// 	});
	// 	// fill the request
	// 	const tpId = this.resolveRules(tx, policy, multisigKiosk, request, nftType);
	// 	// destroy the request
	// 	tx.moveCall({
	// 		target: `${FRAMEWORK}::transfer_policy::confirm_request`,
	// 		arguments: [
	// 			tx.object(tpId), 
	// 			request, 
	// 		],
	// 	});
	// }

	// proposeTransferTo(
	// 	tx: TransactionBlock,
	// 	key: string,
	// 	executionTime: number,
	// 	expirationEpoch: number,
	// 	description: string,
	// 	capId: string,
	// 	nfts: string,
	// 	recipient: string,
	// ) {
	// 	tx.moveCall({
	// 		target: `${this.packageId}::kiosk::propose_transfer_to`,
	// 		arguments: [
	// 			tx.object(this.multisigId), 
	// 			tx.pure(key), 
	// 			tx.pure(executionTime),
	// 			tx.pure(expirationEpoch),
	// 			tx.pure(description),
	// 			tx.pure(capId),
	// 			tx.pure(nfts),
	// 			tx.pure(recipient),
	// 		],
	// 	});
	// 	this.approveProposal(tx, key);
	// }

	// async executeTransferTo(tx: TransactionBlock, key: string, capId: string) {
	// 	const ids = this.multisigData?.proposals.filter(p => p.key == key).map(p => p.action.fields.nfts);
	// 	if (!ids) throw new Error("Proposal is not valid");
	// 	const nfts = await this.client.multiGetObjects({
	// 		ids,
	// 		options: { showContent: true }
	// 	});
	// 	// TODO: get their type
	// 	const [action] = this.executeProposal(tx, key);
	// 	const [cap] = tx.moveCall({
	// 		target: `${this.packageId}::kiosk::borrow_cap_transfer`,
	// 		arguments: [action, tx.object(this.multisigId), tx.object(capId)],
	// 	});
	// 	// TODO: complete the function
	// }

	// private resolveRules(
	// 	tx: TransactionBlock, 
	// 	policy: TransferPolicy,
	// 	kiosk: string, 
	// 	transferRequest: any, 
	// 	nftType: string
	// ) {
	// 	if (policy.hasFloorPrice) {
	// 		tx.moveCall({
	// 			target: `${this.packageId}::floor_price_rule::prove`,
	// 			typeArguments: [nftType],
	// 			arguments: [tx.object(policy.id), transferRequest],
	// 		});
	// 	}
	// 	if (policy.hasRoyalty) {
	// 		const fee = tx.splitCoins(tx.gas, [0]);
	// 		tx.moveCall({
	// 			target: `${this.packageId}::royalty_rule::pay`,
	// 			typeArguments: [nftType],
	// 			arguments: [tx.object(policy.id), transferRequest, fee],
	// 		});
	// 	} 
	// 	if (policy.isLocked) {
	// 		tx.moveCall({
	// 			target: `${this.packageId}::kiosk_lock_rule::prove`,
	// 			typeArguments: [nftType],
	// 			arguments: [transferRequest, tx.object(kiosk)],
	// 		});
	// 	}
	// }
}

