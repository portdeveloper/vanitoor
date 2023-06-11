type WorkerMessage = (event: MessageEvent) => void;

export const initWorkers = (onMessage: WorkerMessage): Worker[] => {
  const numWorkers = 8;
  const workers = Array.from({ length: numWorkers }, () => {
    const worker = new Worker(
      new URL("../utils/addressGenerator.worker.js", import.meta.url)
    );
    worker.onmessage = onMessage;
    return worker;
  });
  return workers;
};

export const terminateWorkers = (workers: Worker[]): void => {
  workers.forEach((worker) => worker.terminate());
};
