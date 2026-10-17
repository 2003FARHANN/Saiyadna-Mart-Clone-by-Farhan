// Browser-local DEMO storage. Public passwords and client role checks are not production authentication.
import { seedState, VERSION, dateKey, log, uid } from "./domain.js";
export const STORAGE_KEY = "saiyadna-mart-demo-v1";
const SESSION_KEY = "saiyadna-mart-session-v1";
let memory = null;
export function load() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) {
      const s = JSON.parse(value);
      if (s.version === VERSION) return s;
    }
  } catch (e) {
    console.warn("Local data unavailable:", e.message);
  }
  if (!memory) {
    memory = seedState();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {}
  }
  return structuredClone(memory);
}
export function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  memory = state;
  window.dispatchEvent(new CustomEvent("mart:change"));
  return state;
}
export function transact(fn) {
  const s = load(),
    result = fn(s);
  save(s);
  return result;
}
export function currentUser(s = load()) {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    return s.users.find((u) => u.id === id && u.active) || null;
  } catch {
    return null;
  }
}
export function signIn(role, login, password) {
  const s = load(),
    u = s.users.find(
      (u) =>
        u.active &&
        u.role === role &&
        u.login.toLowerCase() === login.trim().toLowerCase() &&
        u.password === password,
    );
  if (!u) throw new Error("The ID or password does not match this portal.");
  sessionStorage.setItem(SESSION_KEY, u.id);
  return u;
}
export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
}
export function reset() {
  signOut();
  sessionStorage.removeItem("mart-cart");
  memory = seedState();
  save(memory);
}
export function getCart() {
  try {
    return JSON.parse(sessionStorage.getItem("mart-cart") || "[]");
  } catch {
    return [];
  }
}
export function setCart(value) {
  sessionStorage.setItem("mart-cart", JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("mart:cart"));
}
export function recordVisit() {
  const day = dateKey(),
    first = !sessionStorage.getItem(`mart-visit-${day}`);
  transact((s) => {
    let row = s.traffic.find((x) => x.day === day);
    if (!row) {
      row = { day, visitors: 0, pageviews: 0, sample: false };
      s.traffic.push(row);
    }
    row.pageviews++;
    if (first) row.visitors++;
  });
  sessionStorage.setItem(`mart-visit-${day}`, "1");
}
export function registerCustomer(data) {
  const login = data.login.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login))
    throw new Error("Enter a valid email address.");
  if (data.password.length < 8)
    throw new Error("Use at least 8 characters for your demo password.");
  return transact((s) => {
    if (s.users.some((u) => u.login.toLowerCase() === login))
      throw new Error("This email is already registered.");
    const u = {
      id: uid("customer"),
      role: "customer",
      login,
      password: data.password,
      name: data.name.trim(),
      active: true,
      address: null,
    };
    if (!u.name) throw new Error("Add your name.");
    s.users.push(u);
    sessionStorage.setItem(SESSION_KEY, u.id);
    log(s, "Customer joined", u.name, u.name);
    return u;
  });
}
