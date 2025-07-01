import { useCallback, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';

type ImportState = 'idle' | 'parsing' | 'running' | 'complete' | 'error';

interface Importer {
  state: ImportState;
  rowCount?: number;
  errorCount?: number;
  importCount?: number;
  remainingTime?: number | null;
  error?: any;
}

interface usePapaParseProps<T> {
  batchSize?: number;
  processBatch: (batch: T[]) => Promise<void>;
  mapRow?: (row: any) => T; // optional mapping function from raw CSV row to T
}

export function usePapaParse<T>({
  batchSize = 10,
  processBatch,
  mapRow,
}: usePapaParseProps<T>) {
  const importIdRef = useRef(0);

  const [importer, setImporter] = useState<Importer>({
    state: 'idle',
  });

  const reset = useCallback(() => {
    setImporter({ state: 'idle' });
    importIdRef.current += 1;
  }, []);

  const parseCsv = useCallback(
    (file: File) => {
      setImporter({ state: 'parsing' });

      const importId = importIdRef.current;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        async complete(results) {
          if (importIdRef.current !== importId) return;

          // Apply mapping if provided, else use raw row data
          const allRows: T[] = mapRow
            ? results.data.map(mapRow)
            : (results.data as unknown as T[]);

          setImporter({
            state: 'running',
            rowCount: allRows.length,
            errorCount: results.errors.length,
            importCount: 0,
            remainingTime: null,
          });

          let totalTime = 0;
          for (let i = 0; i < allRows.length; i += batchSize) {
            if (importIdRef.current !== importId) return;

            const batch = allRows.slice(i, i + batchSize);
            try {
              const start = Date.now();
              await processBatch(batch);
              totalTime += Date.now() - start;

              const meanTime = totalTime / (i + batch.length);
              setImporter((previous) => {
                if (previous.state === 'running') {
                  const importCount = (previous.importCount ?? 0) + batch.length;
                  return {
                    ...previous,
                    importCount,
                    remainingTime: meanTime * (allRows.length - importCount),
                  };
                }
                return previous;
              });
            } catch (error) {
              console.error('Failed to import batch', error);
              setImporter((previous) =>
                previous.state === 'running'
                  ? { ...previous, errorCount: (previous.errorCount ?? 0) + batch.length }
                  : previous
              );
            }
          }

          setImporter((previous) =>
            previous.state === 'running'
              ? { ...previous, state: 'complete', remainingTime: null }
              : previous
          );
        },
        error(error) {
          console.error(error);
          setImporter({ state: 'error', error });
        },
        dynamicTyping: true,
      });
    },
    [batchSize, processBatch, mapRow]
  );

  return useMemo(
    () => ({
      importer,
      parseCsv,
      reset,
    }),
    [importer, parseCsv, reset]
  );
}
