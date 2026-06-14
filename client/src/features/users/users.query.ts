/* eslint-disable @typescript-eslint/no-explicit-any */
import i18n from "@/i18n";
import { toast } from "sonner";
import type { User } from "@/types/users.type";
import type { SearchUsersRequest } from "@/schemas/users.schema";
import { createUser, getUsers } from "@/features/users/users.api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const USER_KEYS = {
  getUsers: (search: string) => ["users", "getUsers", search] as const,
};

export function useGetUsers(query: SearchUsersRequest) {
  return useQuery({
    queryKey: USER_KEYS.getUsers(query.search),
    queryFn: () => getUsers(query),
    enabled: query.search.trim().length > 0,
    staleTime: 1000 * 30,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<User>) => createUser(payload),
    onSuccess: (res) => {
      toast.success(i18n.t("api:USER_CREATED") || res?.message);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
