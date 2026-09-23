
/*
  OpenPageRank Checker

  GitHub Pages frontend
  Vercel backend

  Update API_BASE_URL after deploying your Vercel project.
*/

const API_BASE_URL = "https://YOUR-VERCEL-PROJECT.vercel.app";

const MAX_DOMAINS = 100;

const domainsInput = document.getElementById("domains");
const checkBtn = document.getElementById("checkBtn");
const checkBtnText = document.getElementById("checkBtnText");
const loadingSpinner = document.getElementById("loadingSpinner");
const clearBtn = document.getElementById("clearBtn");
const domainCount = document.getElementById("domainCount");
const statusText = document.getElementById("status");

const resultsSection = document.getElementById("resultsSection");
const resultsBody = document.getElementById("resultsBody");
const resultsSummary = document.getElementById("summary");
const emptyResults = document.getElementById("emptyResults");
const exportBtn = document.getElementById("exportBtn");

const yearElement = document.getElementById("year");

let currentResults = [];

yearElement.textContent = new Date().getFullYear();

/* -------------------------
   Domain parsing
------------------------- */

function normalizeDomain(input) {
  let value = String(input || "").trim();

  if (!value) {
    return "";
  }

  // Remove whitespace
  value = value.replace(/\s+/g, "");

  // Add a protocol for URL parsing
  const urlValue = /^https?:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    const url = new URL(urlValue);

    let hostname = url.hostname.toLowerCase();

    // Remove www prefix
    hostname = hostname.replace(/^www\./, "");

    // Remove trailing dot
    hostname = hostname.replace(/\.$/, "");

    return hostname;

  } catch {
    return value.toLowerCase();
  }
}

function getDomains() {
  const rawValues = domainsInput.value
    .split(/[\n,]+/)
    .map(value => value.trim())
    .filter(Boolean);

  const normalizedDomains = rawValues
    .map(normalizeDomain)
    .filter(Boolean);

  return [...new Set(normalizedDomains)];
}

function updateDomainCount() {
  const count = getDomains().length;

  domainCount.textContent =
    `${count} ${count === 1 ? "domain" : "domains"}`;
}

domainsInput.addEventListener("input", updateDomainCount);

/* -------------------------
   Status
------------------------- */

function setStatus(message, type = "") {
  statusText.textContent = message;
  statusText.className = "status";

  if (type) {
    statusText.classList.add(type);
  }
}

function setLoading(isLoading) {
  checkBtn.disabled = isLoading;
  checkBtnText.textContent = isLoading
    ? "Checking..."
    : "Check Authority";

  loadingSpinner.classList.toggle("hidden", !isLoading);
}

/* -------------------------
   Summary
------------------------- */

function renderSummary(results, invalidCount = 0) {
  const foundCount = results.filter(
    item => item.found === true
  ).length;

  const notFoundCount = results.filter(
    item => item.found === false
  ).length;

  resultsSummary.innerHTML = "";

  const summaryItems = [
    ["Returned", results.length],
    ["Found", foundCount],
    ["Not found", notFoundCount],
    ["Invalid", invalidCount]
  ];

  summaryItems.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "summary-item";

    const strong = document.createElement("strong");
    strong.textContent = value;

    item.appendChild(strong);
    item.appendChild(document.createTextNode(` ${label}`));

    resultsSummary.appendChild(item);
  });
}

/* -------------------------
   Results rendering
------------------------- */

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return numericValue.toLocaleString("en-US");
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return String(value);
}

function createCell(text, className = "") {
  const cell = document.createElement("td");

  if (className) {
    cell.className = className;
  }

  cell.textContent = text;

  return cell;
}

function createStatusBadge(item) {
  const badge = document.createElement("span");
  badge.className = "status-badge";

  if (item.found === true) {
    badge.classList.add("status-found");
    badge.textContent = "Found";

  } else if (item.found === false) {
    badge.classList.add("status-not-found");
    badge.textContent = "Not found";

  } else {
    badge.classList.add("status-invalid");
    badge.textContent = "Unknown";
  }

  return badge;
}

function renderResults(results, invalidDomains = []) {
  resultsBody.innerHTML = "";

  currentResults = results.map(item => ({
    domain: item.domain || "",
    open_page_rank: item.open_page_rank ?? "",
    rank: item.rank ?? "",
    referring_domains: item.referring_domains ?? "",
    found: item.found === true
  }));

  renderSummary(results, invalidDomains.length);

  if (currentResults.length === 0) {
    emptyResults.classList.remove("hidden");
    exportBtn.disabled = true;
    return;
  }

  emptyResults.classList.add("hidden");

  currentResults.forEach(item => {
    const row = document.createElement("tr");

    row.appendChild(
      createCell(item.domain, "domain-cell")
    );

    row.appendChild(
      createCell(
        formatScore(item.open_page_rank),
        "score-cell"
      )
    );

    row.appendChild(
      createCell(formatNumber(item.rank))
    );

    row.appendChild(
      createCell(formatNumber(item.referring_domains))
    );

    const statusCell = document.createElement("td");
    statusCell.appendChild(createStatusBadge(item));
    row.appendChild(statusCell);

    resultsBody.appendChild(row);
  });

  exportBtn.disabled = false;
}

/* -------------------------
   API request
------------------------- */

async function checkDomains() {
  const domains = getDomains();

  if (domains.length === 0) {
    setStatus("Please enter at least one valid domain.", "error");
    return;
  }

  if (domains.length > MAX_DOMAINS) {
    setStatus(
      `Please enter no more than ${MAX_DOMAINS} unique domains.`,
      "error"
    );

    return;
  }

  if (
    !API_BASE_URL ||
    API_BASE_URL.includes("YOUR-VERCEL-PROJECT")
  ) {
    setStatus(
      "Please configure your Vercel API URL in script.js.",
      "error"
    );

    return;
  }

  setLoading(true);
  setStatus("Checking domains. Please wait...");
  resultsSection.classList.remove("hidden");
  resultsBody.innerHTML = "";
  resultsSummary.innerHTML = "";
  emptyResults.classList.add("hidden");
  exportBtn.disabled = true;
  currentResults = [];

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          domains
        })
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || "The API request failed."
      );
    }

    const results = Array.isArray(data.results)
      ? data.results
      : [];

    const invalidDomains = Array.isArray(data.invalid)
      ? data.invalid
      : [];

    renderResults(results, invalidDomains);

    setStatus(
      `Completed. Returned ${results.length} results.`,
      "success"
    );

  } catch (error) {
    console.error("Checker error:", error);

    setStatus(
      error.message ||
      "Unable to connect to the API.",
      "error"
    );

  } finally {
    setLoading(false);
  }
}

checkBtn.addEventListener("click", checkDomains);

/* -------------------------
   Clear input
------------------------- */

clearBtn.addEventListener("click", () => {
  domainsInput.value = "";

  updateDomainCount();

  resultsSection.classList.add("hidden");
  resultsBody.innerHTML = "";
  resultsSummary.innerHTML = "";
  currentResults = [];

  setStatus("");
  exportBtn.disabled = true;
});

/* -------------------------
   CSV export
------------------------- */

function csvEscape(value) {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV() {
  if (currentResults.length === 0) {
    setStatus("No results available for export.", "error");
    return;
  }

  const headers = [
    "Domain",
    "OpenPageRank",
    "Global Rank",
    "Referring Domains",
    "Status"
  ];

  const rows = currentResults.map(item => [
    item.domain,
    item.open_page_rank,
    item.rank,
    item.referring_domains,
    item.found ? "Found" : "Not found"
  ]);

  const csvContent = [
    headers,
    ...rows
  ]
    .map(row => row.map(csvEscape).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csvContent],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "openpagerank-results.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", downloadCSV);

/* Initial count */
updateDomainCount();
