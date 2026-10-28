#!/usr/bin/env node
// Squeekchain Pulse — read live Sepolia state of the Squeekchain economy.
// Usage: node scripts/pulse.mjs [--json]

const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
import { pathToFileURL } from 'node:url';

const ADDR = {
  token: '0x5501e1fa81be1c3f49225fa7668da0245d07db60',
  core: '0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44',
  mining: '0xcd46990f8349057335289ef282c276204b6cdc62',
  staking: '0x4b67b739dfd832f4eac67a7aa3bc244fb74cea4f',
};

const SEL = {
  totalSupply: '0x18160ddd',
  cap: '0x355274ea',
  totalMinted: '0xa2309ff8',
  totalBurned: '0xd89135cd',
  paused: '0x5c975abb',
  mining: '0x662fac39',
};

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

const call = (to, data) => rpc('eth_call', [{ to, data }, 'latest']);
const big = (hex) => BigInt(hex);
const fmt = (v, d = 18) => (Number(v) / 10 ** d).toLocaleString('en-US', { maximumFractionDigits: 4 });
const addrOf = (word) => '0x' + word.slice(-40);

export async function snapshot() {
  const [block, gasPrice, supply, cap, minted, burned, paused, miningAddr] = await Promise.all([
    rpc('eth_blockNumber', []),
    rpc('eth_gasPrice', []),
    call(ADDR.token, SEL.totalSupply),
    call(ADDR.token, SEL.cap),
    call(ADDR.token, SEL.totalMinted),
    call(ADDR.token, SEL.totalBurned),
    call(ADDR.core, SEL.paused),
    call(ADDR.token, SEL.mining),
  ]);

  const supplyV = big(supply);
  const capV = big(cap);

  return {
    chain: 'sepolia',
    chainId: 11155111,
    block: Number(big(block)),
    gasPriceWei: big(gasPrice).toString(),
    token: {
      address: ADDR.token,
      symbol: 'SQK',
      totalSupply: supplyV.toString(),
      cap: capV.toString(),
      totalMinted: big(minted).toString(),
      totalBurned: big(burned).toString(),
      emittedPct: capV > 0n ? Number((supplyV * 10000n) / capV) / 100 : 0,
      mining: addrOf(miningAddr),
    },
    core: { address: ADDR.core, paused: paused !== '0x' + '0'.repeat(64) },
    addresses: ADDR,
  };
}

function render(s) {
  const lines = [
    'SQUEEKCHAIN PULSE — Sepolia',
    '='.repeat(42),
    `block            ${s.block.toLocaleString()}`,
    `gas price        ${Number(s.gasPriceWei) / 1e9} gwei`,
    '',
    `SQK supply       ${fmt(BigInt(s.token.totalSupply))}`,
    `SQK cap          ${fmt(BigInt(s.token.cap))}`,
    `emitted          ${s.token.emittedPct}% of cap`,
    `total minted     ${fmt(BigInt(s.token.totalMinted))}`,
    `total burned     ${fmt(BigInt(s.token.totalBurned))}`,
    '',
    `core             ${s.core.address}`,
    `core paused      ${s.core.paused ? 'YES' : 'no'}`,
    `mining           ${s.token.mining}`,
  ];
  return lines.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const s = await snapshot();
  if (process.argv.includes('--json')) console.log(JSON.stringify(s, null, 2));
  else console.log(render(s));
}
