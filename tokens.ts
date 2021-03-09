import nacl from "tweetnacl";
import {Account, clusterApiUrl, Connection, PublicKey, SystemProgram, Transaction} from "@solana/web3.js";
import {AccountLayout, MintLayout, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";

const mySecret = require('/Users/daniel/.config/solana/id.json')
const myAccount = new Account(mySecret);

(async () => {
  const c = new Connection(
    clusterApiUrl('devnet'),
    'single'
  )
  let txSig = await c.requestAirdrop(myAccount.publicKey, 1e9)
  await c.confirmTransaction(txSig)


  // tokens - version 1
  // const mint = await Token.createMint(c, myAccount, myAccount.publicKey, null, 2, TOKEN_PROGRAM_ID);
  // const tokenAccount = await mint.createAccount(myAccount.publicKey);
  // await mint.mintTo(tokenAccount, myAccount, [], 1000)
  //
  // const accountInfo = await mint.getAccountInfo(tokenAccount)
  // console.log(accountInfo);
  // console.log(accountInfo.amount.toString());

  // version 2

  console.log("About to start signing")
  const mintAccount = new Account();
  const mintBalanceNeeded = await Token.getMinBalanceRentForExemptMint(c)
  const createMintAccount = SystemProgram.createAccount({
    programId: TOKEN_PROGRAM_ID,
    fromPubkey: myAccount.publicKey,
    lamports: mintBalanceNeeded,
    newAccountPubkey: mintAccount.publicKey,
    space: MintLayout.span
  })


  const tokenAccount = new Account();
  const tokenAccountBalanceNeeded = await Token.getMinBalanceRentForExemptAccount(c)
  const createTokenAccount = SystemProgram.createAccount({
    programId: TOKEN_PROGRAM_ID,
    fromPubkey: myAccount.publicKey,
    lamports: tokenAccountBalanceNeeded,
    newAccountPubkey: tokenAccount.publicKey,
    space: AccountLayout.span
  })

  const initMint = Token.createInitMintInstruction(
    TOKEN_PROGRAM_ID, mintAccount.publicKey, 2, myAccount.publicKey, null)

  const initAccount = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID, mintAccount.publicKey, tokenAccount.publicKey, myAccount.publicKey)

  const mintTo = Token.createMintToInstruction(
    TOKEN_PROGRAM_ID, mintAccount.publicKey, tokenAccount.publicKey, myAccount.publicKey, [], 1000)

  const { blockhash: recentBlockhash } = await c.getRecentBlockhash();
  const signatures = [ { publicKey: myAccount.publicKey }, mintAccount, tokenAccount ]
  const transaction = new Transaction({
    recentBlockhash,
    signatures
  }).add(
    createMintAccount,
    initMint,
    createTokenAccount,
    initAccount,
    mintTo
  )

  transaction.partialSign(mintAccount, tokenAccount)
  const message = transaction.serializeMessage();

  // done on the device
  // send the message to the device to sign
  const signature = nacl.sign.detached(message, myAccount.secretKey)
  // device returns signature
  transaction.addSignature(myAccount.publicKey, Buffer.from(signature))

  console.log("About to send tx")

  const serialisedTransaction = transaction.serialize();
  txSig = await c.sendRawTransaction(serialisedTransaction)

  console.log("Sent");
  await c.confirmTransaction(txSig);

  console.log("Confirmed");

  const mint = new Token(c, mintAccount.publicKey, TOKEN_PROGRAM_ID, new Account())
  const accountInfo = await mint.getAccountInfo(tokenAccount.publicKey)
  console.log(accountInfo.amount.toString());

})().catch(e => console.error(e))
