// src/pages/AdminDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

// Use Vite dev proxy so we can call /api/* without CORS
const API_BASE = "";

const kycUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  // This is the corrected, safe version.
  const { data } = supabase.storage.from("kyc").getPublicUrl(path);
  return data?.publicUrl || ""; // This ?. prevents the crash.
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");

  const [deposits, setDeposits] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [kycReqs, setKycReqs] = useState([]);

  const [depAmountInput, setDepAmountInput] = useState({});
  const [wdBusyId, setWdBusyId] = useState(null);

  // Reports
  const [reportsL1, setReportsL1] = useState([]); // 1–2 reports
  const [reportsL2, setReportsL2] = useState([]); // >=3 reports

  const me = JSON.parse(localStorage.getItem("myanmatch_user") || "{}");

  const userIndex = useMemo(() => {
    const m = new Map();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  const profileIndex = useMemo(() => {
    const m = new Map();
    for (const p of profiles) m.set(p.user_id, p);
    return m;
  }, [profiles]);

// ADD THIS NEW FUNCTION
  async function handleImpersonate(user) {
    if (!user || !user.id) {
      alert("Cannot log in as this user: missing user ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to log in as ${user.email}? A new tab will open.`
    );
    if (!confirmed) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You are not logged in as an admin.');

      // Ask our backend to create the special login link
      const response = await fetch(`${API_BASE}/api/user/admin/impersonate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.magic_link) {
        throw new Error(result.error || 'Failed to get login link from server.');
      }

      // Open the special link in a new tab, logging you in as the user
      window.open(result.magic_link, '_blank');

    } catch (err) {
      console.error("Impersonation failed:", err);
      alert(`Could not log in as user: ${err.message}`);
    }
  }

  async function load() {
    const [depRes, wdRes, profRes, userRes, kycRes] = await Promise.all([
      supabase
        .from("wallet_transactions")
        .select(
          "id,user_id,amount,status,created_at,detail,payment_method,tx_ref,screenshot_url"
        )
        .eq("type", "deposit")
        .order("created_at", { ascending: false }),
      supabase
        .from("wallet_transactions")
        .select(
          "id,user_id,amount,status,created_at,note,detail,payment_method"
        )
        .eq("type", "withdraw")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("user_id,coin,coin_hold,is_admin,is_verified,blocked"),
      supabase
// Fetches users from our new, secure backend API
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Not logged in');

          const response = await fetch(`${API_BASE}/api/user/admin/list`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });

          if (!response.ok) throw new Error('Failed to fetch user list');
          const data = await response.json();
          return { data: data.users || [], error: null };
        } catch (error) {
          return { data: [], error };
        }
      })(),
      supabase
        .from("kyc_requests")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const errs = [
      depRes.error && ["deposits", depRes.error.message],
      wdRes.error && ["withdraws", wdRes.error.message],
      profRes.error && ["profiles", profRes.error.message],
      userRes.error && ["users", userRes.error.message],
      kycRes.error && ["kyc_requests", kycRes.error.message],
    ].filter(Boolean);
    if (errs.length) {
      console.error("Admin load errors:", errs);
      alert(
        "Admin load error: " + errs.map(([t, m]) => `${t}: ${m}`).join(" | ")
      );
    }

    setDeposits(depRes.data || []);
    setWithdraws(wdRes.data || []);
    setProfiles((profRes.data || []).filter((p) => p && p.user_id));
    setUsers(userRes.data || []);
    setKycReqs(kycRes.data || []);

    // ---- Reports via backend (uses your session/cookies)
    try {
      const r = await fetch(`${API_BASE}/api/admin/reports`);

      let j = { reports: [] };
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        j = await r.json();
      } else {
        const txt = await r.text();
        console.warn("Non-JSON from /api/admin/reports:", txt.slice(0, 200));
      }

      const rep = Array.isArray(j?.reports) ? j.reports : [];

      // group by reported_user_id
      const byUser = new Map();
      for (const x of rep) {
        const arr = byUser.get(x.reported_user_id) || [];
        arr.push(x);
        byUser.set(x.reported_user_id, arr);
      }

      // <<< FIX: This section now correctly merges user and profile data to get the `blocked` status
      const localUsers = userRes.data || [];
      const localProfiles = profRes.data || [];

      const rows = [];
      for (const [reportedId, arr] of byUser.entries()) {
        const u = localUsers.find((uu) => uu.id === reportedId) || {};
        const p = localProfiles.find((pp) => pp.user_id === reportedId) || {};
        rows.push({
          user_id: reportedId,
          username:
            u.username || u.short_id || String(reportedId || "").slice(0, 8),
          email: u.email || "",
          password: u.password || "",
          count: arr.length,
          reasons: arr.map((a) => a.reason).filter(Boolean),
          latestAt: arr.map((a) => a.created_at).sort().slice(-1)[0] || null,
          is_blocked: !!p.blocked, // <<< FIX: Added the user's blocked status
        });
      }

      setReportsL1(
        rows
          .filter((r) => r.count >= 1 && r.count <= 2)
          .sort((a, b) => b.count - a.count)
      );
      setReportsL2(
        rows.filter((r) => r.count >= 3).sort((a, b) => b.count - a.count)
      );
    } catch (e) {
      console.error("fetch /api/admin/reports failed", e);
      setReportsL1([]);
      setReportsL2([]);
    }
  } // end load()

  useEffect(() => {
    load();
  }, []);

  /* ----------------- DEPOSITS ----------------- */
  async function approveDeposit(tx) {
    const raw = depAmountInput[tx.id] ?? tx.amount;
    const amount = Number(raw);
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Enter a valid coin amount before approving.");
      return;
    }

    const { error: updErr } = await supabase
      .from("wallet_transactions")
      .update({ amount })
      .eq("id", tx.id);
    if (updErr) return alert(updErr.message);

    const { error } = await supabase.rpc("approve_deposit", {
      p_tx_id: tx.id,
      p_admin: me.id,
    });
    if (error) return alert(error.message);

    await load();
  }

  async function rejectDeposit(id) {
    const note = prompt("Reason to reject? (optional)", "Invalid slip");
    const { error } = await supabase.rpc("reject_deposit", {
      p_tx_id: id,
      p_admin: me.id,
      p_note: note || null,
    });
    if (error) return alert(error.message);
    await load();
  }

  /* ----------------- WITHDRAWS ----------------- */
  async function approveWithdraw(id) {
    if (wdBusyId) return;
    setWdBusyId(id);
    try {
      const { error } = await supabase.rpc("approve_withdraw", {
        p_tx_id: id,
        p_admin: me.id,
      });

      if (error) {
        const { data: after } = await supabase
          .from("wallet_transactions")
          .select("status")
          .eq("id", id)
          .single();
        if (after?.status !== "approved") {
          alert(error.message);
        }
      }
      await load();
    } finally {
      setWdBusyId(null);
    }
  }

  async function rejectWithdraw(id) {
    if (wdBusyId) return;
    const note = prompt("Reason to reject? (optional)", "Name/account mismatch");
    setWdBusyId(id);
    try {
      const { error } = await supabase.rpc("reject_withdraw", {
        p_tx_id: id,
        p_admin: me.id,
        p_note: note || null,
      });

      if (error) {
        const { data: after } = await supabase
          .from("wallet_transactions")
          .select("status")
          .eq("id", id)
          .single();
        if (after?.status !== "rejected") {
          alert(error.message);
        }
      }
      await load();
    } finally {
      setWdBusyId(null);
    }
  }

  /* ----------------- KYC ----------------- */
  async function approveKyc(req) {
    const now = new Date().toISOString();

    // 1. Update the KYC request itself to 'approved'
    const { error: kycErr } = await supabase
      .from("kyc_requests")
      .update({
        status: "approved",
        decided_at: now,
        notes: req.notes || null,
      })
      .eq("id", req.id);
    if (kycErr) return alert(kycErr.message);

    // 2. Update the user's main profile with all verification fields
    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        is_verified: true,
        verified: true,
        verified_at: now,
        last_kyc_request_id: req.id,
        kyc_status: "approved",
      })
      .eq("user_id", req.user_id);

    if (pErr) return alert(pErr.message);

    await load();
  }

// src/pages/AdminDashboard.jsx

  async function denyKyc(req) {
    const reason =
      prompt("Reason to deny? (visible to user)", req.notes || "") || "";
    const now = new Date().toISOString();

    // 1. Update the KYC request itself to 'denied'
    const { error: kycErr } = await supabase
      .from("kyc_requests")
      .update({
        status: "denied",
        decided_at: now,
        notes: reason,
      })
      .eq("id", req.id);
    if (kycErr) return alert(kycErr.message);

    // 2. Update the user's main profile, clearing verification
    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        is_verified: false,
        verified: false,
        verified_at: null,
        last_kyc_request_id: req.id,
        kyc_status: "denied",
      })
      .eq("user_id", req.user_id);

    if (pErr) return alert(pErr.message);

    await load();
  }

  /* ----------------- REPORT ACTIONS ----------------- */

  async function blockUser(userId) {
    try {
      console.log("[Admin] blockUser ->", userId);
      const r = await fetch(`/api/admin/block_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`block_failed: ${r.status} ${txt}`);
      }
      await load();
    } catch (e) {
      console.error(e);
      alert(`Failed to block user.\n${e?.message || e}`);
    }
  }

  async function releaseUser(userId) {
    try {
      console.log("[Admin] releaseUser ->", userId);
      const r = await fetch(`/api/admin/release_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`release_failed: ${r.status} ${txt}`);
      }
      await load();
    } catch (e) {
      console.error(e);
      alert(`Failed to release user.\n${e?.message || e}`);
    }
  }

  return (
    <div
      className="relative z-10 max-w-6xl mx-auto p-4 text-sm text-white"
      style={{ background: "linear-gradient(180deg,#7d0f2c,#47112d)" }}
    >
      <h1 className="text-xl font-bold mb-3">MyanMatch Admin</h1>

      <div className="flex gap-2 mb-4">
        {["users", "deposits", "withdraws", "kyc", "reports1", "reports2"].map(
          (k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-2 rounded ${
                tab === k ? "bg-black text-white" : "bg-neutral-200 text-black"
              }`}
            >
              {k.toUpperCase()}
            </button>
          )
        )}
        <button onClick={load} className="ml-auto px-3 py-2 rounded bg-neutral-700">
          Refresh
        </button>
      </div>

      {/* USERS */}
      {tab === "users" && (
        <Table>
<thead>
            <Row header>
              <Cell>Short ID</Cell>
              <Cell>Email</Cell>
              <Cell>Coin</Cell>
              <Cell>Hold</Cell>
              <Cell>Admin</Cell>
              <Cell>Verified</Cell>
              <Cell>Joined</Cell>
              <Cell>Actions</Cell>
            </Row>
          </thead>
          <tbody>
            {users.map((u) => {
              const p = profileIndex.get(u.id); // Find matching profile data
              return (
                <Row key={u.id}>
                  <Cell>{u.short_id || "—"}</Cell>
                  <Cell>{u.email || ""}</Cell>
                  <Cell center>{p?.coin ?? "N/A"}</Cell>
                  <Cell center>{p?.coin_hold ?? "N/A"}</Cell>
                  <Cell center>{u.is_admin ? "✓" : ""}</Cell>
                  <Cell center>{p?.is_verified ? "✓" : ""}</Cell>
                  <Cell>{u.created_at?.slice(0, 10) || ""}</Cell>
                  <Cell>
                    <button 
                      onClick={() => handleImpersonate(u)} 
                      className="px-2 py-1 bg-blue-600 rounded text-white hover:bg-blue-700"
                    >
                      Log In As User
                    </button>
                  </Cell>
                </Row>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* DEPOSITS */}
      {tab === "deposits" && (
        <div>
          <h2 className="font-bold mb-2">Deposits</h2>
          <Table>
            <thead>
              <Row header>
                <Cell>Tx</Cell>
                <Cell>User</Cell>
                <Cell>Email</Cell>
                <Cell>Method</Cell>
                <Cell>Tx Ref</Cell>
                <Cell>Proof</Cell>
                <Cell>Amount (coins)</Cell>
                <Cell>Status</Cell>
                <Cell>Actions</Cell>
              </Row>
            </thead>
            <tbody>
              {deposits.map((tx) => {
                const u = userIndex.get(tx.user_id);
                const pending = tx.status === "pending";
                return (
                  <Row key={tx.id}>
                    <Cell>#{tx.id}</Cell>
                    <Cell>{u?.username || u?.short_id || tx.user_id.slice(0, 8)}</Cell>
                    <Cell>{u?.email || ""}</Cell>
                    <Cell>{tx.payment_method || ""}</Cell>
                    <Cell>{tx.tx_ref || ""}</Cell>
                    <Cell>
                      {tx.screenshot_url ? (
                        <a href={tx.screenshot_url} target="_blank" rel="noreferrer">
                          <img
                            src={tx.screenshot_url}
                            alt="proof"
                            className="w-16 h-16 object-cover rounded border"
                          />
                        </a>
                      ) : (
                        "—"
                      )}
                    </Cell>
                    <Cell>
                      {pending ? (
                        <input
                          type="number"
                          min={1}
                          value={depAmountInput[tx.id] ?? (tx.amount ?? "")}
                          onChange={(e) =>
                            setDepAmountInput((s) => ({
                              ...s,
                              [tx.id]: e.target.value,
                            }))
                          }
                          className="w-28 px-2 py-1 rounded text-black"
                        />
                      ) : (
                        tx.amount ?? "—"
                      )}
                    </Cell>
                    <Cell center>{tx.status}</Cell>
                    <Cell>
                      {pending ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveDeposit(tx)}
                            className="px-2 py-1 bg-green-600 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectDeposit(tx.id)}
                            className="px-2 py-1 bg-red-600 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </Cell>
                  </Row>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {/* WITHDRAWS */}
      {tab === "withdraws" && (
        <div>
          <h2 className="font-bold mb-2">Withdrawals</h2>
          <Table>
            <thead>
              <Row header>
                <Cell>Tx</Cell>
                <Cell>User</Cell>
                <Cell>Email</Cell>
                <Cell>Method</Cell>
                <Cell>Payout Details</Cell>
                <Cell>Amount</Cell>
                <Cell>Status</Cell>
                <Cell>Actions</Cell>
              </Row>
            </thead>
            <tbody>
              {withdraws.map((tx) => {
                const u = userIndex.get(tx.user_id);
                return (
                  <Row key={tx.id}>
                    <Cell>#{tx.id}</Cell>
                    <Cell>{u?.username || u?.short_id || tx.user_id.slice(0, 8)}</Cell>
                    <Cell>{u?.email || ""}</Cell>
                    <Cell>{tx.payment_method || ""}</Cell>
                    <Cell>{tx.detail || ""}</Cell>
                    <Cell center>{tx.amount}</Cell>
                    <Cell center>{tx.status}</Cell>
                    <Cell>
                      {tx.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveWithdraw(tx.id)}
                            disabled={wdBusyId === tx.id}
                            className="px-2 py-1 bg-green-600 rounded disabled:opacity-60"
                          >
                            {wdBusyId === tx.id ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => rejectWithdraw(tx.id)}
                            disabled={wdBusyId === tx.id}
                            className="px-2 py-1 bg-red-600 rounded disabled:opacity-60"
                          >
                            {wdBusyId === tx.id ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </Cell>
                  </Row>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {/* KYC */}
      {tab === "kyc" && (
        <div>
          <h2 className="font-bold mb-2">KYC Requests</h2>
          <Table>
            <thead>
              <Row header>
                <Cell>ID</Cell>
                <Cell>User</Cell>
                <Cell>Email</Cell>
                <Cell>Submitted</Cell>
                <Cell>Selfie A</Cell>
                <Cell>Selfie B</Cell>
                <Cell>Avatar</Cell>
                <Cell>Status</Cell>
                <Cell>Admin Note</Cell>
                <Cell>Actions</Cell>
              </Row>
            </thead>
            <tbody>
              {kycReqs.map((r) => {
                const u = userIndex.get(r.user_id);
                const p = profileIndex.get(r.user_id);
                const pending = r.status === "pending";
                return (
                  <Row key={r.id}>
                    <Cell>{r.id.slice(0, 8)}</Cell>
                    <Cell>
                      {(u?.username || u?.short_id || r.user_id.slice(0, 8)) +
                        (p?.is_verified ? " ✓" : "")}
                    </Cell>
                    <Cell>{u?.email || ""}</Cell>
                    <Cell>{(r.created_at || "").slice(0, 19).replace("T", " ")}</Cell>
                    <Cell>
                      {r.selfie1_url ? (
                        <a href={kycUrl(r.selfie1_url)} target="_blank" rel="noreferrer">
                          <img
                            className="w-16 h-16 object-cover rounded border"
                            src={kycUrl(r.selfie1_url)}
                            alt="selfie-a"
                          />
                        </a>
                      ) : (
                        "—"
                      )}
                    </Cell>
                    <Cell>
                      {r.selfie2_url ? (
                        <a href={kycUrl(r.selfie2_url)} target="_blank" rel="noreferrer">
                          <img
                            className="w-16 h-16 object-cover rounded border"
                            src={kycUrl(r.selfie2_url)}
                            alt="selfie-b"
                          />
                        </a>
                      ) : (
                        "—"
                      )}
                    </Cell>
                    <Cell>
                      {r.avatar_snapshot_url ? (
                        <a
                          href={kycUrl(r.avatar_snapshot_url)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            className="w-16 h-16 object-cover rounded border"
                            src={kycUrl(r.avatar_snapshot_url)}
                            alt="avatar-snap"
                          />
                        </a>
                      ) : (
                        "—"
                      )}
                    </Cell>
                    <Cell center>{r.status}</Cell>
                    <Cell>{r.notes || "—"}</Cell>
                    <Cell>
                      {pending ? (
                        <div className="flex gap-2">
                          <button onClick={() => approveKyc(r)} className="px-2 py-1 bg-green-600 rounded">
                            Approve
                          </button>
                          <button onClick={() => denyKyc(r)} className="px-2 py-1 bg-red-600 rounded">
                            Deny
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </Cell>
                  </Row>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {/* <<< FIX: The next two sections (reports1 and reports2) are updated */}
      {/* REPORTS — LEVEL 1 */}
      {tab === "reports1" && (
        <div>
          <h2 className="font-bold mb-2">Reports — Level 1 (1–2)</h2>
          <Table>
            <thead>
              <Row header>
                <Cell>User</Cell>
                <Cell>Email</Cell>
                <Cell>Password</Cell>
                <Cell>Report Count</Cell>
                <Cell>Reasons (latest first)</Cell>
                <Cell>Status</Cell>
                <Cell>Actions</Cell>
              </Row>
            </thead>
            <tbody>
              {reportsL1.map((r) => (
                <Row key={r.user_id}>
                  <Cell>{r.username}</Cell>
                  <Cell>{r.email}</Cell>
                  <Cell>{r.password}</Cell>
                  <Cell center>{r.count}</Cell>
                  <Cell>
                    <ul className="list-disc pl-4">
                      {r.reasons
                        .slice()
                        .reverse()
                        .map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                    </ul>
                  </Cell>
                  <Cell center>
                    {r.is_blocked ? (
                      <span className="font-bold text-red-400">Blocked</span>
                    ) : (
                      <span className="text-green-400">Active</span>
                    )}
                  </Cell>
                  <Cell>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => blockUser(r.user_id)}
                        disabled={r.is_blocked}
                        className="px-2 py-1 bg-red-700 rounded disabled:opacity-50"
                      >
                        Block
                      </button>
                      <button
                        type="button"
                        onClick={() => releaseUser(r.user_id)}
                        disabled={!r.is_blocked}
                        className="px-2 py-1 bg-green-700 rounded disabled:opacity-50"
                      >
                        Release
                      </button>
                    </div>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* REPORTS — LEVEL 2 */}
      {tab === "reports2" && (
        <div>
          <h2 className="font-bold mb-2">Reports — Level 2 (3+)</h2>
          <Table>
            <thead>
              <Row header>
                <Cell>User</Cell>
                <Cell>Email</Cell>
                <Cell>Password</Cell>
                <Cell>Report Count</Cell>
                <Cell>Reasons (latest first)</Cell>
                <Cell>Status</Cell>
                <Cell>Actions</Cell>
              </Row>
            </thead>
            <tbody>
              {reportsL2.map((r) => (
                <Row key={r.user_id}>
                  <Cell>{r.username}</Cell>
                  <Cell>{r.email}</Cell>
                  <Cell>{r.password}</Cell>
                  <Cell center className="font-bold text-red-300">
                    {r.count}
                  </Cell>
                  <Cell>
                    <ul className="list-disc pl-4">
                      {r.reasons
                        .slice()
                        .reverse()
                        .map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                    </ul>
                  </Cell>
                  <Cell center>
                     {r.is_blocked ? (
                      <span className="font-bold text-red-400">Blocked</span>
                    ) : (
                      <span className="text-green-400">Active</span>
                    )}
                  </Cell>
                  <Cell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => blockUser(r.user_id)}
                        disabled={r.is_blocked}
                        className="px-2 py-1 bg-red-700 rounded disabled:opacity-50"
                      >
                        Block
                      </button>
                      <button
                        onClick={() => releaseUser(r.user_id)}
                        disabled={!r.is_blocked}
                        className="px-2 py-1 bg-green-700 rounded disabled:opacity-50"
                      >
                        Release
                      </button>
                    </div>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ---- tiny table components to keep JSX tidy ---- */
function Table({ children }) {
  return <table className="w-full border border-white/20">{children}</table>;
}
function Row({ children, header }) {
  return (
    <tr className={header ? "bg-white/10" : "border-t border-white/20"}>
      {children}
    </tr>
  );
}
function Cell({ children, center }) {
  return (
    <td className={`p-2 align-top ${center ? "text-center" : "text-left"}`}>
      {children}
    </td>
  );
}