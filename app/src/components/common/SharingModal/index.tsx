import React from "react";
import { RQModal } from "lib/design-system/components";
import { HiOutlineShare } from "@react-icons/all-files/hi/HiOutlineShare";
import { PiWarningCircleBold } from "@react-icons/all-files/pi/PiWarningCircleBold";
import { InfoCircleOutlined } from "@ant-design/icons";
import { DownloadRules } from "./DownloadRules";
import "./index.css";

interface ModalProps {
  isOpen: boolean;
  toggleModal: () => void;
  selectedRules: string[];
  source: string;
  callback: () => void;
}

// Rules are shared by exporting them as a JSON file (no cloud shared lists or workspaces).
export const SharingModal: React.FC<ModalProps> = ({
  isOpen,
  toggleModal,
  selectedRules = null,
  callback = () => {},
}) => {
  return (
    <RQModal
      wrapClassName="sharing-modal-wrapper"
      title="Export rules"
      open={isOpen}
      destroyOnClose
      onCancel={toggleModal}
      maskClosable={false}
      centered
    >
      <div className="rq-modal-content">
        <div className="sharing-modal-header">
          <HiOutlineShare /> Export rules
        </div>
        {selectedRules?.length ? (
          <DownloadRules selectedRules={selectedRules} toggleModal={toggleModal} onRulesDownloaded={callback} />
        ) : (
          <EmptySelectionView />
        )}
      </div>
      {selectedRules?.length ? (
        <div className="sharing-modal-footer">
          <InfoCircleOutlined className="sharing-modal-footer-icon" />
          <span className="sharing-modal-footer-text" style={{ maxWidth: "80%" }}>
            Share the downloaded file with anyone. They can add the rules using "Import".
          </span>
        </div>
      ) : null}
    </RQModal>
  );
};

const EmptySelectionView = () => {
  return (
    <div className="sharing-modal-empty-view sharing-modal-body">
      <PiWarningCircleBold />
      <div className="title text-white text-bold">Please select the rules that you want to export</div>
    </div>
  );
};
