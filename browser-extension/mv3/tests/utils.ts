import { Page } from "@playwright/test";

export const waitForPromiseToSettle = async (promise: Promise<any>, timeoutMillis: number) => {
  let isResolved = false;
  let isRejected = false;

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      if (!isResolved && !isRejected) {
        reject(new Error("Promise did not settle within the specified timeout."));
      }
    }, timeoutMillis);
  });

  return Promise.race([promise, timeoutPromise])
    .then((result) => {
      isResolved = true;
      return result;
    })
    .catch((error) => {
      isRejected = true;
      throw error;
    });
};

export const loadRules = async (page: Page, rules: Record<string, any>) => {
  await page.evaluate(
    ({ rules }) => {
      window.postMessage(
        {
          action: "SAVE_STORAGE_OBJECT",
          requestId: Math.random().toString(36).substring(7),
          source: "page_script",
          object: rules,
        },
        window.origin
      );
    },
    { rules }
  );
  await page.waitForTimeout(1000);
};

export const clearRules = async (page: any) => {
  await page.evaluate(() => {
    window.postMessage(
      {
        action: "CLEAR_STORAGE",
        requestId: Math.random().toString(36).substring(7),
        source: "page_script",
      },
      window.origin
    );
  });
};
