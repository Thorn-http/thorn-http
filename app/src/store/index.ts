import { autoBatchEnhancer, configureStore } from "@reduxjs/toolkit";

import { ReducerKeys } from "./constants";
import { recordsReducer } from "./features/rules/slice";
import { billingReducer } from "./features/billing/slice";
import { workspaceReducerWithLocal } from "./slices/workspaces/slice";
import { globalReducers } from "./slices/global/slice";

export const reduxStore = configureStore({
  reducer: {
    [ReducerKeys.GLOBAL]: globalReducers,
    [ReducerKeys.RULES]: recordsReducer, // SLICE ALSO CONTAINS GROUP RECORDS
    [ReducerKeys.BILLING]: billingReducer,
    [ReducerKeys.WORKSPACE]: workspaceReducerWithLocal,
  },
  middleware: (getDefaultMiddleware) => {
    // We have functions in some action payloads, so skip the serializability check.
    return getDefaultMiddleware({ serializableCheck: false });
  },
  enhancers: (existingEnhancers) => {
    return existingEnhancers.concat(autoBatchEnhancer({ type: "timer", timeout: 100 }));
  },
});
