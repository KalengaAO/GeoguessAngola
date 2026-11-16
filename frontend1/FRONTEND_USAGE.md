# Uso actual do frontend

## Consultas com `useFetch`

`useFetch` é um hook client baseado em TanStack Query. Por padrão, consulta
automaticamente e cria a chave de cache com o endpoint e os parâmetros.

```tsx
"use client"

import { useFetch } from "@/hooks"

type StudentExample = { id: number; name: string }

export function StudentsList() {
  const { data, isLoading, isError, error, refetch } = useFetch<
    StudentExample[]
  >("/students", {
    queryKey: ["students", 1],
    params: { page: 1 },
  })

  if (isLoading) return <p>A carregar...</p>
  if (isError) return <p>{error.response?.data?.message ?? error.message}</p>
  if (!data?.length)
    return <button onClick={() => refetch()}>Actualizar</button>

  return (
    <ul>
      {data.map((student) => (
        <li key={student.id}>{student.name}</li>
      ))}
    </ul>
  )
}
```

Use uma `queryKey` diferente quando os parâmetros mudarem. Para adiar a consulta,
passe `enabled: false` e chame `refetch()`. O hook aceita tanto a resposta directa
como um envelope `{ data: ... }` e encaminha o sinal de cancelamento do React
Query para o Axios.

## Sessão com `AuthContext`

O `AuthProvider` já está montado no layout global. Componentes client podem ler
o estado ou terminar a sessão com `useAuth`. Na inicialização, restaura o
utilizador apenas quando encontra tanto `token` como `user` no `localStorage`;
`isLoading` permanece activo até essa verificação:

```tsx
"use client"

import { useAuth } from "@/contexts/AuthContext"

export function AccountMenu() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  if (isLoading) return <span>A verificar sessão...</span>
  if (!isAuthenticated) return <span>Sem sessão iniciada</span>

  return <button onClick={logout}>Terminar sessão de {user?.name}</button>
}
```

Depois de uma autenticação real, o resultado do serviço pode ser passado ao
contexto. Este hook demonstra o fluxo; os tipos e payloads devem ser adaptados
ao contrato do backend:

```tsx
"use client"

import { useAuth } from "@/contexts/AuthContext"
import { loginService } from "@/services/auth"
import type { ExampleLoginRequest } from "@/types/auth"

export function useExampleLogin() {
  const { setSession } = useAuth()

  return async (credentials: ExampleLoginRequest) => {
    const result = await loginService(credentials)
    setSession({
      token: result.data.access_token,
      user: result.data.user,
    })
  }
}
```

`setSession` guarda o token e o utilizador; `logout` limpa os dados locais e
redirecciona para `/entrar`. O `logout` actual não chama o endpoint de logout.

## Providers e estado actual

O layout global já disponibiliza ambos os providers:

```tsx
<ReactQueryProvider>
  <AuthProvider>{children}</AuthProvider>
</ReactQueryProvider>
```

`ReactQueryProvider` mantém uma instância estável de `QueryClient`, necessária
para o cache e hooks do TanStack Query. Não é preciso criar outro provider por
página. Em componentes dentro dele, `useQueryClient()` permite, por
exemplo, invalidar uma lista depois de a actualizar:

```tsx
"use client"

import { useQueryClient } from "@tanstack/react-query"

export function RefreshStudentsButton() {
  const queryClient = useQueryClient()

  return (
    <button
      onClick={() => queryClient.invalidateQueries({ queryKey: ["students"] })}
    >
      Actualizar lista
    </button>
  )
}
```

O Axios usa `NEXT_PUBLIC_API_URL` para a API separada (por omissão,
`http://localhost:8000/api`) e `NEXT_PUBLIC_API_TIMEOUT` (por omissão,
`10000` ms). Anexa o token guardado aos pedidos; numa resposta 401 limpa a sessão
local e redirecciona para `/entrar`.

O formulário de entrada ainda é demonstrativo: não chama `loginService`. Os
tipos e payloads de autenticação também são exemplos, não uma especificação do
backend.
