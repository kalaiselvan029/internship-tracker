
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const initialForm = {
  companyName: "",
  jobTitle: "",
  jobType: "INTERNSHIP",
  jobUrl: "",
  status: "APPLIED",
  appliedDate: new Date().toISOString().slice(0, 10),
  deadline: "",
  notes: "",
};

export default function NewApplicationPage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
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

    if (
      !["INTERNSHIP", "FULL_TIME", "PART_TIME", "CONTRACT"].includes(
        form.jobType
      )
    ) {
      errors.jobType = "Please select a valid job type.";
    }

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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            companyName: form.companyName.trim(),
            jobTitle: form.jobTitle.trim(),
            jobType: form.jobType,
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

          const fieldNames = {
            companyName: "companyName",
            jobTitle: "jobTitle",
            jobType: "jobType",
            jobUrl: "jobUrl",
            appliedDate: "appliedDate",
            deadline: "deadline",
          };

          for (const [key, value] of Object.entries(data)) {
            if (fieldNames[key] && typeof value === "string") {
              mappedErrors[fieldNames[key]] = value;
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
              : "Could not save application. Please check your details."
          );
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            throw new Error(
              responseText ||
                `Could not save application (${response.status}).`
            );
          }

          throw parseError;
        }
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(
        err.message || "Could not save application. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth) {
    return <p>Checking login...</p>;
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

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link href="/dashboard" style={styles.back}>
          ← Back to Dashboard
        </Link>

        <h1 style={styles.heading}>Add Application</h1>

        <p style={styles.subtitle}>
          Track your job application details.
        </p>

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

          <label style={styles.label}>
            Job Type *
            <select
              style={inputStyle("jobType")}
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.jobType)}
            >
              <option value="INTERNSHIP">Internship</option>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACT">Contract</option>
            </select>
            {fieldError("jobType")}
          </label>

          <label style={styles.label}>
            Status *
            <select
              style={inputStyle("status")}
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
            {fieldError("status")}
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

          {error && (
            <p style={styles.error} role="alert">
              {error}
            </p>
          )}

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
              {saving ? "Saving..." : "Save Application"}
            </button>
          </div>
        </form>
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
  },
};
