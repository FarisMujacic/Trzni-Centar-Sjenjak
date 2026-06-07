// src/pages/AdminAds.jsx
import React, { useState, useMemo, useEffect } from "react";
import { fetchAds, createAd, updateAd, deleteAd } from "../api/adsApi";

const BACKEND_BASE = "";

export default function AdminAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [formState, setFormState] = useState({
    id: null,
    title: "",
    category: "",
    description: "",
    imageFile: null,
    imagePreview: null,
  });

  const [formError, setFormError] = useState("");
  const isEditMode = formState.id != null;

  // ------- UČITAVANJE PODATAKA SA BACKENDA -------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchAds();
        setAds(data);
        setErrorMsg("");
      } catch (err) {
        console.error(err);
        setErrorMsg("Greška pri učitavanju reklama.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ------- FILTRIRANJE -------
  const filteredAds = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return ads.filter(
      (ad) =>
        ad.title.toLowerCase().includes(term) ||
        ad.category.toLowerCase().includes(term)
    );
  }, [ads, searchTerm]);

  // ------- FORMA -------
  const resetForm = () => {
    setFormState({
      id: null,
      title: "",
      category: "",
      description: "",
      imageFile: null,
      imagePreview: null,
    });
    setFormError("");
  };

  const handleEditClick = (ad) => {
    setFormState({
      id: ad.id,
      title: ad.title,
      category: ad.category,
      description: ad.description || "",
      imageFile: null,
      imagePreview: ad.imageUrl ? `${BACKEND_BASE}${ad.imageUrl}` : null,
    });
    setFormError("");
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Da li sigurno želiš obrisati ovu reklamu?")) return;

    try {
      await deleteAd(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
      if (formState.id === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert("Greška pri brisanju reklame.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setFormState((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.title.trim() || !formState.category.trim()) {
      setFormError("Naslov i kategorija su obavezni.");
      return;
    }

    try {
      setFormError("");

      const formData = new FormData();
      formData.append("title", formState.title.trim());
      formData.append("category", formState.category.trim());
      formData.append("description", formState.description.trim());
      if (formState.imageFile) {
        formData.append("image", formState.imageFile);
      }

      if (isEditMode) {
        const updated = await updateAd(formState.id, formData);
        setAds((prev) =>
          prev.map((ad) => (ad.id === updated.id ? updated : ad))
        );
      } else {
        const created = await createAd(formData);
        setAds((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setFormError("Greška pri snimanju reklame.");
    }
  };

  const isLoadingList = loading;

  // ------- RENDER -------
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        padding: "32px 24px",
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>
            Upravljanje reklamama
          </h1>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Pregled, pretraga, dodavanje i uređivanje reklama koje se prikazuju
            na stranici.
          </p>
          {errorMsg && (
            <p style={{ color: "#b91c1c", marginTop: 6, fontSize: "0.9rem" }}>
              {errorMsg}
            </p>
          )}
        </header>

        {/* Glavni layout */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          {/* Lijeva strana – lista reklama */}
          <section
            style={{
              flex: "1 1 380px",
              minWidth: 320,
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              padding: "16px 18px",
              backgroundColor: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                }}
              >
                Spisak reklama
              </h2>

              <input
                type="text"
                placeholder="Pretraži po nazivu ili kategoriji..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: "1 1 auto",
                  maxWidth: 260,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            {isLoadingList ? (
              <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                Učitavanje reklama...
              </p>
            ) : filteredAds.length === 0 ? (
              <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                Nema reklama (još). Dodaj prvu reklamu desno.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "60vh",
                  overflowY: "auto",
                }}
              >
                {filteredAds.map((ad) => {
                  const imageUrl = ad.imageUrl
                    ? `${BACKEND_BASE}${ad.imageUrl}`
                    : null;

                  return (
                    <article
                      key={ad.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: 12,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        alignItems: "center",
                      }}
                    >
                      {/* thumbnail */}
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 10,
                          overflow: "hidden",
                          backgroundColor: "#f3f4f6",
                          flexShrink: 0,
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={ad.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.7rem",
                              color: "#9ca3af",
                            }}
                          >
                            Nema slike
                          </div>
                        )}
                      </div>

                      {/* tekstualni dio */}
                      <div
                        style={{
                          flex: "1 1 auto",
                          minWidth: 0,
                          color: "#111827",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 2,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.95rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ad.title}
                          </div>

                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "2px 8px",
                              borderRadius: 999,
                              backgroundColor: "#f3f4f6",
                              color: "#111827",
                              flexShrink: 0,
                            }}
                          >
                            {ad.category || "Kategorija"}
                          </span>
                        </div>

                        {ad.description && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              opacity: 0.8,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ad.description}
                          </div>
                        )}
                      </div>

                      {/* akcije */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          alignItems: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => handleEditClick(ad)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "none",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            backgroundColor: "#111827",
                            color: "#ffffff",
                          }}
                        >
                          Uredi
                        </button>
                        <button
                          onClick={() => handleDeleteClick(ad.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "none",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                            fontWeight: 500,
                          }}
                        >
                          Obriši
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Desna strana – forma */}
          <section
            style={{
              flex: "1 1 380px",
              minWidth: 320,
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              padding: "16px 18px",
              backgroundColor: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                }}
              >
                {isEditMode ? "Uredi reklamu" : "Dodaj novu reklamu"}
              </h2>

              {isEditMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    fontSize: "0.8rem",
                    borderRadius: 999,
                    padding: "4px 10px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#e5e7eb",
                  }}
                >
                  Nova reklama
                </button>
              )}
            </div>

            {formError && (
              <p
                style={{
                  color: "#b91c1c",
                  fontSize: "0.85rem",
                  marginBottom: 8,
                }}
              >
                {formError}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Upload slike */}
              <label style={labelStyle}>
                Slika reklame
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={inputStyle}
                />
              </label>

              {formState.imagePreview && (
                <div
                  style={{
                    marginTop: 4,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.75,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Pregled slike:
                  </span>
                  <img
                    src={formState.imagePreview}
                    alt="Pregled reklame"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 180,
                      borderRadius: 12,
                      objectFit: "cover",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              )}

              {/* Naslov */}
              <label style={labelStyle}>
                Naslov *
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  placeholder="npr. Proljetna akcija -20%"
                />
              </label>

              {/* Kategorija */}
              <label style={labelStyle}>
                Kategorija *
                <select
                  value={formState.category}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">Odaberi kategoriju…</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Hrana i piće">Hrana i piće</option>
                  <option value="Beauty">Beauty & usluge</option>
                  <option value="Ostalo">Ostalo</option>
                </select>
              </label>

              {/* Opis */}
              <label style={labelStyle}>
                Opis
                <textarea
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                  placeholder="Kratak opis ponude, datumi važenja, uslovi…"
                />
              </label>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                }}
              >
                {isEditMode ? "Sačuvaj izmjene" : "Dodaj reklamu"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: "0.9rem",
  fontWeight: 500,
};

const inputStyle = {
  marginTop: 2,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
};
