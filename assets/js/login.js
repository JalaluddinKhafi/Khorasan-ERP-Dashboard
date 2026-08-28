import { api } from "./api-service.js";

document.querySelector("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  document.querySelector("#login-error").textContent = "";
  try {
    const csrf = await api("csrf");
    const r = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { [csrf.headerName]: csrf.token },
      body: new URLSearchParams(new FormData(e.target)),
    });
    if (r.status === 401) throw new Error("نام کاربری یا رمز عبور نادرست است");
    if (r.status === 403)
      throw new Error(
        "نشست ورود منقضی شده است؛ صفحه را تازه کنید و دوباره وارد شوید.",
      );
