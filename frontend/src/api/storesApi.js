// src/api/storesApi.js
import client from "./client";

const STORES_BASE = "/api/stores";

// Učitaj listu radnji (opciono po kategoriji)
export async function fetchStores(category) {
  const params = {};
  if (category) {
    params.category = category;
  }

  const res = await client.get(STORES_BASE, { params });
  return res.data;
}

// Kreiraj novu radnju
export async function createStore(formData) {
  const res = await client.post(STORES_BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Ažuriraj radnju
export async function updateStore(id, formData) {
  const res = await client.put(`${STORES_BASE}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Obriši radnju
export async function deleteStore(id) {
  await client.delete(`${STORES_BASE}/${id}`);
}

// 🔹 NOVO – detalji jedne radnje (za StoreDetails)
export async function fetchStoreById(id) {
  const res = await client.get(`${STORES_BASE}/${id}`);
  return res.data;
}
