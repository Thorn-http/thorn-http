import React, { useCallback, useEffect, useState } from "react";
import { RQNetworkEvent, RuleEditorUrlFragment } from "../../../../types";
import { createRule, isContentBodyEditable } from "../../../../utils";
import { fillMockFromTraffic } from "../../../../../rules/mockFromTraffic";
import { Button, Collapse, Tooltip } from "antd";
import { EditOutlined } from "@ant-design/icons";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import "./responseTabContent.scss";

interface Props {
  networkEvent: RQNetworkEvent;
}

const mimeTypeToLangugageMap: { [mimeType: string]: any } = {
  "application/json": json(),
  "text/javascript": javascript({ jsx: false }),
  "application/javascript": javascript({ jsx: false }),
  "text/html": html(),
  "text/css": css(),
};

const getEditorLanguageFromMimeType = (mimeType: string) => {
  const language = mimeTypeToLangugageMap[mimeType.toLowerCase().split(";")?.[0]];

  return language || markdown();
};

const commonExtensions = [EditorView.lineWrapping];

const ResponseTabContent: React.FC<Props> = ({ networkEvent }) => {
  const [response, setResponse] = useState("");
  const [editorExtensions, setEditorExtensions] = useState([...commonExtensions, markdown()]);

  useEffect(() => {
    networkEvent.getContent((content) => {
      if (content) {
        try {
          setResponse(JSON.stringify(JSON.parse(content), null, 2) || "");
        } catch (e) {
          setResponse(content);
        }
      } else {
        setResponse("");
      }

      const language = getEditorLanguageFromMimeType(networkEvent.response?.content?.mimeType);
      setEditorExtensions([...commonExtensions, language]);
    });
  }, [networkEvent]);

  const editResponseBody = useCallback(() => {
    createRule(
      RuleEditorUrlFragment.RESPONSE,
      (rule) =>
        fillMockFromTraffic(rule, {
          url: networkEvent.request.url,
          method: networkEvent.request.method,
          status: networkEvent.response.status,
          responseBody: response,
          requestBody: networkEvent.request.postData?.text,
        }),
      ""
    );
  }, [networkEvent, response]);

  const renderEditResponseBodyButton = useCallback(() => {
    if (isContentBodyEditable(networkEvent._resourceType)) {
      return (
        <Button
          onClick={(e) => {
            editResponseBody();
            e.stopPropagation();
          }}
          icon={<EditOutlined />}
        >
          Create mock
        </Button>
      );
    }

    return (
      <Tooltip title="Only XHR/Fetch requests can be modified">
        <Button disabled icon={<EditOutlined />}>
          Create mock
        </Button>
      </Tooltip>
    );
  }, [networkEvent, response]);

  return (
    <div className="response-tab-content">
      <Collapse bordered={false}>
        <Collapse.Panel
          collapsible="icon"
          key="response-body"
          showArrow={false}
          header={"Response Body"}
          extra={renderEditResponseBodyButton()}
        ></Collapse.Panel>
      </Collapse>
      <CodeMirror
        basicSetup={{
          lineNumbers: true,
          syntaxHighlighting: true,
        }}
        theme={vscodeDark}
        value={response}
        height="95%"
        extensions={editorExtensions}
        readOnly
      />
    </div>
  );
};

export default ResponseTabContent;
