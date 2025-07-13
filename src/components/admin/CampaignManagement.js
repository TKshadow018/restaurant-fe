import React, { useState, useEffect } from "react";
import Banner from "../Banner";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useSelector } from "react-redux";

const initialForm = {
  image: "",
  title: "",
  subtitle: "",
  text: "",
  textPosition: "center",
  isMain: false,
  campainStartDate: "",
  campainEndDate: "",
  bannerColor: {
    title: "#ffcc00",
    subtitle: "#ff9900",
    text: "#ffffff",
    duration: "#ffffff",
  },
  eligibleDishes: [],
};

const CampaignManagement = () => {
  // Get food list from Redux
  const foods = useSelector((state) => state.menu.menuItems);

  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch banners from Firestore in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "campaigns"), (snapshot) => {
      setBanners(
        snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, multiple, options } = e.target;
    if (name === "eligibleDishes") {
      // Multi-select
      const selected = Array.from(options)
        .filter((opt) => opt.selected)
        .map((opt) => opt.value);
      setForm({ ...form, eligibleDishes: selected });
    } else if (name.startsWith("bannerColor.")) {
      setForm({
        ...form,
        bannerColor: {
          ...form.bannerColor,
          [name.split(".")[1]]: value,
        },
      });
    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, ...formToSave } = form; // Exclude id if present
    if (editId) {
      // Update existing banner (do not send id)
      await updateDoc(doc(db, "campaigns", editId), formToSave);
      setEditId(null);
    } else {
      // Add new banner
      await addDoc(collection(db, "campaigns"), formToSave);
    }
    setForm(initialForm);
  };

  const handleDelete = async (id) => {
        console.log("Deleting banner with ID:", id);
    // Scroll to top first
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await deleteDoc(doc(db, "campaigns", id));
    if (editId === id) {
      setEditId(null);
      setForm(initialForm);
    }
  };

  const handleEdit = (banner) => {
    // Scroll to top first
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Exclude id from form state
    const { id, ...rest } = banner;
    setForm({
      ...rest,
      eligibleDishes: Array.isArray(rest.eligibleDishes) ? rest.eligibleDishes : [],
      bannerColor: {
        ...initialForm.bannerColor,
        ...rest.bannerColor,
      },
    });
    setEditId(banner.id);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm(initialForm);
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-primary">Campaign Management</h2>
      <form className="card p-4 mb-5" onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Image URL</label>
            <input
              type="text"
              className="form-control"
              name="image"
              value={form.image}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-control"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Subtitle</label>
            <input
              type="text"
              className="form-control"
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Text</label>
            <input
              type="text"
              className="form-control"
              name="text"
              value={form.text}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Text Position</label>
            <select
              className="form-select"
              name="textPosition"
              value={form.textPosition}
              onChange={handleChange}
            >
              <option value="center">Center</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="isMain"
                checked={form.isMain}
                onChange={handleChange}
                id="isMain"
              />
              <label className="form-check-label" htmlFor="isMain">
                Main Banner
              </label>
            </div>
          </div>
          <div className="col-md-3">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              name="campainStartDate"
              value={form.campainStartDate}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              name="campainEndDate"
              value={form.campainEndDate}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Title Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              name="bannerColor.title"
              value={form.bannerColor.title}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Subtitle Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              name="bannerColor.subtitle"
              value={form.bannerColor.subtitle}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Text Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              name="bannerColor.text"
              value={form.bannerColor.text}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Duration Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              name="bannerColor.duration"
              value={form.bannerColor.duration}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-12">
            <label className="form-label">Eligible Dishes</label>
            <select
              className="form-select"
              name="eligibleDishes"
              multiple
              value={form.eligibleDishes || []}
              onChange={handleChange}
            >
              {foods.map((food) => {
                const displayName = typeof food.name === 'string' 
                  ? food.name 
                  : food.name?.english || food.name?.swedish || 'Unnamed Item';
                return (
                  <option key={food.id} value={food.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
            <div className="form-text">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple dishes.
            </div>
          </div>
        </div>
        <div className="mt-4 d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            {editId ? "Update Banner" : "Add Banner"}
          </button>
          {editId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h4 className="mb-3">Preview</h4>
      {loading && <div className="alert alert-info">Loading banners...</div>}
      {!loading && banners.length === 0 && (
        <div className="alert alert-info">No banners added yet.</div>
      )}
      {banners.map((banner) => (
        <div key={banner.id} className="mb-4 position-relative p-2 border border-secondary border-lg">
          <Banner {...banner} />
          <div className="position-absolute top-0 end-0 m-3 d-flex flex-column gap-2">
            <button
              className="btn btn-warning"
              onClick={() => handleEdit(banner)}
            >
              Edit
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(banner.id)}
            >
              Delete
            </button>
          </div>
          {banner.eligibleDishes && banner.eligibleDishes.length > 0 && (
            <div className="p-2">
              <strong>Eligible Dishes:</strong>
              <ul>
                {banner.eligibleDishes.map((dishId) => {
                  const dish = foods.find((f) => f.id === dishId);
                  return <li key={dishId}>{dish ? dish.name : dishId}</li>;
                })}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CampaignManagement;