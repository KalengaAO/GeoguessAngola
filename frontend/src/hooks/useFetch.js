import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export function useFetch(endpoint, options = {}) {
    const {
        queryKey,
        params,
        enabled = true,
        staleTime,
        gcTime,
        retry,
        select,
        refetchOnWindowFocus,
    } = options;

    const queryOptions = {
        queryKey: queryKey ?? ["api", endpoint, params],
        queryFn: async ({ signal }) => {
            const response = await api.get(endpoint, { params, signal });
            return response.data;
        },
        enabled,
    };

    if (staleTime !== undefined) queryOptions.staleTime = staleTime;
    if (gcTime !== undefined) queryOptions.gcTime = gcTime;
    if (retry !== undefined) queryOptions.retry = retry;
    if (select !== undefined) queryOptions.select = select;
    if (refetchOnWindowFocus !== undefined) {
        queryOptions.refetchOnWindowFocus = refetchOnWindowFocus;
    }

    return useQuery(queryOptions);
}
