"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const initialForm = {
  companyName: "",
  jobTitle: "",
  jobType: "",
  jobUrl: "",
  status: "APPLIED",
  appliedDate: "",
  deadline: "",
  notes: "",
};

const API_BASE_URL = "http://localhost:8080";

export default function EditApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (checkingAuth || !id) return;

    let cancelled = false;

    async function fetchApplication() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/applications/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "Application not found or you do not have access to it."
            );
          }

          throw new Error(
            `Could not load application (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (cancelled) return;

        setForm({
          companyName: data.companyName || "",
          jobTitle: data.jobTitle || "",
          jobType: data.jobType || "",
          jobUrl: data.jobUrl || "",
          status: data.status || "APPLIED",
          appliedDate: data.appliedDate
            ? String(data.appliedDate).slice(0, 10)
            : "",
          deadline: data.deadline
            ? String(data.deadline).slice(0, 10)
            : "",
          notes: data.notes || "",
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load application.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchApplication();

    return () => {
      cancelled = true;
    };
  }, [checkingAuth, id, router]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  }

  function validateForm() {
    const errors = {};

    if (!form.companyName.trim()) {
      errors.companyName = "Please enter the company name.";
    }

    if (!form.jobTitle.trim()) {
      errors.jobTitle = "Please enter the job title.";
    }

    if (!form.jobType) {
      errors.jobType = "Please select a job type.";
    }

    // Job URL is optional; validate only when entered.
    const urlValue = form.jobUrl.trim();

    if (urlValue) {
      try {
        const url = new URL(urlValue);

        if (
          !["http:", "https:"].includes(url.protocol) ||
          !url.hostname.includes(".") ||
          url.hostname.startsWith(".") ||
          url.hostname.endsWith(".")
        ) {
          errors.jobUrl =
            "Please enter a valid URL, such as https://example.com.";
        }
      } catch {
        errors.jobUrl =
          "Please enter a valid URL, such as https://example.com.";
      }
    }

    if (!form.appliedDate) {
      errors.appliedDate = "Please select the applied date.";
    } else if (Number.isNaN(Date.parse(form.appliedDate))) {
      errors.appliedDate = "Please select a valid applied date.";
    }

    if (form.deadline) {
      if (Number.isNaN(Date.parse(form.deadline))) {
        errors.deadline = "Please select a valid deadline.";
      } else if (
        form.appliedDate &&
        form.deadline < form.appliedDate
      ) {
        errors.deadline =
          "Deadline cannot be earlier than the applied date.";
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function inputStyle(fieldName) {
    return {
      ...styles.input,
      ...(fieldErrors[fieldName] ? styles.invalidInput : {}),
    };
  }

  function fieldError(fieldName) {
    return fieldErrors[fieldName] ? (
      <span style={styles.fieldError} role="alert">
        {fieldErrors[fieldName]}
      </span>
    ) : null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!validateForm()) return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/applications/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            companyName: form.companyName.trim(),
            jobTitle: form.jobTitle.trim(),
            jobUrl: form.jobUrl.trim() || null,
            deadline: form.deadline || null,
            notes: form.notes.trim(),
          }),
        }
      );

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");

        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const responseText = await response.text();

        try {
          const data = JSON.parse(responseText);
          const mappedErrors = {};

          const fieldNames = [
            "companyName",
            "jobTitle",
            "jobType",
            "jobUrl",
            "appliedDate",
            "deadline",
          ];

          for (const field of fieldNames) {
            if (typeof data[field] === "string") {
              mappedErrors[field] = data[field];
            }
          }

          if (Object.keys(mappedErrors).length > 0) {
            setFieldErrors((previous) => ({
              ...previous,
              ...mappedErrors,
            }));
            return;
          }

          throw new Error(
            typeof data.message === "string"
              ? data.message
              : "Could not update application. Please check your details."
          );
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            throw new Error(
              responseText ||
                `Update failed (HTTP ${response.status}).`
            );
          }

          throw parseError;
        }
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(err.message || "Could not update application.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth || loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>Loading application...</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link href="/dashboard" style={styles.back}>
          ← Back to Dashboard
        </Link>

        <h1 style={styles.heading}>Edit Application</h1>

        <p style={styles.subtitle}>
          Update your job application details.
        </p>

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}

        {!error || form.companyName ? (
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <label style={styles.label}>
              Company Name *
              <input
                style={inputStyle("companyName")}
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Zoho"
                maxLength={150}
                aria-invalid={Boolean(fieldErrors.companyName)}
              />
              {fieldError("companyName")}
            </label>

            <label style={styles.label}>
              Job Title *
              <input
                style={inputStyle("jobTitle")}
                name="jobTitle"
                value={form.jobTitle}
                onChange={handleChange}
                placeholder="e.g. Java Developer Intern"
                maxLength={150}
                aria-invalid={Boolean(fieldErrors.jobTitle)}
              />
              {fieldError("jobTitle")}
            </label>

            {/* Job Type */}
            <label style={styles.label}>
              Job Type *
              <select
                style={inputStyle("jobType")}
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.jobType)}
              >
                <option value="">Select job type</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
              {fieldError("jobType")}
            </label>

            <label style={styles.label}>
              Status *
              <select
                style={styles.input}
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="APPLIED">Applied</option>
                <option value="ASSESSMENT">Assessment</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>

            <label style={styles.label}>
              Applied Date *
              <input
                style={inputStyle("appliedDate")}
                type="date"
                name="appliedDate"
                value={form.appliedDate}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.appliedDate)}
              />
              {fieldError("appliedDate")}
            </label>

            <label style={styles.label}>
              Deadline
              <input
                style={inputStyle("deadline")}
                type="date"
                name="deadline"
                value={form.deadline}
                min={form.appliedDate || undefined}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.deadline)}
              />
              {fieldError("deadline")}
            </label>

            <label style={styles.label}>
              Job URL (Optional)
              <input
                style={inputStyle("jobUrl")}
                type="text"
                inputMode="url"
                name="jobUrl"
                value={form.jobUrl}
                onChange={handleChange}
                placeholder="https://company.com/careers"
                maxLength={255}
                aria-invalid={Boolean(fieldErrors.jobUrl)}
              />
              {fieldError("jobUrl")}
            </label>

            <label style={styles.label}>
              Notes
              <textarea
                style={{ ...styles.input, minHeight: "110px" }}
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Interview details, recruiter information..."
                maxLength={2000}
              />
            </label>

            <div style={styles.actions}>
              <Link href="/dashboard" style={styles.cancel}>
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.button,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Updating..." : "Update Application"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "35px 20px",
    color: "#172033",
  },
  container: {
    maxWidth: "760px",
    margin: "0 auto",
  },
  back: {
    display: "inline-block",
    marginBottom: "24px",
    color: "#4f46e5",
    textDecoration: "none",
  },
  heading: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "25px",
  },
  form: {
    display: "grid",
    gap: "20px",
    background: "#fff",
    padding: "28px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
  },
  label: {
    display: "grid",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
    color: "#172033",
  },
  invalidInput: {
    border: "1px solid #dc2626",
    background: "#fffafa",
  },
  fieldError: {
    color: "#b91c1c",
    fontSize: "13px",
    fontWeight: "400",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "16px",
    paddingTop: "12px",
  },
  cancel: {
    color: "#475569",
    textDecoration: "none",
  },
  button: {
    background: "#4f46e5",
    color: "#fff",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  error: {
    color: "#b91c1c",
    background: "#fef2f2",
    padding: "12px",
    borderRadius: "8px",
    overflowWrap: "anywhere",
    marginBottom: "20px",
  },
};