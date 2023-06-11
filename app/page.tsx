"use client";
import { useState, useEffect, useRef } from "react";
import { checkEnsAvailability } from "../utils/ethService";
import { initWorkers, terminateWorkers } from "../utils/workerService";

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

  const onWorkerMessage = (event: MessageEvent) => {
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

  const handleCheckEnsAvailability = async () => {
    const { available, message } = await checkEnsAvailability(ensName);
    setIsENSNameAvailable(available);
    setMessage(message);
  };

  useEffect(() => {
    const workers = initWorkers(onWorkerMessage);
    return () => terminateWorkers(workers);
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

  const generateVanityAddress = async () => {
    shouldContinueGenerating.current = true;
    setIsGenerating(true);
    setMessage("");
    setNumGenerated(0);
    generateStartTime.current = Date.now();
    generatorInterval.current = setInterval(() => {
      setTimeTaken(Date.now() - generateStartTime.current);
    }, 1000);

    workerRef.current = initWorkers(onWorkerMessage); // reinitialize the workers

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
    <div className="flex h-screen flex-col bg-gray-100 px-6 py-4 font-serif">
      <div className="mb-8 flex justify-between">
        <h1 className="text-3xl font-bold text-gray-700">
          Vanitoor <small className="text-2xl">(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</small>
        </h1>
        <div className="flex items-center gap-8 text-lg">
          <a
            href="https://github.com/portdeveloper/vanitoor"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Github
          </a>
          <a
            href="https://twitter.com/port_dev"
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </a>
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
            onClick={handleCheckEnsAvailability}
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
            href="https://github.com/portdeveloper"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            port
          </a>
        </p>
      </div>
    </div>
  );
}
