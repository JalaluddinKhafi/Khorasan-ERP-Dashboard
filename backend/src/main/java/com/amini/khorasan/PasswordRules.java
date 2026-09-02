package com.amini.khorasan;

import java.nio.charset.StandardCharsets;

final class PasswordRules {
  private PasswordRules() {}

  static void validate(String password) {
    if (password == null || password.isBlank() || password.length() < 12)
      throw new IllegalArgumentException("رمز عبور حداقل ۱۲ حرف باشد");
    if (password.getBytes(StandardCharsets.UTF_8).length > 72)
      throw new IllegalArgumentException("رمز عبور حداکثر ۷۲ بایت باشد");
  }
}
