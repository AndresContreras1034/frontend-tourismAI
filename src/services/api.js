const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * 🔐 Headers
 */
const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");

  return {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * 🔥 Response handler
 */
const handleResponse = async (response) => {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} - ${data?.message || "Error en request"}`
    );
  }

  return data;
};

/**
 * =========================
 * 🌐 BASE HTTP METHODS
 * =========================
 */

export const get = async (endpoint) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: getHeaders(),
  });

  return handleResponse(res);
};

export const post = async (endpoint, body) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse(res);
};

export const patch = async (endpoint, body) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse(res);
};

/**
 * =========================
 * 👤 USER
 * =========================
 */

export const getCurrentUser = async () => {
  return await get("/user");
};

export const updateUser = async (data) => {
  return await patch("/user", data);
};

/**
 * =========================
 * 🌍 PROFILE (ONBOARDING CORE)
 * =========================
 */

export const saveUserProfile = async (data) => {
  return await post("/profile", data);
};

export const getUserProfile = async () => {
  return await get("/profile");
};

export const updateUserProfile = async (data) => {
  return await patch("/profile", data);
};

/**
 * =========================
 * 🧠 RECOMMENDATIONS (KEY MVP LOGIC)
 * =========================
 *
 * ⚠️ IMPORTANTE:
 * Esto NO depende del backend.
 * Tu MVP vive aquí.
 */

export const getRecommendations = async (filters, plans = []) => {
  // 🔥 Si luego tienes backend, puedes cambiar esto a:
  // return await post("/recommendations", filters);

  // 🧠 MOCK LOGIC (frontend scoring base)
  const scored = plans.map((plan) => {
    let score = 0;

    // budget match
    if (plan.profile_match?.budget === filters.budget) score += 3;

    // interest match
    const matchInterest =
      plan.profile_match?.interests?.filter((i) =>
        filters.interests?.includes(i)
      )?.length || 0;

    score += matchInterest * 5;

    // companions match
    if (
      plan.profile_match?.companions?.includes(filters.companion)
    ) {
      score += 2;
    }

    // safety bonus
    if (plan.safety?.level === "bajo") score += 3;

    return {
      ...plan,
      score,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
};

/**
 * =========================
 * 📸 AVATAR
 * =========================
 */

export const uploadAvatar = async (file) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_URL}/user/avatar`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  return handleResponse(res);
};