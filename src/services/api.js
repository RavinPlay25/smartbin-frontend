const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

console.log("API_BASE_URL:", API_BASE_URL);

const parseJson = async (response) => {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
};

export const getBins = async () => {
  const response = await fetch(`${API_BASE_URL}/api/bins`, {
    headers: { Accept: "application/json" }
  });

  return parseJson(response);
};

export const getLogs = async () => {
  const response = await fetch(`${API_BASE_URL}/api/logs`, {
    headers: { Accept: "application/json" }
  });

  return parseJson(response);
};
