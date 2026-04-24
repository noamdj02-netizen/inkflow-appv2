# UX Designer Reference Guide

Complete reference for design patterns, accessibility guidelines, and wireframe techniques.

## Table of Contents

1. [Wireframe Techniques](#wireframe-techniques)
2. [Design Patterns Library](#design-patterns-library)
3. [Accessibility Guidelines](#accessibility-guidelines)
4. [Responsive Design Strategies](#responsive-design-strategies)
5. [Component Specifications](#component-specifications)
6. [User Flow Diagrams](#user-flow-diagrams)
7. [Design System Setup](#design-system-setup)

## Wireframe Techniques

### ASCII Wireframe Best Practices

**Layout Characters:**

```
Boxes: ┌─┐ └─┘ ├─┤ │
Light: ┌─┐ └─┘ ├─┤ │
Heavy: ┏━┓ ┗━┛ ┣━┫ ┃
Double: ╔═╗ ╚═╝ ╠═╣ ║
```

**Full Page Example:**

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  [Search...]         [Nav1] [Nav2] [Account ▼] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  Main Content Area            │
│  │  Sidebar            │                               │
│  │                     │  ┌─────────────────────────┐  │
│  │  • Link 1           │  │  Featured Content       │  │
│  │  • Link 2           │  │                         │  │
│  │  • Link 3           │  │  [Hero Image]           │  │
│  │                     │  │                         │  │
│  │  ┌───────────────┐  │  │  Headline Text          │  │
│  │  │ Widget        │  │  │  Description text...    │  │
│  │  │               │  │  │                         │  │
│  │  │ [Action]      │  │  │  [Call to Action]       │  │
│  │  └───────────────┘  │  └─────────────────────────┘  │
│  │                     │                               │
│  └─────────────────────┘  ┌──────┐ ┌──────┐ ┌──────┐  │
│                           │Card 1│ │Card 2│ │Card 3│  │
│                           │      │ │      │ │      │  │
│                           └──────┘ └──────┘ └──────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Footer  |  Links  |  Privacy  |  Terms  |  © 2025    │
└─────────────────────────────────────────────────────────┘
```

### Structured Wireframe Description

When ASCII is not suitable, use structured descriptions:

```markdown
## Screen: Dashboard

### Layout

- Header (fixed, 64px height)
  - Logo (left, 120px × 40px)
  - Search bar (center, 400px × 40px)
  - User menu (right, dropdown)

- Sidebar (left, 240px width, sticky)
  - Navigation links (5 items)
  - Widget section (200px × 150px)

- Main content area (flex-grow)
  - Hero section (100% × 400px)
    - Background image
    - Headline (H1)
    - Subheading (H2)
    - CTA button (160px × 48px)
  - Card grid (3 columns, gap 24px)
    - Cards (300px × 250px each)

- Footer (64px height)
  - Links (horizontal list)
  - Copyright notice

### Interactions

- Logo → Navigate to home
- Search → Autocomplete dropdown (max 8 results)
- User menu → Dropdown with 4 options
- Navigation links → Page navigation with active state
- Hero CTA → Opens modal or navigates to sign-up
- Cards → Hover effect (shadow + scale 1.02)
- Cards click → Navigate to detail page

### Responsive Behavior

- Mobile (< 768px):
  - Sidebar collapses to hamburger menu
  - Card grid becomes single column
  - Hero height reduces to 300px

- Tablet (768-1023px):
  - Card grid becomes 2 columns
  - Sidebar remains visible but narrower (200px)

- Desktop (1024px+):
  - Full 3-column layout
  - All hover states active

### Accessibility

- Landmark regions: header, nav, main, footer
- Skip to content link
- Search: aria-label="Search products"
- User menu: aria-haspopup="true", aria-expanded state
- Cards: aria-label with card title
- Focus indicators: 2px solid primary color
- Keyboard navigation: Tab order logical
```

## Design Patterns Library

### Navigation Patterns

**Top Navigation Bar:**

```
Desktop:
┌─────────────────────────────────────────┐
│  [Logo]    Home  About  Services  Contact  [Search] [Account] │
└─────────────────────────────────────────┘

Properties:
- Height: 64px
- Logo: Left-aligned, 40px height
- Links: Horizontal, 16px spacing
- Hover: Underline or color change
- Active: Bold or underline
- Sticky on scroll
```

**Hamburger Menu (Mobile):**

```
Mobile:
┌─────────────────┐
│  [≡]  Logo  [⚙] │
└─────────────────┘

Expanded:
┌─────────────────┐
│  [×]  Logo  [⚙] │
├─────────────────┤
│  Home           │
│  About          │
│  Services       │
│  Contact        │
└─────────────────┘

Properties:
- Icon: 24px × 24px, right padding 16px
- Menu slides from left or top
- Backdrop overlay (rgba(0,0,0,0.5))
- Focus trap within menu
- Close on outside click or Escape
- Animate 300ms ease-out
```

**Tab Navigation:**

```
┌────────────────────────────────────┐
│  [Tab 1*]  [Tab 2]  [Tab 3]        │
├────────────────────────────────────┤
│                                    │
│  Content for Tab 1                 │
│                                    │
└────────────────────────────────────┘

Properties:
- Active tab: Border-bottom 2px
- Inactive tabs: Muted color
- Hover: Background color change
- Keyboard: Arrow keys to switch
- ARIA: role="tablist", aria-selected
```

**Breadcrumbs:**

```
Home > Category > Subcategory > Current Page

Properties:
- Separator: > or / or →
- Links: All except current page
- Current page: Bold, not clickable
- Font size: 14px
- ARIA: aria-label="Breadcrumb"
```

### Form Patterns

**Single Column Form:**

```
┌────────────────────────────┐
│  Form Title                │
│                            │
│  First Name *              │
│  [________________]        │
│                            │
│  Last Name *               │
│  [________________]        │
│                            │
│  Email *                   │
│  [________________]        │
│  ✓ Valid email format      │
│                            │
│  Password *                │
│  [________________] [👁]   │
│  • 8+ characters           │
│                            │
│  [ ] I agree to terms      │
│                            │
│  [    Submit    ]          │
│                            │
└────────────────────────────┘

Best Practices:
- Labels above inputs
- Required fields marked with *
- Input width: 100% (mobile), max 400px (desktop)
- Input height: 48px minimum
- Font size: 16px minimum (prevents iOS zoom)
- Inline validation on blur
- Success states: Green checkmark
- Error states: Red border + message below
- Submit button: Full width mobile, auto desktop
- Disabled state while submitting
```

**Form Validation States:**

```
Default:
┌────────────────────────────┐
│  Email                     │
│  [________________]        │
└────────────────────────────┘

Focus:
┌────────────────────────────┐
│  Email                     │
│  [████████████████] ← blue │
└────────────────────────────┘

Valid:
┌────────────────────────────┐
│  Email                     │
│  [████████████████] ✓      │
└────────────────────────────┘

Error:
┌────────────────────────────┐
│  Email                     │
│  [████████████████] ← red  │
│  ✕ Please enter valid email│
└────────────────────────────┘
```

### Card Patterns

**Basic Card:**

```
┌────────────────────┐
│  [Image 16:9]      │
├────────────────────┤
│  Card Title        │
│  Description text  │
│  continues here... │
│                    │
│  [Read More]       │
└────────────────────┘

Properties:
- Padding: 16px (mobile), 24px (desktop)
- Image: aspect-ratio 16:9 or 1:1
- Title: H3, 20px font
- Description: 16px, 1.5 line-height
- Border-radius: 8px
- Shadow: 0 2px 8px rgba(0,0,0,0.1)
- Hover: Shadow 0 4px 16px rgba(0,0,0,0.15)
- Transition: 200ms ease
```

**Card Grid:**

```
┌─────┐ ┌─────┐ ┌─────┐
│Card │ │Card │ │Card │
│  1  │ │  2  │ │  3  │
└─────┘ └─────┘ └─────┘

┌─────┐ ┌─────┐ ┌─────┐
│Card │ │Card │ │Card │
│  4  │ │  5  │ │  6  │
└─────┘ └─────┘ └─────┘

Desktop: 3 columns, gap 24px
Tablet: 2 columns, gap 16px
Mobile: 1 column, gap 16px
```

### Modal Patterns

**Modal Dialog:**

```
┌─────────────────────────────────────┐
│  Overlay (rgba(0,0,0,0.5))          │
│                                     │
│    ┌─────────────────────────┐     │
│    │ Modal Title          [×]│     │
│    ├─────────────────────────┤     │
│    │                         │     │
│    │  Modal content goes     │     │
│    │  here with text and     │     │
│    │  possible forms         │     │
│    │                         │     │
│    ├─────────────────────────┤     │
│    │     [Cancel] [Confirm]  │     │
│    └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘

Properties:
- Modal: Max-width 600px, centered
- Close button: Top-right, 24px × 24px
- Padding: 24px
- Footer: Right-aligned buttons
- Focus: Trap within modal
- Keyboard: Escape to close
- Backdrop: Click to close (optional)
- ARIA: role="dialog", aria-modal="true"
- Z-index: 1000+
```

### Button Patterns

**Button Hierarchy:**

```
Primary:     [  Primary Action  ]  ← Solid, high contrast
Secondary:   [  Secondary Action ]  ← Outlined
Tertiary:    [  Tertiary Action  ]  ← Text only

Properties:
- Height: 48px (touch), 40px (desktop acceptable)
- Width: Min 120px, auto-fit content
- Padding: 16px 32px
- Border-radius: 4px or 8px
- Font: 16px, medium weight
- States: default, hover, focus, active, disabled
- Disabled: 50% opacity, cursor not-allowed
```

**Button States:**

```
Default:    [ Button ]
Hover:      [ Button ] ← Darken 10%
Focus:      [ Button ] ← 2px outline
Active:     [ Button ] ← Darken 20%
Disabled:   [ Button ] ← 50% opacity
Loading:    [ ⟳ Loading... ]
```

**Touch Targets:**

- Minimum size: 44px × 44px
- Spacing: Minimum 8px between targets
- Mobile: Larger targets (48px+)

## Accessibility Guidelines

See `resources/accessibility-guide.md` for complete WCAG 2.1 reference.

### Quick Accessibility Checklist

**Visual:**

- [ ] Color contrast ≥ 4.5:1 (text)
- [ ] Color contrast ≥ 3:1 (UI components)
- [ ] Don't rely on color alone
- [ ] Text resizable to 200%
- [ ] No horizontal scroll at 320px width

**Keyboard:**

- [ ] All functionality via keyboard
- [ ] Visible focus indicators (2px outline minimum)
- [ ] Logical tab order
- [ ] No keyboard traps
- [ ] Skip links for navigation

**Semantic:**

- [ ] Proper heading hierarchy (H1 > H2 > H3)
- [ ] Landmark regions (header, nav, main, footer)
- [ ] Alt text for images
- [ ] Labels for form inputs
- [ ] ARIA when semantic HTML insufficient

**Interactive:**

- [ ] Error messages clear and actionable
- [ ] Form validation messages announced
- [ ] Loading states announced
- [ ] Success/failure feedback
- [ ] Sufficient time for interaction

## Responsive Design Strategies

### Mobile-First Approach

```css
/* Mobile base styles (320px+) */
.container {
  width: 100%;
  padding: 16px;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }

  .grid {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 24px;
  }

  .grid-item {
    flex: 0 0 calc(50% - 12px);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px;
  }

  .grid-item {
    flex: 0 0 calc(33.333% - 16px);
  }
}
```

### Responsive Typography

```
Mobile (320px+):
- H1: 28px
- H2: 24px
- H3: 20px
- Body: 16px
- Small: 14px

Tablet (768px+):
- H1: 36px
- H2: 28px
- H3: 22px
- Body: 16px
- Small: 14px

Desktop (1024px+):
- H1: 48px
- H2: 36px
- H3: 24px
- Body: 18px
- Small: 16px

Line height: 1.5 (body), 1.2 (headings)
```

### Responsive Images

```
Mobile:
- Hero images: 100vw, max 768px
- Card images: 100%, aspect-ratio 16:9
- Avatars: 40px × 40px

Desktop:
- Hero images: 100vw, max 1920px
- Card images: 300px, aspect-ratio 16:9
- Avatars: 48px × 48px

Use srcset and sizes for performance
Use WebP with fallback
Lazy load below-fold images
```

## Component Specifications

### Header Component

```
Properties:
- Height: 64px (mobile), 80px (desktop)
- Background: White or brand color
- Position: Sticky top 0
- Z-index: 100
- Shadow: 0 2px 4px rgba(0,0,0,0.1) on scroll

Elements:
- Logo: 40px height, left-aligned
- Navigation: Horizontal list (desktop), hamburger (mobile)
- Search: 300px width (desktop), modal (mobile)
- User menu: Dropdown, right-aligned

States:
- Default: Transparent or colored
- Scrolled: White with shadow
- Mobile menu: Full overlay
```

### Footer Component

```
Properties:
- Background: Neutral-900
- Color: White
- Padding: 48px 24px
- Sections: Links, social, legal, copyright

Layout:
Mobile: Stacked sections
Desktop: 4-column grid

Elements:
- Link groups: Headings + lists
- Social icons: 24px × 24px, gap 16px
- Copyright: Small text, centered
```

### Form Input Component

```
Properties:
- Height: 48px
- Border: 1px solid neutral-300
- Border-radius: 4px
- Padding: 12px 16px
- Font-size: 16px (prevents iOS zoom)
- Background: White

States:
- Default: Border neutral-300
- Focus: Border primary-500, shadow 0 0 0 3px primary-100
- Error: Border error-500, shadow 0 0 0 3px error-100
- Disabled: Background neutral-100, cursor not-allowed
- Success: Border success-500, checkmark icon

Label:
- Font-size: 14px
- Font-weight: 500
- Margin-bottom: 8px
- Required indicator: Red asterisk

Helper text:
- Font-size: 14px
- Color: Neutral-600
- Margin-top: 4px

Error message:
- Font-size: 14px
- Color: Error-600
- Icon: Error icon
- Margin-top: 4px
```

## User Flow Diagrams

### Flow Notation

```
[Start] → [Step 1] → [Decision?]
                         │
                    Yes  │  No
                         │
                    [Step 2A]  [Step 2B]
                         │         │
                         └────┬────┘
                              │
                          [End]
```

### Example Flow: User Registration

```
[Landing Page]
      │
      ↓
[Click "Sign Up"]
      │
      ↓
[Registration Form]
  • First name
  • Last name
  • Email
  • Password
      │
      ↓
[Validation]
      │
  Valid?
   ├─ No → [Show Errors] → [Back to Form]
   │
   └─ Yes
      │
      ↓
[Email Verification]
  Send code to email
      │
      ↓
[Enter Code]
      │
  Correct?
   ├─ No → [Show Error] → [Resend Option]
   │
   └─ Yes
      │
      ↓
[Success Page]
  • Welcome message
  • Next steps
      │
      ↓
[Redirect to Dashboard]

Error States:
- Invalid email format
- Password too weak
- Email already exists
- Verification code expired
- Network error
```

## Design System Setup

### Color System Structure

```
Primary:
- primary-50: #... (lightest)
- primary-100: #...
- primary-500: #... (base)
- primary-900: #... (darkest)

Secondary:
- secondary-50: #...
- secondary-500: #...
- secondary-900: #...

Semantic:
- success: #22c55e
- warning: #f59e0b
- error: #ef4444
- info: #3b82f6

Neutral:
- neutral-50: #fafafa
- neutral-100: #f5f5f5
- neutral-500: #737373
- neutral-900: #171717

Ensure all combinations meet WCAG AA
```

### Typography System

```
Font Families:
- sans: system-ui, -apple-system, "Segoe UI", Roboto
- serif: Georgia, Cambria, "Times New Roman"
- mono: "Fira Code", Consolas, Monaco, monospace

Scale:
- xs: 12px / 1rem
- sm: 14px / 0.875rem
- base: 16px / 1rem
- lg: 18px / 1.125rem
- xl: 20px / 1.25rem
- 2xl: 24px / 1.5rem
- 3xl: 30px / 1.875rem
- 4xl: 36px / 2.25rem
- 5xl: 48px / 3rem

Weights:
- normal: 400
- medium: 500
- semibold: 600
- bold: 700
```

### Spacing System

```
Base unit: 8px

Scale:
- 0: 0
- 1: 4px (0.5 × base)
- 2: 8px (1 × base)
- 3: 12px (1.5 × base)
- 4: 16px (2 × base)
- 5: 20px (2.5 × base)
- 6: 24px (3 × base)
- 8: 32px (4 × base)
- 10: 40px (5 × base)
- 12: 48px (6 × base)
- 16: 64px (8 × base)

Use for:
- Margins
- Padding
- Gaps
- Positioning
```

### Shadow System

```
Elevation:
- xs: 0 1px 2px rgba(0,0,0,0.05)
- sm: 0 2px 4px rgba(0,0,0,0.05)
- md: 0 4px 8px rgba(0,0,0,0.1)
- lg: 0 8px 16px rgba(0,0,0,0.1)
- xl: 0 12px 24px rgba(0,0,0,0.15)
- 2xl: 0 24px 48px rgba(0,0,0,0.2)

Use for:
- Cards: md
- Dropdowns: lg
- Modals: xl
- Tooltips: sm
```

## Best Practices Summary

1. **Always design mobile-first** - Start with 320px, scale up
2. **Use consistent spacing** - 8px base unit for all spacing
3. **Maintain accessibility** - WCAG 2.1 AA minimum, test with tools
4. **Document interactions** - Specify all states (hover, focus, active, disabled)
5. **Provide context** - Explain why design decisions were made
6. **Use semantic HTML** - Proper elements for proper purposes
7. **Test keyboard navigation** - All features accessible without mouse
8. **Validate color contrast** - Use contrast checker for all text/background pairs
9. **Include loading states** - Show feedback for async operations
10. **Design error states** - Clear, actionable error messages

For more details, see:

- `resources/accessibility-guide.md` - Complete WCAG reference
- `resources/design-patterns.md` - Full pattern library
- `resources/design-tokens.md` - Design system tokens
