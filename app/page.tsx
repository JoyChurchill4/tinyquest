"use client";

import Image from "next/image";
import {
  Compass,
  Loader2,
  LogOut,
  Plus,
  RotateCcw,
  Sparkles,
  Sword,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Connector,
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  TINYQUEST_ABI,
  TINYQUEST_CONTRACT_ADDRESS,
} from "@/lib/contract";
import { dataSuffixWriteOptions } from "@/lib/wagmi";

const OPENINGS = [
  "A brass door hums as your first footstep wakes the ruin.",
  "A tiny lantern draws a map on the wall in molten gold.",
  "The forgotten archive whispers your name from below the stairs.",
  "A pocket compass points toward a room that was not there before.",
];

const WORLDS = ["Sunken Library", "Clockwork Vault", "Moss Temple", "Sky Cellar"];

type Quest = {
  id: bigint;
  title: string;
  story: string;
  world: string;
  chapterCount: bigint;
  createdAt: bigint;
  exists: boolean;
};

function shortAddress(address?: `0x${string}`) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
}

function connectorLabel(connector: Connector) {
  const name = connector.name.toLowerCase();
  if (name.includes("coinbase")) return "Coinbase Wallet";
  if (name.includes("injected")) return "Browser Wallet";
  if (name.includes("metamask")) return "MetaMask";
  return connector.name;
}

function buildSentence(world: string, count: number) {
  const beats = [
    `A hidden switch in the ${world} opens a safer path.`,
    `You trade a spark of courage for a glowing relic.`,
    `A quiet echo becomes a clue only you can read.`,
    `The next chamber rewards patience with a silver rune.`,
  ];
  return beats[count % beats.length];
}

export default function Home() {
  const [walletOpen, setWalletOpen] = useState(false);
  const [activeQuestId, setActiveQuestId] = useState(0n);
  const [lastReward, setLastReward] = useState("Ready to earn your first chapter.");
  const [manualDisconnect, setManualDisconnect] = useState(false);

  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: questCountData, refetch: refetchQuestCount } = useReadContract({
    address: TINYQUEST_CONTRACT_ADDRESS,
    abi: TINYQUEST_ABI,
    functionName: "questCount",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: interactionCountData, refetch: refetchInteractions } =
    useReadContract({
      address: TINYQUEST_CONTRACT_ADDRESS,
      abi: TINYQUEST_ABI,
      functionName: "interactionCount",
      args: address ? [address] : undefined,
      query: { enabled: Boolean(address) },
    });

  const questCount = questCountData ?? 0n;
  const interactionCount = interactionCountData ?? 0n;
  const hasQuest = questCount > 0n;
  const safeQuestId = hasQuest
    ? activeQuestId >= questCount
      ? questCount - 1n
      : activeQuestId
    : 0n;

  const { data: questData, refetch: refetchQuest } = useReadContract({
    address: TINYQUEST_CONTRACT_ADDRESS,
    abi: TINYQUEST_ABI,
    functionName: "getQuest",
    args: address && hasQuest ? [address, safeQuestId] : undefined,
    query: { enabled: Boolean(address && hasQuest) },
  });

  const quest = useMemo<Quest | null>(() => {
    if (!questData) return null;
    const [id, title, story, world, chapterCount, createdAt, exists] = questData;
    return { id, title, story, world, chapterCount, createdAt, exists };
  }, [questData]);

  useEffect(() => {
    const disconnected = localStorage.getItem("tinyquest:disconnect") === "1";
    setManualDisconnect(disconnected);
    const isBaseApp =
      /base/i.test(navigator.userAgent) ||
      Boolean(window.ethereum && "isCoinbaseWallet" in window.ethereum);

    if (!isConnected && isBaseApp && !disconnected) {
      const injectedConnector = connectors.find((item) =>
        item.name.toLowerCase().includes("injected"),
      );
      if (injectedConnector) {
        connect({ connector: injectedConnector, chainId: base.id });
      }
    }
  }, [connect, connectors, isConnected]);

  useEffect(() => {
    if (isSuccess) {
      refetchQuestCount();
      refetchInteractions();
      refetchQuest();
      setLastReward("+10 XP earned. Your onchain story advanced.");
    }
  }, [isSuccess, refetchInteractions, refetchQuest, refetchQuestCount]);

  async function ensureBase() {
    if (chainId !== base.id) {
      await switchChainAsync({ chainId: base.id });
    }
  }

  async function handlePrimaryAction() {
    if (!address) {
      setWalletOpen(true);
      return;
    }

    await ensureBase();

    if (!hasQuest) {
      const openingIndex = Number(interactionCount % BigInt(OPENINGS.length));
      const world = WORLDS[openingIndex % WORLDS.length];
      writeContract({
        address: TINYQUEST_CONTRACT_ADDRESS,
        abi: TINYQUEST_ABI,
        functionName: "createQuest",
        args: [`Tiny Quest #${questCount + 1n}`, OPENINGS[openingIndex], world],
        ...dataSuffixWriteOptions,
      });
      setLastReward("First chapter submitted. Confirm it to unlock +10 XP.");
      return;
    }

    const world = quest?.world || WORLDS[0];
    const nextSentence = buildSentence(world, Number(interactionCount));
    writeContract({
      address: TINYQUEST_CONTRACT_ADDRESS,
      abi: TINYQUEST_ABI,
      functionName: "expandStory",
      args: [safeQuestId, nextSentence],
      ...dataSuffixWriteOptions,
    });
    setLastReward("New sentence submitted. Confirm it to bank +10 XP.");
  }

  async function handleReset() {
    if (!address) return;
    await ensureBase();
    writeContract({
      address: TINYQUEST_CONTRACT_ADDRESS,
      abi: TINYQUEST_ABI,
      functionName: "resetWorld",
      args: [],
      ...dataSuffixWriteOptions,
    });
    setLastReward("World reset submitted. A fresh route is waiting.");
  }

  function handleDisconnect() {
    localStorage.setItem("tinyquest:disconnect", "1");
    setManualDisconnect(true);
    disconnect();
  }

  function handleConnect(connector: Connector) {
    localStorage.removeItem("tinyquest:disconnect");
    setManualDisconnect(false);
    connect({ connector, chainId: base.id });
    setWalletOpen(false);
  }

  const busy = isWriting || isConfirming || isConnectPending;
  const storyLines = quest?.story.split(" | ").filter(Boolean) ?? [];

  return (
    <main className="shell">
      <section className="hero">
        <Image
          src="/tinyquest-hero.png"
          alt="TinyQuest fantasy dungeon"
          fill
          priority
          sizes="100vw"
          className="heroImage"
        />
        <div className="heroShade" />

        <nav className="topBar" aria-label="Wallet">
          <div className="brand">
            <span className="brandMark">
              <Compass size={18} />
            </span>
            <span>TinyQuest</span>
          </div>
          {isConnected ? (
            <button className="iconButton" onClick={handleDisconnect} title="Disconnect">
              <LogOut size={18} />
            </button>
          ) : (
            <button className="walletButton" onClick={() => setWalletOpen(true)}>
              <Wallet size={18} />
              Connect
            </button>
          )}
        </nav>

        <div className="heroContent">
          <p className="eyebrow">One-sentence onchain RPG</p>
          <h1>TinyQuest</h1>
          <p className="intro">
            Create an endless micro adventure on Base. Every action writes one
            sentence, grows your route, and shows instant progress.
          </p>
        </div>
      </section>

      <section className="questPanel" aria-label="Quest console">
        <div className="rewardStrip">
          <div>
            <span className="label">Instant reward</span>
            <strong>{lastReward}</strong>
          </div>
          <div className="xpBadge">
            <Sparkles size={16} />
            {Number(interactionCount) * 10} XP
          </div>
        </div>

        <button className="primaryAction" onClick={handlePrimaryAction} disabled={busy}>
          {busy ? <Loader2 className="spin" size={20} /> : <Sword size={20} />}
          {isConnected ? (hasQuest ? "Write Next Chapter" : "Start Quest") : "Connect Wallet"}
        </button>

        <div className="statsGrid">
          <div>
            <span className="label">Wallet</span>
            <strong>{isConnected ? shortAddress(address) : "Not connected"}</strong>
          </div>
          <div>
            <span className="label">Quest count</span>
            <strong>{Number(questCount)}</strong>
          </div>
          <div>
            <span className="label">Chapters</span>
            <strong>{quest ? Number(quest.chapterCount) : 0}</strong>
          </div>
        </div>

        <article className="storyCard">
          <div className="storyHeader">
            <div>
              <span className="label">Current world</span>
              <h2>{quest?.exists ? quest.world : "Uncharted Vault"}</h2>
            </div>
            {hasQuest && (
              <select
                aria-label="Quest route"
                value={safeQuestId.toString()}
                onChange={(event) => setActiveQuestId(BigInt(event.target.value))}
              >
                {Array.from({ length: Number(questCount) }, (_, index) => (
                  <option key={index} value={index}>
                    Route {index + 1}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="storyLog">
            {storyLines.length ? (
              storyLines.map((line, index) => (
                <p key={`${line}-${index}`}>
                  <span>{index + 1}</span>
                  {line}
                </p>
              ))
            ) : (
              <p>
                <span>0</span>
                Your first sentence will appear here after one Base transaction.
              </p>
            )}
          </div>
        </article>

        <div className="secondaryActions">
          <button onClick={handleReset} disabled={!isConnected || busy}>
            <RotateCcw size={16} />
            Reset World
          </button>
          <a href="https://base.org" target="_blank" rel="noreferrer">
            Base Mainnet
          </a>
        </div>

        {manualDisconnect && !isConnected && (
          <p className="hint">Auto-connect is paused until you connect again.</p>
        )}
      </section>

      {walletOpen && (
        <div className="modalBackdrop" onClick={() => setWalletOpen(false)}>
          <div className="walletModal" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <h2>Choose wallet</h2>
              <button onClick={() => setWalletOpen(false)} aria-label="Close">
                x
              </button>
            </div>
            <div className="walletList">
              {connectors.map((connector) => (
                <button key={connector.uid} onClick={() => handleConnect(connector)}>
                  <Wallet size={18} />
                  {connectorLabel(connector)}
                </button>
              ))}
            </div>
            <p>
              Base App uses the injected wallet. Coinbase Wallet, MetaMask, OKX,
              and other browser wallets can be selected here.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
