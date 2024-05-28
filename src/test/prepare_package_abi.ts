import * as fs from "fs";
import path from 'path';
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui.js/faucet";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { codegen } from '@typemove/sui/codegen';
import { FRAMEWORK, STDLIB } from "../constants.js";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";

// to run on localnet:
// `git clone https://github.com/MystenLabs/sui`  
// `cd sui`
// launch localnet: `RUST_LOG="off,sui_node=info" cargo run --bin sui-test-validator`
// or use https://github.com/ChainMovers/suibase


(async () => {
    
    const keypair = Ed25519Keypair.fromSecretKey(Uint8Array.from(Buffer.from("AM06bExREdFceWiExfSacTJ+64AQtFl7SRkSiTmAqh6F", "base64")).slice(1));

    // === get SUI ===

    console.log("Get some SUI");
    await requestSuiFromFaucetV0({
        host: getFaucetHost("localnet"),
        recipient: keypair.toSuiAddress(),
    });
    const client = new SuiClient({ url: getFullnodeUrl("localnet") });
    const { execSync } = require('child_process');

    // === Publish Kraken Package ===

    const { modules, dependencies } = JSON.parse(execSync(
        `"/home/tmarchal/.cargo/bin/sui" move build --dump-bytecode-as-base64 --path "../kraken/package/"`, 
        { encoding: 'utf-8' }
    ));
    const tx = new TransactionBlock();
    const [upgradeCap] = tx.publish({ modules,dependencies });
    tx.transferObjects([upgradeCap], keypair.getPublicKey().toSuiAddress());
    tx.setGasBudget(1000000000);
    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: { showEffects: true, showObjectChanges: true },
        requestType: "WaitForLocalExecution"
    });

    const packageObj: any = result.objectChanges?.find((obj: any) => obj.type === "published");
    console.log("Package published: ", packageObj.packageId);

    // === Generate ABIs ===

    const abisDir = "./src/test/abis";
    if (fs.existsSync(abisDir)) fs.rmdirSync(abisDir, { recursive: true });
    if (!fs.existsSync(abisDir)) fs.mkdirSync(abisDir, { recursive: true });
    
    const krakenAbi = await client.getNormalizedMoveModulesByPackage({ package: packageObj.packageId })
    fs.writeFileSync(path.join(abisDir, "kraken" + '.json'), JSON.stringify(krakenAbi, null, 2))
    const typesDir = "./src/test/types";
    if (fs.existsSync(typesDir)) fs.rmdirSync(typesDir, { recursive: true });
    await codegen(abisDir, typesDir, getFullnodeUrl("localnet"));

    const stdlibAbi = await client.getNormalizedMoveModulesByPackage({ package: STDLIB })
    fs.writeFileSync(path.join(abisDir, "0x1" + '.json'), JSON.stringify(stdlibAbi, null, 2))    
    await codegen(abisDir, typesDir, getFullnodeUrl("localnet"));

    const frameworkAbi = await client.getNormalizedMoveModulesByPackage({ package: FRAMEWORK })
    fs.writeFileSync(path.join(abisDir, "0x2" + '.json'), JSON.stringify(frameworkAbi, null, 2))    
    await codegen(abisDir, typesDir, getFullnodeUrl("localnet"));
})();