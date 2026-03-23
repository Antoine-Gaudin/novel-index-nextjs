import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Mock js-cookie
vi.mock("js-cookie", () => {
  const store = {};
  return {
    default: {
      get: vi.fn((key) => store[key] || undefined),
      set: vi.fn((key, value) => { store[key] = value; }),
      remove: vi.fn((key) => { delete store[key]; }),
    },
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Helper : composant qui utilise useAuth pour tester le hook
function AuthConsumer() {
  const { isLoggedIn, user, jwt, isLoading, usernameInitial, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading ? "true" : "false"}</span>
      <span data-testid="logged-in">{isLoggedIn ? "true" : "false"}</span>
      <span data-testid="jwt">{jwt || "null"}</span>
      <span data-testid="username">{user?.username || "null"}</span>
      <span data-testid="initial">{usernameInitial}</span>
      <button data-testid="login" onClick={() => login("test-jwt", { username: "Alice", id: 1 })}>Login</button>
      <button data-testid="logout" onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("fournit les valeurs par défaut (non connecté)", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Après le useEffect initial, isLoading passe à false
    await vi.waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("logged-in").textContent).toBe("false");
    expect(screen.getByTestId("jwt").textContent).toBe("null");
    expect(screen.getByTestId("initial").textContent).toBe("?");
  });

  it("login met à jour le state", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    act(() => {
      screen.getByTestId("login").click();
    });

    expect(screen.getByTestId("logged-in").textContent).toBe("true");
    expect(screen.getByTestId("jwt").textContent).toBe("test-jwt");
    expect(screen.getByTestId("username").textContent).toBe("Alice");
    expect(screen.getByTestId("initial").textContent).toBe("A");
  });

  it("logout réinitialise le state", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await vi.waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    // Login puis logout
    act(() => { screen.getByTestId("login").click(); });
    expect(screen.getByTestId("logged-in").textContent).toBe("true");

    act(() => { screen.getByTestId("logout").click(); });
    expect(screen.getByTestId("logged-in").textContent).toBe("false");
    expect(screen.getByTestId("jwt").textContent).toBe("null");
    expect(screen.getByTestId("username").textContent).toBe("null");
  });

  it("useAuth en dehors du provider lance une erreur", () => {
    expect(() => render(<AuthConsumer />)).toThrow("useAuth must be used within an AuthProvider");
  });
});
