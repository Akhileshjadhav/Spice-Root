import { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import {
  subscribeToReviews,
  updateReviewStatus,
} from "../../lib/adminStore";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [updatingReviewId, setUpdatingReviewId] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToReviews(
      setReviews,
      (error) => console.error("Failed to load live reviews:", error)
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (reviewId, status) => {
    try {
      setUpdatingReviewId(reviewId);
      await updateReviewStatus(reviewId, status);
    } catch (error) {
      console.error("Failed to update review status:", error);
    } finally {
      setUpdatingReviewId("");
    }
  };

  const columns = useMemo(
    () => [
      { key: "product", label: "Product" },
      { key: "customer", label: "Customer" },
      { key: "type", label: "Type" },
      { key: "rating", label: "Rating", render: (row) => <span className="admin-rating">{row.rating} / 5</span> },
      { key: "review", label: "Review" },
      { key: "status", label: "Status", type: "status" },
      { key: "date", label: "Date" },
      {
        key: "actions",
        label: "Actions",
        render: (row) => (
          <div style={styles.actions}>
            <button
              type="button"
              style={styles.approveButton}
              disabled={updatingReviewId === row.id || row.status === "Approved"}
              onClick={() => handleUpdateStatus(row.id, "Approved")}
            >
              {updatingReviewId === row.id ? "Saving..." : "Approve"}
            </button>
            <button
              type="button"
              style={styles.hideButton}
              disabled={updatingReviewId === row.id || row.status === "Hidden"}
              onClick={() => handleUpdateStatus(row.id, "Hidden")}
            >
              Hide
            </button>
          </div>
        ),
      },
    ],
    [updatingReviewId]
  );

  return (
    <section className="admin-module-section">
      <div className="admin-page-head">
        <div>
          <h2>Reviews</h2>
          <p>Live customer product and overall store reviews from delivered orders.</p>
        </div>
      </div>

      <div className="admin-module-card">
        <DataTable columns={columns} rows={reviews} rowKey="id" />
        {reviews.length === 0 ? (
          <div className="admin-empty-state" style={styles.emptyState}>
            Reviews will appear here after customers submit feedback for delivered orders.
          </div>
        ) : null}
      </div>
    </section>
  );
};

const styles = {
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  approveButton: {
    background: "transparent",
    border: 0,
    color: "#86efac",
    cursor: "pointer",
    padding: 0,
  },
  hideButton: {
    background: "transparent",
    border: 0,
    color: "#fca5a5",
    cursor: "pointer",
    padding: 0,
  },
  emptyState: {
    marginTop: "12px",
  },
};

export default Reviews;
