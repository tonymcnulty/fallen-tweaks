# Preact Guide for Fallen Tweaks

A quick reference for maintaining and extending the options page. Preact is a 3KB alternative to React with the same API — if you've seen React code, you can read Preact code.

---

## Key Concepts

### Components

A component is a function that returns HTML-like markup (JSX). Each component manages a piece of the UI.

```tsx
function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}!</p>;
}
```

Use it like an HTML tag:

```tsx
<Greeting name="delicious friend" />
```

### Props

Data flows **down** via props. A parent passes values; the child receives them as a typed object.

```tsx
interface ModuleCardProps {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function ModuleCard({ title, enabled, onToggle }: ModuleCardProps) {
  return (
    <div>
      <h2>{title}</h2>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onToggle((e.target as HTMLInputElement).checked)}
      />
    </div>
  );
}
```

### useState — Local State

`useState` creates a value that persists across re-renders. When you call the setter, the component re-renders with the new value.

```tsx
import { useState } from "preact/hooks";

function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Clicks: {count}</button>;
}
```

**Pattern used in our options page**: We store all module toggle states in a single `useState<Record<string, boolean>>`.

### useEffect — Side Effects

`useEffect` runs code **after** the component renders. Use it for fetching data, setting up listeners, etc.

```tsx
import { useEffect } from "preact/hooks";

function DataLoader() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Runs once on mount (empty dependency array)
    fetchData().then(setData);
  }, []);

  return <div>{data ? <Show data={data} /> : "Loading..."}</div>;
}
```

The second argument (`[]`) controls **when** the effect re-runs:
- `[]` → once, on mount
- `[value]` → whenever `value` changes
- omitted → every render (rarely what you want)

### useCallback — Stable Function References

`useCallback` memoizes a function so it doesn't get recreated every render. Useful when passing callbacks to child components.

```tsx
import { useCallback } from "preact/hooks";

const handleToggle = useCallback(async (id: string, enabled: boolean) => {
  await setModuleEnabled(id, enabled);
}, []);
```

---

## How We Use Preact in This Project

### File: `src/options/options.tsx`

The options page is the only place we use Preact. The structure is:

```
App                     ← top-level, manages state
├── Header              ← static, shows name + version
├── ModuleCard × N      ← one per module, receives props
└── Footer              ← static
```

**Data flow:**
1. `App` loads module states from `chrome.storage.sync` on mount
2. States are passed as props to each `ModuleCard`
3. When a toggle is clicked, `ModuleCard` calls `onToggle` (a prop)
4. `App` updates local state optimistically, then writes to storage
5. A `storage.onChanged` listener keeps state in sync if changed elsewhere (e.g. from the popup)

### Adding a New Module

No changes needed in the options page! Just add an entry to `MODULE_REGISTRY` in `src/shared/constants.ts`, and the options page will automatically show a new card.

---

## Preact vs React — Differences That Matter

| Aspect | Preact | React |
|---|---|---|
| Import | `from "preact/hooks"` | `from "react"` |
| Class attribute | `class="foo"` | `className="foo"` |
| Event handlers | Standard DOM events | Synthetic events |
| Size | ~3KB | ~40KB |

In practice, if you write standard JSX with `class` instead of `className`, it works.

---

## Useful Links

- [Preact docs](https://preactjs.com/guide/v10/getting-started)
- [Hooks reference](https://preactjs.com/guide/v10/hooks)
- [Differences from React](https://preactjs.com/guide/v10/differences-to-react)
