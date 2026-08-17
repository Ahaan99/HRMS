import { BrowserRouter } from "react-router-dom";
import ClientRoutes from "./routes/ClientRoutes";
import { ClientAuthProvider } from "./context/ClientAuthContext";

function App() {
  return (
    <BrowserRouter>
      <ClientAuthProvider>
        <ClientRoutes />
      </ClientAuthProvider>
    </BrowserRouter>
  );
}

export default App;
