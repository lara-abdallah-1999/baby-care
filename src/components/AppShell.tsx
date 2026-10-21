import { getPageDetails } from "../lib/routes";
import {
  Baby,
  FlaskConical,
  ChevronDown,
  House,
  PanelLeftClose,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useOperation } from "../store/operation";
import { useWorkflow } from "../store/workflow";
import { useTheme } from "../hooks/useTheme";
import { BrandLogo } from "./BrandLogo";
import { PatientSearch } from "./PatientSearch";
import { useWorkflowSummary } from "../hooks/useWorkflowSummary";

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const saving = useOperation((s) => s.saving);
  const { pendingNewbornRequests } = useWorkflowSummary();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [closed, setClosed] = useState(false);
  const { title: page, mainClass } = getPageDetails(location.pathname);
  if (closed)
    return (
      <div className="workspace-closed">
        <div>
          <BrandLogo theme={theme} />
          <h1>Workspace closed</h1>
          <p>
            This is a local demo without an authentication service. Patient selections have been
            cleared; no hospital account was signed out.
          </p>
          <button
            className="primary"
            onClick={() => {
              setClosed(false);
              navigate("/");
            }}
          >
            Reopen BabyCare
          </button>
        </div>
      </div>
    );
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside
        className="sidebar"
        onClickCapture={(e) => {
          if (saving && (e.target as HTMLElement).closest("a")) e.preventDefault();
        }}
      >
        <NavLink to="/" className="brand" aria-label="BabyCare — workflow overview">
          <BrandLogo theme={theme} />
        </NavLink>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          <NavLink to="/" end aria-label="Dashboard" title="Dashboard">
            <House size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admission"
            aria-label="Newborn Registration and Lab Requests"
            title="Newborn Registration and Lab Requests"
          >
            <Baby size={18} />
            <span>Newborn Registration and Lab Requests</span>
          </NavLink>
        </nav>
        <div className="nav-label">REGISTERS</div>
        <nav aria-label="Registers">
          <NavLink
            to="/lab-request-register"
            aria-label="Lab Requests Register"
            title="Lab Requests Register"
          >
            <FlaskConical size={18} />
            <span>Lab Requests</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-theme">
            <Sun size={19} />
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Dark mode"
              onClick={toggleTheme}
            >
              <span />
            </button>
            <Moon size={18} />
          </div>
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            aria-expanded={!collapsed}
          >
            <PanelLeftClose size={17} />
            <span>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            <NavLink to="/" aria-label="Home">
              <House size={16} />
            </NavLink>
            <ChevronRight size={12} />
            <span className="breadcrumb-root">Clinical workspace</span>
            <ChevronRight size={12} />
            <strong>{page}</strong>
          </div>
          <PatientSearch
            key={location.key}
            compact
            disabled={saving}
            onSelect={(mother) => navigate("/admission", { state: { motherId: mother.id } })}
          />
          <div className="topbar-right">
            <NavLink
              className="pending-shortcut"
              aria-label={`${pendingNewbornRequests} pending lab requests`}
              to="/lab-request-register?status=Pending&linked=yes"
              onClick={(e) => {
                if (saving) e.preventDefault();
              }}
            >
              <ClipboardCheck size={16} />
              <span>{pendingNewbornRequests} pending</span>
            </NavLink>
            <span className="workspace-identity">
              <span className="workspace-avatar" title="BabyCare workspace">
                BC
              </span>
              <ChevronDown size={13} aria-hidden="true" />
            </span>
            <button
              className="logout-button"
              aria-label="Log out of workspace"
              title="Close local workspace"
              disabled={saving}
              onClick={() => {
                useWorkflow.getState().reset();
                setClosed(true);
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className={mainClass}>
          <Outlet />
        </main>
        <footer>
          <span>
            BabyCare <span className="footer-dot">·</span> Newborn care workspace
          </span>
        </footer>
      </div>
    </div>
  );
}
