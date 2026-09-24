import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getAppMode, getCurrentlySelectedRuleData } from "store/selectors";
import { Col } from "antd";
import { TestReportsTable } from "./components/TestReportsTable";
import { BottomSheetPlacement, useBottomSheetContext } from "componentsV2/BottomSheet";
import PageScriptMessageHandler from "config/PageScriptMessageHandler";
import { TestReport } from "./types";
import { getTestReportsByRuleId, deleteTestReport } from "./utils/testReports";
import { EmptyTestResultScreen } from "./components/EmptyTestResultScreen";
import { toast } from "utils/Toast";
import Logger from "lib/logger";
//@ts-ignore
import { CONSTANTS as GLOBAL_CONSTANTS } from "@thorn-http/core";
import { trackTestRuleReportDeleted, trackTestRuleReportGenerated } from "./analytics";
import { TestRuleHeader } from "./components/TestRuleHeader";
import "./TestThisRule.scss";

export const TestThisRule = () => {
  const appMode = useSelector(getAppMode);
  const [testReports, setTestReports] = useState<TestReport[] | null>(null);
  const currentlySelectedRuleData = useSelector(getCurrentlySelectedRuleData);

  const { sheetPlacement, isBottomSheetOpen, toggleBottomSheet } = useBottomSheetContext();

  const fetchAndUpdateTestReports = useCallback(
    (testSessionBeingSaved?: string) => {
      getTestReportsByRuleId(appMode, currentlySelectedRuleData?.id)
        .then((testReports: TestReport[]) => {
          const reports = testReports;
          if (testSessionBeingSaved) {
            const index = reports.findIndex((report) => report.id === testSessionBeingSaved);
            if (index !== -1) {
              reports[index].isSessionSaving = true;
            }
          }
          setTestReports(reports);
        })
        .catch((error) => {
          Logger.log(error);
        });
    },
    [appMode, currentlySelectedRuleData?.id]
  );

  const handleTestReportDelete = useCallback(
    (reportId: string) => {
      deleteTestReport(appMode, reportId)
        .then(() => {
          toast.success("Test deleted successfully");
          trackTestRuleReportDeleted(currentlySelectedRuleData.ruleType);
          fetchAndUpdateTestReports();
        })
        .catch((error) => {
          Logger.log(error);
        });
    },
    [appMode, currentlySelectedRuleData.ruleType, fetchAndUpdateTestReports]
  );

  useEffect(() => {
    PageScriptMessageHandler.addMessageListener(
      GLOBAL_CONSTANTS.EXTENSION_MESSAGES.NOTIFY_TEST_RULE_REPORT_UPDATED,
      (message: { testReportId: string; testPageTabId: string; record: boolean; appliedStatus: boolean }) => {
        fetchAndUpdateTestReports(message?.record ? message.testReportId : undefined);
        trackTestRuleReportGenerated(currentlySelectedRuleData.ruleType, message.appliedStatus);
        if (sheetPlacement === BottomSheetPlacement.BOTTOM) {
          toggleBottomSheet({ isOpen: true, action: "test_rule_bottom_sheet" });
        }
      }
    );
  }, [
    currentlySelectedRuleData.ruleType,
    fetchAndUpdateTestReports,
    isBottomSheetOpen,
    toggleBottomSheet,
    sheetPlacement,
  ]);

  useEffect(() => {
    fetchAndUpdateTestReports();
  }, [fetchAndUpdateTestReports]);

  return (
    <Col className="test-this-rule-container">
      <TestRuleHeader />
      <div className="mt-16 test-results-header">Results</div>
      <Col className="mt-8 test-reports-container">
        {testReports?.length ? (
          <TestReportsTable testReports={testReports} deleteReport={handleTestReportDelete} />
        ) : (
          <EmptyTestResultScreen />
        )}
      </Col>
    </Col>
  );
};
