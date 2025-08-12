import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

// ✅ Only Login is real for now; others are placeholders.
// (We’ll swap them back one by one.)
import Login from "./pages/Login";

function Page({ title }: { title: string }) {
  return <div style={{ padding: 20, fontSize: 24 }}>{title}</div>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Page title="Home Page (placeholder)" />} />
        <Route path="/test" element={<Page title="Test Page (placeholder)" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
