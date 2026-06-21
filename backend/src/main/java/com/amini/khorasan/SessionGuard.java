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
