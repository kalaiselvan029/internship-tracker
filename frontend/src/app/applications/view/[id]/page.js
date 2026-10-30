"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE_URL = "http://localhost:8080";

const statusLabels = {
  APPLIED: "Applied",
  ASSESSMENT: "Assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

function formatDate(date) {
  if (!date) return "-";

  const parsedDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return String(date);

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDeadlineStatus(deadline, status) {
  if (!deadline) return null;

  const currentStatus = (status || "APPLIED").toUpperCase();

  if (currentStatus === "OFFER" || currentStatus === "REJECTED") {
    return null;
  }

  const deadlineString = String(deadline).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineString)) {
    return null;
  }

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const [year, month, day] = deadlineString.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = todayString
    .split("-")
    .map(Number);

  const deadlineTime = Date.UTC(year, month - 1, day);
  const todayTime = Date.UTC(todayYear, todayMonth - 1, todayDay);

  const parsedDeadline = new Date(deadlineTime);

  if (
    parsedDeadline.getUTCFullYear() !== year ||
    parsedDeadline.getUTCMonth() !== month - 1 ||
    parsedDeadline.getUTCDate() !== day
  ) {
    return null;
  }

  const daysRemaining = (deadlineTime - todayTime) / 86400000;

  if (daysRemaining < 0) {
    return { label: "Overdue", color: "#b91c1c", background: "#fee2e2" };
  }

  if (daysRemaining <= 3) {
    return { label: "Due Soon", color: "#9a3412", background: "#ffedd5" };
  }

  return { label: "Upcoming", color: "#166534", background: "#dcfce7" };
}

export default function ApplicationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function fetchApplication() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/applications/${encodeURIComponent(id)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (cancelled) return;

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");
          router.replace("/login");
          return;
        }

        if (response.status === 404) {
          throw new Error("Application not found. It may have been deleted.");
        }

        if (!response.ok) {
          throw new Error(
            `Could not load application details. HTTP ${response.status}`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setApplication(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load application details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchApplication();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const status = (application?.status || "APPLIED").toUpperCase();
  const deadlineStatus = application
    ? getDeadlineStatus(application.deadline, status)
    : null;

  const safeJobUrl = (() => {
    if (!application?.jobUrl) return null;

    try {
      const url = new URL(application.jobUrl);

      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.href;
      }

      return null;
    } catch {
      return null;
    }
  })();

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "32px 20px",
      background: "#f5f7fb",
      color: "#1f2937",
    },
    container: {
      maxWidth: "850px",
      margin: "0 auto",
    },
    backButton: {
      border: "1px solid #dbe1ea",
      background: "#ffffff",
      color: "#374151",
      borderRadius: "9px",
      padding: "10px 15px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 600,
      marginBottom: "24px",
    },
    card: {
      background: "#ffffff",
      border: "1px solid #e5eaf2",
      borderRadius: "16px",
      padding: "28px",
      boxShadow: "0 8px 30px rgba(31, 41, 55, 0.05)",
    },
    label: {
      color: "#6b7280",
      fontSize: "12px",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "8px",
    },
    value: {
      color: "#1f2937",
      fontSize: "15px",
      overflowWrap: "anywhere",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "24px",
      marginTop: "30px",
    },
    item: {
      minWidth: 0,
    },
    sectionTitle: {
      fontSize: "16px",
      margin: "30px 0 12px",
      color: "#111827",
    },
    primaryButton: {
      border: "none",
      background: "#4f46e5",
      color: "#ffffff",
      borderRadius: "9px",
      padding: "11px 17px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "14px",
    },
    secondaryButton: {
      border: "1px solid #dbe1ea",
      background: "#ffffff",
      color: "#374151",
      borderRadius: "9px",
      padding: "11px 17px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "14px",
    },
  };

  function renderField(label, value) {
    return (
      <div style={styles.item} key={label}>
        <div style={styles.label}>{label}</div>
        <div style={styles.value}>{value || "-"}</div>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <button
          type="button"
          style={styles.backButton}
          onClick={() => router.push("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        {loading ? (
          <div style={styles.card} role="status">
            Loading application details...
          </div>
        ) : error ? (
          <div style={styles.card}>
            <h1 style={{ fontSize: "22px", marginTop: 0 }}>
              Unable to load application
            </h1>

            <p role="alert" style={{ color: "#b91c1c", lineHeight: 1.6 }}>
              {error}
            </p>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => router.push("/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        ) : application ? (
          <section style={styles.card}>
            <p
              style={{
                color: "#6366f1",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "1px",
                margin: "0 0 10px",
              }}
            >
              APPLICATION DETAILS
            </p>

            <h1
              style={{
                color: "#111827",
                fontSize: "28px",
                margin: "0 0 8px",
                overflowWrap: "anywhere",
              }}
            >
              {application.companyName || "Company"}
            </h1>

            <p
              style={{
                color: "#6b7280",
                fontSize: "16px",
                margin: 0,
                overflowWrap: "anywhere",
              }}
            >
              {application.jobTitle || "Job title not provided"}
            </p>

            <div style={{ marginTop: "20px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "7px 12px",
                  borderRadius: "7px",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: "#eef2ff",
                  color: "#4338ca",
                }}
              >
                {statusLabels[status] || status}
              </span>

              {deadlineStatus && (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: "8px",
                    padding: "7px 12px",
                    borderRadius: "7px",
                    fontSize: "13px",
                    fontWeight: 700,
                    background: deadlineStatus.background,
                    color: deadlineStatus.color,
                  }}
                >
                  {deadlineStatus.label}
                </span>
              )}
            </div>

            <div style={styles.grid}>
              {renderField("Application ID", application.id)}
              {renderField("Applied Date", formatDate(application.appliedDate))}
              {renderField("Deadline", formatDate(application.deadline))}
              {renderField(
                "Created / Uploaded Date",
                formatDate(application.createdAt)
              )}
            </div>

            <h2 style={styles.sectionTitle}>Job Information</h2>

            <div style={styles.grid}>
              <div style={styles.item}>
                <div style={styles.label}>Job URL</div>

                <div style={styles.value}>
                  {safeJobUrl ? (
                    <a
                      href={safeJobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#4f46e5",
                        textDecoration: "underline",
                      }}
                    >
                      Open job posting ↗
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>

              {renderField("Current Status", statusLabels[status] || status)}
            </div>

            <h2 style={styles.sectionTitle}>Notes</h2>

            <div
              style={{
                padding: "16px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                color: application.notes ? "#374151" : "#9ca3af",
                fontSize: "14px",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                minHeight: "48px",
              }}
            >
              {application.notes?.trim() || "No notes added."}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "28px",
              }}
            >
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() =>
                  router.push(`/applications/edit/${application.id}`)
                }
              >
                ✎ Edit Application
              </button>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}