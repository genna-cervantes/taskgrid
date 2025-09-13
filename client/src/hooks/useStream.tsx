import { useState, useRef } from "react";

interface UseStreamOptions extends RequestInit {}

interface UseStreamReturn<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  startStream: () => Promise<void>;
  stopStream: () => void;
  firstResponse: boolean;
  isFinished: boolean;
}

export function useStream<T = any>(
  url: string,
  options: UseStreamOptions = {}
): UseStreamReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [firstResponse, setFirstResponse] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const bufferRef = useRef<string>("");

  const startStream = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setData([]);
    bufferRef.current = "";

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (bufferRef.current.trim()) {
            try {
              const finalData = JSON.parse(bufferRef.current.trim()) as T;
              setData((prev) => [...prev, finalData]);
              setIsFinished(true);
            } catch (parseError) {
              setIsFinished(true);
              console.warn(
                "Failed to parse final JSON chunk:",
                bufferRef.current
              );
            }
          }
          setIsFinished(true);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log("chunk", chunk);
        bufferRef.current += chunk;

        const lines = bufferRef.current.split("\n");
        console.log("lines.length", lines.length);
        bufferRef.current = lines.pop() || "";

        const newItems: T[] = [];

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            try {
              const jsonData = JSON.parse(trimmedLine) as T;
              newItems.push(jsonData);
            } catch (parseError) {
              console.warn(
                "Failed to parse JSON line:",
                trimmedLine,
                parseError
              );
            }
          }
        }

        if (newItems.length > 0) {
          setFirstResponse(true);
          setData((prev) => [...prev, ...newItems]);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopStream = (): void => {
    abortControllerRef.current?.abort();
  };

  return {
    data,
    isLoading,
    error,
    startStream,
    stopStream,
    firstResponse,
    isFinished,
  };
}
