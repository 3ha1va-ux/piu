"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PetListing, ListingTone, AnimalType } from "@/data/listings-types";

type EnrichedListing = PetListing & { isUserSubmitted: boolean };

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminListingsPage() {
  const [items, setItems] = useState<EnrichedListing[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [counts, setCounts] = useState({ totalAll: 0, userCount: 0, demoCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState<string>("all");
  const [animalFilter, setAnimalFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // Editing state
  const [editingItem, setEditingItem] = useState<EnrichedListing | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    place: "",
    tone: "lost" as ListingTone,
    animal: "ძაღლი" as AnimalType,
    contactPhone: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", "25");
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (toneFilter !== "all") params.set("tone", toneFilter);
    if (animalFilter !== "all") params.set("animal", animalFilter);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());

    fetch(`/api/admin/listings?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("მონაცემების ჩატვირთვა ვერ მოხერხდა");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setItems(data.items || []);
          setPagination(data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
          setCounts(data.counts || { totalAll: 0, userCount: 0, demoCount: 0 });
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "შეცდომა");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [page, sourceFilter, toneFilter, animalFilter, searchQuery, reloadKey]);

  // Handle Edit
  const openEditModal = (item: EnrichedListing) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || "",
      place: item.place || "",
      tone: item.tone || "lost",
      animal: item.animal || "ძაღლი",
      contactPhone: item.contactPhone || "",
      description: item.description || "",
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          updates: editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "რედაქტირება ვერ მოხერხდა");

      setActionSuccess("განცხადება წარმატებით განახლდა");
      setEditingItem(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "წაშლა ვერ მოხერხდა");

      setActionSuccess("განცხადება წაიშალა");
      setDeleteConfirmId(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setIsDeleting(false);
    }
  };

  const toneMeta: Record<string, { label: string; color: string; bg: string }> = {
    lost: { label: "დაკარგული", color: "text-amber-800", bg: "bg-amber-100" },
    found: { label: "ნაპოვნი", color: "text-emerald-800", bg: "bg-emerald-100" },
    gift: { label: "ჩუქდება", color: "text-blue-800", bg: "bg-blue-100" },
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] font-display">
            განცხადებების მართვა
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-0.5">
            სულ {counts.totalAll.toLocaleString("ka-GE")} განცხადება (
            <span className="text-[var(--moss)] font-semibold">{counts.userCount} მომხმარებლის</span>,{" "}
            {counts.demoCount} დემო)
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[var(--mist)]/70 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
              ძიება
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="სახელი, ქალაქი, ტელეფონი..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setLoading(true);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none"
              />
              <svg
                className="w-4 h-4 text-[var(--ink-soft)] absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
              წყარო
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setLoading(true);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none bg-white text-[var(--ink)]"
            >
              <option value="all">ყველა ({counts.totalAll})</option>
              <option value="user">მომხმარებლის ({counts.userCount})</option>
              <option value="demo">დემო მონაცემები ({counts.demoCount})</option>
            </select>
          </div>

          {/* Tone Filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
              სტატუსი / ტიპი
            </label>
            <select
              value={toneFilter}
              onChange={(e) => {
                setToneFilter(e.target.value);
                setLoading(true);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none bg-white text-[var(--ink)]"
            >
              <option value="all">ყველა სტატუსი</option>
              <option value="lost">დაკარგული</option>
              <option value="found">ნაპოვნი</option>
              <option value="gift">ჩუქდება</option>
            </select>
          </div>

          {/* Animal Filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
              ცხოველი
            </label>
            <select
              value={animalFilter}
              onChange={(e) => {
                setAnimalFilter(e.target.value);
                setLoading(true);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none bg-white text-[var(--ink)]"
            >
              <option value="all">ყველა ცხოველი</option>
              <option value="ძაღლი">ძაღლი</option>
              <option value="კატა">კატა</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Table Card */}
      <div className="bg-white rounded-2xl border border-[var(--mist)]/70 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[var(--ink-soft)] text-sm flex flex-col items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6 text-[var(--moss)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>განცხადებები იტვირთება...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-[var(--ink-soft)] text-sm">
            განცხადებები ვერ მოიძებნა არჩეული ფილტრებით
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--paper)]/60 text-[var(--ink-soft)] text-xs border-b border-[var(--mist)]">
                <tr>
                  <th className="py-3 px-4 font-medium">სურათი</th>
                  <th className="py-3 px-4 font-medium">სახელი / ჯიში</th>
                  <th className="py-3 px-4 font-medium">სტატუსი</th>
                  <th className="py-3 px-4 font-medium">წყარო</th>
                  <th className="py-3 px-4 font-medium">ლოკაცია</th>
                  <th className="py-3 px-4 font-medium">კონტაქტი</th>
                  <th className="py-3 px-4 font-medium text-right">მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--mist)]/60">
                {items.map((item) => {
                  const meta = toneMeta[item.tone] || {
                    label: item.tone,
                    color: "text-gray-800",
                    bg: "bg-gray-100",
                  };
                  const thumb =
                    item.photoIconUrl ||
                    (item.photoUrls && item.photoUrls[0]) ||
                    (item.animal === "ძაღლი" ? "/demo/icons/dog-1.avif" : "/demo/icons/cat-1.avif");

                  return (
                    <tr key={item.id} className="hover:bg-[var(--paper)]/40 transition">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--mist)] flex-shrink-0 relative">
                          <Image
                            src={thumb}
                            alt={item.name || item.animal}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      </td>

                      {/* Name / Breed / Animal */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--ink)]">
                          {item.name || "უცნობი"}
                        </div>
                        <div className="text-xs text-[var(--ink-soft)]">
                          {item.animal} {item.breed ? `• ${item.breed}` : ""}
                        </div>
                      </td>

                      {/* Status / Tone */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        {item.isUserSubmitted ? (
                          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            მომხმარებელი
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            დემო
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-xs text-[var(--ink-soft)] max-w-[160px] truncate">
                        {item.place}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-xs text-[var(--ink-soft)]">
                        <div>{item.contactPhone || "—"}</div>
                        {item.contactName && (
                          <div className="text-[11px] text-[var(--ink-soft)]/80">
                            {item.contactName}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/gancxadeba/${item.id}`}
                          target="_blank"
                          title="საიტზე ნახვა"
                          className="inline-flex p-1.5 text-[var(--ink-soft)] hover:text-[var(--moss)] transition rounded-lg hover:bg-[var(--mist)]/30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>

                        {/* Edit button (enabled only for user listings) */}
                        {item.isUserSubmitted && (
                          <button
                            onClick={() => openEditModal(item)}
                            title="რედაქტირება"
                            className="inline-flex p-1.5 text-[var(--ink-soft)] hover:text-[var(--lake)] transition rounded-lg hover:bg-[var(--mist)]/30"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}

                        {/* Delete button (enabled only for user listings) */}
                        {item.isUserSubmitted ? (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="წაშლა"
                            className="inline-flex p-1.5 text-red-500 hover:text-red-700 transition rounded-lg hover:bg-red-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        ) : (
                          <span
                            title="დემო მონაცემები დაცულია წაშლისგან"
                            className="inline-flex p-1.5 text-gray-300 cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="bg-[var(--paper)]/40 px-4 py-3 border-t border-[var(--mist)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--ink-soft)]">
          <div>
            ნაჩვენებია {items.length} სულ {pagination.total.toLocaleString("ka-GE")} განცხადებიდან (გვერდი {pagination.page} / {pagination.totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLoading(true);
                setPage((p) => Math.max(1, p - 1));
              }}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-[var(--mist)] bg-white hover:bg-[var(--mist)]/30 disabled:opacity-40 transition font-medium"
            >
              ← წინა
            </button>
            <span className="font-semibold px-1">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => {
                setLoading(true);
                setPage((p) => Math.min(pagination.totalPages, p + 1));
              }}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-[var(--mist)] bg-white hover:bg-[var(--mist)]/30 disabled:opacity-40 transition font-medium"
            >
              შემდეგი →
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--mist)]">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--mist)]">
              <h3 className="font-bold text-lg font-display text-[var(--ink)]">
                განცხადების რედაქტირება (#{editingItem.id})
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                    სახელი
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                    ცხოველი
                  </label>
                  <select
                    value={editForm.animal}
                    onChange={(e) => setEditForm({ ...editForm, animal: e.target.value as AnimalType })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none bg-white"
                  >
                    <option value="ძაღლი">ძაღლი</option>
                    <option value="კატა">კატა</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                    სტატუსი / ტიპი
                  </label>
                  <select
                    value={editForm.tone}
                    onChange={(e) => setEditForm({ ...editForm, tone: e.target.value as ListingTone })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none bg-white"
                  >
                    <option value="lost">დაკარგული</option>
                    <option value="found">ნაპოვნი</option>
                    <option value="gift">ჩუქდება</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                    ტელეფონი
                  </label>
                  <input
                    type="text"
                    value={editForm.contactPhone}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  ლოკაცია
                </label>
                <input
                  type="text"
                  value={editForm.place}
                  onChange={(e) => setEditForm({ ...editForm, place: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  აღწერა
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--mist)]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm rounded-xl border border-[var(--mist)] hover:bg-[var(--paper)] transition"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium bg-[var(--moss)] hover:bg-[var(--leaf)] text-white rounded-xl transition disabled:opacity-50"
                >
                  {isSaving ? "ინახება..." : "შენახვა"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-100">
            <h3 className="font-bold text-lg font-display text-[var(--ink)] mb-2">
              განცხადების წაშლა
            </h3>
            <p className="text-sm text-[var(--ink-soft)] mb-5">
              დარწმუნებული ხართ რომ გსურთ ამ განცხადების (#{deleteConfirmId}) სამუდამოდ წაშლა?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm rounded-xl border border-[var(--mist)] hover:bg-[var(--paper)] transition"
              >
                გაუქმება
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
              >
                {isDeleting ? "იშლება..." : "დიახ, წაშლა"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
