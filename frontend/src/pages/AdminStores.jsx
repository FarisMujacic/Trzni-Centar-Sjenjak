// src/pages/AdminStores.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchStores,
  createStore,
  updateStore,
  deleteStore,
} from "../api/storesApi";

const CATEGORIES = [
  "Sve",
  "Shopping",
  "Hrana i piće",
  "Beauty & usluge",
  "Ostalo",
];

/**
 * Pomoćna funkcija – formira “ljudski” string radnog vremena
 * iz tri polja (pon–pet, subota, nedjelja).
 */
function formatWorkHours(weekdays, saturday, sunday) {
  const wd = weekdays.trim();
  const sa = saturday.trim();
  const su = sunday.trim();

  if (wd && sa === wd && su === wd) {
    return `Pon–Ned ${wd}`;
  }

  if (wd && sa === wd && !su) {
    return `Pon–Sub ${wd}`;
  }

  const parts = [];
  if (wd) parts.push(`Pon–Pet ${wd}`);
  if (sa) parts.push(`Sub ${sa}`);
  if (su) parts.push(`Ned ${su}`);

  return parts.join(" · ");
}

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Sve");

  const [formState, setFormState] = useState({
    id: null,
    name: "",
    category: "",
    floor: "",
    workHoursWeekdays: "",
    workHoursSaturday: "",
    workHoursSunday: "",
    description: "",
    contactPhone: "",
    imageFiles: [], // nove slike iz inputa
    imagePreviews: [], // URL-ovi za preview (cover + galerija)
    existingImageUrl: null,
  });

  const [formError, setFormError] = useState("");
  const isEditMode = formState.id != null;

  // ------- UČITAVANJE PODATAKA SA BACKENDA -------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const raw = await fetchStores(
          activeCategory === "Sve" ? undefined : activeCategory
        );

        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.stores)
          ? raw.stores
          : [];

        console.log("Stores from API:", list);
        setStores(list);
        setErrorMsg("");
      } catch (err) {
        console.error(err);
        setErrorMsg("Greška pri učitavanju prodavnica.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeCategory]);

  // ------- FILTRIRANJE -------
  const filteredStores = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return stores.filter((store) => {
      const name = (store.name || store.title || "").toLowerCase();
      const category = (store.category || "").toLowerCase();

      if (!term) return true;
      return name.includes(term) || category.includes(term);
    });
  }, [stores, searchTerm]);

  // ------- FORMA -------

  const resetForm = () => {
    setFormState({
      id: null,
      name: "",
      category: "",
      floor: "",
      workHoursWeekdays: "",
      workHoursSaturday: "",
      workHoursSunday: "",
      description: "",
      contactPhone: "",
      imageFiles: [],
      imagePreviews: [],
      existingImageUrl: null,
    });
    setFormError("");
  };

  const handleEditClick = (store) => {
    const baseUrl = "";

    const coverUrl = store.imageUrl ? `${baseUrl}${store.imageUrl}` : null;

    const galleryPreviews = Array.isArray(store.galleryUrls)
      ? store.galleryUrls.map((u) =>
          u.startsWith("http") ? u : `${baseUrl}${u}`
        )
      : [];

 const previews = [];

if (coverUrl) {
  previews.push({ type: "image", url: coverUrl });
}

galleryPreviews.forEach((url) => {
  if (!previews.some(p => p.url === url)) {
    previews.push({ type: "image", url });
  }
});


    setFormState({
      id: store.id,
      name: store.name || "",
      category: store.category || "",
      floor: store.floor || "",
      workHoursWeekdays: store.workHoursWeekdays || store.workHours || "",
      workHoursSaturday: store.workHoursSaturday || "",
      workHoursSunday: store.workHoursSunday || "",
      description: store.description || "",
      contactPhone: store.contactPhone || "",
      imageFiles: [],
      imagePreviews: previews,
      existingImageUrl: coverUrl || previews[0] || null,
    });
    setFormError("");
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Da li sigurno želiš obrisati ovu prodavnicu?")) return;

    try {
      await deleteStore(id);
      setStores((prev) => prev.filter((s) => s.id !== id));
      if (formState.id === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert("Greška pri brisanju prodavnice.");
    }
  };

  const handleImageChange = (e) => {
  const newFiles = Array.from(e.target.files || []);
  if (!newFiles.length) return;

  setFormState((prev) => {
    const newPreviews = newFiles.map((file) => ({
      type: file.type.startsWith("video/") ? "video" : "image",
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    return {
      ...prev,
      imageFiles: [...prev.imageFiles, ...newFiles],      // ovdje su sad i video fajlovi
      imagePreviews: [...prev.imagePreviews, ...newPreviews], // sad je array objekata
    };
  });

  e.target.value = "";
};


  // brisanje jedne slike iz previewa
  const handleRemoveImage = (indexToRemove) => {
    setFormState((prev) => {
      const newFiles = [...prev.imageFiles];
      const newPreviews = [...prev.imagePreviews];

      newFiles.splice(indexToRemove, 1);
      newPreviews.splice(indexToRemove, 1);

      return {
        ...prev,
        imageFiles: newFiles,
        imagePreviews: newPreviews,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formState.imageFiles.length > 0) {
  const first = formState.imageFiles[0];
  if (first.type.startsWith("video/")) {
    setFormError("Prvi fajl mora biti slika (cover). Video dodaj poslije.");
    return;
  }
}


    const name = formState.name.trim();
    const category = formState.category.trim();
    const weekdays = formState.workHoursWeekdays.trim();
    const saturday = formState.workHoursSaturday.trim();
    const sunday = formState.workHoursSunday.trim();

    const hasExistingImage = !!formState.existingImageUrl;
    const hasNewImages = formState.imageFiles.length > 0;
    const hasAnyImage = hasExistingImage || hasNewImages;

    if (!name || !category) {
      setFormError("Naziv prodavnice i kategorija su obavezni.");
      return;
    }

    if (!weekdays) {
      setFormError("Radno vrijeme za PON–PET je obavezno.");
      return;
    }

    if (!hasAnyImage && !isEditMode) {
      setFormError("Potrebno je dodati najmanje jednu sliku prodavnice.");
      return;
    }

    try {
      setFormError("");

      const workHoursFormatted = formatWorkHours(weekdays, saturday, sunday);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("floor", formState.floor.trim());
      formData.append("workHours", workHoursFormatted);
      formData.append("workHoursWeekdays", weekdays);
      formData.append("workHoursSaturday", saturday);
      formData.append("workHoursSunday", sunday);
      formData.append("description", formState.description.trim());
      formData.append("contactPhone", formState.contactPhone.trim());

      // slike – prva je cover, ostale su galerija
      if (hasNewImages) {
        formState.imageFiles.forEach((file, index) => {
          const fieldName = index === 0 ? "image" : "galleryImages";
          formData.append(fieldName, file);
        });
      }

      if (isEditMode) {
        const updated = await updateStore(formState.id, formData);
        setStores((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
      } else {
        const created = await createStore(formData);
        setStores((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setFormError("Greška pri snimanju prodavnice.");
    }
  };

  // ------- RENDER -------

  const previewsToShow =
  formState.imagePreviews.length > 0
    ? formState.imagePreviews
    : formState.existingImageUrl
    ? [{ type: "image", url: formState.existingImageUrl }]
    : [];


  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        padding: "32px 24px",
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
            Upravljanje prodavnicama
          </h1>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Odaberi odjeljak, pregledaj postojeće radnje, dodaj nove ili izmijeni
            podatke (slike, sprat, radno vrijeme, kontakt…)
          </p>
          {errorMsg && (
            <p style={{ color: "#b91c1c", marginTop: 6, fontSize: "0.9rem" }}>
              {errorMsg}
            </p>
          )}
        </header>

        {/* Filter po odjeljku */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>
            Odjeljak:
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border:
                    activeCategory === cat
                      ? "1px solid #111827"
                      : "1px solid #d1d5db",
                  backgroundColor:
                    activeCategory === cat ? "#111827" : "#f9fafb",
                  color: activeCategory === cat ? "#ffffff" : "#111827",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Glavni layout */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          {/* Lijevo – lista prodavnica */}
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
                Spisak prodavnica
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

            {loading ? (
              <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                Učitavanje prodavnica...
              </p>
            ) : filteredStores.length === 0 ? (
              <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                Nema prodavnica u ovom odjeljku. Dodaj prvu prodavnicu desno.
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
                {filteredStores.map((store) => (
                  <article
                    key={store.id}
                    style={{
                      display: "flex",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: 12,
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {/* thumbnail slike */}
                    {store.imageUrl ? (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 12,
                          overflow: "hidden",
                          flexShrink: 0,
                          border: "1px solid #e5e7eb",
                          backgroundColor: "#f3f4f6",
                        }}
                      >
                        <img
                          src={store.imageUrl}
                          alt={store.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 12,
                          border: "1px dashed #d1d5db",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          color: "#9ca3af",
                          flexShrink: 0,
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        Bez slike
                      </div>
                    )}

                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          marginBottom: 2,
                        }}
                      >
                        {store.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          opacity: 0.75,
                        }}
                      >
                        {store.category || "-"} · {store.floor || "Sprat ?"}
                      </div>
                      {store.workHours && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            opacity: 0.75,
                          }}
                        >
                          Radno vrijeme: {store.workHours}
                        </div>
                      )}
                      {store.contactPhone && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            opacity: 0.75,
                          }}
                        >
                          Tel: {store.contactPhone}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        alignItems: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => handleEditClick(store)}
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
                        onClick={() => handleDeleteClick(store.id)}
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
                ))}
              </div>
            )}
          </section>

          {/* Desno – forma */}
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
                {isEditMode ? "Uredi prodavnicu" : "Dodaj novu prodavnicu"}
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
                  Nova prodavnica
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
              {/* Slike */}
              <label style={labelStyle}>
                Fotografije radnje (prva je naslovna) *
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleImageChange}
                  style={inputStyle}
                />
                <span
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.7,
                    marginTop: 2,
                  }}
                >
                  Možeš odabrati više slika; prva će biti cover na javnoj
                  stranici.
                </span>
              </label>

             

                   {previewsToShow.length > 0 && (
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
      Pregled slika:
    </span>

    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      {previewsToShow.map((src, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            flex: "0 0 auto",
          }}
        >
          <div
            style={{
              position: "relative",
              width: idx === 0 ? 160 : 70,
              height: idx === 0 ? 120 : 70,
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              backgroundColor: "#f3f4f6",
            }}
          >
            {src.type === "video" ? (
  <video
    src={src.url}
    controls
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
  />
) : (
  <img
    src={src.url}
    alt={`Pregled ${idx + 1}`}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
  />
)}


            {idx === 0 && (
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  padding: "2px 6px",
                  fontSize: "0.65rem",
                  borderRadius: 999,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  color: "#fff",
                }}
              >
                Cover
              </span>
            )}

            <button
              type="button"
              onClick={() => handleRemoveImage(idx)}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 20,
                height: 20,
                borderRadius: "999px",
                border: "none",
                backgroundColor: "rgba(0,0,0,0.65)",
                color: "#fff",
                fontSize: "0.7rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
              aria-label="Obriši sliku"
            >
              
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}



              {/* Naziv */}
              <label style={labelStyle}>
                Naziv prodavnice *
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  placeholder="npr. Zlatara Zilić"
                />
              </label>

              {/* Kategorija / odjeljak */}
              <label style={labelStyle}>
                Odjeljak / kategorija *
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
                  <option value="">Odaberi odjeljak…</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Hrana i piće">Hrana i piće</option>
                  <option value="Beauty & usluge">Beauty & usluge</option>
                  <option value="Ostalo">Ostalo</option>
                </select>
              </label>

              {/* Sprat */}
              <label style={labelStyle}>
                Sprat
                <input
                  type="text"
                  value={formState.floor}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      floor: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  placeholder="npr. Prizemlje, I sprat…"
                />
              </label>

              {/* Radno vrijeme – struktura */}
              <fieldset
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "10px 10px 8px",
                }}
              >
                <legend
                  style={{
                    fontSize: "0.85rem",
                    padding: "0 6px",
                    opacity: 0.85,
                  }}
                >
                  Radno vrijeme *
                </legend>

                <label style={{ ...labelStyle, fontWeight: 500 }}>
                  Pon–Pet
                  <input
                    type="text"
                    value={formState.workHoursWeekdays}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        workHoursWeekdays: e.target.value,
                      }))
                    }
                    style={inputStyle}
                    placeholder="npr. 09–21h"
                  />
                </label>

                <label style={{ ...labelStyle, marginTop: 6 }}>
                  Subota (opcionalno)
                  <input
                    type="text"
                    value={formState.workHoursSaturday}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        workHoursSaturday: e.target.value,
                      }))
                    }
                    style={inputStyle}
                    placeholder="npr. 09–18h ili isto kao pon–pet"
                  />
                </label>

                <label style={{ ...labelStyle, marginTop: 6 }}>
                  Nedjelja (opcionalno)
                  <input
                    type="text"
                    value={formState.workHoursSunday}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        workHoursSunday: e.target.value,
                      }))
                    }
                    style={inputStyle}
                    placeholder="npr. 10–18h ili 'zatvoreno'"
                  />
                </label>
              </fieldset>

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
                  placeholder="Kratak opis radnje, brendovi, usluge…"
                />
              </label>

              {/* Kontakt telefon – opcionalan */}
              <label style={labelStyle}>
                Kontakt telefon (opcionalno)
                <input
                  type="tel"
                  value={formState.contactPhone}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      contactPhone: e.target.value,
                    }))
                  }
                  style={inputStyle}
                  placeholder="+387 35 000 000"
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
                {isEditMode ? "Sačuvaj izmjene" : "Dodaj prodavnicu"}
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
