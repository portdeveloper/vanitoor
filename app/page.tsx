"use client";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";

const PROVIDER = new ethers.InfuraProvider("mainnet", process.env.INFURA_KEY);

const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ENS_REGISTRY_ABI = [
  "function owner(bytes32 node) external view returns (address)",
];

export default function Home() {
  const [ensName, setEnsName] = useState("");
  const [vanityAddress, setVanityAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [message, setMessage] = useState("");
  const [isENSNameAvailable, setIsENSNameAvailable] = useState(false);
  const [isHexInput, setIsHexInput] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numGenerated, setNumGenerated] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const shouldContinueGenerating = useRef(true);
  const generateStartTime = useRef(0);
  const generatorInterval = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker[] | null>(null);
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false);

  const initWorkers = () => {
    const numWorkers = 8;
    const workers = Array.from({ length: numWorkers }, () => {
      const worker = new Worker(
        new URL("../utils/addressGenerator.worker.js", import.meta.url)
      );
      worker.onmessage = (event) => {
        const { address, privateKey, count } = event.data;
        if (address && privateKey) {
          setVanityAddress(address);
          setPrivateKey(privateKey);
          setIsGenerating(false);
          if (workerRef.current) {
            workerRef.current.forEach((worker: Worker) => {
              worker.terminate();
            });
            workerRef.current = null;
          }
        }
        if (count) {
          setNumGenerated((prevCount) => prevCount + count);
        }
      };
      return worker;
    });
    workerRef.current = workers;
  };

  useEffect(() => {
    initWorkers();

    return () => {
      if (workerRef.current) {
        workerRef.current.forEach((worker: Worker) => worker.terminate());
      }
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (hexRegex.test(event.target.value) || event.target.value === "") {
      setEnsName(event.target.value);
      setIsHexInput(true);
    } else {
      setIsHexInput(false);
    }
  };

  const checkEnsAvailability = async () => {
    if (!ensName) {
      setMessage("ENS name cannot be empty.");
      return;
    }

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
      setIsENSNameAvailable(true);
      setMessage("ENS name is available!");
    } else {
      setIsENSNameAvailable(false);
      setMessage("ENS name is not available.");
    }
  };

  const generateVanityAddress = async () => {
    shouldContinueGenerating.current = true;
    setIsGenerating(true);
    setMessage("");
    setNumGenerated(0);
    generateStartTime.current = Date.now();
    generatorInterval.current = setInterval(() => {
      setTimeTaken(Date.now() - generateStartTime.current);
    }, 1000);

    initWorkers(); // reinitialize the workers

    workerRef.current?.forEach((worker: Worker) => {
      worker.postMessage(ensName);
    });
  };

  const stopGenerating = () => {
    shouldContinueGenerating.current = false;
    if (generatorInterval.current) {
      clearInterval(generatorInterval.current);
    }
    setTimeTaken(Date.now() - generateStartTime.current);
    setIsGenerating(false);
    if (workerRef.current) {
      workerRef.current.forEach((worker: Worker) => {
        worker.terminate(); // terminate all workers when stop button is pressed
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-100 px-6 py-2 font-serif">
      <div className="mb-8 flex justify-between">
        <h1 className="text-3xl font-bold text-gray-700">
          Vanity-ENS <small className="text-2xl">(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</small>
        </h1>
        <div className="flex items-center gap-8 text-lg">
          <p>Github</p>
          <p>Twitter</p>
        </div>
      </div>
      <div className="flex flex-grow items-center justify-center font-sans">
        <div className="mt-4 w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
          <input
            type="text"
            placeholder="Enter ENS name"
            onChange={handleInputChange}
            className="mb-6 w-full rounded-md border-2 border-gray-300 px-4 py-3 text-2xl"
          />

          {!isHexInput && (
            <p className="mb-4 text-red-500">
              Only hexadecimal characters are allowed.
            </p>
          )}

          <button
            onClick={checkEnsAvailability}
            disabled={!isHexInput || !ensName}
            className="text-md mb-4 w-full rounded-md bg-gray-800 px-4 py-3 text-white disabled:opacity-50"
          >
            Check ENS Availability
          </button>

          <button
            onClick={generateVanityAddress}
            disabled={!isENSNameAvailable || isGenerating}
            className="text-md mb-4 w-full rounded-md bg-gray-800 px-4 py-3 text-white disabled:opacity-50"
          >
            Generate
          </button>

          <button
            onClick={stopGenerating}
            disabled={!isGenerating}
            className="text-md mb-4 w-full rounded-md bg-gray-800 px-4 py-3 text-white disabled:opacity-50"
          >
            Stop Generating
          </button>

          {isGenerating && (
            <div className="mt-4">
              <p>Generated addresses: {numGenerated}</p>
              <p>Time taken: {timeTaken / 1000} seconds</p>
            </div>
          )}

          {message && <p className="mt-4">{message}</p>}

          {vanityAddress && (
            <div className="mt-4">
              <p>Vanity Address: {vanityAddress}</p>
              <p>
                This is your private key, do not share it with anyone:{" "}
                {isPrivateKeyVisible ? (
                  <strong>{privateKey}</strong>
                ) : (
                  <strong>******</strong>
                )}
                <button
                  onClick={() => setIsPrivateKeyVisible(!isPrivateKeyVisible)}
                  className="ml-2 rounded-md bg-gray-800 px-2 py-1 text-white"
                >
                  {isPrivateKeyVisible ? "Hide" : "Show"}
                </button>
              </p>
              <p>
                You can buy the ENS name{" "}
                <a
                  href={`https://app.ens.domains/name/${ensName}.eth`}
                  className="text-blue-600 hover:underline"
                >
                  {ensName}.eth
                </a>{" "}
                on the ENS website.
              </p>
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-center text-sm text-gray-500">
          {" "}
          Made with ❤️ by{" "}
          <a
            href="https://twitter.com/port_dev"
            className="text-blue-600 hover:underline"
          >
            port
          </a>
        </p>
      </div>
    </div>
  );
}
