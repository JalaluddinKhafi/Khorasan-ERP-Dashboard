
  @Test
  void rejectsShortAndOversizeUtf8Passwords() {
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate(null));
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate("short"));
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate(" ".repeat(12)));
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate("a".repeat(73)));
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate("ک".repeat(37)));
  }
}
