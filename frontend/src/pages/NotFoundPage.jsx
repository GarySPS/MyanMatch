// src/pages/NotFoundPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[75vh] p-6">
        <div className="relative w-full max-w-xl bg-amber-50 text-amber-900 rounded-3xl shadow-xl border border-amber-100 p-8 md:p-10">
          {/* soft glow */}
          <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-br from-amber-100/60 via-transparent to-transparent blur-xl" />

          {/* status pill */}
          <div className="relative mb-5 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 text-amber-800 border border-amber-200 text-sm font-medium">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Maintenance
            </span>
          </div>

          {/* heading & copy */}
          <h1 className="relative text-3xl md:text-4xl font-extrabold tracking-tight text-center">
            Maintaining Coming Soon
          </h1>
          <p className="relative mt-3 text-center text-amber-800/80">
            We’re giving this page a glow-up. Please check back shortly.
          </p>

          {/* progress bar */}
          <div className="relative mt-8 mb-8 h-2 w-full rounded-full bg-amber-100 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-amber-400 animate-pulse" />
          </div>

        </div>
      </div>
    </Layout>
  );
}
