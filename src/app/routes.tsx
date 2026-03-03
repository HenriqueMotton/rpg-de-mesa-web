import type { RouteObject } from "react-router-dom";
import AppShell from "../layouts/AppShell";

// import PersonagensPage from "../pages/PersonagensPage";
// import RolagensPage from "../pages/RolagensPage";
// import NotasPage from "../pages/NotasPage";
// import ConfigPage from "../pages/ConfigPage";
import NotFoundPage from "../pages/NotFoundPage";

export const ROUTES = {
  mesa: "/mesa",
  personagens: "/personagens",
  rolagens: "/rolagens",
  notas: "/notas",
  config: "/config",
} as const;

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      // { index: true, element: <MesaPage /> }, // "/" cai em Mesa
      // { path: ROUTES.mesa.slice(1), element: <MesaPage /> },
      // { path: ROUTES.personagens.slice(1), element: <PersonagensPage /> },
      // { path: ROUTES.rolagens.slice(1), element: <RolagensPage /> },
      // { path: ROUTES.notas.slice(1), element: <NotasPage /> },
      // { path: ROUTES.config.slice(1), element: <ConfigPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];