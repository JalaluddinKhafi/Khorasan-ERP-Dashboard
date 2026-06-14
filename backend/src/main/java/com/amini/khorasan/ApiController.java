public class ApiController {

  final JdbcTemplate db;
  final LedgerService ledger;
  final PasswordEncoder encoder;

  ApiController(
    JdbcTemplate db,
    LedgerService ledger,
