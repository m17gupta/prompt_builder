export const ecomTemplate = `# COMPLETE E-COMMERCE PROMPT (FINAL)

## INSTRUCTIONS FOR AI
Act as an **Elite Full-Stack Next.js 15 Architect**, **E-commerce Specialist** and **Design System Expert**. Generate a complete, production-ready e-commerce website for fashion retail/D2C purposes that is **FULLY INTEGRATED with the Blueprint System**.

**CRITICAL REQUIREMENTS:**
- **NO .data.ts files** - Do not create any .data.ts files anywhere in the project
- **SINGLE PAGE JSON** - Each page has its own JSON configuration file
- **ALL PAGES RENDER FROM JSON** 
- **NO CMS DATABASE COLLECTION**
- **LOCALE SUPPORT**
- **TRANSLATION SUPPORT**
- **EDITABLE TEXT**
- **CLEAN TEXT STORAGE**
- **STYLING VIA CSS CLASSES**
- **BLUEPRINT INTEGRATION**
- **NO LANGUAGE TOGGLE BUTTON**
- **NO DARK MODE TOGGLE**

## VARIABLE CONFIGURATION (INPUT JIG)
\`\`\`yaml
# COMPANY IDENTITY
COMPANY_NAME: {{COMPANY_NAME}}
PROJECT_SLUG: {{PROJECT_SLUG}}
BUSINESS_TYPE: {{BUSINESS_TYPE}}
VERTICAL: {{VERTICAL}}
INDUSTRY: {{INDUSTRY}}
BUSINESS_GOAL: {{BUSINESS_GOAL}}
CURRENT_TENANT_DB_HEADER: {{CURRENT_TENANT_DB_HEADER}}

# LOCALIZATION PRIMITIVES
ACTIVE_LANGUAGES: {{ACTIVE_LANGUAGES}}
DEFAULT_LANGUAGE: {{DEFAULT_LANGUAGE}}
ACTIVE_CURRENCIES: {{ACTIVE_CURRENCIES}}
DEFAULT_CURRENCY: {{DEFAULT_CURRENCY}}
COMPANY_ADDRESS: {{COMPANY_ADDRESS}}
COMPANY_PHONE: {{COMPANY_PHONE}}
COMPANY_EMAIL: {{COMPANY_EMAIL}}
COMPANY_WHATSAPP: {{COMPANY_WHATSAPP}}
\`\`\`

## WEBSITE STRATEGY
**Purpose:** E-commerce/D2C fashion retail website
**Core Requirements:**
- **NO .data.ts files**
- **SINGLE PAGE JSON**
- **ALL PAGES RENDER FROM JSON**
- **NO CMS DATABASE COLLECTION**
- **DATA FLOW: JSON → Redux → Component**

## PAGE STRUCTURE
### Route Structure with Clean URLs
\`\`\`text
src/app/
├── [locale]/                     # Internal folder for all locales
│   ├── layout.tsx                # Locale-aware root layout
│   ├── page.tsx                  # Serves / (default) and /[locale]
│   ├── shop/
│   │   ├── page.tsx              # Serves /shop (default) and /[locale]/shop
│   │   └── [slug]/
│   │       └── page.tsx          # Product details (Server Component)
│   ├── cart/
│   │   └── page.tsx              # Serves /cart (default) and /[locale]/cart
│   ├── checkout/
│   ├── wishlist/
│   ├── about/
│   ├── contact/
│   ├── faq/
│   ├── orders/
│   ├── account/
│   └── search/
├── api/
└── admin/
\`\`\`

## BLUEPRINT SYSTEM INTEGRATION
### Architecture Overview
fetchBlueprintThunk (GET /api/platform/business-blueprint) -> BlueprintApiResponse -> blueprintSlice -> applyTheme -> Custom Properties
`;
