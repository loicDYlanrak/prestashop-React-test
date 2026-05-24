import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Page simple </div>,
    children: [
      {
        path: "",
        element: <h1>Page d&apos;accueil</h1>,
      },
      {
        path: "/admin",
        element: <div>Admin page</div>,
        children: [
          {
            path: "",
            element: <h1>Page d&apos;admin</h1>,
          },
        ],
      },
    ],
  },
]);

export default router;
