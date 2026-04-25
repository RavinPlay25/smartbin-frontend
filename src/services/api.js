const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

const parseJson = async (response) => {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const json = await response.json();

  if (Array.isArray(json?.data)) {
    return json.data;
  }

  if (Array.isArray(json?.data?.data)) {
    return json.data.data;
  }

  return [];
};

export const getBins = async () => {
  const res = await fetch(`${API_BASE}/bins`, {
    headers: { Accept: "application/json" }
  });

  return parseJson(res);
};

export const getLogs = async () => {
  const res = await fetch(`${API_BASE}/logs`, {
    headers: { Accept: "application/json" }
  });

  return parseJson(res);
};