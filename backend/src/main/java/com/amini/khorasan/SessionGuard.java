package com.amini.khorasan;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Objects;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

// Revoke existing sessions when an administrator disables, renames or changes a user's credentials/role.
final class SessionGuard extends OncePerRequestFilter {

  private final JdbcTemplate db;

  SessionGuard(JdbcTemplate db) {
    this.db = db;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain chain
  ) throws ServletException, IOException {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (
      auth != null &&
      auth.isAuthenticated() &&
      !(auth instanceof AnonymousAuthenticationToken)
    ) {
      var users = db.queryForList(
        "SELECT active,role,password FROM app_users WHERE username=?",
        auth.getName()
      );
      boolean valid =
        !users.isEmpty() && Boolean.TRUE.equals(users.get(0).get("active"));
      if (valid) {
        var user = users.get(0);
        valid = auth
          .getAuthorities()
          .stream()
          .anyMatch(a -> a.getAuthority().equals("ROLE_" + user.get("role")));
        var session = request.getSession();
        String stamp = Objects.toString(user.get("password"));
        Object prior = session.getAttribute("credentialStamp");
        if (prior == null) session.setAttribute("credentialStamp", stamp);
        else valid = valid && stamp.equals(prior);
      }
      if (!valid) {
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        if (request.getRequestURI().startsWith("/api/")) {
          response.setStatus(401);
          response.setContentType("application/json;charset=UTF-8");
          response
            .getWriter()
            .write(
              "{\"message\":\"حساب یا دسترسی شما تغییر کرده است؛ دوباره وارد شوید\"}"
            );
        } else response.sendRedirect("/dashboard/login.html");
        return;
      }
    }
    chain.doFilter(request, response);
  }
}
