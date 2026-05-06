import { SQL } from "bun";

import constant from "@/config/constant";

const db = new SQL(constant.DB_URL);

export default db;
