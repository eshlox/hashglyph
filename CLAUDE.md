# CLAUDE.md

## Rules

- Always use `pnpm`. Never `npm` or `yarn`.
- You may create git commits on the user's behalf, following the rules in [Commit Messages](#commit-messages). Do not push or run other git operations unless asked.
- Use the latest stable language/framework features. Replace deprecated patterns and legacy polyfills with native APIs. If a native feature can replace a library, use it.
- Write the absolute minimum code required. KISS. Every line must earn its right to exist.
- Code must be self-documenting through expressive naming. Comments explain _why_, never _what_.
- Do not modify code that is already robust, secure, and clear. Focus on adding value.

## Commit Messages

When you do write a commit message, the subject line must:

- Use the imperative mood.
- Start with a capital letter.
- Have no period at the end.
- Be at most 50 characters.
- Be specific and describe _what_ changed.
- Never use generic words alone.
- Use no conventional-commit prefixes (no `feat:`, `fix:`, etc.).
- Be plain English.

## Critical Thinking

- Always question requests before implementing. Ask _why_ before _how_.
- Proactively voice concerns before proceeding if something seems wrong, unnecessary, or overcomplicated. Do not wait to be asked.
- Propose better alternatives when possible — but voicing concerns is valuable even without one.
- This applies to direct requests too. If there was a solid reason behind your original approach (e.g., avoiding duplication, better separation of concerns), push back with clear reasoning instead of silently complying.
