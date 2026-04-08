import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Callback } from "@/pages/Callback";
import { Collections } from "@/pages/Collections";
import { CollectionDetail } from "@/pages/CollectionDetail";
import { OrasArtifacts } from "@/pages/OrasArtifacts";
import { OrasArtifactDetail } from "@/pages/OrasArtifactDetail";
import { Profiles } from "@/pages/Profiles";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/profile" element={<Callback />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/*" element={<Collections />} />
          <Route
            path="/collection/:id/tag/:tagId"
            element={<CollectionDetail />}
          />
          <Route path="/oras" element={<OrasArtifacts />} />
          <Route path="/oras/*" element={<OrasArtifacts />} />
          <Route path="/oras/artifact" element={<OrasArtifactDetail />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profiles/:name" element={<Profiles />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
