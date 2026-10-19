<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Konvence projektu BSE ERP

- Jazyk: názvy kolekcí, polí a funkcí česky bez diakritiky (camelCase), popisky v administraci česky s diakritikou.
- Hodnoty číselníků (`value`) se po nasazení nemění, jen přidávají – jsou v databázi. Číselníky patří do `ciselniky.ts` daného modulu.
- Odvozené hodnoty (čísla, součty, marže) počítá server v hookách; klientovi se nevěří. Bezpečnostní pravidla mají integrační test.
- Selecty ve vnořených skupinách potřebují krátký `enumName` (PostgreSQL má limit 63 znaků na identifikátor).
- Po změně datového modelu: `npm run generate:types`, `npm run migrate:create -- popis-zmeny`, `npm test`.
- Commit messages česky bez diakritiky, krátce.
