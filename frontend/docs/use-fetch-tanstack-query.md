# `useFetch` e TanStack Query

Este frontend usa TanStack Query para consultar e atualizar dados do servidor. O
hook `src/hooks/useFetch.js` simplifica pedidos `GET`; para criar ou alterar
dados, use `useMutation` com os métodos `POST`, `PATCH` ou `PUT` do cliente
Axios partilhado (`src/services/api.js`).

## Pedido `GET` com `useFetch`

`useFetch(endpoint, options)` devolve o resultado de `useQuery`. O `endpoint` é
relativo ao `VITE_API_URL`. As opções suportadas pelo hook são:

- `queryKey`: chave estável para identificar a consulta. Por omissão, é
  `["api", endpoint, params]`.
- `params`: parâmetros de URL enviados ao servidor.
- `enabled`: ativa ou pausa o pedido; por omissão, `true`.
- `staleTime`, `gcTime`, `retry`, `select` e `refetchOnWindowFocus`: opções de
  consulta do TanStack Query.

Exemplo num hook de domínio:

```js
// src/hooks/useLocations.js
import { useFetch } from "./useFetch";

export const LOCATIONS_QUERY_KEY = ["locations"];

export function useLocations(filters = {}) {
    return useFetch("/locations/", {
        queryKey: [...LOCATIONS_QUERY_KEY, filters],
        params: filters,
        enabled: true,
    });
}
```

Consuma o hook num componente e trate os estados da consulta:

```jsx
import { useLocations } from "../hooks/useLocations";

function LocationsPage() {
    const { data, isLoading, isError, error, refetch } = useLocations({
        province: "Luanda",
    });

    if (isLoading) return <p>A carregar locais...</p>;
    if (isError) {
        return (
            <div>
                <p role="alert">Não foi possível carregar: {error.message}</p>
                <button type="button" onClick={() => refetch()}>
                    Tentar novamente
                </button>
            </div>
        );
    }

    return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

Inclua filtros e identificadores na `queryKey` quando alterarem o resultado.
Assim, cada conjunto de parâmetros tem a sua entrada de cache. Para consultas
dependentes de um identificador, pode pausar a consulta até o valor existir:

```js
export function useLocation(locationId) {
    return useFetch(`/locations/${locationId}/`, {
        queryKey: [...LOCATIONS_QUERY_KEY, locationId],
        enabled: Boolean(locationId),
    });
}
```

## Pedidos que alteram dados

`useFetch` é apenas para `GET`. Para operações de escrita, defina o pedido no
serviço e execute-o com `useMutation`. Isto separa as chamadas HTTP dos
componentes e mantém `api.js` responsável pelo URL base, token e renovação de
sessão.

Exemplos de serviço:

```js
// src/services/locationService.js
import api from "./api";

export async function createLocation(locationData) {
    const response = await api.post("/locations/", locationData);
    return response.data;
}

export async function replaceLocation({ id, locationData }) {
    const response = await api.put(`/locations/${id}/`, locationData);
    return response.data;
}

export async function updateLocation({ id, changes }) {
    const response = await api.patch(`/locations/${id}/`, changes);
    return response.data;
}
```

Use `POST` para criar, `PUT` para substituir o recurso completo e `PATCH` para
alterar apenas alguns campos. Os endpoints e formatos acima são exemplos;
confirme sempre o contrato da API antes de os usar.

### Criar com `POST`

```js
// src/hooks/useCreateLocation.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLocation } from "../services/locationService";
import { LOCATIONS_QUERY_KEY } from "./useLocations";

export function useCreateLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createLocation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
        },
    });
}
```

### Atualizar com `PUT` ou `PATCH`

Ambos podem ser executados como mutações. Use argumentos para passar o ID e os
dados ao serviço:

```js
// src/hooks/useUpdateLocation.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    replaceLocation,
    updateLocation,
} from "../services/locationService";
import { LOCATIONS_QUERY_KEY } from "./useLocations";

function useLocationMutation(mutationFn) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSuccess: (updatedLocation) => {
            queryClient.setQueryData(
                [...LOCATIONS_QUERY_KEY, updatedLocation.id],
                updatedLocation
            );
            queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
        },
    });
}

export function useReplaceLocation() {
    return useLocationMutation(replaceLocation);
}

export function usePatchLocation() {
    return useLocationMutation(updateLocation);
}
```

`setQueryData` atualiza imediatamente a entrada individual caso essa chave
esteja em cache; `invalidateQueries` marca como desatualizadas as consultas de
locais e permite que sejam carregadas novamente.

## Usar uma mutação num componente

`mutate` inicia a operação sem devolver uma Promise. Use `mutateAsync` quando
precisar de aguardar o resultado num handler `async`.

```jsx
import { toast } from "sonner";
import { useCreateLocation } from "../hooks/useCreateLocation";

function CreateLocationForm() {
    const createLocation = useCreateLocation();

    async function handleSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const locationData = {
            name: String(formData.get("name")),
        };

        try {
            await createLocation.mutateAsync(locationData);
            toast.success("Local criado com sucesso.");
            form.reset();
        } catch {
            toast.error("Não foi possível criar o local.");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Nome
                <input name="name" required />
            </label>
            <button type="submit" disabled={createLocation.isPending}>
                {createLocation.isPending ? "A guardar..." : "Criar"}
            </button>
            {createLocation.isError && (
                <p role="alert">O pedido falhou. Tenta novamente.</p>
            )}
        </form>
    );
}
```

Adapte a validação, mensagens e feedback ao formulário real. Os estados
`isPending`, `isError` e `error` pertencem à mutação; no TanStack Query v5,
`isPending` indica que a operação está em curso.

## Padrões a manter neste frontend

- Deixe pedidos HTTP em `src/services/` e use sempre o cliente `api` partilhado
  para chamadas autenticadas.
- Use `useFetch` (ou `useQuery`) para leituras e `useMutation` para operações
  que alteram dados.
- Use chaves de consulta estáveis. Coloque chaves partilhadas em
  `src/utils/queryKeys.js` quando forem usadas por vários hooks ou componentes.
- Invalide as consultas afetadas após uma mutação; use `setQueryData` quando a
  resposta já contém o recurso atualizado e a chave é conhecida.
- Mostre erros de campo junto ao formulário e use Sonner para feedback geral,
  seguindo os componentes de autenticação existentes.
- `src/query/queryClient.js` define as opções globais atuais: `staleTime` de
  30 segundos, uma tentativa de repetição e sem atualização automática ao
  focar novamente a janela. Opções passadas ao `useFetch` podem substituir
  esses valores para uma consulta específica.
