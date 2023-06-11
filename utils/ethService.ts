import { ethers } from "ethers";

const PROVIDER = new ethers.InfuraProvider("mainnet", process.env.INFURA_KEY);
const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ENS_REGISTRY_ABI = [
  "function owner(bytes32 node) external view returns (address)",
];

export async function checkEnsAvailability(
  ensName: string
): Promise<{ available: boolean; message: string }> {
  const ensRegistry = new ethers.Contract(
    ENS_REGISTRY_ADDRESS,
    ENS_REGISTRY_ABI,
    PROVIDER
  );

  const namehash = ethers.namehash(ensName + ".eth");
  const owner = await ensRegistry.owner(namehash);

  if (
    owner === "0x0000000000000000000000000000000000000000" &&
    ensName.length > 2
  ) {
    return { available: true, message: "ENS name is available!" };
  } else {
    return { available: false, message: "ENS name is not available." };
  }
}
