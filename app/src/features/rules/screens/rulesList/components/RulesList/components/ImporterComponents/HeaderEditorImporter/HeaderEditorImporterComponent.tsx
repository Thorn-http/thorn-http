import React from "react";
import { importHeaderEditor } from "@requestly/alternative-importers";

import { CommonRulesImporter } from "../CommonRulesImporter/CommonRulesImporter";

export const HeaderEditorImporter: React.FC<{}> = (props) => {
  return (
    <CommonRulesImporter
      productName="Header Editor"
      supportedFileTypes={["text/plain"]}
      importer={importHeaderEditor}
      docsLink="https://thorn-http.dev/docs"
      shareLink="https://thorn-http.dev/docs"
    />
  );
};
