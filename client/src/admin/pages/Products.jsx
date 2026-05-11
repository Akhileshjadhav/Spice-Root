import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import ActionButton from "../components/ActionButton";
import DataTable from "../components/DataTable";
import { db } from "../../firebase";
import {
  formatPrice,
  normalizeFirestoreProduct,
  seedOriginalCatalog,
} from "../../lib/catalog";
import { mergeCategoriesWithProducts, subscribeToCategories } from "../../lib/adminStore";
import AddProductModal from "./AddProductModal";

const VIEW_MODES = [
  { key: "catalog", label: "Live Catalog" },
  { key: "base", label: "1 KG Base Pricing" },
  { key: "discounts", label: "3 KG + 5 KG Discounts" },
];

const Products = () => {
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewMode, setViewMode] = useState("catalog");
  const [restoring, setRestoring] = useState(false);
  const [categoryDocs, setCategoryDocs] = useState([]);
  const seedAttemptedRef = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const firebaseProducts = snapshot.docs
        .map((docItem) => normalizeFirestoreProduct({ id: docItem.id, ...docItem.data() }))
        .filter(Boolean);

      setProducts(firebaseProducts);

      if (firebaseProducts.length === 0 && !seedAttemptedRef.current) {
        seedAttemptedRef.current = true;
        seedOriginalCatalog().catch((error) => {
          console.error("Failed to restore original products:", error);
        });
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCategories(
      (categories) => setCategoryDocs(categories),
      (error) => console.error("Failed to load categories:", error)
    );

    return () => unsubscribe();
  }, []);

  const categoryOptions = useMemo(
    () => mergeCategoriesWithProducts(categoryDocs, products).map((item) => item.name),
    [categoryDocs, products]
  );

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this product?");
    if (!confirmDelete) {
      return;
    }

    await deleteDoc(doc(db, "products", id));
  };

  const handleEdit = (row) => {
    setEditProduct(row);
    setShowModal(true);
  };

  const handleRestoreOriginals = async () => {
    try {
      setRestoring(true);
      await seedOriginalCatalog();
      window.alert("Original products restored in Firebase.");
    } catch (error) {
      console.error("Failed to restore products:", error);
      window.alert("Could not restore original products right now.");
    } finally {
      setRestoring(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((row) => {
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || row.category === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        [row.name, row.category, row.slug, row.ingredients]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [categoryFilter, products, searchQuery, statusFilter]);

  const columns = useMemo(() => {
    const imageColumn = {
      key: "image",
      label: "Image",
      render: (row) => (
        <img
          src={row.image || "https://via.placeholder.com/50"}
          alt={row.name || "product"}
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "8px",
            objectFit: "cover",
          }}
        />
      ),
    };

    const actionColumn = {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => handleEdit(row)}
            style={buttonStyles.edit}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleDelete(row.documentId || row.id)}
            style={buttonStyles.delete}
          >
            Delete
          </button>
        </div>
      ),
    };

    if (viewMode === "base") {
      return [
        imageColumn,
        { key: "name", label: "Product" },
        { key: "category", label: "Category" },
        {
          key: "basePrice",
          label: "1 KG Base Price",
          render: (row) => formatPrice(row.basePrice || row.price),
        },
        { key: "stock", label: "Stock", align: "right" },
        { key: "status", label: "Status", type: "status" },
        actionColumn,
      ];
    }

    if (viewMode === "discounts") {
      return [
        imageColumn,
        { key: "name", label: "Product" },
        {
          key: "price3kg",
          label: "3 KG Price",
          render: (row) => formatPrice(row.priceTiers?.[1]?.price || 0),
        },
        {
          key: "discount3kg",
          label: "3 KG Discount",
          render: (row) => `${row.priceTiers?.[1]?.discountPercent || 0}%`,
        },
        {
          key: "price5kg",
          label: "5 KG Price",
          render: (row) => formatPrice(row.priceTiers?.[2]?.price || 0),
        },
        {
          key: "discount5kg",
          label: "5 KG Discount",
          render: (row) => `${row.priceTiers?.[2]?.discountPercent || 0}%`,
        },
        actionColumn,
      ];
    }

    return [
      imageColumn,
      { key: "name", label: "Product" },
      { key: "category", label: "Category" },
      {
        key: "basePrice",
        label: "1 KG Price",
        render: (row) => formatPrice(row.basePrice || row.price),
      },
      { key: "stock", label: "Stock", align: "right" },
      { key: "status", label: "Status", type: "status" },
      actionColumn,
    ];
  }, [viewMode]);

  return (
    <section id="products" className="admin-module-section admin-search-target">
      <div className="admin-page-head">
        <div>
          <h2>Products</h2>
          <p>Manage live catalog items, pricing tiers, ingredients, and publish status.</p>
        </div>

        <div className="admin-page-actions">
          <div onClick={handleRestoreOriginals}>
            <ActionButton>{restoring ? "Restoring..." : "Restore Originals"}</ActionButton>
          </div>

          <div
            onClick={() => {
              setEditProduct(null);
              setShowModal(true);
            }}
          >
            <ActionButton variant="primary">+ Add Product</ActionButton>
          </div>
        </div>
      </div>

      <div className="admin-filter-row">
        <input
          className="admin-inline-search"
          placeholder="Search products or ingredients..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

        <select
          className="admin-inline-search"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="All">All Categories</option>
          {categoryOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="admin-inline-search"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Coming Soon">Coming Soon</option>
        </select>

        <div className="admin-pill-list">
          {VIEW_MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-filter-chip${viewMode === item.key ? " active" : ""}`}
              onClick={() => setViewMode(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-module-card">
        <DataTable columns={columns} rows={filteredProducts} rowKey="id" />
      </div>

      {showModal ? (
        <AddProductModal
          closeModal={() => {
            setShowModal(false);
            setEditProduct(null);
          }}
          editProduct={editProduct}
          categoryOptions={categoryOptions}
        />
      ) : null}
    </section>
  );
};

const buttonStyles = {
  edit: {
    cursor: "pointer",
    color: "#f7a400",
    fontSize: "0.95rem",
    background: "transparent",
    border: 0,
  },
  delete: {
    cursor: "pointer",
    color: "#ff7373",
    fontSize: "0.95rem",
    background: "transparent",
    border: 0,
  },
};

export default Products;
