export const TINYQUEST_CONTRACT_ADDRESS =
  "0x6F7967C55A21b6cCCcEc3dd976Ac36068462C094" as const;

export const TINYQUEST_ABI = [
  {
    type: "function",
    name: "questCount",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "interactionCount",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getQuest",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "questId", type: "uint256" },
    ],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "title", type: "string" },
      { name: "story", type: "string" },
      { name: "world", type: "string" },
      { name: "chapterCount", type: "uint256" },
      { name: "createdAt", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "createQuest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "openingStory", type: "string" },
      { name: "world", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "expandStory",
    stateMutability: "nonpayable",
    inputs: [
      { name: "questId", type: "uint256" },
      { name: "nextSentence", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "mergeQuests",
    stateMutability: "nonpayable",
    inputs: [
      { name: "questA", type: "uint256" },
      { name: "questB", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "deleteQuest",
    stateMutability: "nonpayable",
    inputs: [{ name: "questId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "resetWorld",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;
