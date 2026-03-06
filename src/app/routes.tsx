import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import AppShell from "../layouts/AppShell";

import LoginPage from "../pages/login/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import SignUpPage from "../pages/signUp/SignUpPage";

import { getToken, decodeToken } from "../shared/auth/token";
import PersonagensPage from "../pages/personagens/PersonagensPage";
import CreateCharacterPage from "../pages/personagens/CreateCharacterPage";
import ViewCharacterPage from "../pages/personagens/ViewCharacterPage";
import InventoryPage from "../pages/personagens/InventoryPage";
import GrimorioPage from "../pages/personagens/GrimorioPage";
import ClassePage from "../pages/personagens/ClassePage";
import ConfigPage from "../pages/ConfigPage";

export const ROUTES = {
  login: "/login",
  signup: "/signup",

  personagens: "/personagens",
  personagemNovo: "/personagens/novo",
  personagem: "/personagens/:id",
  inventario: "/personagens/:id/inventario",
  grimorio: "/personagens/:id/grimorio",
  classe: "/personagens/:id/classe",

  config: "/config",
} as const;

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (!token) return <Navigate to={ROUTES.login} replace />;
  return <>{children}</>;
}

function RequireMaster({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const payload = decodeToken(token);
  if (!token || payload.isMaster !== true) return <Navigate to={ROUTES.personagens} replace />;
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
      { index: true, element: <Navigate to={ROUTES.personagens} replace /> },

      {
        path: ROUTES.personagens.slice(1),
        children: [
          { index: true, element: <PersonagensPage /> },
          { path: "novo", element: <CreateCharacterPage /> },
          { path: ":id", element: <ViewCharacterPage /> },
          { path: ":id/inventario", element: <InventoryPage /> },
          { path: ":id/grimorio", element: <GrimorioPage /> },
          { path: ":id/classe", element: <ClassePage /> },
        ],
      },

      {
        path: ROUTES.config.slice(1),
        element: (
          <RequireMaster>
            <ConfigPage />
          </RequireMaster>
        ),
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
