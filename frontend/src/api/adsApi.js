// src/api/adsApi.js
import client from "./client";

// GET sve reklame
export async function fetchAds() {
  const res = await client.get("/api/ads");
  return res.data;
}

// POST nova reklama
export async function createAd(formData) {
  const res = await client.post("/api/ads", formData);
  return res.data;
}

// PUT update postojeće reklame
export async function updateAd(id, formData) {
  const res = await client.put(`/api/ads/${id}`, formData);
  return res.data;
}

// DELETE reklama
export async function deleteAd(id) {
  const res = await client.delete(`/api/ads/${id}`);
  return res.data;
}
