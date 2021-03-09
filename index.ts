import {Account, clusterApiUrl, Connection, SystemProgram, Transaction} from "@solana/web3.js";

const a = new Account()

console.log(a.publicKey.toBase58());
console.log(a.secretKey)

const mySecret = require('/Users/daniel/.config/solana/id.json')

const myAccount = new Account(mySecret);

console.log(myAccount.publicKey.toBase58());

(async () => {
  const c = new Connection(
    clusterApiUrl('devnet'),
    'single'
    )

  let balance = await c.getBalance(myAccount.publicKey)

  console.log(balance);
  console.log(balance * 1e-9);

  let txSig = await c.requestAirdrop(myAccount.publicKey, 1e9)

  await c.confirmTransaction(txSig)

  balance = await c.getBalance(myAccount.publicKey)
  console.log(balance * 1e-9);

  const tx = new Transaction().add(SystemProgram.transfer({
    fromPubkey: myAccount.publicKey,
    toPubkey: a.publicKey,
    lamports: 1e9
  }))
  txSig = await c.sendTransaction(tx, [myAccount]);
  await c.confirmTransaction(txSig)

  balance = await c.getBalance(myAccount.publicKey)
  console.log(balance * 1e-9);

  balance = await c.getBalance(a.publicKey)
  console.log(balance * 1e-9);
})().catch(e => console.error(e))
