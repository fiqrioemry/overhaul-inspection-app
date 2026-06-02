# CLAUDE.md — React Frontend Architecture Guide

## Stack

React 19 · TypeScript · Vite · React Router v7 · TanStack Query v5 · Zustand · Axios · React Hook Form · Zod · Shadcn UI · Tailwind CSS · i18next · Sonner

---

## Folder Structure

```
/public/
  locales/
    en/{auth,post,chat,etc}.json          # English translation files per feature domain
    id/{auth,post,chat,etc}.json          # Indonesian translation files per feature domain

/src/
  assets/                                 # Static assets (images, icons, fonts)

  components/
    common/                               # Generic UI primitives used across features (AlertCard, Avatar, etc.)
    fields/                               # Reusable form field wrappers (react-hook-form + shadcn ui)
    layout/                               # App shell components (AppLayout, Sidebar, Navbar, etc.)
    ui/                                   # shadcn/ui base components (button, dialog, input, etc.)

  constants/
    auth.constant.ts                      # AUTH_ENDPOINTS, OAUTH_ENDPOINTS, config objects per feature
    chat.constant.ts
    posts.constant.ts                     # Endpoint strings, enum values, config — no logic

  features/
    auth/
      components/                         # UI components exclusive to auth (LoginForm, ProtectedRoute, etc.)
      auth.api.ts                         # Raw API call functions (axios) — return typed response or throw
      auth.query.ts                       # TanStack Query hooks: useQuery, useMutation wrappers
    posts/
      components/
      posts.api.ts
      posts.query.ts
    comment/
      components/
      comments.api.ts
      comments.query.ts
    hooks/                                # Global reusable hooks (useDebounce, useScrollToTop, useChatSocket, useTheme, useLanguage)

  lib/
    axios.ts                              # Axios instance + interceptors (auth redirect, error transform)
    query.ts                              # QueryClient config (QueryCache, MutationCache, global error toast)

  pages/
    LoginPage.tsx                         # Page components — thin, compose features + layout
    FeedPage.tsx
    ProfilePage.tsx
    # etc.

  schemas/
    auth.schema.ts                        # Zod schemas + inferred types + request interfaces per feature
    posts.schema.ts
    settings.schema.ts

  stores/
    auth.store.ts                         # Zustand store per feature (user, isAuthenticated, setUser, clearUser)
    chat.store.ts
    post.store.ts

  types/
    users.type.ts                         # TypeScript interfaces for domain entities
    response.type.ts                      # ResponseOK, ResponseSuccess<T>, ResponseError, PaginationMeta
    pagination.type.ts

  utils/
    formatDate.ts                         # Pure helper functions, no side effects, no imports from features/
    formatChat.ts
    formatImage.ts
    formatString.ts

  App.tsx                                 # Route tree: PublicRoute / ProtectedRoute + AppLayout wiring
  main.tsx                                # Entry: providers (BrowserRouter, QueryClientProvider, HelmetProvider)
  i18n.ts                                 # i18next init config
  index.css                               # Tailwind base + CSS variables
```

---

## Layer Rules

```
pages      → features/components, components/layout
features/  → features/*.api, features/*.query, components/*, stores/*, schemas/*, constants/*, types/*, utils/
*.query.ts → *.api.ts (one-to-one per feature)
*.api.ts   → lib/axios (never direct fetch)
stores/    → types/ only — no API calls
utils/     → no imports from features/, stores/, lib/
components/common & fields → no imports from features/
```

---

## Patterns

### API function (`features/*.api.ts`)

```ts
// Always typed input + output — never use `any`
// Always throw on error (axios interceptor transforms to ResponseError)
export async function login(data: LoginFormValues): Promise<ResponseSuccess<LoginData>> {
  const res = await api.post(AUTH_ENDPOINTS.login, data);
  return res.data;
}
```

### Query hook (`features/*.query.ts`)

```ts
// Wrap useQuery / useMutation — never call api directly from components
export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  const query = useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: fetchMe,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) setUser(query.data);
    if (query.isError) clearUser();
  }, [query.isSuccess, query.isError, query.data]);

  return query;
}
```

### Query key convention

```ts
// Always define keys as const arrays in *.query.ts
export const AUTH_KEYS = {
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

export const POST_KEYS = {
  list: (params?: object) => ["posts", "list", params] as const,
  detail: (id: string) => ["posts", "detail", id] as const,
};
```

### Zustand store

```ts
// One store per feature domain — keep flat, no nested actions
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}));

// Select primitively in components — avoid selecting whole store
const user = useAuthStore((s) => s.user);
```

### Zod schema + form types

```ts
// Schema in schemas/*.schema.ts — export inferred FormValues type
export const loginSchema = z.object({
  email: z.string().email("Email is not valid"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

// In components: zodResolver wires schema to react-hook-form
const { control, handleSubmit } = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "" },
});
```

### Form component (handler layer)

```ts
// Component responsibility: bind → call mutation/api → handle local UI state
async function onSubmit(values: LoginFormValues) {
  setServerError(null);
  try {
    const result = await login(values);
    navigate("/");
    toast.success(result?.message);
  } catch (err) {
    const res = err as ResponseError;
    setServerError({ message: res?.message, errors: res?.errors });
  }
}
```

### Reusable field components (`components/fields/`)

```tsx
// Always accept `control` + `name` from parent useForm — never own their form state
<ShortTextField control={control} name="email" label={t("auth:email")} type="email" />
<PasswordField  control={control} name="password" label={t("auth:password")} />
```

### Constants (`constants/*.constant.ts`)

```ts
// Endpoint strings, enum-like values, config objects — no logic, no imports from features
export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  logout: "/auth/logout",
  // ...
} as const;
```

### Response types (`types/response.type.ts`)

```ts
// Standardized shapes returned by all API functions
export interface ResponseSuccess<T> {
  success: true;
  message: string;
  data: T;
}
export interface ResponseOK {
  success: true;
  message: string;
}
export interface ResponseError {
  success: false;
  message: string;
  status: number;
  code: string;
  errors?: FieldError[];
}
```

### Axios interceptor (`lib/axios.ts`)

```ts
// Single place for auth redirect + error normalization
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (status === 401 && !shouldSkip) {
      useAuthStore.getState().clearUser();
      window.location.href = "/login";
    }
    const responseError: ResponseError = {
      /* normalize */
    };
    return Promise.reject(responseError);
  },
);
```

### Global query error handling (`lib/query.ts`)

```ts
// Global toasts for query/mutation errors — per-component catch only for local UI
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleQueryError }),
  mutationCache: new MutationCache({ onError: handleMutationError }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});
```

### i18n usage

```ts
// Namespace matches translation file name
const { t } = useTranslation(["auth", "common"]);
t("auth:loginTitle"); // → /public/locales/{lang}/auth.json → loginTitle
t("common:error");
```

### Infinite scroll pattern (pages)

```tsx
// IntersectionObserver on sentinel div — not scroll events
const observerTarget = useRef<HTMLDivElement>(null);
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    { threshold: 0.1 },
  );
  const target = observerTarget.current;
  if (target) observer.observe(target);
  return () => {
    if (target) observer.unobserve(target);
  };
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

const allPosts = data?.pages.flatMap((page) => page.data) ?? [];
```

### Routing (`App.tsx`)

```tsx
// PublicRoute  → redirect to / if already authenticated
// ProtectedRoute → redirect to /login if unauthenticated
<Route element={<PublicRoute />}>
  <Route path="/login" element={<Login />} />
</Route>
<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route path="/" element={<FeedPage />} />
  </Route>
</Route>
```

---

## Do

- **API functions** in `*.api.ts` — plain async functions, typed, return data or throw `ResponseError`
- **Query hooks** in `*.query.ts` — one file per feature, always export `FEATURE_KEYS`
- **Zustand store** for client-side global state — never for server cache (use TanStack Query)
- **Zod schema** for all form + API request validation — export `FormValues` type from schema
- **`components/fields/`** for reusable form fields that accept `control` + `name`
- **`constants/`** for all endpoint strings and enum-like values — no magic strings in components
- **`types/`** for all shared TypeScript interfaces — use `ResponseSuccess<T>` / `ResponseError` everywhere
- **`utils/`** for pure stateless helpers only — no side effects, no store imports
- **i18n** namespace per feature — always `useTranslation(["featureName"])`
- **Helmet** on every page for SEO meta tags
- **Sonner toast** for user feedback — success from mutation `onSuccess`, error from global QueryCache or local catch

## Don't

- Don't call `api` (axios) directly inside components — always go through `*.api.ts`
- Don't use TanStack Query `useQuery` inside `*.api.ts` — only plain async functions there
- Don't put business logic in pages — pages only compose feature components
- Don't put feature-specific components in `components/common` — belongs in `features/*/components/`
- Don't import from `features/` inside `components/common`, `components/fields`, or `utils/`
- Don't hardcode endpoint strings — always use `constants/*.constant.ts`
- Don't use `any` — use `unknown` then narrow, or define proper types in `types/`
- Don't manage server state in Zustand — only client-side UI state (user session, theme, chat draft, etc.)
- Don't skip `staleTime` in queries — always set an appropriate value to avoid unnecessary refetches
- Don't define query keys inline — always reference from `FEATURE_KEYS` object

---

## File Naming Convention

| Layer             | Pattern                 | Example             |
| ----------------- | ----------------------- | ------------------- |
| Page              | `PascalCasePage.tsx`    | `FeedPage.tsx`      |
| Feature component | `PascalCase.tsx`        | `FeedPostCard.tsx`  |
| Common component  | `PascalCase.tsx`        | `AlertCard.tsx`     |
| Field component   | `PascalCaseField.tsx`   | `PasswordField.tsx` |
| API module        | `{feature}.api.ts`      | `auth.api.ts`       |
| Query module      | `{feature}.query.ts`    | `auth.query.ts`     |
| Store             | `{feature}.store.ts`    | `auth.store.ts`     |
| Schema            | `{feature}.schema.ts`   | `auth.schema.ts`    |
| Constant          | `{feature}.constant.ts` | `auth.constant.ts`  |
| Type              | `{domain}.type.ts`      | `users.type.ts`     |
| Hook              | `use{PascalCase}.ts`    | `useDebounce.ts`    |
| Util              | `format{PascalCase}.ts` | `formatDate.ts`     |
| Translation file  | `{feature}.json`        | `auth.json`         |
