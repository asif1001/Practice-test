// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDetailsForm from "./pages/UserDetailsForm";
import Home from "./pages/Home";
import Test from "./pages/Test";

import AdminLayout from "./admin/layout/AdminLayout";
import AdminSubjects from "./admin/pages/AdminSubjects";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminQuizzes from "./admin/pages/AdminQuizzes";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import UploadQuizCSV from "./admin/pages/UploadQuizCSV";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/user-details" element={<UserDetailsForm />} />
      <Route path="/home" element={<Home />} />
      <Route path="/test" element={<Test />} />

      {/* Admin Panel */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="upload-csv" element={<UploadQuizCSV />} />
      </Route>
    </Routes>
  );
}

export default App;
