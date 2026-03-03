import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";

// import MesaPage from "../pages/MesaPage";
// import PersonagensPage from "../pages/PersonagensPage";
// import RolagensPage from "../pages/RolagensPage";
// import NotasPage from "../pages/NotasPage";
// import ConfigPage from "../pages/ConfigPage";
// import NotFoundPage from "../pages/NotFoundPage";
import LoginPage from "../pages/login/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import SignUpPage from "../pages/signUp/SignUpPage";

import { getToken } from "../shared/auth/token";

export const ROUTES = {
  login: "/login",
  signup: "/signup",
  mesa: "/mesa",
  personagens: "/personagens",
  rolagens: "/rolagens",
  notas: "/notas",
  config: "/config",
} as const;

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (!token) return <Navigate to={ROUTES.login} replace />;
  return <>{children}</>;
}

export const routes: RouteObject[] = [
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.signup, element: <SignUpPage /> },
  
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.mesa} replace /> },
      // { path: ROUTES.mesa.slice(1), element: <MesaPage /> },
      // { path: ROUTES.personagens.slice(1), element: <PersonagensPage /> },
      // { path: ROUTES.rolagens.slice(1), element: <RolagensPage /> },
      // { path: ROUTES.notas.slice(1), element: <NotasPage /> },
      // { path: ROUTES.config.slice(1), element: <ConfigPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];