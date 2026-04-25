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

export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    headers: { Accept: "application/json" }
  });

  return parseJson(response);
};

export const getRoles = async () => {
  const response = await fetch(`${API_BASE_URL}/api/roles`, {
    headers: { Accept: "application/json" }
  });

  return parseJson(response);
};

export async function updateServiceMode(binId, enabled) {
  const response = await fetch(`${API_BASE_URL}/api/bins/${binId}/service-mode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      enabled,
      requested_by: "admin"
    })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update service mode");
  }

  return result.data || result;
}

export async function approveRFID(data) {
  const response = await fetch(`${API_BASE_URL}/api/rfid/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to approve RFID");
  }

  return result;
}
