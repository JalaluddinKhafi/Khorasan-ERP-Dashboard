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
    if (
      r.status === 404 ||
      !r.headers.get("content-type")?.includes("application/json")
    ) {
      throw new Error(
        "صفحهٔ ورود را از آدرس http://localhost:8082/dashboard/login.html باز کنید و فعال بودن سرور را بررسی کنید.",
      );
    }
    if (!r.ok)
      throw new Error(
        "سرویس ورود با مشکل روبه‌رو است؛ کمی بعد دوباره تلاش کنید.",
      );
    const result = await r.json();
    if (result.ok !== true) throw new Error("پاسخ سرویس ورود نامعتبر است.");
    location.href = "dashboard.html";
  } catch (error) {
    document.querySelector("#login-error").textContent =
      error instanceof TypeError
        ? "ارتباط با سرور برقرار نشد. فعال بودن برنامه و آدرس http://localhost:8082 را بررسی کنید."
        : error.message;
  } finally {
    btn.disabled = false;
  }
});
