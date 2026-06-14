import api from "@/lib/axios";
import type { User } from "@/types/users.type";
import { USERS_ENDPOINTS } from "@/constants/users.constant";
import type { ResponseSuccess } from "@/types/response.type";
import type { SearchUsersRequest } from "@/schemas/users.schema";

export async function getUsers(query: SearchUsersRequest): Promise<ResponseSuccess<User[]>> {
  const res = await api.get(USERS_ENDPOINTS.getUsers + "?search=" + query.search);
  return res.data;
}

export async function createUser(payload: Partial<User>): Promise<ResponseSuccess<User>> {
  const res = await api.post(USERS_ENDPOINTS.createUser, payload);
  return res.data;
}
