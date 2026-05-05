package com.amini.khorasan;

import static com.amini.khorasan.LedgerService.*;

import java.math.*;
import java.security.Principal;
import java.time.*;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
public class ApiController {

  final JdbcTemplate db;
  final LedgerService ledger;
  final PasswordEncoder encoder;

  ApiController(
    JdbcTemplate db,
    LedgerService ledger,
