# Ramic Studio redesign — code review

## Summary

The project was rebuilt from a minimal React/Vite shell into a React 19 + Vite 7 + Tailwind 4 + tRPC 11 + Drizzle full-stack site. The landing page, newsroom, admin publishing surface, notices schema, and typed procedures are implemented. **Overall assessment: ready for visual review and content replacement; not yet production-launch complete until brand assets, real game media, and owner authentication are supplied.**

## Critical issues

None found in the final automated checks.

## Major issues / follow-ups

1. **Brand assets are still placeholders.** The hero artwork is CSS-generated and game cards use remote Unsplash imagery. Replace these with Ramic-approved logo variants and optimized game art/video before launch.
2. **Admin route shell is discoverable publicly.** Publishing itself is protected by `adminProcedure`, but the `/admin` UI should be wrapped in an explicit authenticated/admin gate before production so the control-room surface is not exposed to anonymous visitors.
3. **Newsletter submit is intentionally a UI stub.** Wire it to a consent-aware subscription provider or a server procedure before collecting real addresses.
4. **Content localization is not yet wired.** The visual system is ready for Korean/English content, but copy currently ships in English.

## Security and reliability review

- No raw SQL input is interpolated in the new feature procedures.
- Notice creation uses a Zod schema with bounded title/body input and a constrained category enum.
- Database access is lazy and has an offline-safe fallback for public newsroom reads.
- Session/auth plumbing remains in the scaffold; protected publishing uses the template's admin procedure.
- `prefers-reduced-motion` is respected for non-essential animation.
- Interactive controls have labels, keyboard-native buttons, visible focus via browser defaults, and mobile layouts were captured at 375px.

## Verification

- `pnpm test`: **2 files / 2 tests passed**
- `pnpm check`: **passed**
- `pnpm build`: **passed** (client + server bundle)
- Managed dev-server health: **running; dependencies OK; LSP and TypeScript clean**
- Visual QA: desktop 1280×720 and mobile 375×812 captures for `/`, `/news`, `/admin`

## Verdict

**Comment / ready for stakeholder review.** The architecture is sound for the first redesign slice; prioritize real studio assets, authentication gating, and localized content before launch.
