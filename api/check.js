
const OPR_ENDPOINT =
  "https://openpagerank.keywordseverywhere.com/v1/domains/bulk";

const MAX_DOMAINS = 100;

function getAllowedOrigin() {
  return process.env.FRONTEND_ORIGIN || "";
}

function setCorsHeaders(req, res) {
  const allowedOrigin = getAllowedOrigin();
  const requestOrigin = req.headers.origin || "";

  if (
    allowedOrigin &&
    requestOrigin === allowedOrigin
  ) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  res.setHeader(
    "Access-Control-Max-Age",
    "86400"
  );
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    error: message
  });
}

function normalizeDomain(value) {
  if (typeof value !== "string") {
    return "";
  }

  let domain = value.trim();

  if (!domain) {
    return "";
  }

  // Keep normalization simple.
  // OpenPageRank itself accepts domains and URLs.
  return domain;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  // Handle browser CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Allow only POST requests
  if (req.method !== "POST") {
    return sendError(
      res,
      405,
      "Method not allowed"
    );
  }

  const apiKey = process.env.OPR_API_KEY;

  if (!apiKey) {
    console.error("OPR_API_KEY is not configured.");

    return sendError(
      res,
      500,
      "The API is not configured."
    );
  }

  try {
    const body = req.body || {};
    const rawDomains = body.domains;

    if (!Array.isArray(rawDomains)) {
      return sendError(
        res,
        400,
        "The domains field must be an array."
      );
    }

    if (rawDomains.length === 0) {
      return sendError(
        res,
        400,
        "Please provide at least one domain."
      );
    }

    if (rawDomains.length > MAX_DOMAINS) {
      return sendError(
        res,
        400,
        `Maximum ${MAX_DOMAINS} domains per request.`
      );
    }

    const domains = [
      ...new Set(
        rawDomains
          .map(normalizeDomain)
          .filter(Boolean)
      )
    ];

    if (domains.length === 0) {
      return sendError(
        res,
        400,
        "No valid domains were provided."
      );
    }

    if (domains.length > MAX_DOMAINS) {
      return sendError(
        res,
        400,
        `Maximum ${MAX_DOMAINS} unique domains per request.`
      );
    }

    const apiResponse = await fetch(
      OPR_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          domains,
          include_history: false
        })
      }
    );

    const responseText = await apiResponse.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "OpenPageRank returned a non-JSON response."
      );

      return sendError(
        res,
        502,
        "The upstream API returned an invalid response."
      );
    }

    if (!apiResponse.ok) {
      console.error(
        "OpenPageRank request failed:",
        apiResponse.status
      );

      return sendError(
        res,
        apiResponse.status >= 400 &&
        apiResponse.status < 600
          ? apiResponse.status
          : 502,
        data.error?.message ||
        data.error ||
        "OpenPageRank request failed."
      );
    }

    // Return the provider's result data.
    // The frontend only displays the expected fields.
    return res.status(200).json({
      as_of: data.as_of || null,
      count: data.count || 0,
      results: Array.isArray(data.results)
        ? data.results
        : [],
      invalid: Array.isArray(data.invalid)
        ? data.invalid
        : []
    });

  } catch (error) {
    console.error(
      "Unexpected server error:",
      error.message
    );

    return sendError(
      res,
      500,
      "Unable to process the request."
    );
  }
}
