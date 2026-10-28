# Squeekchain Pulse

A zero-dependency dashboard and CLI for reading the live state of the
**Squeekchain** economy on Sepolia.

Squeekchain runs a stream-game economy where a `SqueekCore` contract tracks
cumulative work, a `SqueekToken` (SQK) mints against that work, and `Mining` /
`Staking` contracts route the issuance. Those values are public on-chain but
scattered across several `eth_call` requests. Squeekchain Pulse collapses them
into one snapshot you can read at a glance.

## What it reads

| Contract | Address | Values |
| --- | --- | --- |
| SqueekToken (SQK) | `0x5501e1fa81be1c3f49225fa7668da0245d07db60` | supply, cap, minted, burned |
| SqueekCore | `0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44` | pause state |
| SqueekMining | `0xcd46990f8349057335289ef282c276204b6cdc62` | bound via `SqueekToken.mining()` |
| SqueekStaking | `0x4b67b739dfd832f4eac67a7aa3bc244fb74cea4f` | staking surface |

## CLI

Requires Node 18+ (uses the built-in `fetch`). No install step.

```bash
node scripts/pulse.mjs          # human-readable snapshot
node scripts/pulse.mjs --json   # machine-readable
```

Example:

```
SQUEEKCHAIN PULSE — Sepolia
==========================================
block            12,014,546
gas price        0.000000018 gwei

SQK supply       8,066,546.7931
SQK cap          2,100,000,000
emitted          0.38% of cap
```

## Web page

`index.html` is a single static file with no build step. Open it directly, or
serve it:

```bash
npx serve .
```

It refreshes every 15 seconds and shows the same numbers as the CLI.

## Why it exists

Squeekchain's Genesis campaign tracks builders in the **CODE** lane. This
project is a small, real tool for that economy: it calls the deployed
Squeekchain contracts directly and turns their raw return values into
something a human can read.
