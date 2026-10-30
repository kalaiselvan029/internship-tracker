
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://localhost:8080";
const PAGE_SIZE = 5;

const statusLabels = {
  APPLIED: "Applied",
  ASSESSMENT: "Assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const jobTypeLabels = {
  INTERNSHIP: "Internship",
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
};

const initialStats = {
  totalApplications: 0,
  appliedCount: 0,
  assessmentCount: 0,
  interviewCount: 0,
  offerCount: 0,
  rejectedCount: 0,
};

const sortOptions = [
  { value: "NEWEST", label: "Applied Date: Newest First" },
  { value: "OLDEST", label: "Applied Date: Oldest First" },
  { value: "DEADLINE_NEAREST", label: "Deadline: Nearest First" },
  { value: "DEADLINE_FARTHEST", label: "Deadline: Farthest First" },
];

function formatDate(date) {
  if (!date) return "-";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Returns a YYYY-MM-DD string or an empty string.
function getDateKey(value) {
  if (!value) return "";

  const date = String(value).slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

// Sort a copy of the array; never mutate the original application list.
// Missing dates always appear at the bottom.
function sortApplications(list, sortType) {
  return [...list].sort((a, b) => {
    let dateA = "";
    let dateB = "";

    if (
      sortType === "DEADLINE_NEAREST" ||
      sortType === "DEADLINE_FARTHEST"
    ) {
      dateA = getDateKey(a.deadline);
      dateB = getDateKey(b.deadline);
    } else {
      dateA = getDateKey(a.appliedDate);
      dateB = getDateKey(b.appliedDate);
    }

    if (!dateA && !dateB) {
      return Number(b.id || 0) - Number(a.id || 0);
    }

    if (!dateA) return 1;
    if (!dateB) return -1;

    if (dateA === dateB) {
      return Number(b.id || 0) - Number(a.id || 0);
    }

    switch (sortType) {
      case "OLDEST":
      case "DEADLINE_NEAREST":
        return dateA.localeCompare(dateB);

      case "DEADLINE_FARTHEST":
      case "NEWEST":
      default:
        return dateB.localeCompare(dateA);
    }
  });
}

function getDeadlineStatus(deadline, status) {
  if (!deadline) return null;

  const currentStatus = (status || "APPLIED").toUpperCase();

  if (currentStatus === "OFFER" || currentStatus === "REJECTED") {
    return null;
  }

  const deadlineString = getDateKey(deadline);

  if (!deadlineString) return null;

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const [deadlineYear, deadlineMonth, deadlineDay] = deadlineString
    .split("-")
    .map(Number);

  const [todayYear, todayMonth, todayDay] = todayString
    .split("-")
    .map(Number);

  const deadlineTime = Date.UTC(
    deadlineYear,
    deadlineMonth - 1,
    deadlineDay
  );

  const todayTime = Date.UTC(
    todayYear,
    todayMonth - 1,
    todayDay
  );

  const deadlineDate = new Date(deadlineTime);

  if (
    deadlineDate.getUTCFullYear() !== deadlineYear ||
    deadlineDate.getUTCMonth() !== deadlineMonth - 1 ||
    deadlineDate.getUTCDate() !== deadlineDay
  ) {
    return null;
  }

  const daysRemaining = (deadlineTime - todayTime) / 86400000;

  if (daysRemaining < 0) {
    return {
      label: "Overdue",
      className: "deadline-overdue",
    };
  }

  if (daysRemaining <= 3) {
    return {
      label: "Due Soon",
      className: "deadline-due-soon",
    };
  }

  return {
    label: "Upcoming",
    className: "deadline-upcoming",
  };
}

export default function Dashboard() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [applications, setApplications] = useState([]);
  const [allApplications, setAllApplications] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const [apiError, setApiError] = useState("");
  const [userName, setUserName] = useState("Job Seeker");
  const [deletingId, setDeletingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedJobType, setSelectedJobType] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("NEWEST");

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isClientPaginated, setIsClientPaginated] = useState(false);

  function clearLoginData() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
  }

  function redirectToLogin() {
    clearLoginData();
    setIsAuthenticated(false);
    router.replace("/login");
  }

  function goToAddApplication(event) {
    event.preventDefault();
    router.push("/applications/new");
  }

  async function fetchAllApplications() {
    const token = localStorage.getItem("token");

    if (!token) {
      redirectToLogin();
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/api/applications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
      return [];
    }

    if (!response.ok) {
      throw new Error(`Could not load applications. HTTP ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async function refreshAllApplications() {
    const data = await fetchAllApplications();
    setAllApplications(data);
  }

  async function handleSearchAndFilter(
    companyName = searchTerm,
    status = selectedStatus,
    jobType = selectedJobType,
    page = 0,
    sort = selectedSort
  ) {
    setSearchLoading(true);
    setApiError("");

    try {
      const data = await fetchAllApplications();

      const trimmedSearch = companyName.trim().toLowerCase();

      const results = data.filter((application) => {
        const company = (application.companyName || "").toLowerCase();
        const title = (application.jobTitle || "").toLowerCase();
        const applicationStatus = (application.status || "").toUpperCase();
        const applicationJobType = (application.jobType || "").toUpperCase();

        const matchesSearch =
          !trimmedSearch ||
          company.includes(trimmedSearch) ||
          title.includes(trimmedSearch);

        const matchesStatus =
          status === "ALL" || applicationStatus === status;

        const matchesJobType =
          jobType === "ALL" || applicationJobType === jobType;

        return matchesSearch && matchesStatus && matchesJobType;
      });

      // Apply the selected sort before calculating pagination.
      const sortedResults = sortApplications(results, sort);

      setApplications(sortedResults);
      setTotalElements(sortedResults.length);
      setTotalPages(Math.ceil(sortedResults.length / PAGE_SIZE));

      // Keep the page in range when filtering reduces the result count.
      const lastPage = Math.max(
        0,
        Math.ceil(sortedResults.length / PAGE_SIZE) - 1
      );

      const safePage = Math.min(Math.max(page, 0), lastPage);

      setCurrentPage(safePage);
      setIsClientPaginated(true);
    } catch (error) {
      console.error("Search/filter/sort error:", error);
      setApiError(error.message || "Could not load applications.");
    } finally {
      setSearchLoading(false);
    }
  }

  async function refreshStats() {
    const token = localStorage.getItem("token");

    if (!token) {
      redirectToLogin();
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/applications/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      throw new Error(`Statistics request failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    setStats({ ...initialStats, ...data });
  }

  function handleExportCsv() {
    if (allApplications.length === 0) {
      alert("No applications available to export.");
      return;
    }

    const headers = [
      "Company",
      "Job Title",
      "Job Type",
      "Job URL",
      "Status",
      "Applied Date",
      "Deadline",
      "Notes",
    ];

    const escapeCsv = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = allApplications.map((app) => [
      app.companyName,
      app.jobTitle,
      jobTypeLabels[app.jobType] || app.jobType || "",
      app.jobUrl,
      statusLabels[app.status] || app.status,
      app.appliedDate,
      app.deadline,
      app.notes,
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "CareerTrack_Applications.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function handleDeleteApplication(application) {
    const company = application.companyName || "this application";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${company}? This action cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      redirectToLogin();
      return;
    }

    setDeletingId(application.id);
    setApiError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/applications/${application.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Could not delete application. HTTP ${response.status}`
        );
      }

      await Promise.all([refreshStats(), refreshAllApplications()]);

      const nextPage =
        applications.length === 1 && currentPage > 0
          ? currentPage - 1
          : currentPage;

      await handleSearchAndFilter(
        searchTerm,
        selectedStatus,
        selectedJobType,
        nextPage,
        selectedSort
      );
    } catch (error) {
      console.error("Delete application error:", error);
      setApiError(error.message || "Failed to delete application.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setUserName(localStorage.getItem("userName") || "Job Seeker");
    setIsAuthenticated(true);
    setAuthReady(true);
  }, [router]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;

    let cancelled = false;

    async function fetchDashboardData() {
      const token = localStorage.getItem("token");

      if (!token) {
        redirectToLogin();
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/applications/stats`,
          {
            headers,
            cache: "no-store",
          }
        );

        if (cancelled) return;

        if (response.status === 401 || response.status === 403) {
          redirectToLogin();
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Statistics request failed: HTTP ${response.status}`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setStats({ ...initialStats, ...data });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Statistics error:", error);
          setApiError(
            "Could not load statistics. Check whether the backend is running."
          );
        }
      } finally {
        if (!cancelled) setLoadingStats(false);
      }

      if (cancelled) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/applications`, {
          headers,
          cache: "no-store",
        });

        if (cancelled) return;

        if (response.status === 401 || response.status === 403) {
          redirectToLogin();
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Applications request failed: HTTP ${response.status}`
          );
        }

        const data = await response.json();
        const results = Array.isArray(data) ? data : [];
        const sortedResults = sortApplications(results, "NEWEST");

        if (!cancelled) {
          setAllApplications(results);
          setApplications(sortedResults);
          setTotalElements(sortedResults.length);
          setTotalPages(Math.ceil(sortedResults.length / PAGE_SIZE));
          setCurrentPage(0);
          setSelectedSort("NEWEST");
          setIsClientPaginated(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Applications error:", error);
          setApiError(
            "Could not load applications. Check the backend and API endpoint."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingApplications(false);
          setLoadingDeadlines(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthenticated]);

  function handleLogout() {
    clearLoginData();
    setIsAuthenticated(false);
    router.replace("/login");
  }

  function handleSearchChange(value) {
    setSearchTerm(value);
    setCurrentPage(0);
    handleSearchAndFilter(
      value,
      selectedStatus,
      selectedJobType,
      0,
      selectedSort
    );
  }

  function handleStatusChange(value) {
    setSelectedStatus(value);
    setCurrentPage(0);
    handleSearchAndFilter(
      searchTerm,
      value,
      selectedJobType,
      0,
      selectedSort
    );
  }

  function handleJobTypeChange(value) {
    setSelectedJobType(value);
    setCurrentPage(0);
    handleSearchAndFilter(
      searchTerm,
      selectedStatus,
      value,
      0,
      selectedSort
    );
  }

  function handleSortChange(value) {
    setSelectedSort(value);
    setCurrentPage(0);
    handleSearchAndFilter(
      searchTerm,
      selectedStatus,
      selectedJobType,
      0,
      value
    );
  }

  function handleClearFilters() {
    setSearchTerm("");
    setSelectedStatus("ALL");
    setSelectedJobType("ALL");
    setSelectedSort("NEWEST");
    setCurrentPage(0);

    handleSearchAndFilter("", "ALL", "ALL", 0, "NEWEST");
  }

  function handlePageChange(nextPage) {
    if (nextPage < 0 || nextPage >= totalPages || searchLoading) return;
    setCurrentPage(nextPage);
  }

  const statCards = [
    {
      label: "Total Applications",
      value: stats.totalApplications,
      change: "All your applications",
      color: "purple",
      icon: "▤",
    },
    {
      label: "Applied",
      value: stats.appliedCount,
      change: "Applications submitted",
      color: "blue",
      icon: "↗",
    },
    {
      label: "Interviews",
      value: stats.interviewCount,
      change: "Interview stage",
      color: "orange",
      icon: "♧",
    },
    {
      label: "Offers",
      value: stats.offerCount,
      change: "Offers received",
      color: "green",
      icon: "✓",
    },
  ];

  const total = Number(stats.totalApplications) || 0;

  const progressStatuses = [
    {
      label: "Applied",
      value: Number(stats.appliedCount) || 0,
      className: "segment-applied",
      dotClass: "dot-applied",
    },
    {
      label: "Assessment",
      value: Number(stats.assessmentCount) || 0,
      className: "segment-assessment",
      dotClass: "dot-assessment",
    },
    {
      label: "Interview",
      value: Number(stats.interviewCount) || 0,
      className: "segment-interview",
      dotClass: "dot-interview",
    },
    {
      label: "Offer",
      value: Number(stats.offerCount) || 0,
      className: "segment-offer",
      dotClass: "dot-offer",
    },
    {
      label: "Rejected",
      value: Number(stats.rejectedCount) || 0,
      className: "segment-rejected",
      dotClass: "dot-rejected",
    },
  ];

  const deadlineSummary = allApplications.reduce(
    (counts, application) => {
      const deadlineStatus = getDeadlineStatus(
        application.deadline,
        application.status
      );

      if (deadlineStatus?.label === "Overdue") counts.overdue += 1;
      if (deadlineStatus?.label === "Due Soon") counts.dueSoon += 1;
      if (deadlineStatus?.label === "Upcoming") counts.upcoming += 1;

      return counts;
    },
    { overdue: 0, dueSoon: 0, upcoming: 0 }
  );

  const deadlineCards = [
    {
      label: "Overdue",
      value: deadlineSummary.overdue,
      description: "Deadline has passed",
      icon: "!",
      className: "deadline-summary-overdue",
    },
    {
      label: "Due Soon",
      value: deadlineSummary.dueSoon,
      description: "Due within 3 days",
      icon: "◷",
      className: "deadline-summary-due-soon",
    },
    {
      label: "Upcoming",
      value: deadlineSummary.upcoming,
      description: "Due after 3 days",
      icon: "▣",
      className: "deadline-summary-upcoming",
    },
  ];

  const displayedApplications = isClientPaginated
    ? applications.slice(
        currentPage * PAGE_SIZE,
        (currentPage + 1) * PAGE_SIZE
      )
    : applications;

  if (!authReady || !isAuthenticated) return null;

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-icon">J</span>
          <span>CareerTrack</span>
        </a>

        <div className="nav-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-item active">
            <span className="nav-icon">▦</span>
            Dashboard
          </a>

          <a href="#applications" className="nav-item">
            <span className="nav-icon">▤</span>
            Applications
            <span className="nav-count">{total}</span>
          </a>

          <a
            href="/applications/new"
            className="nav-item"
            onClick={goToAddApplication}
          >
            <span className="nav-icon">＋</span>
            Add Application
          </a>
        </nav>

        <div className="nav-section-label tools-label">PREFERENCES</div>

        <nav className="sidebar-nav">
          <a href="#settings" className="nav-item">
            <span className="nav-icon">⚙</span>
            Settings
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <h3>Stay organized</h3>
            <p>Track every opportunity and keep your job search moving.</p>
          </div>

          <div className="profile">
            <div className="avatar">{initials || "JS"}</div>

            <div className="profile-info">
              <strong>{userName}</strong>
              <span>Job Seeker</span>
              <button
                type="button"
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            </div>

            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>

          <div className="topbar-right">
            <span className="today-label">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <div className="top-avatar">{initials || "JS"}</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">YOUR CAREER WORKSPACE</p>
              <h1>Dashboard</h1>
              <p className="page-description">
                Welcome back! Here&apos;s what&apos;s happening with your job search.
              </p>
            </div>

            <a
              href="/applications/new"
              className="primary-button"
              onClick={goToAddApplication}
            >
              <span>＋</span> Add Application
            </a>
          </div>

          {apiError && (
            <p role="alert" className="dashboard-error">
              {apiError}
            </p>
          )}

          <section className="stats-grid" aria-label="Application statistics">
            {statCards.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className="stat-top">
                  <span className="stat-label">{stat.label}</span>
                  <span className={`stat-icon ${stat.color}`}>{stat.icon}</span>
                </div>

                <div className="stat-value">
                  {loadingStats ? "..." : stat.value}
                </div>

                <p className="stat-caption">{stat.change}</p>
              </article>
            ))}
          </section>

          <section
            className="deadline-summary-section"
            aria-label="Deadline summary"
          >
            <div className="deadline-summary-heading">
              <div>
                <h2>Deadline Overview</h2>
                <p>Track deadlines across all your applications.</p>
              </div>
            </div>

            <div className="deadline-summary-grid">
              {deadlineCards.map((card) => (
                <article
                  className={`deadline-summary-card ${card.className}`}
                  key={card.label}
                >
                  <div className="deadline-summary-top">
                    <span className="deadline-summary-label">
                      {card.label}
                    </span>
                    <span className="deadline-summary-icon" aria-hidden="true">
                      {card.icon}
                    </span>
                  </div>

                  <div className="deadline-summary-value">
                    {loadingDeadlines ? "..." : card.value}
                  </div>

                  <p className="deadline-summary-description">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="progress-panel">
            <div className="progress-heading">
              <div>
                <h2>Application progress</h2>
                <p>Your current application pipeline at a glance.</p>
              </div>

              <span className="progress-total">
                {loadingStats ? "Loading..." : `${total} applications`}
              </span>
            </div>

            <div
              className="progress-bar"
              aria-label="Application progress overview"
            >
              {progressStatuses.map((status) => (
                <span
                  key={status.label}
                  className={`segment ${status.className}`}
                  style={{
                    width: total > 0 ? `${(status.value / total) * 100}%` : "0%",
                  }}
                />
              ))}
            </div>

            <div className="progress-legend">
              {progressStatuses.map((status) => (
                <span key={status.label}>
                  <i className={`legend-dot ${status.dotClass}`} />{" "}
                  {status.label} <strong>{status.value}</strong>
                </span>
              ))}
            </div>
          </section>

          <section className="applications-panel" id="applications">
            <div className="table-heading">
              <div>
                <h2>Recent Applications</h2>
                <p>Keep track of your latest job opportunities.</p>
              </div>

              <a className="text-link" href="#applications">
                View all applications <span>→</span>
              </a>
            </div>

            <div className="filter-toolbar">
              <input
                type="search"
                className="search-input"
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search company or job title..."
                aria-label="Search company or job title"
              />

              <select
                className="status-select"
                value={selectedStatus}
                onChange={(event) => handleStatusChange(event.target.value)}
                aria-label="Filter applications by status"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPLIED">Applied</option>
                <option value="ASSESSMENT">Assessment</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                className="status-select"
                value={selectedJobType}
                onChange={(event) => handleJobTypeChange(event.target.value)}
                aria-label="Filter applications by job type"
              >
                <option value="ALL">All Job Types</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>

              <select
                className="status-select"
                value={selectedSort}
                onChange={(event) => handleSortChange(event.target.value)}
                aria-label="Sort applications"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="filter-actions">
                <button
                  type="button"
                  className="filter-button clear-button"
                  onClick={handleExportCsv}
                  disabled={loadingDeadlines || allApplications.length === 0}
                >
                  ↓ Export CSV
                </button>

                <button
                  type="button"
                  className="filter-button clear-button"
                  onClick={handleClearFilters}
                  disabled={searchLoading}
                >
                  <span aria-hidden="true">↺</span> Clear
                </button>
              </div>
            </div>

            {searchLoading && (
              <p className="search-status-message" role="status">
                Loading applications...
              </p>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>COMPANY / ROLE</th>
                    <th>JOB TYPE</th>
                    <th>STATUS</th>
                    <th>APPLIED DATE</th>
                    <th>DEADLINE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingApplications ? (
                    <tr>
                      <td colSpan={6}>Loading applications...</td>
                    </tr>
                  ) : displayedApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        <div className="empty-state-icon">⌕</div>
                        <strong>No applications found</strong>
                        <p>Try another search or clear your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    displayedApplications.map((application) => {
                      const company = application.companyName || "Company";
                      const status = application.status || "APPLIED";
                      const isDeleting = deletingId === application.id;
                      const deadlineStatus = getDeadlineStatus(
                        application.deadline,
                        status
                      );

                      return (
                        <tr key={application.id}>
                          <td>
                            <div className="company-cell">
                              <div
                                className={`company-logo logo-${company
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]/g, "")}`}
                              >
                                {company.charAt(0).toUpperCase()}
                              </div>

                              <div className="company-details">
                                <strong>{company}</strong>
                                <span>{application.jobTitle || "-"}</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="status-badge">
                              {jobTypeLabels[application.jobType] ||
                                application.jobType ||
                                "Not specified"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge status-${status.toLowerCase()}`}
                            >
                              <i />
                              {statusLabels[status] || status}
                            </span>
                          </td>

                          <td className="date-cell">
                            {formatDate(application.appliedDate)}
                          </td>

                          <td className="date-cell">
                            <div className="deadline-cell">
                              <span>{formatDate(application.deadline)}</span>

                              {deadlineStatus && (
                                <span
                                  className={`deadline-badge ${deadlineStatus.className}`}
                                >
                                  {deadlineStatus.label}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="actions-cell">
                            <div className="action-buttons">
                              <button
                                className="action-button"
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/applications/view/${application.id}`
                                  )
                                }
                                title="View application details"
                                disabled={isDeleting}
                                style={{
                                  backgroundColor: "#eef2ff",
                                  color: "#4338ca",
                                  border: "1px solid #c7d2fe",
                                }}
                              >
                                <span aria-hidden="true">↗</span>
                                View
                              </button>

                              <button
                                className="action-button edit-button"
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/applications/edit/${application.id}`
                                  )
                                }
                                title="Edit application"
                                disabled={isDeleting}
                              >
                                <span aria-hidden="true">✎</span>
                                Edit
                              </button>

                              <button
                                className="action-button delete-button"
                                type="button"
                                onClick={() =>
                                  handleDeleteApplication(application)
                                }
                                title="Delete application"
                                disabled={deletingId !== null}
                              >
                                <span aria-hidden="true">×</span>
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing{" "}
                {totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1}
                {" - "}
                {Math.min((currentPage + 1) * PAGE_SIZE, totalElements)}
                {" of "}
                {totalElements} applications
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  disabled={currentPage === 0 || searchLoading}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage + 1 >= totalPages || searchLoading}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <footer className="page-footer">
            <span>CareerTrack · Internship Application Tracker</span>
            <span>Keep going. Your next opportunity is out there.</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
