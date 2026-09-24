import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getIsSecondarySidebarCollapsed } from "store/selectors";

import { PrimarySidebarLink } from "./components/PrimarySidebarLink/PrimarySidebarLink";
import { PrimarySidebarItem } from "../type";
import PATHS from "config/constants/sub/paths";
import { SidebarToggleButton } from "componentsV2/SecondarySidebar/components/SidebarToggleButton/SidebarToggleButton";
import RulesIcon from "/assets/media/common/feature_rules.svg";

import "./PrimarySidebar.css";

const sidebarItems: PrimarySidebarItem[] = [
  {
    id: 0,
    title: "Rules",
    path: PATHS.RULES.INDEX,
    icon: <img src={RulesIcon} alt="rules" />,
    display: true,
  },
];

export const PrimarySidebar: React.FC = () => {
  const { pathname } = useLocation();
  const isSecondarySidebarCollapsed = useSelector(getIsSecondarySidebarCollapsed);
  const isSecondarySidebarToggleAllowed = pathname.includes(PATHS.RULES.INDEX);

  return (
    <div className="primary-sidebar-container">
      {isSecondarySidebarCollapsed && isSecondarySidebarToggleAllowed && <SidebarToggleButton />}
      <ul>
        {sidebarItems.map((sidebarItem) => (
          <li key={sidebarItem.id}>
            <PrimarySidebarLink {...sidebarItem} />
          </li>
        ))}
      </ul>
    </div>
  );
};
