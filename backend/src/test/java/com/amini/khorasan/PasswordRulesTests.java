package com.amini.khorasan;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class PasswordRulesTests {
  @Test
  void acceptsAsciiAndDariPasswordsAtByteLimit() {
    assertDoesNotThrow(() -> PasswordRules.validate("a".repeat(72)));
    assertDoesNotThrow(() -> PasswordRules.validate("ک".repeat(36)));
  }

  @Test
  void rejectsShortAndOversizeUtf8Passwords() {
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate(null));
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate("short"));
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate(" ".repeat(12)));
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate("a".repeat(73)));
    assertThrows(IllegalArgumentException.class, () -> PasswordRules.validate("ک".repeat(37)));
  }
}
